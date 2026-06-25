import type { NormalizedLayout } from './themes/config'
import { normalizeLayout } from './themes/config'

export interface ENLightboxImage {
  src: string
  alt?: string
}

export interface ENLightboxCta {
  label: string
  href?: string
}

export interface TriggersConfigBase {}

export interface ThemeConfigBase {}

export interface LayoutConfigBase {}

export interface ENIntegrationConfigBase {}

export interface ENLightboxConfig {
  header?: string
  body?: string
  image?: ENLightboxImage
  cta?: ENLightboxCta
  closeOnOverlay?: boolean
  closeOnEsc?: boolean
  hideImageOnMobile?: boolean
  triggers?: TriggersConfigBase
  theme?: ThemeConfigBase
  layout?: LayoutConfigBase
  en?: ENIntegrationConfigBase
}

export interface NormalizedConfig {
  header: string
  body: string
  image?: ENLightboxImage
  cta?: ENLightboxCta
  closeOnOverlay: boolean
  closeOnEsc: boolean
  hideImageOnMobile: boolean
  triggers: TriggersConfigBase
  theme: ThemeConfigBase
  layout: NormalizedLayout
  en: ENIntegrationConfigBase
}

export function normalizeConfig(input?: Partial<ENLightboxConfig>): NormalizedConfig {
  const src = input ?? {}
  const topLevelHideImageOnMobile = src.hideImageOnMobile ?? true
  return {
    header: src.header ?? '',
    body: src.body ?? '',
    image: src.image,
    cta: src.cta,
    closeOnOverlay: src.closeOnOverlay ?? true,
    closeOnEsc: src.closeOnEsc ?? true,
    hideImageOnMobile: topLevelHideImageOnMobile,
    triggers: src.triggers ?? {},
    theme: src.theme ?? {},
    layout: normalizeLayout(src.layout, topLevelHideImageOnMobile),
    en: src.en ?? {},
  }
}
