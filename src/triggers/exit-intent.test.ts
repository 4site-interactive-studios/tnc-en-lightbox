import { describe, it, expect, vi } from 'vitest'
import { createExitIntentTrigger } from './exit-intent'

describe('exit-intent trigger', () => {
  it('fires when mouse leaves the top of the page (clientY <= 0, no relatedTarget)', () => {
    const onFire = vi.fn()
    const trigger = createExitIntentTrigger()
    trigger.arm(onFire)
    document.dispatchEvent(new MouseEvent('mouseout', { clientY: 0, bubbles: true }))
    expect(onFire).toHaveBeenCalledTimes(1)
  })

  it('fires when clientY is negative (above the viewport)', () => {
    const onFire = vi.fn()
    const trigger = createExitIntentTrigger()
    trigger.arm(onFire)
    document.dispatchEvent(new MouseEvent('mouseout', { clientY: -10, bubbles: true }))
    expect(onFire).toHaveBeenCalledTimes(1)
  })

  it('does NOT fire when clientY is positive (mouse leaves from the sides)', () => {
    const onFire = vi.fn()
    const trigger = createExitIntentTrigger()
    trigger.arm(onFire)
    document.dispatchEvent(new MouseEvent('mouseout', { clientY: 100, bubbles: true }))
    expect(onFire).not.toHaveBeenCalled()
  })

  it('does NOT fire when relatedTarget is set (moving within the page)', () => {
    const onFire = vi.fn()
    const trigger = createExitIntentTrigger()
    trigger.arm(onFire)
    const related = document.createElement('div')
    document.dispatchEvent(
      new MouseEvent('mouseout', { clientY: 0, relatedTarget: related, bubbles: true }),
    )
    expect(onFire).not.toHaveBeenCalled()
  })

  it('disarm removes the mouseout listener', () => {
    const onFire = vi.fn()
    const trigger = createExitIntentTrigger()
    trigger.arm(onFire)
    trigger.disarm()
    document.dispatchEvent(new MouseEvent('mouseout', { clientY: 0, bubbles: true }))
    expect(onFire).not.toHaveBeenCalled()
  })

  it('does not fire more than once per arm cycle', () => {
    const onFire = vi.fn()
    const trigger = createExitIntentTrigger()
    trigger.arm(onFire)
    document.dispatchEvent(new MouseEvent('mouseout', { clientY: 0, bubbles: true }))
    expect(onFire).toHaveBeenCalledTimes(1)
    document.dispatchEvent(new MouseEvent('mouseout', { clientY: 0, bubbles: true }))
    expect(onFire).toHaveBeenCalledTimes(1)
  })
})
