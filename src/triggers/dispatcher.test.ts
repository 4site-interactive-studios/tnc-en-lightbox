import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('trigger dispatcher', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    document.body.innerHTML = ''
    document.head.querySelectorAll('style[data-enlb]').forEach((el) => el.remove())
    delete (globalThis as { ENLightbox?: unknown }).ENLightbox
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.resetModules()
    localStorage.clear()
    document.body.innerHTML = ''
    document.head.querySelectorAll('style[data-enlb]').forEach((el) => el.remove())
    delete (globalThis as { ENLightbox?: unknown }).ENLightbox
  })

  it('arms a time-on-page trigger that opens the lightbox after the delay and NOT before', async () => {
    const mod = await import('../index')
    mod.init({ header: 'Hi', body: 'B', triggers: { time: 5000, frequencyDays: 7 } })
    mod.armTriggers()

    expect(document.querySelector('.enlb-overlay')).toBeNull()

    vi.advanceTimersByTime(4999)
    expect(document.querySelector('.enlb-overlay')).toBeNull()

    vi.advanceTimersByTime(1)
    expect(document.querySelector('.enlb-overlay')).not.toBeNull()
  })

  it('does NOT open when a fresh enlb:shown localStorage record is inside frequencyDays', async () => {
    localStorage.setItem('enlb:shown:/', String(Date.now()))

    const mod = await import('../index')
    mod.init({ header: 'Hi', body: 'B', triggers: { time: 5000, frequencyDays: 7 } })
    mod.armTriggers()

    vi.advanceTimersByTime(5000)

    expect(document.querySelector('.enlb-overlay')).toBeNull()
  })
})
