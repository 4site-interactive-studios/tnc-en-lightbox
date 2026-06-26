import { Lightbox } from './core/lightbox'
import { normalizeConfig, type ENLightboxConfig, type TriggersConfigBase, type ThemeConfigBase } from './config'
import { normalizeTriggers, type NormalizedTriggers } from './triggers/config'
import { normalizeTheme } from './themes/config'
import { createDispatcher, type Dispatcher } from './triggers/dispatcher'
import { isEligible as checkEligible, stamp } from './triggers/dismissal'

export { Lightbox, normalizeConfig }

let activeInstance: Lightbox | null = null
let activeTriggers: NormalizedTriggers | null = null
let dispatcher: Dispatcher | null = null
let dismissListener: ((e: Event) => void) | null = null

export function init(config?: Partial<ENLightboxConfig>): Lightbox {
  if (activeInstance) {
    activeInstance.destroy()
    activeInstance = null
  }
  disarmTriggers()
  activeInstance = new Lightbox(normalizeConfig(config))
  activeTriggers = normalizeTriggers(config?.triggers)
  return activeInstance
}

export function getInstance(): Lightbox | null {
  return activeInstance
}

export function armTriggers(config?: TriggersConfigBase): void {
  disarmTriggers()
  if (!activeInstance) return
  const triggers = config ? normalizeTriggers(config) : activeTriggers
  if (!triggers || triggers.triggers.length === 0) return
  if (!checkEligible(triggers.frequencyDays)) return
  ensureDismissListener()
  dispatcher = createDispatcher(triggers.triggers, () => {
    if (!checkEligible(triggers.frequencyDays)) return
    activeInstance?.open()
    stamp()
  })
  dispatcher.arm()
}

export function disarmTriggers(): void {
  dispatcher?.disarm()
  dispatcher = null
  if (dismissListener) {
    document.removeEventListener('enlb:dismiss', dismissListener)
    dismissListener = null
  }
}

export function isEligible(): boolean {
  const freq = activeTriggers?.frequencyDays ?? 7
  return checkEligible(freq)
}

export function open(): void {
  if (!activeInstance) return
  const freq = activeTriggers?.frequencyDays ?? 7
  if (!checkEligible(freq)) return
  activeInstance.open()
  stamp()
  ensureDismissListener()
}

export function close(): void {
  activeInstance?.close()
}

export function setTheme(theme: ThemeConfigBase): void {
  if (!activeInstance) return
  activeInstance.applyTheme(normalizeTheme(theme))
}

function ensureDismissListener(): void {
  if (dismissListener) return
  dismissListener = (): void => {
    stamp()
  }
  document.addEventListener('enlb:dismiss', dismissListener)
}

function autoInit(cfg: unknown): void {
  if (cfg && typeof cfg === 'object' && !('Lightbox' in cfg) && !('getInstance' in cfg)) {
    init(cfg as Partial<ENLightboxConfig>)
    if ((cfg as { triggers?: unknown }).triggers) armTriggers()
  }
}

;(() => {
  const g = globalThis as { __ENLightboxLoaded?: boolean; ENLightbox?: Partial<ENLightboxConfig> }
  if (g.__ENLightboxLoaded) return
  g.__ENLightboxLoaded = true
  try {
    const cfg = g.ENLightbox
    if (cfg) {
      autoInit(cfg)
    } else if (document.readyState === 'loading') {
      document.addEventListener(
        'DOMContentLoaded',
        () => {
          try {
            autoInit(g.ENLightbox)
          } catch (e) {
            console.warn('[ENLightbox] auto-init failed:', e)
          }
        },
        { once: true },
      )
    }
  } catch (e) {
    console.warn('[ENLightbox] auto-init failed:', e)
  }
})()
