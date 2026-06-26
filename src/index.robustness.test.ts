import { describe, it, expect, afterEach, vi } from 'vitest'

const ENL = globalThis as typeof globalThis & {
  ENLightbox?: unknown
  ENLightboxAPI?: unknown
  __ENLightboxLoaded?: boolean
}

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
  document.head.querySelectorAll('style[data-enlb]').forEach((el) => el.remove())
  delete ENL.ENLightbox
  delete ENL.ENLightboxAPI
  delete ENL.__ENLightboxLoaded
  try {
    localStorage.clear()
  } catch {
    // storage unavailable
  }
  vi.restoreAllMocks()
  vi.resetModules()
})

describe('auto-init robustness', () => {
  it('a wrong-typed config (non-iterable triggers.list) does not throw and yields a default-themed instance', async () => {
    ENL.ENLightbox = { triggers: { list: 123 } }
    const mod = await import('./index')
    const lb = mod.getInstance()
    expect(lb).toBeInstanceOf(mod.Lightbox)
    lb!.open()
    expect(document.querySelector('.enlb-overlay')?.classList.contains('enlb-theme-light')).toBe(true)
    lb!.close()
  })

  it('theme.colors set to null degrades to the default theme without throwing', async () => {
    ENL.ENLightbox = { theme: { colors: null } }
    const mod = await import('./index')
    const lb = mod.getInstance()
    expect(lb).toBeInstanceOf(mod.Lightbox)
    lb!.open()
    expect(document.querySelector('.enlb-overlay')?.classList.contains('enlb-theme-light')).toBe(true)
    lb!.close()
  })

  it('a forced throw during auto-init is swallowed and emits a single console.warn', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const cfg: Record<string, unknown> = {}
    Object.defineProperty(cfg, 'triggers', {
      get() {
        throw new Error('forced init failure')
      },
      enumerable: true,
      configurable: true,
    })
    ENL.ENLightbox = cfg

    await expect(import('./index')).resolves.toBeDefined()
    expect(warnSpy).toHaveBeenCalledOnce()
  })

  it('a second script evaluation is a no-op (no re-init, no destroy, no re-arm)', async () => {
    ENL.ENLightbox = { header: 'first' }
    const mod1 = await import('./index')
    expect(mod1.getInstance()).toBeInstanceOf(mod1.Lightbox)
    expect(ENL.__ENLightboxLoaded).toBe(true)

    vi.resetModules()
    ENL.ENLightbox = { header: 'second' }
    const mod2 = await import('./index')
    expect(mod2.getInstance()).toBeNull()
  })

  it('defers auto-init to DOMContentLoaded when loading and no config is set yet', async () => {
    const readySpy = vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading')
    const mod = await import('./index')
    expect(mod.getInstance()).toBeNull()

    ENL.ENLightbox = { header: 'Deferred', body: 'B' }
    document.dispatchEvent(new Event('DOMContentLoaded'))

    const lb = mod.getInstance()
    expect(lb).toBeInstanceOf(mod.Lightbox)
    lb!.open()
    expect(document.querySelector('.enlb-overlay')).not.toBeNull()
    lb!.close()
    readySpy.mockRestore()
  })
})
