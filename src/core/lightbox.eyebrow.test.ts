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

describe('Lightbox eyebrow label', () => {
  it('renders .enlb-eyebrow with the configured text above .enlb-title when present', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'Title', body: 'B', eyebrow: 'Example Eyebrow' }))
    lb.open()

    const eyebrow = sq('.enlb-content .enlb-eyebrow')
    expect(eyebrow).not.toBeNull()
    expect(eyebrow?.textContent).toBe('Example Eyebrow')

    const title = sq('.enlb-title')
    expect(title).not.toBeNull()
    // The eyebrow must PRECEDE the title in DOM order (it renders above it).
    const rel = eyebrow!.compareDocumentPosition(title!)
    expect(rel & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('renders NO .enlb-eyebrow element when eyebrow is omitted', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'Title', body: 'B' }))
    lb.open()
    expect(sq('.enlb-eyebrow')).toBeNull()
  })

  it('renders NO .enlb-eyebrow element when eyebrow is an empty string', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'Title', body: 'B', eyebrow: '' }))
    lb.open()
    expect(sq('.enlb-eyebrow')).toBeNull()
  })

  it('degrades a wrong-typed eyebrow to no element and never throws', () => {
    const cfg = { header: 'Title', body: 'B', eyebrow: 12345 } as unknown as Parameters<typeof normalizeConfig>[0]
    expect(() => {
      const lb = new Lightbox(normalizeConfig(cfg))
      lb.open()
    }).not.toThrow()
    expect(sq('.enlb-eyebrow')).toBeNull()
  })

  it('keeps the dialog accessible name from the title (aria-labelledby), not the eyebrow', () => {
    const lb = new Lightbox(normalizeConfig({ header: 'Title', body: 'B', eyebrow: 'Example Eyebrow' }))
    lb.open()
    const dialog = sq('[role="dialog"]') as HTMLElement
    expect(dialog.hasAttribute('aria-labelledby')).toBe(true)
    expect(dialog.hasAttribute('aria-label')).toBe(false)
  })
})
