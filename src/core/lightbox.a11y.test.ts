import { describe, it, expect, afterEach, vi, beforeAll } from 'vitest'
import { Lightbox } from './lightbox'
import { normalizeConfig } from '../config'
import { sq, shadowActiveElement } from './shadow-test-helpers'

beforeAll(() => {
  const ua = document.createElement('style')
  ua.textContent = '* { outline: 0px solid }'
  document.head.appendChild(ua)
})

afterEach(() => {
  document.body.innerHTML = ''
  document.body.removeAttribute('style')
  document.head.querySelectorAll('style[data-enlb]').forEach((el) => el.remove())
  window.scrollTo = () => undefined
})

describe('Lightbox a11y/UX hardening', () => {
  it('sets inert and aria-hidden on body siblings while open and restores them on close', () => {
    const sibling = document.createElement('div')
    sibling.id = 'page-content'
    document.body.appendChild(sibling)

    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()

    expect(sibling.hasAttribute('inert')).toBe(true)
    expect(sibling.getAttribute('aria-hidden')).toBe('true')
    expect(sibling.getAttribute('tabindex')).toBe('-1')

    lb.close()

    expect(sibling.hasAttribute('inert')).toBe(false)
    expect(sibling.hasAttribute('aria-hidden')).toBe(false)
    expect(sibling.hasAttribute('tabindex')).toBe(false)
  })

  it('does not inert its own host element (only the host page siblings)', () => {
    const sibling = document.createElement('div')
    sibling.id = 'page-content'
    document.body.appendChild(sibling)

    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()

    const host = document.querySelector('[data-enlb-root]') as HTMLElement
    expect(host).not.toBeNull()
    expect(host.hasAttribute('inert')).toBe(false)
    expect(host.hasAttribute('aria-hidden')).toBe(false)
    expect(sibling.hasAttribute('inert')).toBe(true)
  })

  it('restores pre-existing inert/aria-hidden/tabindex values exactly', () => {
    const sibling = document.createElement('div')
    sibling.setAttribute('inert', '')
    sibling.setAttribute('aria-hidden', 'false')
    sibling.setAttribute('tabindex', '5')
    document.body.appendChild(sibling)

    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    lb.close()

    expect(sibling.getAttribute('inert')).toBe('')
    expect(sibling.getAttribute('aria-hidden')).toBe('false')
    expect(sibling.getAttribute('tabindex')).toBe('5')
  })

  it('gives the dialog a non-empty accessible name via aria-label when the header is empty', () => {
    const lb = new Lightbox(normalizeConfig({ header: '', body: 'B' }))
    lb.open()
    const dialog = sq('[role="dialog"]') as HTMLElement
    expect(dialog).not.toBeNull()
    const label = dialog.getAttribute('aria-label')
    expect(label).toBeTruthy()
    expect(label!.length).toBeGreaterThan(0)
    expect(dialog.hasAttribute('aria-labelledby')).toBe(false)
  })

  it('labels the dialog via aria-labelledby (not aria-label) when the header is non-empty', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'My title', body: 'B' }))
    lb.open()
    const dialog = sq('[role="dialog"]') as HTMLElement
    expect(dialog.hasAttribute('aria-labelledby')).toBe(true)
    expect(dialog.hasAttribute('aria-label')).toBe(false)
  })

  it('locks body scroll on open and restores overflow on close', () => {
    document.body.style.overflow = 'auto'

    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()

    expect(document.body.style.overflow).toBe('hidden')

    lb.close()

    expect(document.body.style.overflow).toBe('auto')
  })

  it('restores body overflow even when it was unset before open', () => {
    document.body.style.overflow = ''

    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    lb.close()

    expect(document.body.style.overflow).toBe('')
  })

  it('focuses the dialog root (not the close button) on open', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    const dialog = sq('[role="dialog"]') as HTMLElement
    expect(shadowActiveElement()).toBe(dialog)
  })

  it('focuses the dialog root when closeButton is outside', () => {
    const lb = new Lightbox(
      normalizeConfig({ header: 'H', body: 'B', layout: { closeButton: 'outside' } }),
    )
    lb.open()
    const dialog = sq('[role="dialog"]') as HTMLElement
    expect(shadowActiveElement()).toBe(dialog)
  })

  it('focuses the dialog root when closeButton is none', () => {
    const lb = new Lightbox(
      normalizeConfig({ header: 'H', body: 'B', layout: { closeButton: 'none' } }),
    )
    lb.open()
    const dialog = sq('[role="dialog"]') as HTMLElement
    expect(shadowActiveElement()).toBe(dialog)
  })

  it('restores scroll position on close', () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)

    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    lb.close()

    expect(scrollToSpy).toHaveBeenCalledWith(0, 0)
    scrollToSpy.mockRestore()
  })

  it('suppresses default focus outline on the dialog container (programmatic focus)', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    const dialog = sq('[role="dialog"]') as HTMLElement
    dialog.focus()
    const style = getComputedStyle(dialog)
    expect(style.outlineStyle).toBe('none')
  })

  it('dialog has tabindex=-1 so it can receive programmatic focus but not tab focus', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    const dialog = sq('[role="dialog"]') as HTMLElement
    expect(dialog.getAttribute('tabindex')).toBe('-1')
  })

  it('CTA buttons and close button exist as focusable elements inside the dialog', () => {
    const lb = new Lightbox(
      normalizeConfig({
        header: 'H',
        body: 'B',
        cta: { label: 'Primary', action: 'close' },
        secondaryCta: { label: 'Secondary', action: 'close' },
      }),
    )
    lb.open()
    const dialog = sq('.enlb-dialog') as HTMLElement
    expect(dialog.querySelector('.enlb-cta')).not.toBeNull()
    expect(dialog.querySelector('.enlb-cta--secondary')).not.toBeNull()
    expect(dialog.querySelector('.enlb-close')).not.toBeNull()
  })

  it('strips visible outline on dialog but keeps focusable interactive elements', () => {
    const lb = new Lightbox(
      normalizeConfig({
        header: 'H',
        body: 'B',
        cta: { label: 'Go', action: 'close' },
      }),
    )
    lb.open()
    const dialog = sq('[role="dialog"]') as HTMLElement
    const cta = dialog.querySelector('.enlb-cta') as HTMLElement
    // Dialog itself suppresses its focus outline; interactive elements remain focusable
    dialog.focus()
    expect(getComputedStyle(dialog).outlineStyle).toBe('none')
    // Interactive elements are focusable via keyboard
    cta.focus()
    expect(shadowActiveElement()).toBe(cta)
  })
})
