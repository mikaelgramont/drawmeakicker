/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Overrides the site the desktop app syncs to. See ./runtime.ts. */
  readonly VITE_API_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
