import assert from 'node:assert/strict';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createApp } from '../server';

async function startServer(env: NodeJS.ProcessEnv): Promise<{ server: any; base: string }> {
  const app = createApp(env);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('failed to bind test server');
  }
  return { server, base: `http://127.0.0.1:${address.port}` };
}

async function closeServer(server: any): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error: unknown) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

type MockIamRuntime = {
  server: any;
  base: string;
  pdpCalls: Record<string, number>;
};

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }
  if (chunks.length === 0) {
    return {};
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf-8')) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function writeJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function startMockIamServer(): Promise<MockIamRuntime> {
  const pdpCalls: Record<string, number> = {};
  const server = createServer(async (req, res) => {
    const path = String(req.url ?? '').split('?')[0];
    if (req.method === 'POST' && path === '/oauth/introspect') {
      const body = await readJsonBody(req);
      const token = String(body.token ?? '').trim();
      if (token === 'drive-token') {
        writeJson(res, 200, {
          active: true,
          client_id: 'drive-web',
          scope: 'drive.appdata.read drive.appdata.write drive.drive.read drive.drive.write',
          exp: Math.floor(Date.now() / 1000) + 3600,
        });
        return;
      }
      if (token === 'ordering-token') {
        writeJson(res, 200, {
          active: true,
          client_id: 'ordering-web',
          scope: 'drive.appdata.read drive.appdata.write drive.drive.read drive.drive.write',
          exp: Math.floor(Date.now() / 1000) + 3600,
        });
        return;
      }
      writeJson(res, 200, { active: false });
      return;
    }

    if (req.method === 'POST' && path === '/api/foundation/security/pdp/evaluate') {
      const body = await readJsonBody(req);
      const token = String(body.token ?? '').trim();
      pdpCalls[token] = (pdpCalls[token] ?? 0) + 1;

      if (token === 'ordering-token') {
        writeJson(res, 200, {
          allow: false,
          decision: 'DENY',
          reason: 'POLICY_NOT_FOUND',
          decisionId: 'pdp-deny-ordering',
        });
        return;
      }

      writeJson(res, 200, {
        allow: true,
        decision: 'ALLOW',
        reason: 'SELF_ALLOWED',
        decisionId: 'pdp-allow-generic',
      });
      return;
    }

    writeJson(res, 404, { error: 'NOT_FOUND' });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('failed to bind mock iam server');
  }
  return {
    server,
    base: `http://127.0.0.1:${address.port}`,
    pdpCalls,
  };
}

async function run() {
  const runtime = await startServer({
    ...process.env,
    MODE: 'mock',
    MOCK_PROFILE: 'base',
    DRIVE_SKIP_AUTH: 'true',
  });

  const containersRes = await fetch(`${runtime.base}/api/drive/containers`);
  assert.equal(containersRes.status, 200);

  const createContainerRes = await fetch(`${runtime.base}/api/drive/containers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'self-test-container', mode: 'APP_DATA', ownerAppId: 'ordering' }),
  });
  assert.equal(createContainerRes.status, 201);
  const createContainerPayload = await createContainerRes.json();

  const initUploadRes = await fetch(`${runtime.base}/api/drive/artifacts/init-upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      containerId: createContainerPayload.container.containerId,
      artifactType: 'DRAWING',
      fileName: 'self-test.dxf',
      mimeType: 'application/dxf',
      sizeBytes: 1024,
    }),
  });
  assert.equal(initUploadRes.status, 200);
  const initUploadPayload = await initUploadRes.json();

  const completeUploadRes = await fetch(`${runtime.base}/api/drive/artifacts/${initUploadPayload.artifactId}/complete-upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ versionId: initUploadPayload.versionId, etag: 'etag-self-test', sizeBytes: 1024 }),
  });
  assert.equal(completeUploadRes.status, 200);

  const downloadRes = await fetch(`${runtime.base}/api/drive/artifacts/${initUploadPayload.artifactId}/download-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ versionId: initUploadPayload.versionId }),
  });
  assert.equal(downloadRes.status, 200);
  const downloadPayload = await downloadRes.json();
  assert.equal(typeof downloadPayload.downloadUrl, 'string');
  assert.ok(downloadPayload.downloadUrl.includes(`/mock-download/${initUploadPayload.artifactId}/${initUploadPayload.versionId}`));

  const queryRes = await fetch(`${runtime.base}/api/drive/artifacts/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword: 'self-test' }),
  });
  assert.equal(queryRes.status, 200);

  const grantRes = await fetch(`${runtime.base}/api/drive/artifacts/${initUploadPayload.artifactId}/grants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceAppId: 'drawing', targetAppId: 'ordering', permissions: ['read'] }),
  });
  assert.equal(grantRes.status, 200);

  const auditRes = await fetch(`${runtime.base}/api/drive/audit/logs`);
  assert.equal(auditRes.status, 200);
  const auditPayload = await auditRes.json();
  assert.ok(Array.isArray(auditPayload.items));

  await closeServer(runtime.server);

  const authRuntime = await startServer({
    ...process.env,
    MODE: 'mock',
    MOCK_PROFILE: 'base',
    DRIVE_SKIP_AUTH: 'false',
  });

  const unauthorizedRes = await fetch(`${authRuntime.base}/api/drive/containers`);
  assert.equal(unauthorizedRes.status, 401);

  await closeServer(authRuntime.server);

  const iamRuntime = await startMockIamServer();
  const pdpRuntime = await startServer({
    ...process.env,
    MODE: 'mock',
    MOCK_PROFILE: 'base',
    DRIVE_SKIP_AUTH: 'false',
    FOUNDATION_IAM_URL: iamRuntime.base,
  });

  const driveSelfRes = await fetch(`${pdpRuntime.base}/api/drive/containers`, {
    headers: { Authorization: 'Bearer drive-token' },
  });
  assert.equal(driveSelfRes.status, 200);

  const orderingCrossRes = await fetch(`${pdpRuntime.base}/api/drive/containers`, {
    headers: { Authorization: 'Bearer ordering-token' },
  });
  assert.equal(orderingCrossRes.status, 403);
  const orderingCrossPayload = await orderingCrossRes.json();
  assert.equal(orderingCrossPayload.error, 'DRIVE_PDP_DENY');

  assert.equal(iamRuntime.pdpCalls['drive-token'] ?? 0, 0);
  assert.equal(iamRuntime.pdpCalls['ordering-token'] ?? 0, 1);

  await closeServer(pdpRuntime.server);
  await closeServer(iamRuntime.server);

  console.log('[drive-api] mock self-test passed');
}

run().catch((error) => {
  console.error('[drive-api] mock self-test failed', error);
  process.exit(1);
});
