export interface ENLightboxImage {
  src: string
  alt?: string
}

export interface ENLightboxCta {
  label: string
  href?: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- intentionally empty; populated via declaration merging from src/triggers/config.ts (B1/R1)
export interface TriggersConfigBase {}

export interface ENLightboxConfig {
  header?: string
  body?: string
  image?: ENLightboxImage
  cta?: ENLightboxCta
  closeOnOverlay?: boolean
  closeOnEsc?: boolean
  hideImageOnMobile?: boolean
  triggers?: TriggersConfigBase
  theme?: unknown
}

export interface NormalizedConfig {
  header: string
  body: string
  image?: ENLightboxImage
  cta?: ENLightboxCta
  closeOnOverlay: boolean
  closeOnEsc: boolean
  hideImageOnMobile: boolean
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
  }
}
