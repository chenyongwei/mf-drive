import assert from "node:assert/strict";

interface RuntimeServer {
  listen: (port: number, host: string) => any;
}

interface ServerAddress {
  port: number;
}

export async function startServer(
  createApp: (env?: NodeJS.ProcessEnv) => RuntimeServer,
  env: NodeJS.ProcessEnv,
): Promise<{ server: any; base: string }> {
  const app = createApp(env);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  const address = server.address() as ServerAddress | string | null;
  if (!address || typeof address === "string") {
    throw new Error("failed to bind test server");
  }
  return { server, base: `http://127.0.0.1:${address.port}` };
}

export async function closeServer(server: any): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error: unknown) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

export async function expectStatus(
  url: string,
  expectedStatus: number,
  init?: RequestInit,
): Promise<void> {
  const response = await fetch(url, init);
  assert.equal(response.status, expectedStatus, `${url} should return HTTP ${expectedStatus}`);
}
