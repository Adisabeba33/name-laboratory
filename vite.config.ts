/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Build-stamp injected into the app so a fresh deploy is visible at a glance. */
export function buildDefine() {
  const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
    (() => {
      try {
        return execSync('git rev-parse --short HEAD').toString().trim()
      } catch {
        return 'local'
      }
    })()
  const time = new Date().toISOString().slice(0, 16).replace('T', ' ')
  return {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_SHA__: JSON.stringify(sha),
    __BUILD_TIME__: JSON.stringify(time),
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: buildDefine(),
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
})
