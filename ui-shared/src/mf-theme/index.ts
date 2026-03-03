export type MfThemeMode = 'light' | 'dark';

type ThemeListener = (mode: MfThemeMode) => void;

type ThemeRecord = {
  subject: string;
  deviceId: string;
  themeMode: MfThemeMode;
  updatedAt: string;
};

type ThemeEventPayload = ThemeRecord & {
  sourceAppId?: string;
  eventId: string;
};

type AccountSessionPayload = {
  subject?: string;
  accountAuthorized?: boolean;
};

type ThemePreferencePayload = {
  subject?: string;
  deviceId?: string;
  themeMode?: string;
  updatedAt?: string;
  exists?: boolean;
};

const DEFAULT_THEME_MODE: MfThemeMode = 'light';
const DEFAULT_SUBJECT = 'anonymous';
const DEFAULT_UPDATED_AT = '1970-01-01T00:00:00.000Z';

const DEVICE_STORAGE_KEY = 'mf.theme.deviceId.v1';
const LAST_STORAGE_KEY = 'mf.theme.last.v1';
const EVENT_STORAGE_KEY = 'mf.theme.event.v1';
const CACHE_PREFIX = 'mf.theme.v1';
const CHANNEL_NAME = 'mf.theme.sync.v1';

let initialized = false;
let activeAppId = 'foundation_workbench';
let deviceId = '';
let subject = DEFAULT_SUBJECT;
let accountAuthorized = false;
let themeMode: MfThemeMode = DEFAULT_THEME_MODE;
let updatedAt = DEFAULT_UPDATED_AT;
let syncPromise: Promise<void> | null = null;

const listeners = new Set<ThemeListener>();

let channel: BroadcastChannel | null = null;
let storageHandler: ((event: StorageEvent) => void) | null = null;

function nowIso(): string {
  return new Date().toISOString();
}

function randomId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}

function isThemeMode(value: unknown): value is MfThemeMode {
  return value === 'light' || value === 'dark';
}

function toValidIso(value: unknown, fallback = DEFAULT_UPDATED_AT): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return fallback;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }
  return parsed.toISOString();
}

function compareIso(leftIso: string, rightIso: string): number {
  return new Date(leftIso).getTime() - new Date(rightIso).getTime();
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function canUseBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function buildScopedKey(recordSubject: string, recordDeviceId: string): string {
  return `${CACHE_PREFIX}:${recordSubject}:${recordDeviceId}`;
}

function normalizeRecord(
  raw: Partial<ThemeRecord> | null | undefined,
  fallbackSubject = subject,
  fallbackDeviceId = deviceId,
): ThemeRecord | null {
  if (!raw) {
    return null;
  }
  const nextThemeMode = isThemeMode(raw.themeMode) ? raw.themeMode : null;
  if (!nextThemeMode) {
    return null;
  }
  const nextSubject = typeof raw.subject === 'string' && raw.subject.trim().length > 0
    ? raw.subject.trim()
    : fallbackSubject;
  const nextDeviceId = typeof raw.deviceId === 'string' && raw.deviceId.trim().length > 0
    ? raw.deviceId.trim()
    : fallbackDeviceId;
  if (!nextDeviceId) {
    return null;
  }
  return {
    subject: nextSubject || DEFAULT_SUBJECT,
    deviceId: nextDeviceId,
    themeMode: nextThemeMode,
    updatedAt: toValidIso(raw.updatedAt, nowIso()),
  };
}

function readScopedRecord(recordSubject: string, recordDeviceId: string): ThemeRecord | null {
  if (!canUseBrowser()) {
    return null;
  }
  const parsed = safeParse<ThemeRecord>(window.localStorage.getItem(buildScopedKey(recordSubject, recordDeviceId)));
  return normalizeRecord(parsed, recordSubject, recordDeviceId);
}

function readLastRecord(): ThemeRecord | null {
  if (!canUseBrowser()) {
    return null;
  }
  const parsed = safeParse<ThemeRecord>(window.localStorage.getItem(LAST_STORAGE_KEY));
  return normalizeRecord(parsed, subject, deviceId);
}

function persistRecord(record: ThemeRecord): void {
  if (!canUseBrowser()) {
    return;
  }
  const serialized = JSON.stringify(record);
  window.localStorage.setItem(buildScopedKey(record.subject, record.deviceId), serialized);
  window.localStorage.setItem(LAST_STORAGE_KEY, serialized);
}

function applyDomTheme(nextMode: MfThemeMode): void {
  if (!canUseBrowser()) {
    return;
  }
  const root = document.documentElement;
  root.dataset.mfTheme = nextMode;
  root.style.colorScheme = nextMode;
}

function notifyListeners(): void {
  for (const listener of listeners) {
    listener(themeMode);
  }
}

function applyRecord(record: ThemeRecord, options?: { persist?: boolean; notify?: boolean }): void {
  themeMode = record.themeMode;
  updatedAt = record.updatedAt;
  subject = record.subject;
  deviceId = record.deviceId;
  applyDomTheme(record.themeMode);
  if (options?.persist !== false) {
    persistRecord(record);
  }
  if (options?.notify !== false) {
    notifyListeners();
  }
}

function ensureDeviceId(): string {
  if (!canUseBrowser()) {
    return '';
  }

  const existing = window.localStorage.getItem(DEVICE_STORAGE_KEY);
  if (existing && existing.trim().length > 0 && existing.trim().length <= 128) {
    return existing.trim();
  }

  const generated = randomId('device').slice(0, 128);
  window.localStorage.setItem(DEVICE_STORAGE_KEY, generated);
  return generated;
}

function matchesRuntime(record: ThemeRecord): boolean {
  if (record.deviceId !== deviceId) {
    return false;
  }
  if (subject !== DEFAULT_SUBJECT && record.subject !== subject) {
    return false;
  }
  return true;
}

function shouldApplyIncoming(record: ThemeRecord): boolean {
  if (!matchesRuntime(record)) {
    return false;
  }
  return compareIso(record.updatedAt, updatedAt) >= 0;
}

function emitCrossWindow(record: ThemeRecord, sourceAppId?: string): void {
  if (!canUseBrowser()) {
    return;
  }
  const payload: ThemeEventPayload = {
    ...record,
    sourceAppId,
    eventId: randomId('theme-event'),
  };
  const encoded = JSON.stringify(payload);

  if (typeof BroadcastChannel !== 'undefined') {
    channel?.postMessage(payload);
  }
  window.localStorage.setItem(EVENT_STORAGE_KEY, encoded);
}

async function fetchAccountSession(): Promise<{ subject: string; accountAuthorized: boolean } | null> {
  if (!canUseBrowser()) {
    return null;
  }
  try {
    const response = await fetch('/oauth/account/session');
    if (!response.ok) {
      return null;
    }
    const payload = await response.json() as AccountSessionPayload;
    const nextSubject = typeof payload.subject === 'string' && payload.subject.trim().length > 0
      ? payload.subject.trim()
      : DEFAULT_SUBJECT;
    return {
      subject: nextSubject,
      accountAuthorized: Boolean(payload.accountAuthorized),
    };
  } catch {
    return null;
  }
}

async function fetchRemotePreference(nextDeviceId: string): Promise<ThemeRecord | null> {
  if (!canUseBrowser()) {
    return null;
  }
  try {
    const query = new URLSearchParams({ deviceId: nextDeviceId });
    const response = await fetch(`/api/foundation/preferences/theme?${query.toString()}`);
    if (response.status === 403) {
      return null;
    }
    if (!response.ok) {
      return null;
    }
    const payload = await response.json() as ThemePreferencePayload;
    const normalized = normalizeRecord(
      {
        subject: payload.subject,
        deviceId: payload.deviceId,
        themeMode: payload.themeMode as MfThemeMode,
        updatedAt: payload.updatedAt ?? (payload.exists ? nowIso() : DEFAULT_UPDATED_AT),
      },
      subject,
      nextDeviceId,
    );
    return normalized;
  } catch {
    return null;
  }
}

async function pushRemotePreference(record: ThemeRecord, sourceAppId: string): Promise<ThemeRecord | null> {
  if (!canUseBrowser()) {
    return null;
  }
  try {
    const response = await fetch('/api/foundation/preferences/theme', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceId: record.deviceId,
        themeMode: record.themeMode,
        sourceAppId,
      }),
    });
    if (!response.ok) {
      return null;
    }
    const payload = await response.json() as ThemePreferencePayload;
    return normalizeRecord(
      {
        subject: payload.subject,
        deviceId: payload.deviceId,
        themeMode: payload.themeMode as MfThemeMode,
        updatedAt: payload.updatedAt,
      },
      record.subject,
      record.deviceId,
    );
  } catch {
    return null;
  }
}

async function synchronizeWithRemote(): Promise<void> {
  const session = await fetchAccountSession();
  if (session) {
    subject = session.subject;
    accountAuthorized = session.accountAuthorized;
  } else {
    subject = DEFAULT_SUBJECT;
    accountAuthorized = false;
  }

  const scopedLocal = readScopedRecord(subject, deviceId);
  if (scopedLocal && compareIso(scopedLocal.updatedAt, updatedAt) > 0) {
    applyRecord(scopedLocal, { persist: false, notify: false });
  }

  if (!accountAuthorized || subject === DEFAULT_SUBJECT) {
    return;
  }

  const remote = await fetchRemotePreference(deviceId);
  if (!remote) {
    return;
  }

  const local = readScopedRecord(subject, deviceId) ?? {
    subject,
    deviceId,
    themeMode,
    updatedAt,
  };

  if (compareIso(remote.updatedAt, local.updatedAt) > 0) {
    applyRecord(remote, { persist: true, notify: true });
    emitCrossWindow(remote, activeAppId);
    return;
  }

  if (compareIso(local.updatedAt, remote.updatedAt) > 0) {
    void pushRemotePreference(local, activeAppId);
  }
}

function handleIncoming(raw: unknown): void {
  const payload = raw as Partial<ThemeEventPayload> | null | undefined;
  const normalized = normalizeRecord(
    {
      subject: payload?.subject,
      deviceId: payload?.deviceId,
      themeMode: payload?.themeMode as MfThemeMode,
      updatedAt: payload?.updatedAt,
    },
    subject,
    deviceId,
  );
  if (!normalized || !shouldApplyIncoming(normalized)) {
    return;
  }
  applyRecord(normalized, { persist: true, notify: true });
}

function setupCrossWindowSync(): void {
  if (!canUseBrowser()) {
    return;
  }

  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event: MessageEvent<ThemeEventPayload>) => {
      handleIncoming(event.data);
    };
  }

  storageHandler = (event: StorageEvent) => {
    if (event.key !== EVENT_STORAGE_KEY && event.key !== LAST_STORAGE_KEY) {
      return;
    }
    const parsed = safeParse<ThemeEventPayload | ThemeRecord>(event.newValue);
    handleIncoming(parsed);
  };
  window.addEventListener('storage', storageHandler);
}

function ensureInitialized(appId?: string): void {
  if (appId) {
    activeAppId = appId;
  }
  if (!canUseBrowser()) {
    return;
  }
  if (initialized) {
    return;
  }

  initialized = true;
  deviceId = ensureDeviceId();
  const last = readLastRecord();
  if (last) {
    applyRecord(last, { persist: false, notify: false });
  } else {
    applyDomTheme(themeMode);
  }
  setupCrossWindowSync();
}

export function initMfThemeSync(options?: { appId?: string }): void {
  ensureInitialized(options?.appId);
  if (syncPromise) {
    return;
  }
  syncPromise = synchronizeWithRemote().finally(() => {
    syncPromise = null;
  });
}

export function getMfThemeMode(): MfThemeMode {
  ensureInitialized();
  return themeMode;
}

export function subscribeMfTheme(listener: ThemeListener): () => void {
  ensureInitialized();
  listeners.add(listener);
  listener(themeMode);
  return () => {
    listeners.delete(listener);
  };
}

export function setMfThemeMode(nextMode: MfThemeMode, options?: { appId?: string }): void {
  ensureInitialized(options?.appId);
  if (!isThemeMode(nextMode)) {
    return;
  }

  const nextRecord: ThemeRecord = {
    subject,
    deviceId,
    themeMode: nextMode,
    updatedAt: nowIso(),
  };

  applyRecord(nextRecord, { persist: true, notify: true });
  emitCrossWindow(nextRecord, options?.appId ?? activeAppId);

  if (accountAuthorized && subject !== DEFAULT_SUBJECT) {
    void pushRemotePreference(nextRecord, options?.appId ?? activeAppId).then((remote) => {
      if (!remote) {
        return;
      }
      if (compareIso(remote.updatedAt, nextRecord.updatedAt) > 0) {
        applyRecord(remote, { persist: true, notify: true });
        emitCrossWindow(remote, options?.appId ?? activeAppId);
      }
    });
  }
}

export function __unsafeResetMfThemeSyncForTests(): void {
  if (canUseBrowser() && storageHandler) {
    window.removeEventListener('storage', storageHandler);
  }
  storageHandler = null;
  if (channel) {
    channel.close();
  }
  channel = null;
  listeners.clear();
  initialized = false;
  activeAppId = 'foundation_workbench';
  deviceId = '';
  subject = DEFAULT_SUBJECT;
  accountAuthorized = false;
  themeMode = DEFAULT_THEME_MODE;
  updatedAt = DEFAULT_UPDATED_AT;
  syncPromise = null;
}
