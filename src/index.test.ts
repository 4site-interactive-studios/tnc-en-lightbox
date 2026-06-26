import { describe, it, expect, afterEach, vi } from 'vitest'
import { lightboxHost, sq } from './core/shadow-test-helpers'

afterEach(() => {
  document.body.innerHTML = ''
  document.head.querySelectorAll('style[data-enlb]').forEach((el) => el.remove())
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

describe('setTheme API', () => {
  it('re-applies a new preset at runtime via applyTheme', async () => {
    const mod = await import('./index')
    const lb = mod.init({ header: 'H', body: 'B' })
    lb.open()
    const overlay = sq('.enlb-overlay') as HTMLElement
    expect(overlay.classList.contains('enlb-theme-light')).toBe(true)

    mod.setTheme({ preset: 'dark' })

    expect(overlay.classList.contains('enlb-theme-dark')).toBe(true)
    expect(overlay.classList.contains('enlb-theme-light')).toBe(false)
    lb.close()
  })

  it('applies per-token color overrides at runtime', async () => {
    const mod = await import('./index')
    const lb = mod.init({ header: 'H', body: 'B' })
    lb.open()
    mod.setTheme({ colors: { ctaBg: '#ff0000' } })
    const overlay = sq('.enlb-overlay') as HTMLElement
    expect(overlay.style.getPropertyValue('--enlb-cta-bg')).toBe('#ff0000')
    lb.close()
  })

  it('is a no-op when no instance is active', async () => {
    const mod = await import('./index')
    expect(() => mod.setTheme({ preset: 'dark' })).not.toThrow()
  })
})

describe('CTA routing', () => {
  it('does not re-open via API after a close CTA dismisses the lightbox', async () => {
    const mod = await import('./index')
    mod.init({ header: 'H', body: 'B', cta: { label: 'Close', action: 'close' } })
    mod.open()
    expect(sq('.enlb-overlay')).not.toBeNull()
    ;(sq('.enlb-cta') as HTMLElement).click()
    expect(lightboxHost()).toBeNull()
    mod.open()
    expect(lightboxHost()).toBeNull()
  })
})
