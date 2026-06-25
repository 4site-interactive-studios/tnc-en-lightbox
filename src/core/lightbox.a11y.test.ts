import { describe, it, expect, afterEach } from 'vitest'
import { Lightbox } from './lightbox'
import { normalizeConfig } from '../config'

afterEach(() => {
  document.body.innerHTML = ''
  document.head.querySelectorAll('style[data-enlb]').forEach((el) => el.remove())
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

    lb.close()

    expect(sibling.hasAttribute('inert')).toBe(false)
    expect(sibling.hasAttribute('aria-hidden')).toBe(false)
  })
})
