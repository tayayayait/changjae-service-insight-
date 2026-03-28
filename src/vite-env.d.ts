/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ASTROLOGY_ASSUME_PAID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
