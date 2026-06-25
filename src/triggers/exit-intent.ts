import type { Trigger } from './types'

export function createExitIntentTrigger(): Trigger {
  let handler: ((e: MouseEvent) => void) | null = null
  let fired = false

  return {
    arm(onFire) {
      fired = false
      handler = (e: MouseEvent): void => {
        if (fired) return
        if (e.clientY <= 0 && !e.relatedTarget) {
          fired = true
          onFire()
        }
      }
      document.addEventListener('mouseout', handler)
    },
    disarm() {
      if (handler) document.removeEventListener('mouseout', handler)
      handler = null
    },
  }
}
