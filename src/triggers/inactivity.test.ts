import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createInactivityTrigger } from './inactivity'

describe('inactivity trigger', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('fires after the idle period with no activity', () => {
    const onFire = vi.fn()
    const trigger = createInactivityTrigger(5000)
    trigger.arm(onFire)
    vi.advanceTimersByTime(4999)
    expect(onFire).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onFire).toHaveBeenCalledTimes(1)
  })

  it('activity resets the idle timer', () => {
    const onFire = vi.fn()
    const trigger = createInactivityTrigger(5000)
    trigger.arm(onFire)
    vi.advanceTimersByTime(3000)
    document.dispatchEvent(new Event('mousemove'))
    vi.advanceTimersByTime(3000)
    expect(onFire).not.toHaveBeenCalled()
    vi.advanceTimersByTime(2000)
    expect(onFire).toHaveBeenCalledTimes(1)
  })

  it('multiple activity events keep resetting the timer', () => {
    const onFire = vi.fn()
    const trigger = createInactivityTrigger(5000)
    trigger.arm(onFire)
    vi.advanceTimersByTime(2000)
    document.dispatchEvent(new Event('keydown'))
    vi.advanceTimersByTime(2000)
    document.dispatchEvent(new Event('click'))
    vi.advanceTimersByTime(2000)
    expect(onFire).not.toHaveBeenCalled()
    vi.advanceTimersByTime(3000)
    expect(onFire).toHaveBeenCalledTimes(1)
  })

  it('disarm cancels the timer and removes activity listeners', () => {
    const onFire = vi.fn()
    const trigger = createInactivityTrigger(5000)
    trigger.arm(onFire)
    trigger.disarm()
    vi.advanceTimersByTime(10000)
    expect(onFire).not.toHaveBeenCalled()
  })
})
