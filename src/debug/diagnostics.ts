import { buildTealiumPayload, type TealiumEvent } from '../analytics/payloads'

type EventDetail = Record<string, unknown>

type ConsoleLike = {
  log?: (...data: unknown[]) => void
}

type WindowLike = {
  utag?: unknown
}

export function installDiagnosticsListeners(): () => void {
  if (!isDiagnosticsEnabled()) return () => undefined

  const onOpen = (event: Event): void => {
    try {
      logLifecycle('enlb:open', readDetail(event))
      logPayload('impression')
    } catch {
      // Diagnostics must never affect the host page.
    }
  }

  const onCta = (event: Event): void => {
    try {
      const detail = readDetail(event)
      logLifecycle('enlb:cta', detail)
      if (detail?.role === 'primary') logPayload('click')
    } catch {
      // Diagnostics must never affect the host page.
    }
  }

  const onDismiss = (event: Event): void => {
    try {
      logLifecycle('enlb:dismiss', readDetail(event))
    } catch {
      // Diagnostics must never affect the host page.
    }
  }

  const onFieldWrite = (event: Event): void => {
    try {
      logLifecycle('enlb:field-write', readDetail(event))
    } catch {
      // Diagnostics must never affect the host page.
    }
  }

  try {
    document.addEventListener('enlb:open', onOpen)
    document.addEventListener('enlb:cta', onCta)
    document.addEventListener('enlb:dismiss', onDismiss)
    document.addEventListener('enlb:field-write', onFieldWrite)
  } catch {
    // A hostile document must not prevent the rest of the asset from loading.
  }

  return () => {
    try {
      document.removeEventListener('enlb:open', onOpen)
      document.removeEventListener('enlb:cta', onCta)
      document.removeEventListener('enlb:dismiss', onDismiss)
      document.removeEventListener('enlb:field-write', onFieldWrite)
    } catch {
      // A hostile document must not affect teardown or the host page.
    }
  }
}

function isDiagnosticsEnabled(): boolean {
  try {
    const locationValue = (globalThis as { location?: unknown }).location
    if (!locationValue || (typeof locationValue !== 'object' && typeof locationValue !== 'function')) {
      return false
    }
    const search = (locationValue as { search?: unknown }).search
    if (typeof search !== 'string') return false

    const value = new URLSearchParams(search).get('debug')
    return value === 'true' || value === 'log'
  } catch {
    return false
  }
}

function readDetail(event: Event): EventDetail | undefined {
  try {
    const detail = (event as CustomEvent<unknown>).detail
    if (!detail || typeof detail !== 'object' || Array.isArray(detail)) return undefined
    return detail as EventDetail
  } catch {
    return undefined
  }
}

function logLifecycle(name: string, detail: EventDetail | undefined): void {
  safeLog(`[ENLightbox debug] ${name}`, detail)
}

function logPayload(event: TealiumEvent): void {
  const payload = buildTealiumPayload(event)
  if (hasUtagLink()) {
    safeLog('[ENLightbox debug] utag payload:', payload)
  } else {
    safeLog('[ENLightbox debug] utag absent — would fire:', payload)
  }
}

function hasUtagLink(): boolean {
  try {
    const windowValue = (globalThis as { window?: unknown }).window
    if (!windowValue || (typeof windowValue !== 'object' && typeof windowValue !== 'function')) {
      return false
    }
    const utag = (windowValue as WindowLike).utag
    return Boolean(
      utag &&
        (typeof utag === 'object' || typeof utag === 'function') &&
        typeof (utag as { link?: unknown }).link === 'function',
    )
  } catch {
    return false
  }
}

function safeLog(message: string, detail?: unknown): void {
  try {
    const consoleValue = (globalThis as { console?: unknown }).console
    if (!consoleValue || (typeof consoleValue !== 'object' && typeof consoleValue !== 'function')) {
      return
    }
    const log = (consoleValue as ConsoleLike).log
    if (typeof log !== 'function') return
    if (detail === undefined) {
      log.call(consoleValue, message)
    } else {
      log.call(consoleValue, message, detail)
    }
  } catch {
    // A frozen, missing, or hostile console must not affect the host page.
  }
}
