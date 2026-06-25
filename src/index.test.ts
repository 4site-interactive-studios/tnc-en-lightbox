import { describe, it, expect, afterEach, vi } from 'vitest'

afterEach(() => {
  delete (globalThis as { ENLightbox?: unknown }).ENLightbox
  delete (globalThis as { ENLightboxAPI?: unknown }).ENLightboxAPI
  vi.resetModules()
})

describe('index auto-init', () => {
  it('instantiates a Lightbox from window.ENLightbox when present', async () => {
    ;(globalThis as { ENLightbox?: unknown }).ENLightbox = { header: 'Hi', body: 'Body' }
    const mod = await import('./index')
    expect(mod.getInstance()).toBeInstanceOf(mod.Lightbox)
  })

  it('init(config) creates, stores, and returns a Lightbox', async () => {
    const mod = await import('./index')
    const lb = mod.init({ header: 'Hi' })
    expect(lb).toBeInstanceOf(mod.Lightbox)
    expect(mod.getInstance()).toBe(lb)
  })
})
