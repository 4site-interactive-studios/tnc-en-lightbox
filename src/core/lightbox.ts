import lightboxCss from '../styles/lightbox.scss?inline'
import type { NormalizedConfig } from '../config'

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
    this.dialog?.focus()
  }

  close(): void {
    if (!this.overlay) return
    document.removeEventListener('keydown', this.onKeydown)
    this.overlay.removeEventListener('click', this.onOverlayClick)
    this.dialog?.removeEventListener('keydown', this.onDialogKeydown)
    const closeBtn = this.dialog?.querySelector<HTMLElement>('.enlb-close')
    closeBtn?.removeEventListener('click', this.onCloseClick)
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

  private buildDom(): HTMLElement {
    const overlay = document.createElement('div')
    overlay.className = 'enlb-overlay'

    const dialog = document.createElement('div')
    dialog.className = 'enlb-dialog'
    if (this.config.hideImageOnMobile) dialog.classList.add('enlb-hide-image-mobile')
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-modal', 'true')
    dialog.setAttribute('aria-labelledby', this.titleId)
    dialog.setAttribute('tabindex', '-1')
    if (!this.config.header) {
      dialog.setAttribute('aria-label', 'Dialog')
    }

    const closeBtn = document.createElement('button')
    closeBtn.type = 'button'
    closeBtn.className = 'enlb-close'
    closeBtn.setAttribute('aria-label', 'Close')
    closeBtn.textContent = '×'
    dialog.appendChild(closeBtn)

    const layout = document.createElement('div')
    layout.className = 'enlb-layout'

    if (this.config.image) {
      const imageWrap = document.createElement('div')
      imageWrap.className = 'enlb-image'
      const img = document.createElement('img')
      img.className = 'enlb-img'
      img.src = this.config.image.src
      img.alt = this.config.image.alt ?? ''
      imageWrap.appendChild(img)
      layout.appendChild(imageWrap)
    }

    const content = document.createElement('div')
    content.className = 'enlb-content'

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

    if (this.config.cta) {
      const cta = document.createElement('a')
      cta.className = 'enlb-cta'
      if (this.config.cta.href) cta.href = this.config.cta.href
      cta.textContent = this.config.cta.label
      content.appendChild(cta)
    }

    layout.appendChild(content)
    dialog.appendChild(layout)
    overlay.appendChild(dialog)

    this.dialog = dialog
    return overlay
  }
}
