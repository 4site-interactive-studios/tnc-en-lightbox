import { describe, it, expect, afterEach } from 'vitest'
import { Lightbox } from './lightbox'
import { normalizeConfig } from '../config'

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
  document.head.querySelectorAll('style[data-enlb]').forEach((el) => el.remove())
  window.scrollTo = () => undefined
})

describe('Lightbox theme application', () => {
  it('preset dark applies the dark theme class to the lightbox root', () => {
    const lb = new Lightbox(
      normalizeConfig({ header: 'H', body: 'B', theme: { preset: 'dark' } }),
    )
    lb.open()
    const overlay = document.querySelector('.enlb-overlay') as HTMLElement
    expect(overlay).not.toBeNull()
    expect(overlay.classList.contains('enlb-theme-dark')).toBe(true)
  })

  it('defaults to the light theme class when no preset is specified', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    const overlay = document.querySelector('.enlb-overlay') as HTMLElement
    expect(overlay.classList.contains('enlb-theme-light')).toBe(true)
  })

  it('preset brand applies the brand theme class to the lightbox root', () => {
    const lb = new Lightbox(
      normalizeConfig({ header: 'H', body: 'B', theme: { preset: 'brand' } }),
    )
    lb.open()
    const overlay = document.querySelector('.enlb-overlay') as HTMLElement
    expect(overlay.classList.contains('enlb-theme-brand')).toBe(true)
  })
})
