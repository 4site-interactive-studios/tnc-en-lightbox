import { describe, it, expect, afterEach } from 'vitest'
import { Lightbox } from './lightbox'
import { normalizeConfig } from '../config'
import { sq } from './shadow-test-helpers'

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
  document.head.querySelectorAll('style[data-enlb]').forEach((el) => el.remove())
  window.scrollTo = () => undefined
})

// Render + a11y invariants for the close button. The size/backing treatment is
// CSS-only and cannot be asserted in jsdom (jsdom does not apply the shadow-root
// stylesheet to computed style); those are verified in e2e/smoke.spec.ts against
// a real browser (bounding box >=44x44 + non-transparent backing).
describe('Lightbox close button (render + a11y invariants)', () => {
  it('renders a close button (default closeButton inside)', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    const close = sq('.enlb-close')
    expect(close).not.toBeNull()
    expect(close!.tagName).toBe('BUTTON')
  })

  it('renders a close button when closeButton is outside', () => {
    const lb = new Lightbox(
      normalizeConfig({ header: 'H', body: 'B', layout: { closeButton: 'outside' } }),
    )
    lb.open()
    expect(sq('.enlb-close')).not.toBeNull()
  })

  it('renders NO close button when closeButton is none', () => {
    const lb = new Lightbox(
      normalizeConfig({ header: 'H', body: 'B', layout: { closeButton: 'none' } }),
    )
    lb.open()
    expect(sq('.enlb-close')).toBeNull()
  })

  it('close button exposes an accessible name via aria-label', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    expect(sq('.enlb-close')!.getAttribute('aria-label')).toBe('Close')
  })
})
