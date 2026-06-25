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
})
