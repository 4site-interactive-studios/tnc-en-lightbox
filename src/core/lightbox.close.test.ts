import { describe, it, expect, afterEach } from 'vitest'
import { Lightbox } from './lightbox'
import { normalizeConfig } from '../config'
import { sq } from './shadow-test-helpers'

afterEach(() => {
  window.scrollTo = () => undefined
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  document.body.innerHTML = ''
  document.body.style.overflow = ''
  document.head.querySelectorAll('style[data-enlb]').forEach((el) => el.remove())
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

  it('preserves pathname and reports close-button, esc, overlay, and api dismissal reasons', () => {
    const dismissals: CustomEvent[] = []
    const onDismiss = (event: Event) => dismissals.push(event as CustomEvent)
    document.addEventListener('enlb:dismiss', onDismiss)

    const closeWith = (close: (lightbox: Lightbox) => void) => {
      const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
      lb.open()
      close(lb)
    }

    try {
      closeWith(() => (sq('.enlb-close') as HTMLElement).click())
      closeWith(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
      closeWith(() => (sq('.enlb-overlay') as HTMLElement).click())
      closeWith((lb) => lb.close())

      expect(dismissals.map((event) => event.detail.reason)).toEqual([
        'close-button',
        'esc',
        'overlay',
        'api',
      ])
      expect(dismissals.every((event) => event.detail.pathname === location.pathname)).toBe(true)
      expect(dismissals.every((event) => event.target === document && event.bubbles)).toBe(true)
    } finally {
      document.removeEventListener('enlb:dismiss', onDismiss)
    }
  })
})
