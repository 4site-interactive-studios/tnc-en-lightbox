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
// forest: the white CTA means var(--enlb-cta-bg) is white, so the default focus
// ring would be invisible on the white close box. forest overrides --enlb-focus-ring
// to pure black (#000000) — the brief's "near-black #16181d" gives only 2.73:1 on
// the green surface (fails); pure black gives 3.23:1. sky's dark close box (#16181d)
// means the default black ring would match the box (1:1), so sky overrides to a
// medium blue (#2b6da6) that clears 3:1 against both the dark box and the light surface.
describe('forest/sky focus-ring + close-button contrast (WCAG 1.4.11)', () => {
  it('forest focus-ring (#000000) >=3:1 vs surface and the white close-box', () => {
    const surface = PRESET_TOKENS.forest['--enlb-surface-bg'] // #0d6b4e
    const closeBox = '#ffffff' // forest close backing (white box / green x)
    const ring = '#000000' // forest --enlb-focus-ring override
    expect(contrastRatio(ring, surface)).toBeGreaterThanOrEqual(AA_UI_COMPONENT)
    expect(contrastRatio(ring, closeBox)).toBeGreaterThanOrEqual(AA_UI_COMPONENT)
  })

  it('sky focus-ring (#2b6da6) >=3:1 vs surface and the dark close-box', () => {
    const surface = PRESET_TOKENS.sky['--enlb-surface-bg'] // #a7cce3
    const closeBox = '#16181d' // sky close backing (dark box / white x)
    const ring = '#2b6da6' // sky --enlb-focus-ring override
    expect(contrastRatio(ring, surface)).toBeGreaterThanOrEqual(AA_UI_COMPONENT)
    expect(contrastRatio(ring, closeBox)).toBeGreaterThanOrEqual(AA_UI_COMPONENT)
  })

  it('forest close x (#0d6b4e) on white close-box meets AA text contrast', () => {
    expect(contrastRatio('#0d6b4e', '#ffffff')).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
  })

  it('sky close x (#ffffff) on dark close-box (#16181d) meets AA text contrast', () => {
    expect(contrastRatio('#ffffff', '#16181d')).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
  })
})
