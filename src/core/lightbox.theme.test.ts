import { describe, it, expect, afterEach } from 'vitest'
import { Lightbox } from './lightbox'
import { normalizeConfig } from '../config'
import { normalizeTheme } from '../themes/config'
import { sq } from './shadow-test-helpers'

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
    const overlay = sq('.enlb-overlay') as HTMLElement
    expect(overlay).not.toBeNull()
    expect(overlay.classList.contains('enlb-theme-dark')).toBe(true)
  })

  it('defaults to the light theme class when no preset is specified', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    const overlay = sq('.enlb-overlay') as HTMLElement
    expect(overlay.classList.contains('enlb-theme-light')).toBe(true)
  })

  it('preset brand applies the brand theme class to the lightbox root', () => {
    const lb = new Lightbox(
      normalizeConfig({ header: 'H', body: 'B', theme: { preset: 'brand' } }),
    )
    lb.open()
    const overlay = sq('.enlb-overlay') as HTMLElement
    expect(overlay.classList.contains('enlb-theme-brand')).toBe(true)
  })

  it('per-token color override is applied as an inline CSS var alongside the preset class', () => {
    const lb = new Lightbox(
      normalizeConfig({
        header: 'H',
        body: 'B',
        theme: { preset: 'dark', colors: { ctaBg: '#ff0000' } },
      }),
    )
    lb.open()
    const overlay = sq('.enlb-overlay') as HTMLElement
    expect(overlay.classList.contains('enlb-theme-dark')).toBe(true)
    expect(overlay.style.getPropertyValue('--enlb-cta-bg')).toBe('#ff0000')
  })

  it('per-token override beats preset — override value is set, preset default is not', () => {
    const lb = new Lightbox(
      normalizeConfig({
        header: 'H',
        body: 'B',
        theme: { preset: 'dark', colors: { ctaBg: '#ff0000', text: '#00ff00' } },
      }),
    )
    lb.open()
    const overlay = sq('.enlb-overlay') as HTMLElement
    expect(overlay.style.getPropertyValue('--enlb-cta-bg')).toBe('#ff0000')
    expect(overlay.style.getPropertyValue('--enlb-text')).toBe('#00ff00')
    expect(overlay.classList.contains('enlb-theme-dark')).toBe(true)
  })

  it('applyTheme re-applies at runtime via a single style mutation (D17)', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    const overlay = sq('.enlb-overlay') as HTMLElement

    const observer = new MutationObserver(() => {})
    observer.observe(overlay, { attributes: true, attributeFilter: ['style'] })

    lb.applyTheme(
      normalizeTheme({ preset: 'light', colors: { ctaBg: '#ff0000', text: '#00ff00', surface: '#333' } }),
    )

    const styleMutations = observer.takeRecords().filter((r) => r.attributeName === 'style')
    expect(styleMutations.length).toBe(1)

    observer.disconnect()
  })

  it('applyTheme updates the preset class when the preset changes', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    lb.open()
    const overlay = sq('.enlb-overlay') as HTMLElement
    expect(overlay.classList.contains('enlb-theme-light')).toBe(true)

    lb.applyTheme(normalizeTheme({ preset: 'dark' }))

    expect(overlay.classList.contains('enlb-theme-dark')).toBe(true)
    expect(overlay.classList.contains('enlb-theme-light')).toBe(false)
  })

  it('invalid preset degrades gracefully — lightbox opens with light theme, no throw', () => {
    expect(() => {
      const lb = new Lightbox(
        normalizeConfig({
          header: 'H',
          body: 'B',
          theme: { preset: 'nonexistent' as unknown as 'light' },
        }),
      )
      lb.open()
      const overlay = sq('.enlb-overlay') as HTMLElement
      expect(overlay.classList.contains('enlb-theme-light')).toBe(true)
    }).not.toThrow()
  })

  it('partial theme with only radius override keeps the lightbox functional', () => {
    const lb = new Lightbox(
      normalizeConfig({ header: 'H', body: 'B', theme: { radius: '20px' } }),
    )
    lb.open()
    const overlay = sq('.enlb-overlay') as HTMLElement
    expect(overlay.style.getPropertyValue('--enlb-radius')).toBe('20px')
    expect(overlay.classList.contains('enlb-theme-light')).toBe(true)
    lb.close()
  })
})
