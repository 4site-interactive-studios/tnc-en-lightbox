import type { Trigger } from './types'
import type { TriggerSpec } from './config'
import { createTimeOnPageTrigger } from './time-on-page'
import { createScrollDepthTrigger } from './scroll-depth'
import { createInactivityTrigger } from './inactivity'
import { createExitIntentTrigger } from './exit-intent'

export interface Dispatcher {
  arm(): void
  disarm(): void
}

function createTrigger(spec: TriggerSpec): Trigger {
  switch (spec.type) {
    case 'time':
      return createTimeOnPageTrigger(spec.delayMs!)
    case 'scroll':
      return createScrollDepthTrigger(spec.percent!)
    case 'inactivity':
      return createInactivityTrigger(spec.idleMs!)
    case 'exit-intent':
      return createExitIntentTrigger()
  }
}

export function createDispatcher(specs: TriggerSpec[], onFire: () => void): Dispatcher {
  let armed: Trigger[] = []
  let fired = false

  const fire = (): void => {
    if (fired) return
    fired = true
    disarmAll()
    onFire()
  }

  function disarmAll(): void {
    for (const t of armed) t.disarm()
    armed = []
  }

  return {
    arm() {
      if (specs.length === 0) return
      fired = false
      armed = specs.map((spec) => createTrigger(spec))
      for (const t of armed) t.arm(fire)
    },
    disarm() {
      disarmAll()
      fired = false
    },
  }
}
