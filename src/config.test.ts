import { describe, it, expect } from 'vitest'
import { normalizeConfig } from './config'

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
    expect(c.en).toEqual({})
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
