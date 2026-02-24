import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DRIVE_SESSION_STORAGE_KEY, useDriveSession } from './useDriveSession';

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function Probe() {
  const session = useDriveSession();
  return (
    <div>
      <div data-testid="status">{session.status}</div>
      <div data-testid="account">{String(session.accountAuthorized)}</div>
      <div data-testid="token-active">{String(session.tokenActive)}</div>
      <button type="button" onClick={() => void session.authorize()} data-testid="authorize-trigger">
        authorize
      </button>
    </div>
  );
}

describe('useDriveSession', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('transitions from needs_account to ready after oauth authorization', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? 'GET').toUpperCase();

      if (url.startsWith('/oauth/account/session') && method === 'GET') {
        return jsonResponse({ accountAuthorized: false });
      }
      if (url.startsWith('/oauth/account/authorize') && method === 'POST') {
        return jsonResponse({ accountAuthorized: true, accountAuthorizedAt: '2026-01-01T00:00:00.000Z' });
      }
      if (url.startsWith('/oauth/authorize') && method === 'GET') {
        return jsonResponse({
          authorizationId: 'auth-1',
          incremental: false,
          grantId: 'grant-1',
          clientId: 'drive-web',
          requestedScopes: ['drive.appdata.read'],
        });
      }
      if (url.startsWith('/oauth/token') && method === 'POST') {
        return jsonResponse({
          access_token: 'token-1',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'drive.appdata.read drive.appdata.write drive.drive.read drive.drive.write',
        });
      }
      if (url.startsWith('/oauth/introspect') && method === 'POST') {
        return jsonResponse({
          active: true,
          client_id: 'drive-web',
          scope: 'drive.appdata.read drive.appdata.write drive.drive.read drive.drive.write',
          exp: 1893456000,
        });
      }

      throw new Error(`Unexpected fetch: ${method} ${url}`);
    });

    render(<Probe />);

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('needs_account');
    });

    await userEvent.click(screen.getByTestId('authorize-trigger'));

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('ready');
      expect(screen.getByTestId('token-active')).toHaveTextContent('true');
    });

    expect(window.sessionStorage.getItem(DRIVE_SESSION_STORAGE_KEY)).toBe('token-1');
    expect(fetchMock).toHaveBeenCalled();
  });

  it('clears inactive persisted token and falls back to needs_authorization', async () => {
    window.sessionStorage.setItem(DRIVE_SESSION_STORAGE_KEY, 'expired-token');

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? 'GET').toUpperCase();

      if (url.startsWith('/oauth/account/session') && method === 'GET') {
        return jsonResponse({ accountAuthorized: true, accountAuthorizedAt: '2026-01-01T00:00:00.000Z' });
      }
      if (url.startsWith('/oauth/introspect') && method === 'POST') {
        return jsonResponse({ active: false });
      }

      throw new Error(`Unexpected fetch: ${method} ${url}`);
    });

    render(<Probe />);

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('needs_authorization');
    });

    expect(window.sessionStorage.getItem(DRIVE_SESSION_STORAGE_KEY)).toBeNull();
  });
});
