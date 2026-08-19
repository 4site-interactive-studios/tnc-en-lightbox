import { isSafeReferenceFieldName, type NormalizedENIntegrationConfig } from './config'

type CtaDetail = {
  role?: unknown
}

type DismissDetail = {
  reason?: unknown
}

type StoredOutcome = {
  field: string
  value: 'lightbox_accepted' | 'lightbox_declined'
}

const STORAGE_KEY = 'enlb:reference-field'
const EN_FORM_SELECTOR = 'form.en__component--page'
const LEGACY_EN_FORM_SELECTOR = 'form[data-en-component="form"]'
const ACCEPTED = 'lightbox_accepted'
const DECLINED = 'lightbox_declined'
const DECLINE_REASONS = new Set(['close-button', 'esc', 'overlay', 'cta-secondary', 'cta-dismiss', 'api'])

export function installReferenceFieldListeners(config: NormalizedENIntegrationConfig): () => void {
  const field = config.referenceField
  if (!isSafeReferenceFieldName(field)) return () => undefined

  const onCta = (event: Event): void => {
    try {
      const role = (event as CustomEvent<CtaDetail>).detail?.role
      if (role === 'primary') writeOutcome(field, ACCEPTED)
    } catch {
      // A malformed host event must never escape into the host page.
    }
  }

  const onDismiss = (event: Event): void => {
    try {
      const reason = (event as CustomEvent<DismissDetail>).detail?.reason
      if (typeof reason === 'string' && DECLINE_REASONS.has(reason)) writeOutcome(field, DECLINED)
    } catch {
      // A malformed host event must never escape into the host page.
    }
  }

  try {
    document.addEventListener('enlb:cta', onCta)
    document.addEventListener('enlb:dismiss', onDismiss)
    ensureField(field)
    replayPending(field)
  } catch {
    return () => undefined
  }

  return () => {
    document.removeEventListener('enlb:cta', onCta)
    document.removeEventListener('enlb:dismiss', onDismiss)
  }
}

function findENForm(): HTMLFormElement | null {
  return (
    document.querySelector<HTMLFormElement>(EN_FORM_SELECTOR) ??
    document.querySelector<HTMLFormElement>(LEGACY_EN_FORM_SELECTOR)
  )
}

function ensureField(field: string): boolean {
  try {
    if (!isSafeReferenceFieldName(field)) return false
    const form = findENForm()
    if (!form) return false
    return findOrCreateInput(form, field) !== null
  } catch {
    // Page-load ensure is best-effort and must not escape into the host page.
    return false
  }
}

function writeOutcome(field: string, value: 'lightbox_accepted' | 'lightbox_declined'): void {
  if (!isSafeReferenceFieldName(field)) return
  if (writeToForm(field, value, 'write')) savePending({ field, value })
}

function replayPending(field: string): void {
  const pending = readPending()
  if (!pending || pending.field !== field) return
  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        try {
          replayPending(field)
        } catch {
          // Deferred carry-over replay must not escape into the host page.
        }
      },
      { once: true },
    )
    return
  }
  if (writeToForm(field, pending.value, 'replay')) clearPending()
}

function writeToForm(field: string, value: 'lightbox_accepted' | 'lightbox_declined', action: 'write' | 'replay'): boolean {
  try {
    if (!isSafeReferenceFieldName(field)) return false
    const form = findENForm()
    if (!form) return false

    const input = findOrCreateInput(form, field)
    if (!input) return false
    input.value = value
    document.dispatchEvent(
      new CustomEvent('enlb:field-write', {
        detail: { action, field, value },
        bubbles: true,
      }),
    )
    return true
  } catch {
    return false
  }
}

function findOrCreateInput(form: HTMLFormElement, field: string): HTMLInputElement | null {
  const existing = Array.from(form.querySelectorAll<HTMLInputElement>('input')).find(
    (input) => input.name === field,
  )
  if (existing) return existing

  const input = document.createElement('input')
  input.type = 'hidden'
  input.name = field
  input.value = ''
  form.appendChild(input)
  return input
}

function savePending(outcome: StoredOutcome): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(outcome))
  } catch {
    // Session storage is optional; same-page writing continues without it.
  }
}

function readPending(): StoredOutcome | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isStoredOutcome(parsed)) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function clearPending(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage is optional; a failed clear must not affect the host page.
  }
}

function isStoredOutcome(value: unknown): value is StoredOutcome {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const candidate = value as Record<string, unknown>
  return (
    isSafeReferenceFieldName(candidate.field) &&
    (candidate.value === ACCEPTED || candidate.value === DECLINED)
  )
}
