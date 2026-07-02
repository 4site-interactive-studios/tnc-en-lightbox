import { describe, it, expect } from 'vitest'
import { PRESET_TOKENS } from './presets'

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return [r, g, b]
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  const toLinear = (c: number): number => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg)
  const l2 = relativeLuminance(bg)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

const AA_NORMAL_TEXT = 4.5
const AA_UI_COMPONENT = 3

describe('preset WCAG contrast (axe-relevant)', () => {
  for (const preset of ['light', 'dark', 'brand', 'forest', 'sky'] as const) {
    const tokens = PRESET_TOKENS[preset]
    const surface = tokens['--enlb-surface-bg']
    const ctaBg = tokens['--enlb-cta-bg']

    describe(`${preset} preset`, () => {
      it('body text on surface meets WCAG AA (4.5:1)', () => {
        expect(contrastRatio(tokens['--enlb-text'], surface)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
      })

      it('title text on surface meets WCAG AA (4.5:1)', () => {
        expect(contrastRatio(tokens['--enlb-title'], surface)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
      })

      it('CTA text on CTA background meets WCAG AA (4.5:1)', () => {
        expect(contrastRatio(tokens['--enlb-cta-text'], ctaBg)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
      })

      it('secondary CTA text on surface meets WCAG AA (4.5:1)', () => {
        expect(contrastRatio(tokens['--enlb-secondary-cta-text'], surface)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
      })
    })
  }
})

describe('preset token completeness', () => {
  const required = [
    '--enlb-overlay-bg', '--enlb-surface-bg', '--enlb-text', '--enlb-title',
    '--enlb-cta-bg', '--enlb-cta-text', '--enlb-secondary-cta-bg',
    '--enlb-secondary-cta-text', '--enlb-border', '--enlb-radius',
    '--enlb-max-width', '--enlb-font-family',
  ]
  for (const preset of ['light', 'dark', 'brand', 'forest', 'sky'] as const) {
    it(`${preset} preset defines all color tokens`, () => {
      const tokens = PRESET_TOKENS[preset]
      for (const key of required) {
        expect(tokens[key]).toBeDefined()
      }
    })
  }
})

// Focus-ring + close-button contrast (WCAG 1.4.11 non-text contrast >=3:1).
// The --enlb-focus-ring and --enlb-close-* tokens are SCSS-only (not ThemeColors,
// so not in PRESET_TOKENS). These hex values mirror the SCSS .enlb-theme-forest
// / .enlb-theme-sky classes and the :host defaults — keep them in sync.
//
// forest (corrected #47): the close button is now a GREEN square (#006537, the
// surface) with a white ×, so the close backing == the surface. A black ring
// only reaches 2.92:1 on the darker #006537 (FAILS); a WHITE ring clears both
// the surface and the close box at 7.20:1. sky: the close button has NO box
// (transparent), so its backing is the light-blue surface #8DBBDC; a BLACK ring
// clears it at 10.27:1. (The old sky ring #2b6da6 / dark box #16181d are gone.)
describe('forest/sky focus-ring + close-button contrast (WCAG 1.4.11)', () => {
  it('forest focus-ring (#ffffff) >=3:1 vs surface and the green close-box', () => {
    const surface = PRESET_TOKENS.forest['--enlb-surface-bg'] // #006537
    const closeBox = PRESET_TOKENS.forest['--enlb-surface-bg'] // green square == surface
    const ring = '#ffffff' // forest --enlb-focus-ring override
    expect(contrastRatio(ring, surface)).toBeGreaterThanOrEqual(AA_UI_COMPONENT)
    expect(contrastRatio(ring, closeBox)).toBeGreaterThanOrEqual(AA_UI_COMPONENT)
  })

  it('sky focus-ring (#000000) >=3:1 vs surface (no close box; backing = surface)', () => {
    const surface = PRESET_TOKENS.sky['--enlb-surface-bg'] // #8DBBDC
    const closeBox = PRESET_TOKENS.sky['--enlb-surface-bg'] // no box -> backing is the surface
    const ring = '#000000' // sky --enlb-focus-ring override
    expect(contrastRatio(ring, surface)).toBeGreaterThanOrEqual(AA_UI_COMPONENT)
    expect(contrastRatio(ring, closeBox)).toBeGreaterThanOrEqual(AA_UI_COMPONENT)
  })

  it('forest black ring would FAIL on #006537 (guards the white-ring choice)', () => {
    const surface = PRESET_TOKENS.forest['--enlb-surface-bg'] // #006537
    expect(contrastRatio('#000000', surface)).toBeLessThan(AA_UI_COMPONENT)
  })

  it('forest close x (#ffffff) on green close-box (#006537) meets AA text contrast', () => {
    expect(contrastRatio('#ffffff', PRESET_TOKENS.forest['--enlb-surface-bg'])).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
  })

  it('sky close x (#000000) on the light-blue surface (#8DBBDC) meets AA text contrast', () => {
    expect(contrastRatio('#000000', PRESET_TOKENS.sky['--enlb-surface-bg'])).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
  })
})

// ── Wave-5 forest/sky mockup CORRECTION (issue #47) ───────────────────────────
// The shipped PR #41 colors did not match the client mockups. These assert the
// corrected source-of-truth values before the implementation propagates them.
describe('forest/sky corrected mockup colors (issue #47)', () => {
  it('forest surface is #006537 (corrected from #0d6b4e)', () => {
    expect(PRESET_TOKENS.forest['--enlb-surface-bg']).toBe('#006537')
  })

  it('forest CTA text is #006537 on a white CTA (corrected from #0d6b4e)', () => {
    expect(PRESET_TOKENS.forest['--enlb-cta-text']).toBe('#006537')
  })

  it('sky surface is #8DBBDC (corrected from #a7cce3)', () => {
    expect(PRESET_TOKENS.sky['--enlb-surface-bg']).toBe('#8DBBDC')
  })

  it('sky text is #191919 (corrected from #16181d)', () => {
    expect(PRESET_TOKENS.sky['--enlb-text']).toBe('#191919')
  })

  it('sky title is #191919 (corrected from #16181d)', () => {
    expect(PRESET_TOKENS.sky['--enlb-title']).toBe('#191919')
  })

  it('sky primary CTA background is #000000 (black, corrected from #16181d)', () => {
    expect(PRESET_TOKENS.sky['--enlb-cta-bg']).toBe('#000000')
  })

  it('sky secondary link text is #000000 (black, corrected from #16181d)', () => {
    expect(PRESET_TOKENS.sky['--enlb-secondary-cta-text']).toBe('#000000')
  })
})
