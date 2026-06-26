import type { TriggersConfigBase } from '../config'

export interface TriggerSpec {
  type: 'time' | 'scroll' | 'inactivity' | 'exit-intent'
  delayMs?: number
  percent?: number
  idleMs?: number
}

export interface NormalizedTriggers {
  frequencyDays: number
  triggers: TriggerSpec[]
}

declare module '../config' {
  interface TriggersConfigBase {
    frequencyDays?: number
    time?: number
    scroll?: number
    inactivity?: number
    exitIntent?: boolean
    list?: TriggerSpec[]
  }
}

export function normalizeTriggers(config?: TriggersConfigBase): NormalizedTriggers {
  const src = config ?? {}
  const frequencyDays = src.frequencyDays ?? 7
  const triggers: TriggerSpec[] = []

  if (src.time != null) triggers.push({ type: 'time', delayMs: src.time })
  if (src.scroll != null) triggers.push({ type: 'scroll', percent: src.scroll })
  if (src.inactivity != null) triggers.push({ type: 'inactivity', idleMs: src.inactivity })
  if (src.exitIntent) triggers.push({ type: 'exit-intent' })
  if (Array.isArray(src.list)) {
    for (const item of src.list) {
      const spec = validSpec(item)
      if (spec) triggers.push(spec)
    }
  }

  return { frequencyDays, triggers }
}

function validSpec(item: unknown): TriggerSpec | null {
  if (!item || typeof item !== 'object') return null
  const s = item as Record<string, unknown>
  switch (s.type) {
    case 'time':
      return typeof s.delayMs === 'number' ? { type: 'time', delayMs: s.delayMs } : null
    case 'scroll':
      return typeof s.percent === 'number' ? { type: 'scroll', percent: s.percent } : null
    case 'inactivity':
      return typeof s.idleMs === 'number' ? { type: 'inactivity', idleMs: s.idleMs } : null
    case 'exit-intent':
      return { type: 'exit-intent' }
    default:
      return null
  }
}
