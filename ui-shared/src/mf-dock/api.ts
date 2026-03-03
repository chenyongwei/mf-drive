import type {
  AppId,
  AppsCatalogResponse,
  AuthTokenResult,
  OntologyDataDomainV1,
  OntologyPurposeV1,
  OntologyRetentionV1,
  OntologyRevocationModeV1,
} from './types';

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `${response.status} ${response.statusText}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export async function fetchAccountSession(): Promise<{ subject?: string; accountAuthorized: boolean; accountAuthorizedAt?: string; revokedAt?: string }> {
  return requestJson('/oauth/account/session');
}

export async function authorizeAccount(): Promise<{ accountAuthorized: boolean; accountAuthorizedAt?: string }> {
  return requestJson('/oauth/account/authorize', {
    method: 'POST',
  });
}

export async function revokeAccount(): Promise<{ success: boolean; accountAuthorized: boolean; revokedAt: string }> {
  return requestJson('/oauth/account/revoke', {
    method: 'POST',
  });
}

export async function fetchAppsCatalog(sourceAppId: AppId): Promise<AppsCatalogResponse> {
  const query = new URLSearchParams({ sourceAppId });
  return requestJson(`/api/foundation/apps/catalog?${query.toString()}`);
}

export async function oauthAuthorize(payload: {
  clientId: string;
  scope?: string;
  responseType?: string;
}): Promise<{
  authorizationId: string;
  incremental: boolean;
  grantId: string;
  clientId: string;
  requestedScopes: string[];
}> {
  const query = new URLSearchParams({
    client_id: payload.clientId,
    response_type: payload.responseType ?? 'code',
  });
  if (payload.scope && payload.scope.trim().length > 0) {
    query.set('scope', payload.scope.trim());
  }
  return requestJson(`/oauth/authorize?${query.toString()}`);
}

export async function oauthToken(payload: {
  clientId: string;
  grantId?: string;
  grantType?: string;
}): Promise<AuthTokenResult> {
  return requestJson('/oauth/token', {
    method: 'POST',
    body: JSON.stringify({
      grant_type: payload.grantType ?? 'authorization_code',
      client_id: payload.clientId,
      ...(payload.grantId ? { grant_id: payload.grantId } : {}),
    }),
  });
}

export async function oauthIntrospect(token: string): Promise<{ active: boolean; scope?: string; exp?: number; client_id?: string }> {
  return requestJson('/oauth/introspect', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function incrementalConsent(payload: {
  grantId: string;
  scopes: string[];
}): Promise<{ grantId: string; approvedScopes: string[]; status: string; updatedAt: string }> {
  return requestJson('/oauth/consent/incremental', {
    method: 'POST',
    body: JSON.stringify({
      grantId: payload.grantId,
      scopes: payload.scopes,
    }),
  });
}

export async function createSecurityPolicy(payload: {
  sourceAppId: AppId;
  allowedConsumers: AppId[];
  dataDomain: OntologyDataDomainV1;
  purpose: OntologyPurposeV1;
  retention: OntologyRetentionV1;
  revocationMode: OntologyRevocationModeV1;
  metadata?: Record<string, unknown>;
}): Promise<{
  success: boolean;
  legalGate: 'PASS' | 'WARN' | 'FAIL';
  legalReason?: string;
  policy: {
    policyId: string;
    sourceAppId: AppId;
    allowedConsumers: AppId[];
    dataDomain: OntologyDataDomainV1;
    purpose: OntologyPurposeV1;
    retention: OntologyRetentionV1;
    revocationMode: OntologyRevocationModeV1;
    status: 'ACTIVE' | 'REVOKED';
    legalGate: 'PASS' | 'WARN' | 'FAIL';
    legalReason?: string;
    createdAt: string;
    updatedAt: string;
    revokedAt?: string;
  };
}> {
  return requestJson('/api/foundation/security/policies', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
