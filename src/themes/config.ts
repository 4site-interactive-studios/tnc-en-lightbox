import type { LayoutConfigBase, ThemeConfigBase } from '../config'

export type LayoutVariant = 'two-column'
export type LayoutImagePosition = 'left' | 'right' | 'top'
export type LayoutCloseButton = 'inside' | 'outside' | 'none'

export type ThemePreset = 'light' | 'dark' | 'brand'

export interface ThemeColors {
  overlay?: string
  surface?: string
  text?: string
  title?: string
  ctaBg?: string
  ctaText?: string
  secondaryCtaBg?: string
  secondaryCtaText?: string
  border?: string
}

const COLOR_TOKEN_MAP: Record<keyof ThemeColors, string> = {
  overlay: '--enlb-overlay-bg',
  surface: '--enlb-surface-bg',
  text: '--enlb-text',
  title: '--enlb-title',
  ctaBg: '--enlb-cta-bg',
  ctaText: '--enlb-cta-text',
  secondaryCtaBg: '--enlb-secondary-cta-bg',
  secondaryCtaText: '--enlb-secondary-cta-text',
  border: '--enlb-border',
}

declare module '../config' {
  interface ThemeConfigBase {
    preset?: ThemePreset
    colors?: ThemeColors
    radius?: string
    maxWidth?: string
    fontFamily?: string
    customCss?: string
  }
}

export interface NormalizedTheme {
  preset: ThemePreset
  cssVars: Record<string, string>
}

export function normalizeTheme(theme: ThemeConfigBase | undefined): NormalizedTheme {
  const src = theme ?? {}
  const preset: ThemePreset = src.preset ?? 'light'
  const cssVars: Record<string, string> = {}

  if (src.colors) {
    for (const [key, value] of Object.entries(src.colors)) {
      if (value !== undefined) {
        const tokenName = COLOR_TOKEN_MAP[key as keyof ThemeColors]
        if (tokenName) cssVars[tokenName] = value
      }
    }
  }
  if (src.radius) cssVars['--enlb-radius'] = src.radius
  if (src.maxWidth) cssVars['--enlb-max-width'] = src.maxWidth
  if (src.fontFamily) cssVars['--enlb-font-family'] = src.fontFamily

  return { preset, cssVars }
}

export interface NormalizedLayout {
  variant: LayoutVariant
  imagePosition: LayoutImagePosition
  imageRatio: string
  hideImageOnMobile?: boolean
  closeButton: LayoutCloseButton
}

declare module '../config' {
  interface LayoutConfigBase {
    variant?: LayoutVariant
    imagePosition?: LayoutImagePosition
    imageRatio?: string
    hideImageOnMobile?: boolean
    closeButton?: LayoutCloseButton
  }
}

export function normalizeLayout(
  layout: LayoutConfigBase | undefined,
  topLevelHideImageOnMobile: boolean,
): NormalizedLayout {
  const src = layout ?? {}
  return {
    variant: src.variant ?? 'two-column',
    imagePosition: src.imagePosition ?? 'left',
    imageRatio: src.imageRatio ?? '40%',
    hideImageOnMobile: src.hideImageOnMobile ?? topLevelHideImageOnMobile,
    closeButton: src.closeButton ?? 'inside',
  }
}
