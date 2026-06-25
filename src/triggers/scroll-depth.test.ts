import { describe, it, expect, afterEach, vi } from 'vitest'
import { createScrollDepthTrigger } from './scroll-depth'

describe('scroll-depth trigger', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  function mockScroll(scrollY: number, scrollHeight: number, innerHeight = 800): void {
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(scrollY)
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(scrollHeight)
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(innerHeight)
  }

  it('fires on arm when already scrolled past the threshold', () => {
    mockScroll(600, 2000)
    const onFire = vi.fn()
    const trigger = createScrollDepthTrigger(50)
    trigger.arm(onFire)
    expect(onFire).toHaveBeenCalledTimes(1)
  })

  it('does NOT fire on arm when below the threshold', () => {
    mockScroll(300, 2000)
    const onFire = vi.fn()
    const trigger = createScrollDepthTrigger(50)
    trigger.arm(onFire)
    expect(onFire).not.toHaveBeenCalled()
  })

  it('fires on scroll event when threshold is crossed', () => {
    const scrollYSpy = vi.spyOn(window, 'scrollY', 'get').mockReturnValue(0)
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(2000)
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800)
    const onFire = vi.fn()
    const trigger = createScrollDepthTrigger(50)
    trigger.arm(onFire)
    expect(onFire).not.toHaveBeenCalled()

    scrollYSpy.mockReturnValue(600)
    window.dispatchEvent(new Event('scroll'))
    expect(onFire).toHaveBeenCalledTimes(1)
  })

  it('does NOT fire again after already fired', () => {
    mockScroll(600, 2000)
    const onFire = vi.fn()
    const trigger = createScrollDepthTrigger(50)
    trigger.arm(onFire)
    expect(onFire).toHaveBeenCalledTimes(1)
    window.dispatchEvent(new Event('scroll'))
    expect(onFire).toHaveBeenCalledTimes(1)
  })

  it('disarm removes the scroll listener', () => {
    const scrollYSpy = vi.spyOn(window, 'scrollY', 'get').mockReturnValue(0)
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(2000)
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800)
    const onFire = vi.fn()
    const trigger = createScrollDepthTrigger(50)
    trigger.arm(onFire)
    trigger.disarm()
    scrollYSpy.mockReturnValue(600)
    window.dispatchEvent(new Event('scroll'))
    expect(onFire).not.toHaveBeenCalled()
  })
})
