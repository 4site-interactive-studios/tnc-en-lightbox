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

describe('Lightbox close button (accessible size + backing)', () => {
  it('close button has a >=44x44px tap target', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    const close = sq('.enlb-close') as HTMLElement
    const cs = getComputedStyle(close)
    expect(parseFloat(cs.width)).toBeGreaterThanOrEqual(44)
    expect(parseFloat(cs.height)).toBeGreaterThanOrEqual(44)
  })

  it('close button has a contrasting (non-transparent) rounded backing', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    const close = sq('.enlb-close') as HTMLElement
    const cs = getComputedStyle(close)
    // A backing must be present so the x is visible over photos and surfaces.
    expect(cs.backgroundColor).not.toBe('transparent')
    expect(cs.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    // Rounded backing (circle).
    expect(cs.borderRadius).not.toBe('0px')
  })

  it('close button is rendered when closeButton is inside (default)', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    expect(sq('.enlb-close')).not.toBeNull()
  })

  it('close button is rendered when closeButton is outside', () => {
    const lb = new Lightbox(
      normalizeConfig({ header: 'H', body: 'B', layout: { closeButton: 'outside' } }),
    )
    lb.open()
    expect(sq('.enlb-close')).not.toBeNull()
  })

  it('close button is NOT rendered when closeButton is none', () => {
    const lb = new Lightbox(
      normalizeConfig({ header: 'H', body: 'B', layout: { closeButton: 'none' } }),
    )
    lb.open()
    expect(sq('.enlb-close')).toBeNull()
  })
})
