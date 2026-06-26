import { describe, it, expect, afterEach, vi } from 'vitest'
import { Lightbox } from './lightbox'
import { normalizeConfig } from '../config'

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
    const cta = document.querySelector('.enlb-cta')
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
    const cta = document.querySelector('.enlb-cta') as HTMLElement
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
    const row = document.querySelector('.enlb-cta-row')
    expect(row).not.toBeNull()
    const ctas = row!.querySelectorAll('.enlb-cta, .enlb-cta--secondary')
    expect(ctas.length).toBe(2)
    expect(ctas[0].tagName).toBe('A')
    expect(ctas[0].textContent).toBe('Yes')
    expect(ctas[1].tagName).toBe('BUTTON')
    expect(ctas[1].textContent).toBe('Learn more')
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
    const decline = document.querySelector('.enlb-cta--secondary')
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
    const dialog = document.querySelector('.enlb-dialog') as HTMLElement
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    )
    expect(focusable[0].classList.contains('enlb-close')).toBe(true)
    expect(focusable[1].classList.contains('enlb-cta')).toBe(true)
    expect(focusable[2].classList.contains('enlb-cta--secondary')).toBe(true)
  })
})
