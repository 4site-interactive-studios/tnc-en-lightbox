import { describe, it, expect, afterEach, vi } from 'vitest'
import { Lightbox } from './lightbox'
import { normalizeConfig } from '../config'
import { lightboxHost, sq } from './shadow-test-helpers'

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
  document.head.querySelectorAll('style[data-enlb]').forEach((el) => el.remove())
  window.scrollTo = () => undefined
})

describe('Lightbox CTA', () => {
  it('renders the redirect CTA as an anchor with href', () => {
    const lb = new Lightbox(
      normalizeConfig({ header: 'H', body: 'B', cta: { label: 'Go', href: '#go' } }),
    )
    lb.open()
    const cta = sq('.enlb-cta')
    expect(cta).not.toBeNull()
    expect(cta!.tagName).toBe('A')
    expect(cta!.getAttribute('href')).toBe('#go')
  })

  it('does not call location.assign on primary CTA click', () => {
    const assignSpy = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...window.location, assign: assignSpy },
      configurable: true,
    })

    const lb = new Lightbox(
      normalizeConfig({ header: 'H', body: 'B', cta: { label: 'Go', href: '#redirect' } }),
    )
    lb.open()
    const cta = sq('.enlb-cta') as HTMLElement
    cta.click()
    expect(assignSpy).not.toHaveBeenCalled()
  })

  it('renders a secondary CTA next to the primary', () => {
    const lb = new Lightbox(
      normalizeConfig({
        header: 'H',
        body: 'B',
        cta: { label: 'Yes', href: '#yes' },
        secondaryCta: { label: 'Learn more', href: '#more' },
      }),
    )
    lb.open()
    const row = sq('.enlb-cta-row')
    expect(row).not.toBeNull()
    const ctas = row!.querySelectorAll('.enlb-cta, .enlb-cta--secondary')
    expect(ctas.length).toBe(2)
    expect(ctas[0].tagName).toBe('A')
    expect(ctas[0].textContent).toBe('Yes')
    expect(ctas[1].tagName).toBe('A')
    expect(ctas[1].textContent).toBe('Learn more')
    expect(ctas[1].getAttribute('href')).toBe('#more')
  })

  it('renders a secondary close CTA as a button', () => {
    const lb = new Lightbox(
      normalizeConfig({
        header: 'H',
        body: 'B',
        cta: { label: 'Yes', href: '#yes' },
        secondaryCta: { label: 'No thanks', action: 'close' },
      }),
    )
    lb.open()
    const secondary = sq('.enlb-cta--secondary')
    expect(secondary).not.toBeNull()
    expect(secondary!.tagName).toBe('BUTTON')
    expect(secondary!.getAttribute('data-enlb-action')).toBe('close')
  })

  it('closes the lightbox when a secondary close CTA is clicked', () => {
    const lb = new Lightbox(
      normalizeConfig({
        header: 'H',
        body: 'B',
        cta: { label: 'Yes', href: '#yes' },
        secondaryCta: { label: 'No thanks', action: 'close' },
      }),
    )
    lb.open()
    expect(sq('.enlb-overlay')).not.toBeNull()
    ;(sq('.enlb-cta--secondary') as HTMLElement).click()
    expect(lightboxHost()).toBeNull()
  })

  it('renders a decline CTA when dismissLabel is provided', () => {
    const lb = new Lightbox(
      normalizeConfig({
        header: 'H',
        body: 'B',
        cta: { label: 'Yes', href: '#yes' },
        dismissLabel: 'No thanks',
      }),
    )
    lb.open()
    const decline = sq('.enlb-cta--secondary')
    expect(decline).not.toBeNull()
    expect(decline!.textContent).toBe('No thanks')
  })

  it('focus trap includes both CTAs in order: primary then secondary/decline', () => {
    const lb = new Lightbox(
      normalizeConfig({
        header: 'H',
        body: 'B',
        cta: { label: 'Yes', href: '#yes' },
        secondaryCta: { label: 'Maybe', href: '#maybe' },
      }),
    )
    lb.open()
    const dialog = sq('.enlb-dialog') as HTMLElement
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    )
    expect(focusable[0].classList.contains('enlb-close')).toBe(true)
    expect(focusable[1].classList.contains('enlb-cta')).toBe(true)
    expect(focusable[2].classList.contains('enlb-cta--secondary')).toBe(true)
  })

  it('closes the lightbox and records dismissal when a CTA with action:"close" is clicked', () => {
    const dismissHandler = vi.fn()
    document.addEventListener('enlb:dismiss', dismissHandler)

    const lb = new Lightbox(
      normalizeConfig({
        header: 'H',
        body: 'B',
        cta: { label: 'Close', action: 'close' },
      }),
    )
    lb.open()
    expect(sq('.enlb-overlay')).not.toBeNull()

    const cta = sq('.enlb-cta') as HTMLElement
    cta.click()

    expect(lightboxHost()).toBeNull()
    expect(dismissHandler).toHaveBeenCalledOnce()
    expect(dismissHandler).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { pathname: expect.any(String) } }),
    )

    document.removeEventListener('enlb:dismiss', dismissHandler)
  })
})
