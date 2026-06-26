import { describe, it, expect, afterEach, vi } from 'vitest'
import { Lightbox } from './lightbox'
import { normalizeConfig } from '../config'
import { lightboxHost, shadowRoot, sq, sqa, shadowActiveElement } from './shadow-test-helpers'

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
  document.head.querySelectorAll('style[data-enlb]').forEach((el) => el.remove())
  window.scrollTo = () => undefined
})

describe('Lightbox', () => {
  it('open() mounts a host into document.body and an aria-modal dialog inside its open shadow root', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'Hi', body: 'Body' }))
    lb.open()

    const host = lightboxHost()
    expect(host).not.toBeNull()
    expect(host!.parentElement).toBe(document.body)
    expect(host!.shadowRoot).not.toBeNull()

    const overlay = sq('.enlb-overlay')
    const dialog = sq('[role="dialog"]')

    expect(overlay).not.toBeNull()
    expect(dialog).not.toBeNull()
    expect(overlay?.contains(dialog as Node)).toBe(true)
    expect(dialog?.getAttribute('aria-modal')).toBe('true')

    // Nothing leaks into the light DOM: every enlb-* node lives inside the shadow.
    expect(document.querySelector('[class*="enlb-"]')).toBeNull()
  })

  it('renders a 2-column layout (image + content) and a close button inside the dialog', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B', image: { src: 'i.png' } }))
    lb.open()
    const dialog = sq('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(dialog!.querySelector('.enlb-image')).not.toBeNull()
    expect(dialog!.querySelector('.enlb-content')).not.toBeNull()
    expect(dialog!.querySelector('.enlb-close')).not.toBeNull()
  })

  it('labels the dialog via aria-labelledby pointing at the header title', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'My title', body: 'B' }))
    lb.open()
    const dialog = sq('[role="dialog"]')
    expect(dialog).not.toBeNull()
    const labelledby = dialog!.getAttribute('aria-labelledby')
    expect(labelledby).toBeTruthy()
    // ids are shadow-scoped: resolve the title within the shadow root.
    const label = shadowRoot().getElementById(labelledby!)
    expect(label).not.toBeNull()
    expect(label!.textContent).toContain('My title')
  })

  it('pressing Escape removes the lightbox from the DOM', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'Hi', body: 'Body' }))
    lb.open()
    expect(sq('.enlb-overlay')).not.toBeNull()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(lightboxHost()).toBeNull()
  })

  it('does not close on Escape when closeOnEsc is false', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'Hi', body: 'B', closeOnEsc: false }))
    lb.open()
    expect(sq('.enlb-overlay')).not.toBeNull()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(sq('.enlb-overlay')).not.toBeNull()
  })

  it('closes when the top-right X button is clicked', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    expect(sq('.enlb-overlay')).not.toBeNull()
    ;(sq('.enlb-close') as HTMLElement).click()
    expect(lightboxHost()).toBeNull()
  })

  it('closes when the overlay backdrop is clicked', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    expect(sq('.enlb-overlay')).not.toBeNull()
    ;(sq('.enlb-overlay') as HTMLElement).click()
    expect(lightboxHost()).toBeNull()
  })

  it('does not close when a click lands inside the dialog', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    expect(sq('.enlb-overlay')).not.toBeNull()
    ;(sq('.enlb-content') as HTMLElement).click()
    expect(sq('.enlb-overlay')).not.toBeNull()
  })

  it('does not close on overlay click when closeOnOverlay is false', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B', closeOnOverlay: false }))
    lb.open()
    expect(sq('.enlb-overlay')).not.toBeNull()
    ;(sq('.enlb-overlay') as HTMLElement).click()
    expect(sq('.enlb-overlay')).not.toBeNull()
  })

  it('traps focus: Tab on the last focusable element wraps focus to the first', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B', cta: { label: 'Go', href: '#go' } }))
    lb.open()
    const dialog = sq('[role="dialog"]')
    expect(dialog).not.toBeNull()
    const focusable = Array.from(
      dialog!.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
    )
    expect(focusable.length).toBeGreaterThan(1)
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    last.focus()
    expect(shadowActiveElement()).toBe(last)
    dialog!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    expect(shadowActiveElement()).toBe(first)
  })

  it('traps focus: Shift+Tab on the first focusable element wraps focus to the last', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B', cta: { label: 'Go', href: '#go' } }))
    lb.open()
    const dialog = sq('[role="dialog"]')
    expect(dialog).not.toBeNull()
    const focusable = Array.from(
      dialog!.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first.focus()
    expect(shadowActiveElement()).toBe(first)
    dialog!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }))
    expect(shadowActiveElement()).toBe(last)
  })

  it('moves focus into the dialog on open and restores focus on close', () => {
    const trigger = document.createElement('button')
    trigger.id = 'trigger'
    document.body.appendChild(trigger)
    trigger.focus()
    expect(document.activeElement).toBe(trigger)

    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    const dialog = sq('[role="dialog"]') as HTMLElement
    expect(dialog).not.toBeNull()
    // Focus lands inside the shadow; document.activeElement is the host, shadow.activeElement is the dialog.
    expect(dialog.contains(shadowActiveElement())).toBe(true)

    lb.close()
    expect(document.activeElement).toBe(trigger)
  })

  it('destroy() removes the host, the injected styles, and leaves no enlb nodes behind', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    expect(sq('.enlb-overlay')).not.toBeNull()
    // Styles live in the shadow root, not document.head.
    expect(sq('style[data-enlb]')).not.toBeNull()
    expect(document.querySelector('style[data-enlb]')).toBeNull()
    lb.destroy()
    expect(lightboxHost()).toBeNull()
    expect(document.querySelector('style[data-enlb]')).toBeNull()
    expect(document.querySelectorAll('[class*="enlb-"]').length).toBe(0)
  })

  it('does not leak duplicate DOM when open/close is repeated', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    expect(() => {
      lb.open()
      lb.close()
      lb.open()
      lb.close()
    }).not.toThrow()
    expect(lightboxHost()).toBeNull()
    lb.open()
    expect(sqa('.enlb-overlay').length).toBe(1)
    expect(sqa('[role="dialog"]').length).toBe(1)
    expect(document.querySelectorAll('[data-enlb-root]').length).toBe(1)
  })

  it('open() fails closed when DOM construction throws, instead of propagating into a host handler', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    const createSpy = vi.spyOn(document, 'createElement').mockImplementationOnce(() => {
      throw new Error('dom construction failed')
    })

    expect(() => lb.open()).not.toThrow()
    expect(lightboxHost()).toBeNull()
    expect(document.body.style.overflow).not.toBe('hidden')

    createSpy.mockRestore()
    warnSpy.mockRestore()

    lb.open()
    expect(sq('.enlb-overlay')).not.toBeNull()
    lb.close()
  })
})
