import type { Trigger } from './types'

const ACTIVITY_EVENTS = ['mousemove', 'scroll', 'keydown', 'touchstart', 'click'] as const

export function createInactivityTrigger(idleMs: number): Trigger {
  let timerId: ReturnType<typeof setTimeout> | null = null
  let resetFn: (() => void) | null = null

  return {
    arm(onFire) {
      resetFn = (): void => {
        if (timerId !== null) clearTimeout(timerId)
        timerId = setTimeout(onFire, idleMs)
      }
      for (const evt of ACTIVITY_EVENTS) {
        document.addEventListener(evt, resetFn, { passive: true })
      }
      resetFn()
    },
    disarm() {
      if (timerId !== null) clearTimeout(timerId)
      timerId = null
      if (resetFn) {
        for (const evt of ACTIVITY_EVENTS) {
          document.removeEventListener(evt, resetFn)
        }
      }
      resetFn = null
    },
  }
}
