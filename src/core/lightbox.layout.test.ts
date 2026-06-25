import { describe, it, expect, afterEach } from 'vitest'
import { Lightbox } from './lightbox'
import { normalizeConfig } from '../config'

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
  document.head.querySelectorAll('style[data-enlb]').forEach((el) => el.remove())
  window.scrollTo = () => undefined
})

describe('Lightbox layout', () => {
  it('renders single-column when variant is two-column but no image is provided', () => {
    const lb = new Lightbox(
      normalizeConfig({
        header: 'H',
        body: 'B',
        layout: { variant: 'two-column' },
      }),
    )
    lb.open()
    const dialog = document.querySelector('.enlb-dialog') as HTMLElement
    const layout = document.querySelector('.enlb-layout') as HTMLElement
    expect(dialog).not.toBeNull()
    expect(layout).not.toBeNull()
    expect(dialog!.querySelector('.enlb-image')).toBeNull()
    expect(layout.classList.contains('enlb-layout--single-column')).toBe(true)
  })

  it('renders two-column class when an image is present with variant two-column', () => {
    const lb = new Lightbox(
      normalizeConfig({
        header: 'H',
        body: 'B',
        image: { src: 'i.png' },
        layout: { variant: 'two-column' },
      }),
    )
    lb.open()
    const layout = document.querySelector('.enlb-layout') as HTMLElement
    expect(layout.classList.contains('enlb-layout--two-column')).toBe(true)
    expect(layout.classList.contains('enlb-layout--single-column')).toBe(false)
  })

  it('honors imagePosition left/right/top as a class on the layout', () => {
    for (const position of ['left', 'right', 'top'] as const) {
      document.body.innerHTML = ''
      document.head.querySelectorAll('style[data-enlb]').forEach((el) => el.remove())
      const lb = new Lightbox(
        normalizeConfig({
          header: 'H',
          body: 'B',
          image: { src: 'i.png' },
          layout: { imagePosition: position },
        }),
      )
      lb.open()
      const layout = document.querySelector('.enlb-layout') as HTMLElement
      expect(layout.classList.contains(`enlb-layout--image-${position}`)).toBe(true)
    }
  })

  it('writes imageRatio and stackBreakpoint as custom properties on the dialog', () => {
    const lb = new Lightbox(
      normalizeConfig({
        header: 'H',
        body: 'B',
        image: { src: 'i.png' },
        layout: { imageRatio: '35%', stackBreakpoint: 768 },
      }),
    )
    lb.open()
    const dialog = document.querySelector('.enlb-dialog') as HTMLElement
    expect(dialog.style.getPropertyValue('--enlb-image-ratio')).toBe('35%')
    expect(dialog.style.getPropertyValue('--enlb-stack-breakpoint')).toBe('768px')
  })

  it('adds hide-image-on-mobile class from layout.hideImageOnMobile override', () => {
    const lb = new Lightbox(
      normalizeConfig({
        header: 'H',
        body: 'B',
        image: { src: 'i.png' },
        hideImageOnMobile: false,
        layout: { hideImageOnMobile: true },
      }),
    )
    lb.open()
    const dialog = document.querySelector('.enlb-dialog') as HTMLElement
    expect(dialog.classList.contains('enlb-hide-image-mobile')).toBe(true)
  })

  it('omits hide-image-on-mobile class when layout override turns it off', () => {
    const lb = new Lightbox(
      normalizeConfig({
        header: 'H',
        body: 'B',
        image: { src: 'i.png' },
        hideImageOnMobile: true,
        layout: { hideImageOnMobile: false },
      }),
    )
    lb.open()
    const dialog = document.querySelector('.enlb-dialog') as HTMLElement
    expect(dialog.classList.contains('enlb-hide-image-mobile')).toBe(false)
  })

  it('places close button inside by default', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    const dialog = document.querySelector('.enlb-dialog') as HTMLElement
    const closeBtn = dialog.querySelector('.enlb-close')
    expect(closeBtn).not.toBeNull()
    expect(dialog.classList.contains('enlb-close--outside')).toBe(false)
  })

  it('supports closeButton outside', () => {
    const lb = new Lightbox(
      normalizeConfig({ header: 'H', body: 'B', layout: { closeButton: 'outside' } }),
    )
    lb.open()
    const overlay = document.querySelector('.enlb-overlay') as HTMLElement
    const dialog = document.querySelector('.enlb-dialog') as HTMLElement
    const closeBtn = overlay.querySelector('.enlb-close')
    expect(closeBtn).not.toBeNull()
    expect(dialog.classList.contains('enlb-close--outside')).toBe(true)
    expect(dialog.querySelector('.enlb-close')).toBeNull()
  })

  it('supports closeButton none', () => {
    const lb = new Lightbox(
      normalizeConfig({ header: 'H', body: 'B', layout: { closeButton: 'none' } }),
    )
    lb.open()
    expect(document.querySelector('.enlb-close')).toBeNull()
  })
})
