import type { Trigger } from './types'

export function createExitIntentTrigger(): Trigger {
  let handler: ((e: MouseEvent) => void) | null = null

  return {
    arm(onFire) {
      handler = (e: MouseEvent): void => {
        if (e.clientY <= 0 && !e.relatedTarget) onFire()
      }
      document.addEventListener('mouseout', handler)
    },
    disarm() {
      if (handler) document.removeEventListener('mouseout', handler)
      handler = null
    },
  }
}
