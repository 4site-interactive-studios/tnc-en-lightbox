import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createDispatcher } from './dispatcher'

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

  it('first-to-fire wins: other triggers disarm when one fires', async () => {
    const mod = await import('../index')
    mod.init({
      header: 'Hi',
      body: 'B',
      triggers: { time: 3000, inactivity: 5000, frequencyDays: 7 },
    })
    mod.armTriggers()

    vi.advanceTimersByTime(3000)
    expect(document.querySelector('.enlb-overlay')).not.toBeNull()

    vi.advanceTimersByTime(2000)
    expect(document.querySelectorAll('.enlb-overlay').length).toBe(1)
  })

  it('open() opens the lightbox manually when eligible and stamps the show', async () => {
    const mod = await import('../index')
    mod.init({ header: 'Hi', body: 'B', triggers: { frequencyDays: 7 } })
    expect(mod.isEligible()).toBe(true)

    mod.open()
    expect(document.querySelector('.enlb-overlay')).not.toBeNull()
    expect(mod.isEligible()).toBe(false)
  })

  it('open() is a no-op when not eligible', async () => {
    localStorage.setItem('enlb:shown:/', String(Date.now()))
    const mod = await import('../index')
    mod.init({ header: 'Hi', body: 'B', triggers: { frequencyDays: 7 } })
    expect(mod.isEligible()).toBe(false)

    mod.open()
    expect(document.querySelector('.enlb-overlay')).toBeNull()
  })

  it('close() closes the lightbox and enlb:dismiss refreshes the stamp', async () => {
    const mod = await import('../index')
    mod.init({ header: 'Hi', body: 'B', triggers: { frequencyDays: 7 } })
    mod.open()
    expect(document.querySelector('.enlb-overlay')).not.toBeNull()

    mod.close()
    expect(document.querySelector('.enlb-overlay')).toBeNull()
    expect(mod.isEligible()).toBe(false)
  })

  it('disarmTriggers is idempotent and disarms active triggers', async () => {
    const mod = await import('../index')
    mod.init({ header: 'Hi', body: 'B', triggers: { time: 5000, frequencyDays: 7 } })
    mod.armTriggers()
    expect(() => mod.disarmTriggers()).not.toThrow()
    expect(() => mod.disarmTriggers()).not.toThrow()

    vi.advanceTimersByTime(10000)
    expect(document.querySelector('.enlb-overlay')).toBeNull()
  })

  it('sync fire from scroll-depth does not leak inactivity listeners/timers after disarm', async () => {
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(600)
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(2000)
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800)

    const mod = await import('../index')
    mod.init({
      header: 'Hi',
      body: 'B',
      triggers: { scroll: 50, inactivity: 5000, frequencyDays: 7 },
    })
    mod.armTriggers()

    expect(document.querySelector('.enlb-overlay')).not.toBeNull()

    mod.close()
    mod.disarmTriggers()

    vi.advanceTimersByTime(5000)
    expect(document.querySelector('.enlb-overlay')).toBeNull()
  })
})

describe('dispatcher (direct — sync fire leak)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('sync fire from scroll-depth does not leak the inactivity timer after disarm', () => {
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(600)
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(2000)
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800)

    const onFire = vi.fn()
    const dispatcher = createDispatcher(
      [
        { type: 'scroll', percent: 50 },
        { type: 'inactivity', idleMs: 5000 },
      ],
      onFire,
    )
    dispatcher.arm()
    expect(onFire).toHaveBeenCalledTimes(1)

    dispatcher.disarm()

    vi.advanceTimersByTime(5000)
    expect(onFire).toHaveBeenCalledTimes(1)
  })
})
