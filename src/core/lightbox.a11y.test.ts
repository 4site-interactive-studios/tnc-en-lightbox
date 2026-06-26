import { describe, it, expect, afterEach, vi } from 'vitest'
import { Lightbox } from './lightbox'
import { normalizeConfig } from '../config'
import { sq, shadowActiveElement } from './shadow-test-helpers'

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

  it('gives the dialog a non-empty accessible name when the header is empty', () => {
    const lb = new Lightbox(normalizeConfig({ header: '', body: 'B' }))
    lb.open()
    const dialog = sq('[role="dialog"]') as HTMLElement
    expect(dialog).not.toBeNull()
    const label = dialog.getAttribute('aria-label')
    expect(label).toBeTruthy()
    expect(label!.length).toBeGreaterThan(0)
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
})
