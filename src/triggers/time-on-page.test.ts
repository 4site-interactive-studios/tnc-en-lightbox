import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createTimeOnPageTrigger } from './time-on-page'

describe('time-on-page trigger', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('fires after the specified delay', () => {
    const onFire = vi.fn()
    const trigger = createTimeOnPageTrigger(5000)
    trigger.arm(onFire)
    vi.advanceTimersByTime(5000)
    expect(onFire).toHaveBeenCalledTimes(1)
  })

  it('does NOT fire before the delay', () => {
    const onFire = vi.fn()
    const trigger = createTimeOnPageTrigger(5000)
    trigger.arm(onFire)
    vi.advanceTimersByTime(4999)
    expect(onFire).not.toHaveBeenCalled()
  })

  it('disarm cancels the timer so it never fires', () => {
    const onFire = vi.fn()
    const trigger = createTimeOnPageTrigger(5000)
    trigger.arm(onFire)
    trigger.disarm()
    vi.advanceTimersByTime(10000)
    expect(onFire).not.toHaveBeenCalled()
  })

  it('can be re-armed after disarm', () => {
    const onFire = vi.fn()
    const trigger = createTimeOnPageTrigger(5000)
    trigger.arm(onFire)
    trigger.disarm()
    vi.advanceTimersByTime(10000)
    expect(onFire).not.toHaveBeenCalled()
    trigger.arm(onFire)
    vi.advanceTimersByTime(5000)
    expect(onFire).toHaveBeenCalledTimes(1)
  })
})
