/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CESIUM_ION_TOKEN?: string
  readonly VITE_CESIUM_3D_TILES_URL?: string
  readonly VITE_CESIUM_ION_ASSET_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const CESIUM_BASE_URL: string
