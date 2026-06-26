import lightboxCss from '../styles/lightbox.scss?inline'
import type { NormalizedConfig } from '../config'
import type { NormalizedTheme } from '../themes/config'

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

type SavedSibling = {
  el: Element
  inert: string | null
  ariaHidden: string | null
  tabindex: string | null
}

export class Lightbox {
  private config: NormalizedConfig
  private overlay: HTMLElement | null = null
  private dialog: HTMLElement | null = null
  private styleEl: HTMLStyleElement | null = null
  private prevFocus: Element | null = null
  private titleId: string
  private savedSiblings: SavedSibling[] = []
  private bodyOverflow: string | null = null
  private scrollX = 0
  private scrollY = 0

  private onKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.config.closeOnEsc) {
      e.stopPropagation()
      this.close()
    }
  }

  private onOverlayClick = (e: MouseEvent): void => {
    if (this.config.closeOnOverlay && e.target === this.overlay) {
      this.close()
    }
  }

  private onCloseClick = (e: MouseEvent): void => {
    e.stopPropagation()
    this.close()
  }

  private onCtaClick = (e: MouseEvent): void => {
    const target = e.currentTarget as HTMLElement
    const action = target.getAttribute('data-enlb-action')
    if (action === 'close') {
      e.preventDefault()
      e.stopPropagation()
      this.close()
      return
    }
    // Redirect: native <a href> handles navigation; just stop bubbling inside the dialog.
    e.stopPropagation()
  }

  private onDialogKeydown = (e: KeyboardEvent): void => {
    if (e.key !== 'Tab' || !this.dialog) return
    const focusable = Array.from(this.dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    if (focusable.length === 0) {
      e.preventDefault()
      this.dialog.focus()
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement
    if (e.shiftKey) {
      if (active === first || !this.dialog.contains(active)) {
        e.preventDefault()
        last.focus()
      }
    } else if (active === last || !this.dialog.contains(active)) {
      e.preventDefault()
      first.focus()
    }
  }

  constructor(config: NormalizedConfig) {
    this.config = config
    this.titleId = `enlb-title-${Math.random().toString(36).slice(2, 10)}`
  }

  open(): void {
    if (this.overlay) return
    try {
      this.prevFocus = document.activeElement
      this.scrollX = window.scrollX
      this.scrollY = window.scrollY
      this.injectStyles()
      this.lockBackground()
      this.overlay = this.buildDom()
      document.body.appendChild(this.overlay)
      this.isolateBackground()
      document.addEventListener('keydown', this.onKeydown)
      this.overlay.addEventListener('click', this.onOverlayClick)
      this.dialog?.addEventListener('keydown', this.onDialogKeydown)
      const closeBtn = this.dialog?.querySelector<HTMLElement>('.enlb-close')
      closeBtn?.addEventListener('click', this.onCloseClick)
      this.dialog?.querySelectorAll<HTMLElement>('.enlb-cta').forEach((cta) => {
        cta.addEventListener('click', this.onCtaClick)
      })
      this.dialog?.focus()
    } catch (e) {
      this.abortOpen()
      console.warn('[ENLightbox] open() failed:', e)
    }
  }

  private abortOpen(): void {
    if (this.overlay) {
      this.overlay.remove()
      this.overlay = null
    }
    this.dialog = null
    this.restoreBackground()
    this.prevFocus = null
  }

  close(): void {
    if (!this.overlay) return
    document.removeEventListener('keydown', this.onKeydown)
    this.overlay.removeEventListener('click', this.onOverlayClick)
    this.dialog?.removeEventListener('keydown', this.onDialogKeydown)
    const closeBtn = this.dialog?.querySelector<HTMLElement>('.enlb-close')
    closeBtn?.removeEventListener('click', this.onCloseClick)
    this.dialog?.querySelectorAll<HTMLElement>('.enlb-cta').forEach((cta) => {
      cta.removeEventListener('click', this.onCtaClick)
    })
    this.overlay.remove()
    this.overlay = null
    this.dialog = null
    this.restoreBackground()
    if (this.prevFocus instanceof HTMLElement) {
      this.prevFocus.focus()
      this.prevFocus = null
    }
    document.dispatchEvent(
      new CustomEvent('enlb:dismiss', {
        detail: { pathname: location.pathname },
        bubbles: true,
      }),
    )
  }

  destroy(): void {
    this.close()
    this.styleEl?.remove()
    this.styleEl = null
  }

  applyTheme(theme: NormalizedTheme): void {
    this.config = { ...this.config, theme }
    if (!this.overlay) return
    const newClass = this.buildOverlayClasses()
    if (this.overlay.className !== newClass) {
      this.overlay.className = newClass
    }
    const newStyle = this.composeOverlayStyle()
    if (this.overlay.getAttribute('style') !== newStyle) {
      this.overlay.setAttribute('style', newStyle)
    }
  }

  private lockBackground(): void {
    this.bodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }

  private isolateBackground(): void {
    this.savedSiblings = Array.from(document.body.children)
      .filter((el) => el !== this.overlay)
      .map((el) => ({
        el,
        inert: el.getAttribute('inert'),
        ariaHidden: el.getAttribute('aria-hidden'),
        tabindex: el.getAttribute('tabindex'),
      }))
    for (const s of this.savedSiblings) {
      s.el.setAttribute('inert', '')
      s.el.setAttribute('aria-hidden', 'true')
      s.el.setAttribute('tabindex', '-1')
    }
  }

  private restoreBackground(): void {
    document.body.style.overflow = this.bodyOverflow ?? ''
    if (this.bodyOverflow === null) {
      document.body.style.overflow = ''
    }
    window.scrollTo(this.scrollX, this.scrollY)
    for (const s of this.savedSiblings) {
      if (s.inert === null) s.el.removeAttribute('inert')
      else s.el.setAttribute('inert', s.inert)
      if (s.ariaHidden === null) s.el.removeAttribute('aria-hidden')
      else s.el.setAttribute('aria-hidden', s.ariaHidden)
      if (s.tabindex === null) s.el.removeAttribute('tabindex')
      else s.el.setAttribute('tabindex', s.tabindex)
    }
    this.savedSiblings = []
    this.bodyOverflow = null
  }

  private injectStyles(): void {
    if (this.styleEl) return
    this.styleEl = document.createElement('style')
    this.styleEl.setAttribute('data-enlb', '')
    this.styleEl.textContent = lightboxCss
    document.head.appendChild(this.styleEl)
  }

  private buildDialogClasses(): string {
    const classes = ['enlb-dialog']
    if (this.config.layout.hideImageOnMobile) classes.push('enlb-hide-image-mobile')
    if (this.config.layout.closeButton === 'outside') classes.push('enlb-close--outside')
    return classes.join(' ')
  }

  private buildOverlayClasses(): string {
    return `enlb-overlay enlb-theme-${this.config.theme.preset}`
  }

  private composeOverlayStyle(): string {
    const parts: string[] = [`--enlb-image-ratio: ${this.config.layout.imageRatio}`]
    for (const [key, value] of Object.entries(this.config.theme.cssVars)) {
      parts.push(`${key}: ${value}`)
    }
    return parts.join('; ')
  }

  private buildLayoutClasses(): string {
    const classes = ['enlb-layout']
    const hasImage = Boolean(this.config.image)
    if (hasImage) {
      classes.push(`enlb-layout--${this.config.layout.variant}`)
      classes.push(`enlb-layout--image-${this.config.layout.imagePosition}`)
    } else {
      classes.push('enlb-layout--single-column')
    }
    return classes.join(' ')
  }

  private buildCloseButton(): HTMLElement | null {
    if (this.config.layout.closeButton === 'none') return null
    const closeBtn = document.createElement('button')
    closeBtn.type = 'button'
    closeBtn.className = 'enlb-close'
    closeBtn.setAttribute('aria-label', 'Close')
    closeBtn.textContent = '×'
    return closeBtn
  }

  private resolveCtaAction(
    action: 'redirect' | 'close' | undefined,
    href?: string,
  ): 'redirect' | 'close' {
    if (action === 'redirect') return 'redirect'
    if (action === 'close') return 'close'
    return href ? 'redirect' : 'close'
  }

  private buildCtaElement(
    label: string,
    className: string,
    action?: 'redirect' | 'close',
    href?: string,
  ): HTMLElement {
    const resolved = this.resolveCtaAction(action, href)
    if (resolved === 'redirect') {
      const el = document.createElement('a')
      el.className = className
      if (href) el.href = href
      el.setAttribute('data-enlb-action', 'redirect')
      el.textContent = label
      return el
    }
    const el = document.createElement('button')
    el.type = 'button'
    el.className = className
    el.setAttribute('data-enlb-action', 'close')
    el.textContent = label
    return el
  }

  private buildCtaRow(): HTMLElement | null {
    const hasPrimary = Boolean(this.config.cta)
    const hasSecondary = Boolean(this.config.secondaryCta)
    const hasDecline = Boolean(this.config.dismissLabel)
    if (!hasPrimary && !hasSecondary && !hasDecline) return null

    const row = document.createElement('div')
    row.className = 'enlb-cta-row'

    if (hasPrimary) {
      const { label, action, href } = this.config.cta!
      row.appendChild(this.buildCtaElement(label, 'enlb-cta', action, href))
    }

    if (hasSecondary) {
      const { label, action, href } = this.config.secondaryCta!
      row.appendChild(this.buildCtaElement(label, 'enlb-cta enlb-cta--secondary', action, href))
    }

    if (hasDecline) {
      row.appendChild(
        this.buildCtaElement(this.config.dismissLabel!, 'enlb-cta enlb-cta--secondary', 'close'),
      )
    }

    return row
  }

  private buildDom(): HTMLElement {
    const overlay = document.createElement('div')
    overlay.className = this.buildOverlayClasses()
    overlay.setAttribute('style', this.composeOverlayStyle())

    const dialog = document.createElement('div')
    dialog.className = this.buildDialogClasses()
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-modal', 'true')
    dialog.setAttribute('aria-labelledby', this.titleId)
    dialog.setAttribute('tabindex', '-1')
    if (!this.config.header) {
      dialog.setAttribute('aria-label', 'Dialog')
    }

    const closeBtn = this.buildCloseButton()
    if (closeBtn) dialog.appendChild(closeBtn)

    const layout = document.createElement('div')
    layout.className = this.buildLayoutClasses()

    const content = document.createElement('div')
    content.className = 'enlb-content'

    if (this.config.image) {
      const imageWrap = document.createElement('div')
      imageWrap.className = 'enlb-image'
      const img = document.createElement('img')
      img.className = 'enlb-img'
      img.src = this.config.image.src
      img.alt = this.config.image.alt ?? ''
      imageWrap.appendChild(img)
      if (this.config.layout.imagePosition === 'right') {
        layout.appendChild(content)
        layout.appendChild(imageWrap)
      } else {
        layout.appendChild(imageWrap)
        layout.appendChild(content)
      }
    } else {
      layout.appendChild(content)
    }

    const title = document.createElement('h2')
    title.className = 'enlb-title'
    title.id = this.titleId
    title.textContent = this.config.header
    content.appendChild(title)

    if (this.config.body) {
      const body = document.createElement('div')
      body.className = 'enlb-text'
      body.textContent = this.config.body
      content.appendChild(body)
    }

    const ctaRow = this.buildCtaRow()
    if (ctaRow) content.appendChild(ctaRow)

    dialog.appendChild(layout)
    overlay.appendChild(dialog)

    this.dialog = dialog
    return overlay
  }
}
