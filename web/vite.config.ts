import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const portRaw = Number.parseInt(process.env.PORT ?? '31211', 10);
const port = Number.isFinite(portRaw) ? portRaw : 31211;

const basePath = process.env.VITE_BASE_PATH ?? '/';
const driveProxyTarget = process.env.VITE_API_PROXY_DRIVE_TARGET ?? 'http://127.0.0.1:31210';
const foundationProxyTarget = process.env.VITE_API_PROXY_FOUNDATION_TARGET ?? 'http://127.0.0.1:31200';

const hmrHost = process.env.VITE_HMR_HOST;
const hmrPortRaw = Number.parseInt(process.env.VITE_HMR_PORT ?? '', 10);
const hmrClientPort = Number.isFinite(hmrPortRaw) ? hmrPortRaw : undefined;
const hmrPath = process.env.VITE_HMR_PATH;

const hmr =
  hmrHost || hmrClientPort || hmrPath
    ? {
        ...(hmrHost ? { host: hmrHost } : {}),
        ...(hmrClientPort ? { clientPort: hmrClientPort } : {}),
        ...(hmrPath ? { path: hmrPath } : {}),
      }
    : undefined;

export default defineConfig({
  base: basePath,
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port,
    strictPort: true,
    proxy: {
      '/api/drive': {
        target: driveProxyTarget,
        changeOrigin: true,
      },
      '/oauth': {
        target: foundationProxyTarget,
        changeOrigin: true,
      },
      '/api/foundation': {
        target: foundationProxyTarget,
        changeOrigin: true,
      },
    },
    ...(hmr ? { hmr } : {}),
  },
});
