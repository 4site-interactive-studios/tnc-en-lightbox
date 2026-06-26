import { describe, it, expect } from 'vitest'
import { normalizeLayout } from './config'

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
