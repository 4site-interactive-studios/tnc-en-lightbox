import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'

function versionBanner(): Plugin {
  const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))
  const banner = `/*! tnc-en-lightbox v${pkg.version} | MIT */\n`
  return {
    name: 'version-banner',
    generateBundle(_opts, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === 'chunk' && file.fileName === 'en-lightbox.js') {
          file.code = banner + file.code
        }
      }
    },
  }
}

export default defineConfig({
  build: {
    target: 'es2020',
    minify: 'oxc',
    cssCodeSplit: false,
    emptyOutDir: true,
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'ENLightboxAPI',
      fileName: () => 'en-lightbox.js',
      formats: ['iife'],
    },
  },
  plugins: [versionBanner()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    clearMocks: true,
  },
})
