export class RequestError extends Error {
  readonly status: number;
  readonly payload?: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = 'RequestError';
    this.status = status;
    this.payload = payload;
  }
}

function asRecord(input: unknown): Record<string, unknown> | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return null;
  }
  return input as Record<string, unknown>;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  const record = asRecord(payload);
  if (!record) {
    return fallback;
  }
  const message = record.message;
  if (typeof message === 'string' && message.trim().length > 0) {
    return message;
  }
  const error = record.error;
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  return fallback;
}

export function isRequestError(error: unknown): error is RequestError {
  return error instanceof RequestError;
}

export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
  } catch (error) {
    throw new RequestError(0, `NETWORK_ERROR: ${String(error)}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = String(response.headers.get('content-type') ?? '').toLowerCase();
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : await response.text().catch(() => '');

  if (!response.ok) {
    const fallback = typeof payload === 'string'
      ? payload || `${response.status} ${response.statusText}`
      : `${response.status} ${response.statusText}`;
    throw new RequestError(response.status, extractErrorMessage(payload, fallback), payload);
  }

  if (isJson) {
    return payload as T;
  }

  return {} as T;
}

export type OAuthAccountSession = {
  accountAuthorized: boolean;
  accountAuthorizedAt?: string;
  revokedAt?: string;
};

export type OAuthAuthorizeResponse = {
  authorizationId: string;
  incremental: boolean;
  grantId: string;
  clientId: string;
  requestedScopes: string[];
};

export type OAuthTokenResponse = {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
  scope: string;
};

export type OAuthIntrospectResponse = {
  active: boolean;
  client_id?: string;
  sub?: string;
  scope?: string;
  exp?: number;
};

export type AuthorizedDriveToken = {
  grantId: string;
  accessToken: string;
  scope: string;
  scopeList: string[];
  expiresIn: number;
  expiresAtEpoch?: number;
  active: boolean;
};

export function parseScopes(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }
  return raw
    .split(/\s+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
}

export async function getAccountSession(): Promise<OAuthAccountSession> {
  return requestJson<OAuthAccountSession>('/oauth/account/session');
}

export async function authorizeAccount(): Promise<OAuthAccountSession> {
  return requestJson<OAuthAccountSession>('/oauth/account/authorize', {
    method: 'POST',
  });
}

export async function oauthAuthorize(clientId: string, scope: string): Promise<OAuthAuthorizeResponse> {
  const query = new URLSearchParams({
    client_id: clientId,
    scope,
    response_type: 'code',
  });
  return requestJson<OAuthAuthorizeResponse>(`/oauth/authorize?${query.toString()}`);
}

export async function oauthToken(clientId: string, grantId: string): Promise<OAuthTokenResponse> {
  return requestJson<OAuthTokenResponse>('/oauth/token', {
    method: 'POST',
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: clientId,
      grant_id: grantId,
    }),
  });
}

export async function oauthIntrospect(token: string): Promise<OAuthIntrospectResponse> {
  return requestJson<OAuthIntrospectResponse>('/oauth/introspect', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function authorizeDriveOAuth(clientId: string, scope: string): Promise<AuthorizedDriveToken> {
  const authorizeResponse = await oauthAuthorize(clientId, scope);
  const tokenResponse = await oauthToken(clientId, authorizeResponse.grantId);
  const introspectResponse = await oauthIntrospect(tokenResponse.access_token);

  return {
    grantId: authorizeResponse.grantId,
    accessToken: tokenResponse.access_token,
    scope: tokenResponse.scope,
    scopeList: parseScopes(tokenResponse.scope),
    expiresIn: tokenResponse.expires_in,
    expiresAtEpoch: introspectResponse.exp,
    active: Boolean(introspectResponse.active),
  };
}

export function toUserFacingOAuthError(error: unknown): string {
  if (isRequestError(error)) {
    if (error.status === 0) {
      return '无法连接 Foundation IAM，请先启动 foundation（含 iam-api）并确认网关可用。';
    }
    if (error.status === 401) {
      return 'OAuth 认证失败，请重新授权账号。';
    }
    if (error.status === 403) {
      return 'OAuth scope 不足，请重新执行授权。';
    }
    if (error.status >= 500) {
      return 'Foundation IAM 暂时不可用，请稍后重试。';
    }
    return error.message;
  }

  return String(error);
}
