import type { ENIntegrationConfig } from '../config'

declare module '../config' {
  interface ENIntegrationConfig {
    referenceField?: string
  }
}

export interface NormalizedENIntegrationConfig {
  referenceField?: string
}

const SAFE_FIELD_NAME = /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)*$/
const MAX_FIELD_NAME_LENGTH = 128
const FORM_CLOBBERING_NAMES = new Set([
  'action',
  'submit',
])
const PROTOTYPE_POLLUTION_SEGMENT = /(?:^|\.)(?:__proto__|constructor|prototype)(?:\.|$)/i

export function isSafeReferenceFieldName(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_FIELD_NAME_LENGTH) return false
  if (!SAFE_FIELD_NAME.test(value)) return false
  if (FORM_CLOBBERING_NAMES.has(value.toLowerCase())) return false
  // Reject keys that can mutate a host object's prototype when field paths are mapped into objects.
  return !PROTOTYPE_POLLUTION_SEGMENT.test(value)
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
