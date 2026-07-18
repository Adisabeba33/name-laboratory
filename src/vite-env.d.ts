/// <reference types="vite/client" />

// Build-time constants injected via vite `define` (see vite.config.ts).
declare const __APP_VERSION__: string
declare const __BUILD_SHA__: string
declare const __BUILD_TIME__: string

// Optional Supabase auth config — absent → the app runs in guest mode.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
