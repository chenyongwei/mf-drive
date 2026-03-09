import assert from 'node:assert/strict';
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
  const versionOneContent = Buffer.from('DRAWING-V1', 'utf8').toString('base64');

  const completeUploadRes = await fetch(`${runtime.base}/api/drive/artifacts/${initUploadPayload.artifactId}/complete-upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      versionId: initUploadPayload.versionId,
      etag: 'etag-self-test-v1',
      sizeBytes: 1024,
      contentBase64: versionOneContent,
    }),
  });
  assert.equal(completeUploadRes.status, 200);

  const appendUploadRes = await fetch(`${runtime.base}/api/drive/artifacts/init-upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      artifactId: initUploadPayload.artifactId,
      containerId: createContainerPayload.container.containerId,
      artifactType: 'DRAWING',
      fileName: 'self-test.dxf',
      mimeType: 'application/dxf',
      sizeBytes: 2048,
    }),
  });
  assert.equal(appendUploadRes.status, 200);
  const appendUploadPayload = await appendUploadRes.json();
  const versionTwoContent = Buffer.from('DRAWING-V2', 'utf8').toString('base64');

  const appendCompleteRes = await fetch(`${runtime.base}/api/drive/artifacts/${initUploadPayload.artifactId}/complete-upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      versionId: appendUploadPayload.versionId,
      etag: 'etag-self-test-v2',
      sizeBytes: 2048,
      contentBase64: versionTwoContent,
    }),
  });
  assert.equal(appendCompleteRes.status, 200);

  const versionsRes = await fetch(`${runtime.base}/api/drive/artifacts/${initUploadPayload.artifactId}/versions`);
  assert.equal(versionsRes.status, 200);
  const versionsPayload = await versionsRes.json();
  assert.equal(versionsPayload.total, 2);

  const downloadUrlRes = await fetch(`${runtime.base}/api/drive/artifacts/${initUploadPayload.artifactId}/download-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ versionId: appendUploadPayload.versionId }),
  });
  assert.equal(downloadUrlRes.status, 200);
  const downloadUrlPayload = await downloadUrlRes.json();
  assert.equal(typeof downloadUrlPayload.downloadUrl, 'string');

  const downloadRes = await fetch(String(downloadUrlPayload.downloadUrl));
  assert.equal(downloadRes.status, 200);
  const downloadPayload = await downloadRes.text();
  assert.equal(downloadPayload, 'DRAWING-V2');

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

  console.log('[drive-api] mock self-test passed');
}

run().catch((error) => {
  console.error('[drive-api] mock self-test failed', error);
  process.exit(1);
});
