import type { LayoutConfigBase } from '../config'

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
