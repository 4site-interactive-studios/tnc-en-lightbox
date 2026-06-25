export interface ENLightboxConfig {
  header?: string
  body?: string
  image?: { src: string; alt?: string }
  cta?: { label: string; href?: string }
  closeOnOverlay?: boolean
  closeOnEsc?: boolean
  hideImageOnMobile?: boolean
}

export function normalizeConfig(_input?: Partial<ENLightboxConfig>): ENLightboxConfig {
  return {} as ENLightboxConfig
}
