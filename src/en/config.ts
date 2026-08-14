import type { ENIntegrationConfig } from '../config'

declare module '../config' {
  interface ENIntegrationConfig {
    referenceField?: string
  }
}

export interface NormalizedENIntegrationConfig {
  referenceField?: string
}

const SAFE_FIELD_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/
const MAX_FIELD_NAME_LENGTH = 128
const FORM_CLOBBERING_NAMES = new Set([
  'action',
  'submit',
])

export function isSafeReferenceFieldName(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_FIELD_NAME_LENGTH) return false
  if (!SAFE_FIELD_NAME.test(value)) return false
  return !FORM_CLOBBERING_NAMES.has(value.toLowerCase())
}

export function normalizeENConfig(config: unknown): NormalizedENIntegrationConfig {
  try {
    if (!config || typeof config !== 'object' || Array.isArray(config)) return {}
    const record = config as Record<string, unknown>
    const candidate = record.en
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return {}
    const referenceField = (candidate as ENIntegrationConfig).referenceField
    return isSafeReferenceFieldName(referenceField) ? { referenceField } : {}
  } catch {
    return {}
  }
}
