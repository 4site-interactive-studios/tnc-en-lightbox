import { buildTealiumPayload, type TealiumPayload } from './payloads'

type Utag = {
  link?: (payload: TealiumPayload) => void
}

type CtaDetail = {
  role?: unknown
}

type TealiumWindow = Window & {
  utag?: unknown
}

function send(payload: TealiumPayload): void {
  try {
    const utag = (window as TealiumWindow).utag as Utag | undefined
    if (typeof utag?.link !== 'function') return
    utag.link(payload)
  } catch {
    // Tealium is an optional host integration. Its absence or failure must not
    // affect the page hosting the lightbox.
  }
}

function onOpen(): void {
  send(buildTealiumPayload('impression'))
}

function onCta(event: Event): void {
  try {
    const detail = (event as CustomEvent<CtaDetail>).detail
    if (detail?.role !== 'primary') return
    send(buildTealiumPayload('click'))
  } catch {
    // A malformed host-dispatched event must not escape this boundary.
  }
}

export function installTealiumListeners(): () => void {
  document.addEventListener('enlb:open', onOpen)
  document.addEventListener('enlb:cta', onCta)

  return () => {
    document.removeEventListener('enlb:open', onOpen)
    document.removeEventListener('enlb:cta', onCta)
  }
}
