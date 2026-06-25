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
  layout: LayoutConfigBase
  en: ENIntegrationConfigBase
}

export function normalizeConfig(input?: Partial<ENLightboxConfig>): NormalizedConfig {
  const src = input ?? {}
  return {
    header: src.header ?? '',
    body: src.body ?? '',
    image: src.image,
    cta: src.cta,
    closeOnOverlay: src.closeOnOverlay ?? true,
    closeOnEsc: src.closeOnEsc ?? true,
    hideImageOnMobile: src.hideImageOnMobile ?? true,
    triggers: src.triggers ?? {},
    theme: src.theme ?? {},
    layout: src.layout ?? {},
    en: src.en ?? {},
  }
}
