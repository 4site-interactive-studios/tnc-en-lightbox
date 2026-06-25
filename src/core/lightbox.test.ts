import { describe, it, expect, afterEach } from 'vitest'
import { Lightbox } from './lightbox'
import { normalizeConfig } from '../config'

afterEach(() => {
  document.body.innerHTML = ''
  document.head.querySelectorAll('style[data-enlb]').forEach((el) => el.remove())
})

describe('Lightbox', () => {
  it('open() mounts an overlay and an aria-modal dialog into document.body', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'Hi', body: 'Body' }))
    lb.open()

    const overlay = document.querySelector('.enlb-overlay')
    const dialog = document.querySelector('[role="dialog"]')

    expect(overlay).not.toBeNull()
    expect(dialog).not.toBeNull()
    expect(overlay?.contains(dialog as Node)).toBe(true)
    expect(dialog?.getAttribute('aria-modal')).toBe('true')
  })

  it('renders a 2-column layout (image + content) and a close button inside the dialog', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B', image: { src: 'i.png' } }))
    lb.open()
    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(dialog!.querySelector('.enlb-image')).not.toBeNull()
    expect(dialog!.querySelector('.enlb-content')).not.toBeNull()
    expect(dialog!.querySelector('.enlb-close')).not.toBeNull()
  })

  it('labels the dialog via aria-labelledby pointing at the header title', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'My title', body: 'B' }))
    lb.open()
    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    const labelledby = dialog!.getAttribute('aria-labelledby')
    expect(labelledby).toBeTruthy()
    const label = document.getElementById(labelledby!)
    expect(label).not.toBeNull()
    expect(label!.textContent).toContain('My title')
  })

  it('pressing Escape removes the overlay and dialog from the DOM', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'Hi', body: 'Body' }))
    lb.open()
    expect(document.querySelector('.enlb-overlay')).not.toBeNull()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(document.querySelector('.enlb-overlay')).toBeNull()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('does not close on Escape when closeOnEsc is false', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'Hi', body: 'B', closeOnEsc: false }))
    lb.open()
    expect(document.querySelector('.enlb-overlay')).not.toBeNull()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(document.querySelector('.enlb-overlay')).not.toBeNull()
  })

  it('closes when the top-right X button is clicked', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    expect(document.querySelector('.enlb-overlay')).not.toBeNull()
    ;(document.querySelector('.enlb-close') as HTMLElement).click()
    expect(document.querySelector('.enlb-overlay')).toBeNull()
  })

  it('closes when the overlay backdrop is clicked', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    expect(document.querySelector('.enlb-overlay')).not.toBeNull()
    ;(document.querySelector('.enlb-overlay') as HTMLElement).click()
    expect(document.querySelector('.enlb-overlay')).toBeNull()
  })

  it('does not close when a click lands inside the dialog', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    expect(document.querySelector('.enlb-overlay')).not.toBeNull()
    ;(document.querySelector('.enlb-content') as HTMLElement).click()
    expect(document.querySelector('.enlb-overlay')).not.toBeNull()
  })

  it('does not close on overlay click when closeOnOverlay is false', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B', closeOnOverlay: false }))
    lb.open()
    expect(document.querySelector('.enlb-overlay')).not.toBeNull()
    ;(document.querySelector('.enlb-overlay') as HTMLElement).click()
    expect(document.querySelector('.enlb-overlay')).not.toBeNull()
  })

  it('traps focus: Tab on the last focusable element wraps focus to the first', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B', cta: { label: 'Go', href: '#go' } }))
    lb.open()
    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    const focusable = Array.from(
      dialog!.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
    )
    expect(focusable.length).toBeGreaterThan(1)
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    last.focus()
    expect(document.activeElement).toBe(last)
    dialog!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    expect(document.activeElement).toBe(first)
  })

  it('traps focus: Shift+Tab on the first focusable element wraps focus to the last', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B', cta: { label: 'Go', href: '#go' } }))
    lb.open()
    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    const focusable = Array.from(
      dialog!.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first.focus()
    expect(document.activeElement).toBe(first)
    dialog!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }))
    expect(document.activeElement).toBe(last)
  })

  it('moves focus into the dialog on open and restores focus on close', () => {
    const trigger = document.createElement('button')
    trigger.id = 'trigger'
    document.body.appendChild(trigger)
    trigger.focus()
    expect(document.activeElement).toBe(trigger)

    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement
    expect(dialog).not.toBeNull()
    expect(dialog.contains(document.activeElement)).toBe(true)

    lb.close()
    expect(document.activeElement).toBe(trigger)
  })

  it('destroy() removes the overlay, the injected styles, and leaves no enlb nodes behind', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    expect(document.querySelector('.enlb-overlay')).not.toBeNull()
    expect(document.querySelector('style[data-enlb]')).not.toBeNull()
    lb.destroy()
    expect(document.querySelector('.enlb-overlay')).toBeNull()
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
    expect(document.querySelector('.enlb-overlay')).toBeNull()
    lb.open()
    expect(document.querySelectorAll('.enlb-overlay').length).toBe(1)
    expect(document.querySelectorAll('[role="dialog"]').length).toBe(1)
  })
})
