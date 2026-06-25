import { Lightbox } from './core/lightbox'
import type { ENLightboxConfig } from './config'

export { Lightbox }

let activeInstance: Lightbox | null = null

export function getInstance(): Lightbox | null {
  return activeInstance
}

export function init(_config?: ENLightboxConfig): Lightbox {
  return new Lightbox({} as ENLightboxConfig)
}
