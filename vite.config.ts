import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

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
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    clearMocks: true,
  },
})
