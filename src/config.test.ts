import { describe, it, expect } from 'vitest'
import { normalizeConfig, type ENLightboxConfig } from './config'

describe('normalizeConfig', () => {
  it('applies defaults for the behavior flags the core uses', () => {
    const c = normalizeConfig()
    expect(c.closeOnEsc).toBe(true)
    expect(c.closeOnOverlay).toBe(true)
    expect(c.hideImageOnMobile).toBe(true)
    expect(c.triggers).toEqual({})
    expect(c.theme).toEqual({ preset: 'light', cssVars: {} })
    expect(c.layout).toEqual({
      variant: 'two-column',
      imagePosition: 'left',
      imageRatio: '40%',
      hideImageOnMobile: true,
      closeButton: 'inside',
    })
  })

  it('defaults content fields to empty strings and leaves image undefined', () => {
    const c = normalizeConfig()
    expect(c.header).toBe('')
    expect(c.body).toBe('')
    expect(c.image).toBeUndefined()
  })

  it('preserves explicitly provided values over the defaults', () => {
    const c = normalizeConfig({ closeOnEsc: false, closeOnOverlay: false, header: 'H', body: 'B' })
    expect(c.closeOnEsc).toBe(false)
    expect(c.closeOnOverlay).toBe(false)
    expect(c.header).toBe('H')
    expect(c.body).toBe('B')
  })

  it('passes image and cta through unchanged', () => {
    const image = { src: 'i.png', alt: 'alt' }
    const cta = { label: 'Go', href: '#go' }
    const c = normalizeConfig({ image, cta })
    expect(c.image).toEqual(image)
    expect(c.cta).toEqual(cta)
  })
})

describe('normalizeConfig — wrong-typed fields degrade to defaults', () => {
  // Wrong-typed inputs are intentional: they simulate a hand-authored config that TS would
  // reject but the runtime must tolerate. Cast through `unknown` to bypass the type check.
  const bad = (c: Record<string, unknown>) => normalizeConfig(c as unknown as Partial<ENLightboxConfig>)

  it('degrades a non-object image to undefined', () => {
    expect(bad({ image: 'not-an-object' }).image).toBeUndefined()
    expect(bad({ image: 42 }).image).toBeUndefined()
  })

  it('degrades an image missing a string src to undefined', () => {
    expect(bad({ image: { alt: 'x' } }).image).toBeUndefined()
    expect(bad({ image: { src: 123 } }).image).toBeUndefined()
  })

  it('degrades a non-object cta to undefined', () => {
    expect(bad({ cta: 'not-an-object' }).cta).toBeUndefined()
  })

  it('degrades a non-object secondaryCta to undefined', () => {
    expect(bad({ secondaryCta: 'not-an-object' }).secondaryCta).toBeUndefined()
  })

  it('degrades a non-object triggers to the default empty object', () => {
    expect(bad({ triggers: 'not-an-object' }).triggers).toEqual({})
  })

  it('degrades a non-object theme to the default theme', () => {
    expect(bad({ theme: 'not-an-object' }).theme).toEqual({ preset: 'light', cssVars: {} })
  })

  it('degrades non-object theme.colors to the default theme', () => {
    expect(bad({ theme: { colors: 'not-an-object' } }).theme).toEqual({
      preset: 'light',
      cssVars: {},
    })
  })
})
