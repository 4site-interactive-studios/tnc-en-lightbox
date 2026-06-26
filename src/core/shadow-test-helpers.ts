// Test-only helpers for piercing the lightbox's open Shadow DOM.
//
// The lightbox renders into an open shadow root attached to a `[data-enlb-root]`
// host element in document.body (see src/core/lightbox.ts). `document.querySelector`
// does NOT cross the shadow boundary, so unit tests resolve lightbox nodes through
// these helpers instead. This module is imported only by tests; it is never part of
// the shipped bundle.

/** The lightbox host element in the light DOM, or null when the lightbox is closed. */
export function lightboxHost(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-enlb-root]')
}

/** The open shadow root. Throws if the lightbox is not currently open. */
export function shadowRoot(): ShadowRoot {
  const host = lightboxHost()
  if (!host || !host.shadowRoot) {
    throw new Error('lightbox shadow root not found (is the lightbox open?)')
  }
  return host.shadowRoot
}

/** Query a single element inside the lightbox shadow root. */
export function sq<E extends Element = Element>(selector: string): E | null {
  return shadowRoot().querySelector<E>(selector)
}

/** Query all elements inside the lightbox shadow root (as an array). */
export function sqa<E extends Element = Element>(selector: string): E[] {
  return Array.from(shadowRoot().querySelectorAll<E>(selector))
}

/** The element currently focused inside the shadow root (not the host), or null. */
export function shadowActiveElement(): Element | null {
  return shadowRoot().activeElement
}
