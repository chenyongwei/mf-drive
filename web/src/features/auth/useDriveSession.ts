import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RequestError,
  authorizeAccount,
  authorizeDriveOAuth,
  getAccountSession,
  isRequestError,
  oauthIntrospect,
  parseScopes,
  toUserFacingOAuthError,
} from './oauth';

export const DRIVE_SESSION_STORAGE_KEY = 'mf.drive.oauth.access_token';

export type DriveSessionStatus =
  | 'checking'
  | 'needs_account'
  | 'needs_authorization'
  | 'authorizing'
  | 'ready'
  | 'error';

export type DriveSessionView = {
  status: DriveSessionStatus;
  accountAuthorized: boolean;
  tokenActive: boolean;
  accessToken: string | null;
  scopes: string[];
  expiresAtEpoch?: number;
  error: string | null;
  refresh: () => Promise<void>;
  authorize: () => Promise<void>;
  clearToken: () => void;
};

function readStoredToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const token = window.sessionStorage.getItem(DRIVE_SESSION_STORAGE_KEY);
  if (!token) {
    return null;
  }
  const value = token.trim();
  return value.length > 0 ? value : null;
}

function writeStoredToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.sessionStorage.setItem(DRIVE_SESSION_STORAGE_KEY, token);
}

function clearStoredToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.sessionStorage.removeItem(DRIVE_SESSION_STORAGE_KEY);
}

function resolveClientId(): string {
  return String(import.meta.env.VITE_DRIVE_CLIENT_ID ?? 'drive-web').trim() || 'drive-web';
}

function resolveScopeBase(): string {
  const fallback = 'drive.appdata.read drive.appdata.write drive.drive.read drive.drive.write';
  const raw = String(import.meta.env.VITE_DRIVE_SCOPE_BASE ?? fallback).trim();
  return raw.length > 0 ? raw : fallback;
}

export function useDriveSession(): DriveSessionView {
  const clientId = useMemo(() => resolveClientId(), []);
  const scopeBase = useMemo(() => resolveScopeBase(), []);

  const [status, setStatus] = useState<DriveSessionStatus>('checking');
  const [accountAuthorized, setAccountAuthorized] = useState<boolean>(false);
  const [tokenActive, setTokenActive] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [scopes, setScopes] = useState<string[]>([]);
  const [expiresAtEpoch, setExpiresAtEpoch] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const clearToken = useCallback(() => {
    clearStoredToken();
    setAccessToken(null);
    setTokenActive(false);
    setScopes([]);
    setExpiresAtEpoch(undefined);
    setError(null);
    setStatus(accountAuthorized ? 'needs_authorization' : 'needs_account');
  }, [accountAuthorized]);

  const refresh = useCallback(async () => {
    setStatus('checking');
    setError(null);

    try {
      const accountSession = await getAccountSession();
      setAccountAuthorized(Boolean(accountSession.accountAuthorized));

      const token = readStoredToken();
      if (token) {
        const introspect = await oauthIntrospect(token);
        if (introspect.active) {
          const nextScopes = parseScopes(introspect.scope);
          setAccessToken(token);
          setTokenActive(true);
          setScopes(nextScopes);
          setExpiresAtEpoch(introspect.exp);
          setStatus('ready');
          return;
        }
        clearStoredToken();
      }

      setAccessToken(null);
      setTokenActive(false);
      setScopes([]);
      setExpiresAtEpoch(undefined);
      setStatus(accountSession.accountAuthorized ? 'needs_authorization' : 'needs_account');
    } catch (requestError) {
      clearStoredToken();
      setAccessToken(null);
      setTokenActive(false);
      setScopes([]);
      setExpiresAtEpoch(undefined);
      setStatus('error');
      setError(toUserFacingOAuthError(requestError));
    }
  }, []);

  const authorize = useCallback(async () => {
    setStatus('authorizing');
    setError(null);

    try {
      let account = accountAuthorized;
      if (!accountAuthorized) {
        const authorizedSession = await authorizeAccount();
        account = Boolean(authorizedSession.accountAuthorized);
        setAccountAuthorized(account);
      }

      if (!account) {
        throw new RequestError(403, 'ACCOUNT_AUTH_REQUIRED');
      }

      const authorizedToken = await authorizeDriveOAuth(clientId, scopeBase);
      if (!authorizedToken.active) {
        throw new RequestError(401, 'DRIVE_TOKEN_INACTIVE');
      }

      writeStoredToken(authorizedToken.accessToken);
      setAccessToken(authorizedToken.accessToken);
      setTokenActive(true);
      setScopes(authorizedToken.scopeList);
      setExpiresAtEpoch(authorizedToken.expiresAtEpoch);
      setStatus('ready');
    } catch (requestError) {
      if (isRequestError(requestError) && requestError.status === 401) {
        clearStoredToken();
      }
      setAccessToken(null);
      setTokenActive(false);
      setScopes([]);
      setExpiresAtEpoch(undefined);
      setStatus('error');
      setError(toUserFacingOAuthError(requestError));
    }
  }, [accountAuthorized, clientId, scopeBase]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    status,
    accountAuthorized,
    tokenActive,
    accessToken,
    scopes,
    expiresAtEpoch,
    error,
    refresh,
    authorize,
    clearToken,
  };
}
