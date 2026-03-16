import crypto from 'node:crypto';
import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';
import { createPool, type Pool, type RowDataPacket } from 'mysql2/promise';
import { Client as MinioClient } from 'minio';

type RuntimeMode = 'mock' | 'live';
type MockScenario = 'base' | 'demo' | 'edge' | 'failure';
type FailureKind = '401' | '403' | '409' | '500' | 'timeout';
type ApplyFailure = (req: Request, res: Response, defaultFailure: FailureKind | null) => Promise<boolean>;
type StateStore = {
  ready: Promise<void>;
  state: DriveState;
  save: () => Promise<void>;
};

type JsonPayloadRow = RowDataPacket & {
  payload: string;
};

type ContainerMode = 'APP_DATA' | 'MY_DRIVE';
type ArtifactType = 'DRAWING' | 'PARTS' | 'LAYOUT';
type PrincipalType = 'USER' | 'APP' | 'ROLE' | 'DOMAIN';
type GrantStatus = 'ACTIVE' | 'REVOKED';

type DriveContainer = {
  containerId: string;
  tenantId: string;
  ownerAppId: string;
  mode: ContainerMode;
  name: string;
  quotaBytes: number;
  usedBytes: number;
  createdAt: string;
};

type DriveArtifactVersion = {
  versionId: string;
  versionNo: number;
  sizeBytes: number;
  etag: string;
  sha256?: string;
  createdAt: string;
};

type DriveArtifact = {
  artifactId: string;
  tenantId: string;
  containerId: string;
  artifactType: ArtifactType;
  ownerAppId: string;
  displayName: string;
  mimeType: string;
  currentVersionId: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
  versions: DriveArtifactVersion[];
};

type DriveAclEntry = {
  principalType: PrincipalType;
  principalId: string;
  permissions: string[];
  expiresAt?: string;
};

type DriveGrant = {
  grantId: string;
  artifactId: string;
  sourceAppId: string;
  targetAppId: string;
  permissions: string[];
  status: GrantStatus;
  expiresAt?: string;
  createdAt: string;
  revokedAt?: string;
};

type DriveAuditLog = {
  auditId: string;
  action: string;
  actorAppId: string;
  actorUserId?: string;
  artifactId?: string;
  result: 'ALLOW' | 'DENY';
  reason?: string;
  createdAt: string;
};

type DriveState = {
  sequences: Record<string, number>;
  containers: DriveContainer[];
  artifacts: DriveArtifact[];
  aclByArtifact: Record<string, DriveAclEntry[]>;
  grants: DriveGrant[];
  auditLogs: DriveAuditLog[];
};

type TokenCacheRecord = {
  active: boolean;
  scopes: Set<string>;
  expiresAtEpoch?: number;
  cachedAtMs: number;
};

type IntrospectResponse = {
  active: boolean;
  client_id?: string;
  scope?: string;
  exp?: number;
};

type ObjectStoreBridge = {
  ready: Promise<void>;
  putVersionObject: (artifactId: string, versionId: string, payload: Buffer, mimeType: string) => Promise<void>;
  getVersionObject: (artifactId: string, versionId: string) => Promise<Buffer | null>;
};

type PdpDecisionResponse = {
  decision?: 'ALLOW' | 'DENY';
  allow?: boolean;
  reason?: string;
  decisionId?: string;
  matchedGrantId?: string;
};

const FAILURE_STATUS: Record<FailureKind, number> = {
  '401': 401,
  '403': 403,
  '409': 409,
  '500': 500,
  timeout: 504,
};

const AUTH_CACHE_TTL_MS = 30_000;
const SIGNED_URL_TTL_MS = 10 * 60_000;

function nowIso(): string {
  return new Date().toISOString();
}

function buildSignedPayload(artifactId: string, versionId: string, expiresAtMs: number): string {
  return `${artifactId}:${versionId}:${expiresAtMs}`;
}

function signDownloadPayload(secret: string, artifactId: string, versionId: string, expiresAtMs: number): string {
  return crypto
    .createHmac('sha256', secret)
    .update(buildSignedPayload(artifactId, versionId, expiresAtMs))
    .digest('hex');
}

function safeSignatureEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function normalizeString(value: unknown, fallback = ''): string {
  const raw = String(value ?? '').trim();
  return raw.length > 0 ? raw : fallback;
}

function normalizeNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function includeKeyword(values: unknown[], keyword: string): boolean {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return values.some((value) => String(value ?? '').toLowerCase().includes(normalized));
}

function paginate<T>(rows: T[], pageRaw: unknown, pageSizeRaw: unknown): { items: T[]; total: number; page: number; pageSize: number } {
  const page = Math.max(1, Number.parseInt(String(pageRaw ?? '1'), 10) || 1);
  const pageSize = Math.max(1, Number.parseInt(String(pageSizeRaw ?? '20'), 10) || 20);
  const start = (page - 1) * pageSize;
  return {
    items: rows.slice(start, start + pageSize),
    total: rows.length,
    page,
    pageSize,
  };
}

function allocateId(state: DriveState, sequenceKey: string, prefix: string): string {
  const current = state.sequences[sequenceKey] ?? 0;
  const next = current + 1;
  state.sequences[sequenceKey] = next;
  return `${prefix}-${next}`;
}

function buildDefaultOrderingContainers(now: () => string, tenantId: string): DriveContainer[] {
  return [
    {
      containerId: 'ctr-ordering-appdata',
      tenantId,
      ownerAppId: 'ordering',
      mode: 'APP_DATA',
      name: 'Ordering Internal Drawings',
      quotaBytes: 50 * 1024 * 1024 * 1024,
      usedBytes: 8 * 1024 * 1024 * 1024,
      createdAt: now(),
    },
    {
      containerId: 'ctr-ordering-my-drive',
      tenantId,
      ownerAppId: 'ordering',
      mode: 'MY_DRIVE',
      name: 'Ordering My Drive',
      quotaBytes: 50 * 1024 * 1024 * 1024,
      usedBytes: 0,
      createdAt: now(),
    },
  ];
}

function ensureDefaultContainers(state: DriveState, now: () => string): boolean {
  const existingIds = new Set(state.containers.map((item) => item.containerId));
  const fallbackTenantId = normalizeString(state.containers[0]?.tenantId, 'tenant-001');
  let changed = false;

  for (const container of buildDefaultOrderingContainers(now, fallbackTenantId)) {
    if (existingIds.has(container.containerId)) {
      continue;
    }
    state.containers.push(container);
    existingIds.add(container.containerId);
    changed = true;
  }

  return changed;
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function resolveScenario(env: NodeJS.ProcessEnv): MockScenario {
  const raw = normalizeString(env.MOCK_PROFILE, 'base').toLowerCase();
  if (raw === 'base' || raw === 'demo' || raw === 'edge' || raw === 'failure') {
    return raw;
  }
  return 'base';
}

function resolveFailureKind(req: Request, scenario: MockScenario, defaultFailure: FailureKind | null): FailureKind | null {
  const raw = String(req.header('x-mock-failure') ?? req.query.failure ?? '').trim().toLowerCase();

  if (raw === '401' || raw === 'unauthorized') return '401';
  if (raw === '403' || raw === 'forbidden') return '403';
  if (raw === '409' || raw === 'conflict') return '409';
  if (raw === '500' || raw === 'server') return '500';
  if (raw === 'timeout' || raw === '504') return 'timeout';

  if (scenario === 'failure') {
    return defaultFailure;
  }

  return null;
}

async function maybeApplyFailure(req: Request, res: Response, scenario: MockScenario, defaultFailure: FailureKind | null): Promise<boolean> {
  const failure = resolveFailureKind(req, scenario, defaultFailure);
  if (!failure) {
    return false;
  }

  if (failure === 'timeout') {
    await new Promise<void>((resolve) => setTimeout(resolve, 1200));
  }

  const status = FAILURE_STATUS[failure];
  res.status(status).json({
    error: `mock ${failure === 'timeout' ? 'timeout' : `http ${status}`}`,
    code: `MOCK_${failure.toUpperCase()}`,
    scenario,
    failure,
  });
  return true;
}

function parseBearerToken(req: Request): string | null {
  const header = String(req.header('authorization') ?? '').trim();
  if (!header) {
    return null;
  }
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return null;
  }
  const token = match[1].trim();
  return token.length > 0 ? token : null;
}

function createInitialState(now: () => string, scenario: MockScenario): DriveState {
  const edgeMode = scenario === 'edge';
  const tenantId = edgeMode ? 'tenant-edge' : 'tenant-001';
  const [baseContainer, myDriveContainer] = buildDefaultOrderingContainers(now, tenantId);
  if (edgeMode) {
    baseContainer.name = 'Edge Empty Container';
    baseContainer.usedBytes = 0;
  }

  const baseArtifact: DriveArtifact = {
    artifactId: 'art-ordering-001',
    tenantId: baseContainer.tenantId,
    containerId: baseContainer.containerId,
    artifactType: 'DRAWING',
    ownerAppId: 'ordering',
    displayName: edgeMode ? 'edge-empty.dxf' : 'door-panel-A.dxf',
    mimeType: 'application/dxf',
    currentVersionId: edgeMode ? 'ver-0' : 'ver-1',
    projectId: edgeMode ? 'proj-edge-1' : 'proj-1001',
    createdAt: now(),
    updatedAt: now(),
    versions: [
      {
        versionId: edgeMode ? 'ver-0' : 'ver-1',
        versionNo: 1,
        sizeBytes: edgeMode ? 0 : 1024 * 1024,
        etag: edgeMode ? 'etag-edge' : 'etag-ver-1',
        createdAt: now(),
      },
    ],
  };

  return {
    sequences: {
      container: 2,
      artifact: 2,
      version: 2,
      grant: 1,
      audit: 1,
    },
    containers: [baseContainer, myDriveContainer],
    artifacts: edgeMode ? [] : [baseArtifact],
    aclByArtifact: {
      [baseArtifact.artifactId]: [
        {
          principalType: 'APP',
          principalId: 'ordering',
          permissions: ['read', 'write', 'delete', 'share'],
        },
      ],
    },
    grants: [],
    auditLogs: [],
  };
}

function createAuthMiddleware(env: NodeJS.ProcessEnv, mode: RuntimeMode) {
  const skipAuth = normalizeString(env.DRIVE_SKIP_AUTH, 'false').toLowerCase() === 'true'
    || (mode === 'mock' && normalizeString(env.DRIVE_SKIP_AUTH_IN_MOCK, 'false').toLowerCase() === 'true');
  const enforceContainerPdp = normalizeString(env.DRIVE_ENFORCE_CONTAINER_PDP, 'true').toLowerCase() === 'true';
  const iamUrl = normalizeString(env.FOUNDATION_IAM_URL, 'http://127.0.0.1:31121').replace(/\/$/, '');
  const cache = new Map<string, TokenCacheRecord>();

  function requiredScopes(req: Request): string[] | null {
    const path = String(req.originalUrl ?? req.path).split('?')[0];
    if (!path.startsWith('/api/drive/')) {
      return null;
    }

    if (
      path === '/api/drive/artifacts/query'
      || /^\/api\/drive\/artifacts\/[^/]+\/download-url$/.test(path)
    ) {
      return [
        'drive.appdata.read',
        'drive.drive.read',
        'drive.delegated.read',
      ];
    }

    if (path.includes('/acl') || path.includes('/grants')) {
      return ['drive.drive.share'];
    }

    if (req.method === 'GET') {
      return [
        'drive.appdata.read',
        'drive.drive.read',
        'drive.delegated.read',
      ];
    }

    if (req.method === 'DELETE') {
      return ['drive.drive.share', 'drive.appdata.delete', 'drive.drive.delete'];
    }

    return ['drive.appdata.write', 'drive.drive.write', 'drive.drive.share'];
  }

  function isFoundationInternalAllowed(path: string, method: string): boolean {
    if (method !== 'POST' && !(method === 'GET' && path === '/api/drive/containers')) {
      return false;
    }
    if (path === '/api/drive/artifacts/init-upload') {
      return true;
    }
    if (/^\/api\/drive\/artifacts\/[^/]+\/complete-upload$/.test(path)) {
      return true;
    }
    if (path === '/api/drive/artifacts/query') {
      return true;
    }
    if (/^\/api\/drive\/artifacts\/[^/]+\/download-url$/.test(path)) {
      return true;
    }
    if (path === '/api/drive/containers' && method === 'GET') {
      return true;
    }
    return false;
  }

  function isFoundationOnlyPath(path: string): boolean {
    if (path === '/api/drive/artifacts/init-upload') {
      return true;
    }
    if (/^\/api\/drive\/artifacts\/[^/]+\/complete-upload$/.test(path)) {
      return true;
    }
    return false;
  }

  function resolvePdpContext(req: Request): {
    consumerAppId: 'drive';
    resourcePackId: 'drive.storage.containers.read';
    selector: {
      dataDomains: ['FILE'];
      objectTypes: ['Container'];
      containerIds: ['default'];
    };
    action: 'read';
  } | null {
    if (!enforceContainerPdp) {
      return null;
    }
    const path = String(req.originalUrl ?? req.path).split('?')[0];
    if (path === '/api/drive/containers' && req.method === 'GET') {
      return {
        consumerAppId: 'drive',
        resourcePackId: 'drive.storage.containers.read',
        selector: {
          dataDomains: ['FILE'],
          objectTypes: ['Container'],
          containerIds: ['default'],
        },
        action: 'read',
      };
    }
    return null;
  }

  async function introspectToken(token: string): Promise<TokenCacheRecord> {
    const response = await fetch(`${iamUrl}/oauth/introspect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `${response.status} ${response.statusText}`);
    }

    const payload = await response.json() as IntrospectResponse;
    const scopeRaw = normalizeString(payload.scope);
    const scopes = new Set(scopeRaw.split(/\s+/).filter(Boolean));
    const nextRecord: TokenCacheRecord = {
      active: Boolean(payload.active),
      scopes,
      expiresAtEpoch: typeof payload.exp === 'number' ? payload.exp : undefined,
      cachedAtMs: Date.now(),
    };
    cache.set(token, nextRecord);
    return nextRecord;
  }

  async function evaluatePdp(token: string, tenantId: string, context: {
    consumerAppId: 'drive';
    resourcePackId: 'drive.storage.containers.read';
    selector: {
      dataDomains: ['FILE'];
      objectTypes: ['Container'];
      containerIds: ['default'];
    };
    action: 'read';
  }): Promise<PdpDecisionResponse> {
    const response = await fetch(`${iamUrl}/api/foundation/security/pdp/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        tenantId,
        consumerAppId: context.consumerAppId,
        resourcePackId: context.resourcePackId,
        selector: context.selector,
        action: context.action,
        at: nowIso(),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`pdp evaluate failed: ${text || `${response.status} ${response.statusText}`}`);
    }

    return response.json() as Promise<PdpDecisionResponse>;
  }

  return async (req: Request, res: Response, next: () => void) => {
    if (skipAuth || req.method === 'OPTIONS') {
      next();
      return;
    }

    const path = String(req.originalUrl ?? req.path).split('?')[0];
    const sourceApp = normalizeString(req.header('x-source-app')).toLowerCase();
    if (isFoundationOnlyPath(path) && sourceApp !== 'foundation') {
      res.status(403).json({
        error: 'DRIVE_SOURCE_APP_REQUIRED',
        message: 'x-source-app=foundation is required for this path',
        path,
      });
      return;
    }
    if (sourceApp === 'foundation') {
      if (isFoundationInternalAllowed(path, req.method)) {
        next();
        return;
      }
      res.status(403).json({
        error: 'DRIVE_SOURCE_APP_DENY',
        message: 'foundation sourceApp is not allowed for this path',
        path,
      });
      return;
    }

    const needed = requiredScopes(req);
    if (!needed) {
      next();
      return;
    }

    const token = parseBearerToken(req);
    if (!token) {
      res.status(401).json({ error: 'DRIVE_AUTH_REQUIRED', message: 'Missing Bearer token' });
      return;
    }

    try {
      const cached = cache.get(token);
      const expiredByTtl = cached ? Date.now() - cached.cachedAtMs > AUTH_CACHE_TTL_MS : true;
      const expiredByExp = cached?.expiresAtEpoch ? cached.expiresAtEpoch <= Math.floor(Date.now() / 1000) : false;
      const record = cached && !expiredByTtl && !expiredByExp ? cached : await introspectToken(token);

      if (!record.active) {
        res.status(401).json({ error: 'DRIVE_TOKEN_INACTIVE', message: 'Token is inactive or expired' });
        return;
      }

      const matched = needed.some((scope) => record.scopes.has(scope));
      if (!matched) {
        res.status(403).json({
          error: 'DRIVE_SCOPE_REQUIRED',
          requiredScope: needed.join('|'),
          grantedScopes: Array.from(record.scopes.values()),
        });
        return;
      }

      const pdpContext = resolvePdpContext(req);
      if (pdpContext) {
        const tenantId = normalizeString(req.header('x-tenant-id'), 'tenant-001');
        const decision = await evaluatePdp(token, tenantId, pdpContext);
        const allowed = decision.allow === true || decision.decision === 'ALLOW';
        if (!allowed) {
          res.status(403).json({
            error: 'DRIVE_PDP_DENY',
            reason: decision.reason ?? 'pdp denied',
            decisionId: decision.decisionId,
            matchedGrantId: decision.matchedGrantId,
          });
          return;
        }
      }

      next();
    } catch (error) {
      if (String(error).includes('pdp')) {
        res.status(502).json({
          error: 'DRIVE_PDP_FAILED',
          message: String(error),
        });
        return;
      }
      res.status(502).json({
        error: 'DRIVE_INTROSPECT_FAILED',
        message: String(error),
      });
    }
  };
}

function ensureMockMode(mode: RuntimeMode, res: Response): boolean {
  void mode;
  void res;
  return true;
}

function replaceState(target: DriveState, next: DriveState): void {
  target.sequences = next.sequences;
  target.containers = next.containers;
  target.artifacts = next.artifacts;
  target.aclByArtifact = next.aclByArtifact;
  target.grants = next.grants;
  target.auditLogs = next.auditLogs;
}

function createLivePool(env: NodeJS.ProcessEnv): Pool {
  return createPool({
    host: normalizeString(env.DRIVE_DB_HOST, '127.0.0.1'),
    port: Math.max(1, Math.floor(normalizeNumber(env.DRIVE_DB_PORT, 3306))),
    database: normalizeString(env.DRIVE_DB_NAME, 'drive_db'),
    user: normalizeString(env.DRIVE_DB_USER, 'drive_user'),
    password: normalizeString(env.DRIVE_DB_PASSWORD, 'drive_password'),
    connectionLimit: 8,
    namedPlaceholders: false,
  });
}

function createEmptyState(): DriveState {
  return {
    sequences: {
      container: 0,
      artifact: 0,
      version: 0,
      grant: 0,
      audit: 0,
    },
    containers: [],
    artifacts: [],
    aclByArtifact: {},
    grants: [],
    auditLogs: [],
  };
}

function createStateStore(mode: RuntimeMode, env: NodeJS.ProcessEnv, scenario: MockScenario): StateStore {
  const state = createInitialState(nowIso, scenario);

  if (mode !== 'live') {
    return {
      ready: Promise.resolve(),
      state,
      save: async () => undefined,
    };
  }

  const pool = createLivePool(env);
  const seedEnabled = normalizeString(env.DRIVE_LIVE_SEED, 'true').toLowerCase() !== 'false';
  let saveQueue: Promise<void> = Promise.resolve();

  const persist = async () => {
    await pool.query(
      'INSERT INTO drive_state (state_key, payload) VALUES (?, CAST(? AS JSON)) ON DUPLICATE KEY UPDATE payload = VALUES(payload)',
      ['main', JSON.stringify(state)],
    );
  };

  const ready = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS drive_state (
        state_key VARCHAR(64) PRIMARY KEY,
        payload JSON NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [rows] = await pool.query<JsonPayloadRow[]>(
      'SELECT CAST(payload AS CHAR) AS payload FROM drive_state WHERE state_key = ? LIMIT 1',
      ['main'],
    );

    let loadedFromStore = false;
    if (rows.length > 0 && rows[0]?.payload) {
      replaceState(state, JSON.parse(rows[0].payload) as DriveState);
      loadedFromStore = true;
    } else {
      if (!seedEnabled) {
        replaceState(state, createEmptyState());
      }
    }

    const normalized = ensureDefaultContainers(state, nowIso);
    if (normalized || !loadedFromStore) {
      await persist();
    }
  })();

  const save = async () => {
    saveQueue = saveQueue
      .then(async () => {
        await persist();
      })
      .catch((error) => {
        console.error('[drive-api] state persistence failed', error);
      });
    await saveQueue;
  };

  return {
    ready,
    state,
    save,
  };
}

function createObjectStore(mode: RuntimeMode, env: NodeJS.ProcessEnv, endpoint: string, bucket: string): ObjectStoreBridge {
  if (mode !== 'live') {
    const mockObjects = new Map<string, Buffer>();
    return {
      ready: Promise.resolve(),
      putVersionObject: async (artifactId: string, versionId: string, payload: Buffer) => {
        mockObjects.set(`${artifactId}/${versionId}`, Buffer.from(payload));
      },
      getVersionObject: async (artifactId: string, versionId: string) => {
        const payload = mockObjects.get(`${artifactId}/${versionId}`);
        return payload ? Buffer.from(payload) : null;
      },
    };
  }

  const parsed = new URL(endpoint);
  const accessKey = normalizeString(env.DRIVE_MINIO_ACCESS_KEY, 'minioadmin');
  const secretKey = normalizeString(env.DRIVE_MINIO_SECRET_KEY, 'minioadmin');
  const client = new MinioClient({
    endPoint: parsed.hostname,
    port: Number(parsed.port || (parsed.protocol === 'https:' ? 443 : 80)),
    useSSL: parsed.protocol === 'https:',
    accessKey,
    secretKey,
  });

  const ready = (async () => {
    const exists = await client.bucketExists(bucket).catch(() => false);
    if (!exists) {
      await client.makeBucket(bucket, 'us-east-1').catch((error: unknown) => {
        const code = String((error as { code?: string })?.code ?? '');
        if (code === 'BucketAlreadyOwnedByYou' || code === 'BucketAlreadyExists') {
          return;
        }
        throw error;
      });
    }
  })();

  return {
    ready,
    putVersionObject: async (artifactId: string, versionId: string, payload: Buffer, mimeType: string) => {
      await ready;
      const objectKey = `${artifactId}/${versionId}`;
      await client.putObject(bucket, objectKey, payload, payload.length, {
        'Content-Type': mimeType || 'application/octet-stream',
      });
    },
    getVersionObject: async (artifactId: string, versionId: string) => {
      await ready;
      const objectKey = `${artifactId}/${versionId}`;
      try {
        const stream = await client.getObject(bucket, objectKey);
        return streamToBuffer(stream);
      } catch (error) {
        const code = String((error as { code?: string })?.code ?? '');
        if (code === 'NoSuchKey' || code === 'NotFound') {
          return null;
        }
        throw error;
      }
    },
  };
}

function appendAudit(state: DriveState, payload: Omit<DriveAuditLog, 'auditId' | 'createdAt'>): void {
  state.auditLogs.unshift({
    auditId: allocateId(state, 'audit', 'audit'),
    createdAt: nowIso(),
    ...payload,
  });
}

export function createApp(env: NodeJS.ProcessEnv = process.env): Express {
  const app = express();
  const mode: RuntimeMode = env.MODE === 'live' ? 'live' : 'mock';
  const bodyLimit = normalizeString(env.DRIVE_BODY_LIMIT, '64mb');
  const scenario = resolveScenario(env);
  const minioEndpoint = normalizeString(env.DRIVE_MINIO_ENDPOINT, 'http://127.0.0.1:9000').replace(/\/$/, '');
  const minioBucket = normalizeString(env.DRIVE_MINIO_BUCKET, 'drive-live');
  const store = createStateStore(mode, env, scenario);
  const objectStore = createObjectStore(mode, env, minioEndpoint, minioBucket);
  const state = store.state;
  const signedUrlSecret = normalizeString(env.DRIVE_SIGNED_URL_SECRET, 'drive-signed-url-secret');
  const buildObjectUrl = (kind: 'upload' | 'download', artifactId: string, versionId: string): string => {
    if (mode !== 'live') {
      return `https://minio.local/mock-${kind}/${artifactId}/${versionId}`;
    }
    return `${minioEndpoint}/${minioBucket}/${artifactId}/${versionId}`;
  };
  const buildSignedDownloadUrl = (req: Request, artifactId: string, versionId: string) => {
    const expiresAtMs = Date.now() + SIGNED_URL_TTL_MS;
    const signature = signDownloadPayload(signedUrlSecret, artifactId, versionId, expiresAtMs);
    const origin = `${req.protocol}://${req.get('host')}`;
    const downloadPath = `/api/drive/public/artifacts/${encodeURIComponent(artifactId)}/versions/${encodeURIComponent(versionId)}/download?expires=${expiresAtMs}&sig=${signature}`;
    return {
      downloadUrl: `${origin}${downloadPath}`,
      expiresAt: new Date(expiresAtMs).toISOString(),
    };
  };
  const applyFailure: ApplyFailure = (req, res, defaultFailure) => {
    if (mode === 'live') {
      return Promise.resolve(false);
    }
    return maybeApplyFailure(req, res, scenario, defaultFailure);
  };

  app.use(cors());
  app.use(express.json({ limit: bodyLimit }));
  app.use(async (_req, _res, next) => {
    await store.ready;
    await objectStore.ready;
    next();
  });
  app.use((req, res, next) => {
    if (mode !== 'live') {
      next();
      return;
    }
    res.on('finish', () => {
      if (req.method === 'GET' || req.method === 'HEAD') {
        return;
      }
      if (res.statusCode >= 500) {
        return;
      }
      void store.save();
    });
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'drive-api', mode, scenario, at: nowIso() });
  });

  app.all('/api/drive/mock/*', (_req, res) => {
    if (mode !== 'live') {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }
    res.status(410).json({
      error: 'MOCK_ENDPOINT_DISABLED_IN_LIVE',
      message: 'mock endpoints are disabled in live mode',
    });
  });

  app.get('/api/drive/public/artifacts/:artifactId/versions/:versionId/download', async (req, res) => {
    const artifactId = normalizeString(req.params.artifactId);
    const versionId = normalizeString(req.params.versionId);
    const expiresAtMs = Number.parseInt(normalizeString(req.query.expires), 10);
    const signature = normalizeString(req.query.sig);

    if (!artifactId || !versionId || !Number.isFinite(expiresAtMs) || !signature) {
      res.status(400).json({ error: 'invalid signed download url' });
      return;
    }
    if (Date.now() > expiresAtMs) {
      res.status(403).json({ error: 'signed download url expired' });
      return;
    }

    const expectedSignature = signDownloadPayload(signedUrlSecret, artifactId, versionId, expiresAtMs);
    if (!safeSignatureEquals(signature, expectedSignature)) {
      res.status(403).json({ error: 'signed download url signature mismatch' });
      return;
    }

    const artifact = state.artifacts.find((item) => item.artifactId === artifactId);
    if (!artifact) {
      res.status(404).json({ error: 'artifact not found' });
      return;
    }
    const version = artifact.versions.find((item) => item.versionId === versionId);
    if (!version) {
      res.status(404).json({ error: 'version not found' });
      return;
    }

    const payload = await objectStore.getVersionObject(artifactId, versionId);
    if (!payload) {
      res.status(404).json({ error: 'artifact payload not found' });
      return;
    }

    const safeFileName = artifact.displayName.replace(/["\r\n]/g, '_');
    res.setHeader('Content-Type', artifact.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', String(payload.length));
    res.setHeader('Cache-Control', 'private, max-age=60');
    res.setHeader('Content-Disposition', `inline; filename="${safeFileName}"`);
    if (version.etag && version.etag !== 'pending') {
      res.setHeader('ETag', version.etag);
    }
    res.send(payload);
  });

  app.use('/api/drive', createAuthMiddleware(env, mode));

  app.get('/api/drive/containers', async (req, res) => {
    if (!ensureMockMode(mode, res)) return;
    if (await applyFailure(req, res, '500')) return;
    res.json({ items: state.containers, total: state.containers.length });
  });

  app.post('/api/drive/containers', async (req, res) => {
    if (!ensureMockMode(mode, res)) return;
    if (await applyFailure(req, res, '409')) return;

    const name = normalizeString(req.body?.name);
    const modeInput = normalizeString(req.body?.mode).toUpperCase();
    if (!name || (modeInput !== 'APP_DATA' && modeInput !== 'MY_DRIVE')) {
      res.status(400).json({ error: 'name and mode(APP_DATA|MY_DRIVE) are required' });
      return;
    }

    const created: DriveContainer = {
      containerId: allocateId(state, 'container', 'ctr'),
      tenantId: normalizeString(req.body?.tenantId, 'tenant-001'),
      ownerAppId: normalizeString(req.body?.ownerAppId, 'ordering'),
      mode: modeInput as ContainerMode,
      name,
      quotaBytes: Math.max(1, normalizeNumber(req.body?.quotaBytes, 10 * 1024 * 1024 * 1024)),
      usedBytes: 0,
      createdAt: nowIso(),
    };
    state.containers.unshift(created);
    appendAudit(state, {
      action: 'container.create',
      actorAppId: created.ownerAppId,
      result: 'ALLOW',
      reason: 'container created',
    });
    res.status(201).json({ container: created });
  });

  app.post('/api/drive/artifacts/init-upload', async (req, res) => {
    if (!ensureMockMode(mode, res)) return;
    if (await applyFailure(req, res, '409')) return;

    const requestedArtifactId = normalizeString(req.body?.artifactId);
    const containerId = normalizeString(req.body?.containerId);
    const artifactType = normalizeString(req.body?.artifactType).toUpperCase();
    const fileName = normalizeString(req.body?.fileName);
    const mimeType = normalizeString(req.body?.mimeType, 'application/octet-stream');

    const container = state.containers.find((item) => item.containerId === containerId);
    if (!container) {
      res.status(404).json({ error: 'container not found' });
      return;
    }
    if (!fileName || (artifactType !== 'DRAWING' && artifactType !== 'PARTS' && artifactType !== 'LAYOUT')) {
      res.status(400).json({ error: 'containerId, artifactType and fileName are required' });
      return;
    }

    const versionId = allocateId(state, 'version', 'ver');
    const createdAt = nowIso();
    const existingArtifact = requestedArtifactId
      ? state.artifacts.find((item) => item.artifactId === requestedArtifactId)
      : null;
    if (requestedArtifactId && !existingArtifact) {
      res.status(404).json({ error: 'artifact not found' });
      return;
    }

    let artifact: DriveArtifact;
    let artifactId: string;
    let version: DriveArtifactVersion;

    if (existingArtifact) {
      if (existingArtifact.containerId !== container.containerId) {
        res.status(409).json({ error: 'artifact container mismatch' });
        return;
      }
      if (existingArtifact.artifactType !== artifactType) {
        res.status(409).json({ error: 'artifact type mismatch' });
        return;
      }

      artifact = existingArtifact;
      artifactId = existingArtifact.artifactId;
      version = {
        versionId,
        versionNo: existingArtifact.versions.length + 1,
        sizeBytes: Math.max(0, normalizeNumber(req.body?.sizeBytes, 0)),
        etag: 'pending',
        createdAt,
      };
      artifact.displayName = fileName || artifact.displayName;
      artifact.mimeType = mimeType || artifact.mimeType;
      artifact.projectId = normalizeString(req.body?.projectId) || artifact.projectId;
      artifact.updatedAt = createdAt;
      artifact.versions.push(version);
    } else {
      artifactId = allocateId(state, 'artifact', 'art');
      version = {
        versionId,
        versionNo: 1,
        sizeBytes: Math.max(0, normalizeNumber(req.body?.sizeBytes, 0)),
        etag: 'pending',
        createdAt,
      };

      artifact = {
        artifactId,
        tenantId: container.tenantId,
        containerId: container.containerId,
        artifactType: artifactType as ArtifactType,
        ownerAppId: container.ownerAppId,
        displayName: fileName,
        mimeType,
        currentVersionId: versionId,
        projectId: normalizeString(req.body?.projectId) || undefined,
        createdAt,
        updatedAt: createdAt,
        versions: [version],
      };

      state.artifacts.unshift(artifact);
      state.aclByArtifact[artifact.artifactId] = [
        {
          principalType: 'APP',
          principalId: artifact.ownerAppId,
          permissions: ['read', 'write', 'delete', 'share'],
        },
      ];
    }

    appendAudit(state, {
      action: 'artifact.init_upload',
      actorAppId: artifact.ownerAppId,
      artifactId: artifact.artifactId,
      result: 'ALLOW',
      reason: 'upload initialized',
    });

    res.json({
      artifactId,
      versionId,
      uploadUrl: buildObjectUrl('upload', artifactId, versionId),
      expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
    });
  });

  app.post('/api/drive/artifacts/:artifactId/complete-upload', async (req, res) => {
    if (!ensureMockMode(mode, res)) return;
    if (await applyFailure(req, res, '409')) return;

    const artifactId = normalizeString(req.params.artifactId);
    const artifact = state.artifacts.find((item) => item.artifactId === artifactId);
    if (!artifact) {
      res.status(404).json({ error: 'artifact not found' });
      return;
    }

    const versionId = normalizeString(req.body?.versionId, artifact.currentVersionId);
    let version = artifact.versions.find((item) => item.versionId === versionId);
    if (!version) {
      version = {
        versionId,
        versionNo: artifact.versions.length + 1,
        sizeBytes: 0,
        etag: 'pending',
        createdAt: nowIso(),
      };
      artifact.versions.push(version);
    }

    const contentBase64 = normalizeString(req.body?.contentBase64);
    const fallbackPayload = Buffer.from(
      JSON.stringify({
        artifactId,
        versionId,
        completedAt: nowIso(),
      }),
      'utf-8',
    );
    const objectPayload = contentBase64 ? Buffer.from(contentBase64, 'base64') : fallbackPayload;

    version.sizeBytes = Math.max(0, normalizeNumber(req.body?.sizeBytes, version.sizeBytes || objectPayload.length));
    version.etag = normalizeString(req.body?.etag, version.etag);
    const sha256 = normalizeString(req.body?.sha256);
    version.sha256 = sha256 || version.sha256;

    try {
      await objectStore.putVersionObject(artifactId, versionId, objectPayload, artifact.mimeType);
    } catch (error) {
      console.error('[drive-api] failed to persist object payload', error);
      res.status(502).json({
        error: 'OBJECT_STORE_WRITE_FAILED',
        message: 'failed to write object payload into minio',
      });
      return;
    }

    artifact.currentVersionId = version.versionId;
    artifact.updatedAt = nowIso();

    appendAudit(state, {
      action: 'artifact.complete_upload',
      actorAppId: artifact.ownerAppId,
      artifactId,
      result: 'ALLOW',
      reason: 'upload completed',
    });

    res.json({ artifact });
  });

  app.post('/api/drive/artifacts/query', async (req, res) => {
    if (!ensureMockMode(mode, res)) return;
    if (await applyFailure(req, res, '500')) return;

    const keyword = normalizeString(req.body?.keyword).toLowerCase();
    const containerId = normalizeString(req.body?.containerId);
    const artifactType = normalizeString(req.body?.artifactType).toUpperCase();
    const projectId = normalizeString(req.body?.projectId);

    let rows = [...state.artifacts];
    if (containerId) {
      rows = rows.filter((row) => row.containerId === containerId);
    }
    if (artifactType) {
      rows = rows.filter((row) => row.artifactType === artifactType);
    }
    if (projectId) {
      rows = rows.filter((row) => row.projectId === projectId);
    }
    if (keyword) {
      rows = rows.filter((row) => includeKeyword([row.displayName, row.artifactId, row.ownerAppId], keyword));
    }

    const pageData = paginate(rows, req.body?.page, req.body?.pageSize);
    res.json(pageData);
  });

  app.get('/api/drive/artifacts/:artifactId', async (req, res) => {
    if (!ensureMockMode(mode, res)) return;
    if (await applyFailure(req, res, '403')) return;

    const artifactId = normalizeString(req.params.artifactId);
    const artifact = state.artifacts.find((item) => item.artifactId === artifactId);
    if (!artifact) {
      res.status(404).json({ error: 'artifact not found' });
      return;
    }

    appendAudit(state, {
      action: 'artifact.read',
      actorAppId: normalizeString(req.header('x-app-id'), 'ordering'),
      artifactId,
      result: 'ALLOW',
      reason: 'metadata read',
    });

    res.json({ artifact });
  });

  app.get('/api/drive/artifacts/:artifactId/versions', async (req, res) => {
    if (!ensureMockMode(mode, res)) return;
    if (await applyFailure(req, res, '403')) return;

    const artifactId = normalizeString(req.params.artifactId);
    const artifact = state.artifacts.find((item) => item.artifactId === artifactId);
    if (!artifact) {
      res.status(404).json({ error: 'artifact not found' });
      return;
    }

    res.json({ items: artifact.versions, total: artifact.versions.length });
  });

  app.post('/api/drive/artifacts/:artifactId/download-url', async (req, res) => {
    if (!ensureMockMode(mode, res)) return;
    if (await applyFailure(req, res, '403')) return;

    const artifactId = normalizeString(req.params.artifactId);
    const artifact = state.artifacts.find((item) => item.artifactId === artifactId);
    if (!artifact) {
      res.status(404).json({ error: 'artifact not found' });
      return;
    }

    const versionId = normalizeString(req.body?.versionId, artifact.currentVersionId);
    const version = artifact.versions.find((item) => item.versionId === versionId);
    if (!version) {
      res.status(404).json({ error: 'version not found' });
      return;
    }

    appendAudit(state, {
      action: 'artifact.download_url',
      actorAppId: normalizeString(req.header('x-app-id'), 'ordering'),
      artifactId,
      result: 'ALLOW',
      reason: 'signed url generated',
    });

    res.json({
      artifactId,
      versionId,
      ...buildSignedDownloadUrl(req, artifactId, versionId),
    });
  });

  app.put('/api/drive/artifacts/:artifactId/acl', async (req, res) => {
    if (!ensureMockMode(mode, res)) return;
    if (await applyFailure(req, res, '409')) return;

    const artifactId = normalizeString(req.params.artifactId);
    const artifact = state.artifacts.find((item) => item.artifactId === artifactId);
    if (!artifact) {
      res.status(404).json({ error: 'artifact not found' });
      return;
    }

    const entries = Array.isArray(req.body?.entries)
      ? req.body.entries
          .map((entry: unknown) => {
            const candidate = entry as Record<string, unknown>;
            const principalType = normalizeString(candidate?.principalType).toUpperCase();
            const principalId = normalizeString(candidate?.principalId);
            const permissions = Array.isArray(candidate?.permissions)
              ? candidate.permissions.map((item) => String(item)).filter(Boolean)
              : [];
            if (!principalId || permissions.length === 0) {
              return null;
            }
            if (!['USER', 'APP', 'ROLE', 'DOMAIN'].includes(principalType)) {
              return null;
            }
            return {
              principalType: principalType as PrincipalType,
              principalId,
              permissions,
              expiresAt: normalizeString(candidate?.expiresAt) || undefined,
            } satisfies DriveAclEntry;
          })
          .filter((entry: DriveAclEntry | null): entry is DriveAclEntry => Boolean(entry))
      : [];

    state.aclByArtifact[artifactId] = entries;
    artifact.updatedAt = nowIso();

    appendAudit(state, {
      action: 'artifact.acl.update',
      actorAppId: normalizeString(req.header('x-app-id'), artifact.ownerAppId),
      artifactId,
      result: 'ALLOW',
      reason: 'acl replaced',
    });

    res.json({ artifactId, entries });
  });

  app.post('/api/drive/artifacts/:artifactId/grants', async (req, res) => {
    if (!ensureMockMode(mode, res)) return;
    if (await applyFailure(req, res, '409')) return;

    const artifactId = normalizeString(req.params.artifactId);
    const artifact = state.artifacts.find((item) => item.artifactId === artifactId);
    if (!artifact) {
      res.status(404).json({ error: 'artifact not found' });
      return;
    }

    const sourceAppId = normalizeString(req.body?.sourceAppId, artifact.ownerAppId);
    const targetAppId = normalizeString(req.body?.targetAppId);
    const permissions = Array.isArray(req.body?.permissions)
      ? req.body.permissions.map((item: unknown) => String(item)).filter(Boolean)
      : [];

    if (!targetAppId || permissions.length === 0) {
      res.status(400).json({ error: 'targetAppId and permissions are required' });
      return;
    }

    const grant: DriveGrant = {
      grantId: allocateId(state, 'grant', 'grant'),
      artifactId,
      sourceAppId,
      targetAppId,
      permissions,
      status: 'ACTIVE',
      expiresAt: normalizeString(req.body?.expiresAt) || undefined,
      createdAt: nowIso(),
    };
    state.grants.unshift(grant);

    appendAudit(state, {
      action: 'grant.create',
      actorAppId: sourceAppId,
      artifactId,
      result: 'ALLOW',
      reason: `grant to ${targetAppId}`,
    });

    res.json(grant);
  });

  app.delete('/api/drive/grants/:grantId', async (req, res) => {
    if (!ensureMockMode(mode, res)) return;
    if (await applyFailure(req, res, '409')) return;

    const grantId = normalizeString(req.params.grantId);
    const grant = state.grants.find((item) => item.grantId === grantId);
    if (!grant) {
      res.status(404).json({ error: 'grant not found' });
      return;
    }

    grant.status = 'REVOKED';
    grant.revokedAt = nowIso();

    appendAudit(state, {
      action: 'grant.revoke',
      actorAppId: normalizeString(req.header('x-app-id'), grant.sourceAppId),
      artifactId: grant.artifactId,
      result: 'ALLOW',
      reason: `revoke ${grantId}`,
    });

    res.json({ success: true, grantId, revokedAt: grant.revokedAt });
  });

  app.get('/api/drive/audit/logs', async (req, res) => {
    if (!ensureMockMode(mode, res)) return;
    if (await applyFailure(req, res, '500')) return;

    const artifactId = normalizeString(req.query.artifactId);
    const action = normalizeString(req.query.action).toLowerCase();

    let rows = [...state.auditLogs];
    if (artifactId) {
      rows = rows.filter((row) => row.artifactId === artifactId);
    }
    if (action) {
      rows = rows.filter((row) => row.action.toLowerCase() === action);
    }

    const pageData = paginate(rows, req.query.page, req.query.pageSize);
    res.json(pageData);
  });

  return app;
}
