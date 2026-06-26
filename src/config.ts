import type { NormalizedLayout, NormalizedTheme } from './themes/config'
import { normalizeLayout, normalizeTheme } from './themes/config'

export interface ENLightboxImage {
  src: string
  alt?: string
}

export interface ENLightboxCta {
  label: string
  href?: string
  action?: 'redirect' | 'close'
}

export interface ENLightboxSecondaryCta {
  label: string
  href?: string
  action?: 'redirect' | 'close'
}

export interface TriggersConfigBase {}

export interface ThemeConfigBase {}

export interface LayoutConfigBase {}

export interface ENLightboxConfig {
  header?: string
  body?: string
  image?: ENLightboxImage
  cta?: ENLightboxCta
  secondaryCta?: ENLightboxSecondaryCta
  dismissLabel?: string
  closeOnOverlay?: boolean
  closeOnEsc?: boolean
  hideImageOnMobile?: boolean
  triggers?: TriggersConfigBase
  theme?: ThemeConfigBase
  layout?: LayoutConfigBase
}

export interface NormalizedConfig {
  header: string
  body: string
  image?: ENLightboxImage
  cta?: ENLightboxCta
  secondaryCta?: ENLightboxSecondaryCta
  dismissLabel?: string
  closeOnOverlay: boolean
  closeOnEsc: boolean
  hideImageOnMobile: boolean
  triggers: TriggersConfigBase
  theme: NormalizedTheme
  layout: NormalizedLayout
}

export function normalizeConfig(input?: Partial<ENLightboxConfig>): NormalizedConfig {
  const src = input ?? {}
  const topLevelHideImageOnMobile = src.hideImageOnMobile ?? true
  return {
    header: src.header ?? '',
    body: src.body ?? '',
    image: src.image,
    cta: src.cta,
    secondaryCta: src.secondaryCta,
    dismissLabel: src.dismissLabel,
    closeOnOverlay: src.closeOnOverlay ?? true,
    closeOnEsc: src.closeOnEsc ?? true,
    hideImageOnMobile: topLevelHideImageOnMobile,
    triggers: src.triggers ?? {},
    theme: normalizeTheme(src.theme),
    layout: normalizeLayout(src.layout, topLevelHideImageOnMobile),
  }
}
