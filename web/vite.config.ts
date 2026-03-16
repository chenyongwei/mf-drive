import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const portRaw = Number.parseInt(process.env.PORT ?? '31111', 10);
const port = Number.isFinite(portRaw) ? portRaw : 31111;

const basePath = process.env.VITE_BASE_PATH ?? '/';
const driveProxyTarget = process.env.VITE_API_PROXY_DRIVE_TARGET ?? 'http://127.0.0.1:31110';
const foundationProxyTarget = process.env.VITE_API_PROXY_FOUNDATION_TARGET ?? 'http://127.0.0.1:31100';
const uiSharedRoot = path.resolve(__dirname, '../../ui-shared');

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
  resolve: {
    alias: {
      '@platform/ui-shared': path.resolve(uiSharedRoot, 'src'),
    },
  },
  optimizeDeps: {
    exclude: ['@platform/ui-shared'],
  },
  server: {
    host: '0.0.0.0',
    port,
    strictPort: true,
    fs: {
      allow: [
        path.resolve(__dirname, '..'),
        path.resolve(__dirname, '../..'),
        uiSharedRoot,
      ],
    },
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
