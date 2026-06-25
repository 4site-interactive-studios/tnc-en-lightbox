import type { Trigger } from './types'

export function createScrollDepthTrigger(percent: number): Trigger {
  let handler: (() => void) | null = null
  let fired = false

  return {
    arm(onFire) {
      fired = false
      handler = (): void => {
        if (fired) return
        const scrollTop = window.scrollY
        const docHeight = document.documentElement.scrollHeight - window.innerHeight
        if (docHeight > 0 && (scrollTop / docHeight) * 100 >= percent) {
          fired = true
          onFire()
        }
      }
      window.addEventListener('scroll', handler, { passive: true })
      handler()
    },
    disarm() {
      if (handler) window.removeEventListener('scroll', handler)
      handler = null
    },
  }
}
