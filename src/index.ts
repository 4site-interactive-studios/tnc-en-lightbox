import { Lightbox } from './core/lightbox'
import { normalizeConfig } from './config'
import type { ENLightboxConfig } from './config'

export { Lightbox, normalizeConfig }

let activeInstance: Lightbox | null = null

export function init(config?: Partial<ENLightboxConfig>): Lightbox {
  if (activeInstance) {
    activeInstance.destroy()
    activeInstance = null
  }
  activeInstance = new Lightbox(normalizeConfig(config))
  return activeInstance
}

export function getInstance(): Lightbox | null {
  return activeInstance
}

;(() => {
  const cfg = (globalThis as { ENLightbox?: Partial<ENLightboxConfig> }).ENLightbox
  if (cfg && typeof cfg === 'object' && !('Lightbox' in cfg) && !('getInstance' in cfg)) {
    init(cfg)
  }
})()
