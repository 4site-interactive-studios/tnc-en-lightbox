import { describe, it, expect } from 'vitest'
import { normalizeLayout, normalizeTheme } from './config'

describe('normalizeLayout', () => {
  it('applies the default layout values', () => {
    const l = normalizeLayout(undefined, true)
    expect(l.variant).toBe('two-column')
    expect(l.imagePosition).toBe('left')
    expect(l.imageRatio).toBe('40%')
    expect(l.hideImageOnMobile).toBe(true)
    expect(l.closeButton).toBe('inside')
  })

  it('lets layout.hideImageOnMobile override the top-level flag', () => {
    expect(normalizeLayout({ hideImageOnMobile: true }, false).hideImageOnMobile).toBe(true)
    expect(normalizeLayout({ hideImageOnMobile: false }, true).hideImageOnMobile).toBe(false)
  })

  it('falls back to top-level hideImageOnMobile when layout override is unset', () => {
    expect(normalizeLayout({}, false).hideImageOnMobile).toBe(false)
    expect(normalizeLayout({}, true).hideImageOnMobile).toBe(true)
  })
})

describe('normalizeTheme', () => {
  it('defaults to light preset with no overrides', () => {
    const t = normalizeTheme(undefined)
    expect(t.preset).toBe('light')
    expect(t.cssVars).toEqual({})
  })

  it('preserves the specified preset', () => {
    expect(normalizeTheme({ preset: 'dark' }).preset).toBe('dark')
    expect(normalizeTheme({ preset: 'brand' }).preset).toBe('brand')
    expect(normalizeTheme({ preset: 'forest' }).preset).toBe('forest')
    expect(normalizeTheme({ preset: 'sky' }).preset).toBe('sky')
  })

  it('maps color overrides to --enlb-* token names', () => {
    const t = normalizeTheme({
      preset: 'dark',
      colors: { ctaBg: '#ff0000', text: '#00ff00' },
    })
    expect(t.cssVars['--enlb-cta-bg']).toBe('#ff0000')
    expect(t.cssVars['--enlb-text']).toBe('#00ff00')
  })

  it('maps scalar overrides to their --enlb-* tokens', () => {
    const t = normalizeTheme({ radius: '12px', maxWidth: '600px', fontFamily: 'Georgia' })
    expect(t.cssVars['--enlb-radius']).toBe('12px')
    expect(t.cssVars['--enlb-max-width']).toBe('600px')
    expect(t.cssVars['--enlb-font-family']).toBe('Georgia')
  })

  it('falls back to light preset for an invalid preset value', () => {
    const t = normalizeTheme({ preset: 'nonexistent' as unknown as 'light' })
    expect(t.preset).toBe('light')
  })

  it('skips non-string color values gracefully', () => {
    const t = normalizeTheme({
      colors: { ctaBg: 123 as unknown as string, text: '#valid' },
    })
    expect(t.cssVars['--enlb-cta-bg']).toBeUndefined()
    expect(t.cssVars['--enlb-text']).toBe('#valid')
  })

  it('does not throw on a null theme', () => {
    expect(() => normalizeTheme(null as unknown as undefined)).not.toThrow()
  })
})
