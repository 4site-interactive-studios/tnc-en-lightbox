import type { Trigger } from './types'

export function createTimeOnPageTrigger(delayMs: number): Trigger {
  let timerId: ReturnType<typeof setTimeout> | null = null

  return {
    arm(onFire) {
      timerId = setTimeout(onFire, delayMs)
    },
    disarm() {
      if (timerId !== null) clearTimeout(timerId)
      timerId = null
    },
  }
}
