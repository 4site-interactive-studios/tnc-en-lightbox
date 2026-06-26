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

describe('preset WCAG contrast (axe-relevant)', () => {
  for (const preset of ['light', 'dark', 'brand'] as const) {
    const tokens = PRESET_TOKENS[preset]
    const surface = tokens['--enlb-surface-bg']
    const ctaBg = tokens['--enlb-cta-bg']

    describe(`${preset} preset`, () => {
      it('body text on surface meets WCAG AA (4.5:1)', () => {
        const ratio = contrastRatio(tokens['--enlb-text'], surface)
        expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
      })

      it('title text on surface meets WCAG AA (4.5:1)', () => {
        const ratio = contrastRatio(tokens['--enlb-title'], surface)
        expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
      })

      it('CTA text on CTA background meets WCAG AA (4.5:1)', () => {
        const ratio = contrastRatio(tokens['--enlb-cta-text'], ctaBg)
        expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
      })

      it('secondary CTA text on surface meets WCAG AA (4.5:1)', () => {
        const ratio = contrastRatio(tokens['--enlb-secondary-cta-text'], surface)
        expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
      })
    })
  }
})

describe('preset token completeness', () => {
  for (const preset of ['light', 'dark', 'brand'] as const) {
    it(`${preset} preset defines all color tokens`, () => {
      const tokens = PRESET_TOKENS[preset]
      const required = [
        '--enlb-overlay-bg', '--enlb-surface-bg', '--enlb-text', '--enlb-title',
        '--enlb-cta-bg', '--enlb-cta-text', '--enlb-secondary-cta-bg',
        '--enlb-secondary-cta-text', '--enlb-border', '--enlb-radius',
        '--enlb-max-width', '--enlb-font-family',
      ]
      for (const key of required) {
        expect(tokens[key]).toBeDefined()
      }
    })
  }
})
