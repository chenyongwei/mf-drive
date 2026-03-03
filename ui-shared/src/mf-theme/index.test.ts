import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __unsafeResetMfThemeSyncForTests,
  getMfThemeMode,
  initMfThemeSync,
  setMfThemeMode,
} from './index';

const DEVICE_STORAGE_KEY = 'mf.theme.deviceId.v1';
const EVENT_STORAGE_KEY = 'mf.theme.event.v1';
const CHANNEL_NAME = 'mf.theme.sync.v1';

class FakeBroadcastChannel {
  static instancesByName = new Map<string, Set<FakeBroadcastChannel>>();
  static postedByName = new Map<string, unknown[]>();

  readonly name: string;
  onmessage: ((event: MessageEvent<unknown>) => void) | null = null;

  constructor(name: string) {
    this.name = name;
    const instances = FakeBroadcastChannel.instancesByName.get(name) ?? new Set<FakeBroadcastChannel>();
    instances.add(this);
    FakeBroadcastChannel.instancesByName.set(name, instances);
  }

  postMessage(payload: unknown): void {
    const posted = FakeBroadcastChannel.postedByName.get(this.name) ?? [];
    posted.push(payload);
    FakeBroadcastChannel.postedByName.set(this.name, posted);
  }

  close(): void {
    const instances = FakeBroadcastChannel.instancesByName.get(this.name);
    if (!instances) {
      return;
    }
    instances.delete(this);
    if (instances.size === 0) {
      FakeBroadcastChannel.instancesByName.delete(this.name);
    }
  }

  static emit(name: string, payload: unknown): void {
    const instances = FakeBroadcastChannel.instancesByName.get(name);
    if (!instances) {
      return;
    }
    for (const instance of instances) {
      instance.onmessage?.({ data: payload } as MessageEvent<unknown>);
    }
  }

  static lastPosted(name: string): unknown {
    const posted = FakeBroadcastChannel.postedByName.get(name);
    if (!posted || posted.length === 0) {
      return undefined;
    }
    return posted[posted.length - 1];
  }

  static reset(): void {
    FakeBroadcastChannel.instancesByName.clear();
    FakeBroadcastChannel.postedByName.clear();
  }
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function installFetch(
  handler: (url: string, init?: RequestInit) => Response | Promise<Response>,
): ReturnType<typeof vi.fn> {
  const mock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    return Promise.resolve(handler(url, init));
  });
  vi.stubGlobal('fetch', mock as unknown as typeof fetch);
  return mock;
}

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.has(key) ? values.get(key) ?? null : null;
    },
    key(index: number) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, String(value));
    },
  };
}

async function flushAsync(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('mf-theme sync core', () => {
  beforeEach(() => {
    const memoryStorage = createMemoryStorage();
    vi.stubGlobal('localStorage', memoryStorage);
    Object.defineProperty(window, 'localStorage', {
      value: memoryStorage,
      configurable: true,
    });
    vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel as unknown as typeof BroadcastChannel);
    delete document.documentElement.dataset.mfTheme;
    document.documentElement.style.removeProperty('color-scheme');
    FakeBroadcastChannel.reset();
    __unsafeResetMfThemeSyncForTests();
  });

  afterEach(() => {
    __unsafeResetMfThemeSyncForTests();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reuses generated deviceId between initializations', async () => {
    installFetch((url) => {
      if (url === '/oauth/account/session') {
        return jsonResponse({ subject: 'user-theme-1', accountAuthorized: false });
      }
      return jsonResponse({ error: 'unhandled' }, 404);
    });

    initMfThemeSync({ appId: 'ordering' });
    await flushAsync();
    const firstDeviceId = window.localStorage.getItem(DEVICE_STORAGE_KEY);
    expect(firstDeviceId).toBeTruthy();

    __unsafeResetMfThemeSyncForTests();
    initMfThemeSync({ appId: 'wms' });
    await flushAsync();
    const secondDeviceId = window.localStorage.getItem(DEVICE_STORAGE_KEY);
    expect(secondDeviceId).toBe(firstDeviceId);
  });

  it('applies setTheme to local cache, dom and broadcast payload', async () => {
    installFetch((url) => {
      if (url === '/oauth/account/session') {
        return jsonResponse({ subject: 'user-theme-2', accountAuthorized: false });
      }
      return jsonResponse({ error: 'unhandled' }, 404);
    });

    initMfThemeSync({ appId: 'ordering' });
    await flushAsync();

    const deviceId = window.localStorage.getItem(DEVICE_STORAGE_KEY);
    expect(deviceId).toBeTruthy();

    setMfThemeMode('dark', { appId: 'ordering' });

    expect(getMfThemeMode()).toBe('dark');
    expect(document.documentElement.dataset.mfTheme).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');

    const scopedKey = `mf.theme.v1:user-theme-2:${deviceId}`;
    const scopedRecordRaw = window.localStorage.getItem(scopedKey);
    expect(scopedRecordRaw).toBeTruthy();
    const scopedRecord = JSON.parse(String(scopedRecordRaw)) as { themeMode: string };
    expect(scopedRecord.themeMode).toBe('dark');

    const storageEventRaw = window.localStorage.getItem(EVENT_STORAGE_KEY);
    expect(storageEventRaw).toBeTruthy();
    const storageEventPayload = JSON.parse(String(storageEventRaw)) as { themeMode: string };
    expect(storageEventPayload.themeMode).toBe('dark');

    const broadcastPayload = FakeBroadcastChannel.lastPosted(CHANNEL_NAME) as { themeMode?: string } | undefined;
    expect(broadcastPayload?.themeMode).toBe('dark');
  });

  it('reacts to broadcast and storage channel events', async () => {
    installFetch((url) => {
      if (url === '/oauth/account/session') {
        return jsonResponse({ subject: 'user-theme-3', accountAuthorized: false });
      }
      return jsonResponse({ error: 'unhandled' }, 404);
    });

    initMfThemeSync({ appId: 'ordering' });
    await flushAsync();

    const deviceId = String(window.localStorage.getItem(DEVICE_STORAGE_KEY) ?? '');
    const broadcastPayload = {
      subject: 'user-theme-3',
      deviceId,
      themeMode: 'dark',
      updatedAt: new Date(Date.now() + 1000).toISOString(),
      eventId: 'broadcast-event-1',
    };

    FakeBroadcastChannel.emit(CHANNEL_NAME, broadcastPayload);
    expect(getMfThemeMode()).toBe('dark');

    const storagePayload = {
      subject: 'user-theme-3',
      deviceId,
      themeMode: 'light',
      updatedAt: new Date(Date.now() + 2000).toISOString(),
      eventId: 'storage-event-1',
    };
    window.dispatchEvent(new StorageEvent('storage', {
      key: EVENT_STORAGE_KEY,
      newValue: JSON.stringify(storagePayload),
    }));

    expect(getMfThemeMode()).toBe('light');
  });

  it('keeps local state when remote persistence fails', async () => {
    const fetchMock = installFetch((url, init) => {
      if (url === '/oauth/account/session') {
        return jsonResponse({ subject: 'user-theme-4', accountAuthorized: true });
      }
      if (url.startsWith('/api/foundation/preferences/theme?')) {
        const parsedUrl = new URL(url, 'http://localhost');
        return jsonResponse({
          subject: 'user-theme-4',
          deviceId: parsedUrl.searchParams.get('deviceId'),
          themeMode: 'light',
          exists: false,
        });
      }
      if (url === '/api/foundation/preferences/theme' && init?.method === 'PUT') {
        return jsonResponse({ error: 'write failed' }, 500);
      }
      return jsonResponse({ error: 'unhandled' }, 404);
    });

    initMfThemeSync({ appId: 'ordering' });
    await flushAsync();

    setMfThemeMode('dark', { appId: 'ordering' });
    await flushAsync();

    expect(getMfThemeMode()).toBe('dark');

    const deviceId = window.localStorage.getItem(DEVICE_STORAGE_KEY);
    const scopedKey = `mf.theme.v1:user-theme-4:${deviceId}`;
    const scopedRecordRaw = window.localStorage.getItem(scopedKey);
    const scopedRecord = JSON.parse(String(scopedRecordRaw)) as { themeMode: string };
    expect(scopedRecord.themeMode).toBe('dark');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/foundation/preferences/theme',
      expect.objectContaining({ method: 'PUT' }),
    );
  });
});
