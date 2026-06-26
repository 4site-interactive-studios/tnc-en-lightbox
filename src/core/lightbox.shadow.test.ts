import { describe, it, expect, afterEach } from 'vitest'
import { Lightbox } from './lightbox'
import { normalizeConfig } from '../config'
import { normalizeTheme } from '../themes/config'
import { lightboxHost, shadowRoot, sq, shadowActiveElement } from './shadow-test-helpers'

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
  window.scrollTo = () => undefined
})

describe('Lightbox Shadow DOM isolation', () => {
  it('mounts the overlay inside an open shadow root on a host element in document.body', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()

    const host = lightboxHost()
    expect(host).not.toBeNull()
    expect(host!.parentElement).toBe(document.body)
    expect(host!.shadowRoot).not.toBeNull()
    expect(host!.shadowRoot!.mode).toBe('open')

    // The overlay lives inside the shadow, not the light DOM.
    expect(host!.shadowRoot!.querySelector('.enlb-overlay')).not.toBeNull()
    expect(document.querySelector('.enlb-overlay')).toBeNull()
  })

  it('injects its styles into the shadow root, not document.head', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    expect(sq('style[data-enlb]')).not.toBeNull()
    expect(document.head.querySelector('style[data-enlb]')).toBeNull()
  })

  it('moves focus into the shadow on open (document.activeElement is the host)', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    const host = lightboxHost()
    const dialog = sq('[role="dialog"]')
    // From the light DOM, the host is the active element...
    expect(document.activeElement).toBe(host)
    // ...while the real focus target is the dialog inside the shadow.
    expect(shadowActiveElement()).toBe(dialog)
  })

  it('keeps the focus trap working across the shadow boundary', () => {
    const lb = new Lightbox(
      normalizeConfig({ header: 'H', body: 'B', cta: { label: 'Go', href: '#go' } }),
    )
    lb.open()
    const dialog = sq('[role="dialog"]') as HTMLElement
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    last.focus()
    expect(shadowActiveElement()).toBe(last)
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    expect(shadowActiveElement()).toBe(first)
  })

  it('applies setTheme/applyTheme inside the shadow root, never on document.body', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    const overlay = sq('.enlb-overlay') as HTMLElement
    expect(overlay.classList.contains('enlb-theme-light')).toBe(true)

    lb.applyTheme(normalizeTheme({ preset: 'dark', colors: { ctaBg: '#abcdef' } }))

    // The themed element is inside the shadow; document.body is untouched.
    expect(shadowRoot().querySelector('.enlb-theme-dark')).not.toBeNull()
    expect(overlay.style.getPropertyValue('--enlb-cta-bg')).toBe('#abcdef')
    expect(document.body.className).toBe('')
  })
})
