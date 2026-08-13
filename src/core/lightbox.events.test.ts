import { describe, it, expect, afterEach, vi } from 'vitest'
import { Lightbox } from './lightbox'
import { normalizeConfig } from '../config'

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
  document.head.querySelectorAll('style[data-enlb]').forEach((el) => el.remove())
  window.scrollTo = () => undefined
})

describe('Lightbox lifecycle events', () => {
  it('emits enlb:open once per successful mount and never from the abortOpen path', () => {
    const opens: CustomEvent[] = []
    const onOpen = (event: Event) => opens.push(event as CustomEvent)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    document.addEventListener('enlb:open', onOpen)

    const lb = new Lightbox(normalizeConfig({ header: 'H', body: 'B' }))
    try {
      lb.open()
      lb.open()

      expect(opens).toHaveLength(1)
      expect(opens[0].target).toBe(document)
      expect(opens[0].bubbles).toBe(true)
      expect(opens[0].detail).toEqual({})

      lb.close()
      const createSpy = vi.spyOn(document, 'createElement').mockImplementationOnce(() => {
        throw new Error('mount failed')
      })
      lb.open()
      createSpy.mockRestore()

      expect(opens).toHaveLength(1)
    } finally {
      document.removeEventListener('enlb:open', onOpen)
      warnSpy.mockRestore()
      lb.close()
    }
  })
})
