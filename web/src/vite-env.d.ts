/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MODE?: 'mock' | 'live';
  readonly VITE_DRIVE_CLIENT_ID?: string;
  readonly VITE_DRIVE_SCOPE_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
