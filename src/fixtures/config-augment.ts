import type { ENLightboxConfig } from '../config'

declare module '../config' {
  interface TriggersConfigBase {
    time?: number
  }
}

type _AssertAugmentation = Required<ENLightboxConfig>['triggers'] extends { time?: number } ? true : never
const _check: _AssertAugmentation = true
void _check
