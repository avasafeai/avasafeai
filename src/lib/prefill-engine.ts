// ── Prefill Engine — SERVER-SIDE ONLY ────────────────────────────────────────
// This module imports field-encryption (KMS) and must only be used in
// API routes or server components — never imported by client components.
// Client components that need isMinor() should import from lib/date-utils.ts

import type { ServiceConfig } from './services/registry'
import type { SupabaseClient } from '@supabase/supabase-js'
import { decryptField } from './field-encryption'
import { isMinor } from './date-utils'

export { isMinor }  // re-export for backwards compat with any server-side callers

export interface PrefillResult {
  prefilled: Record<string, string>
  sources: Record<string, string>   // field_id → doc_type that sourced it
  coverage: number                   // 0-100
  missing_sources: string[]          // doc_types not in locker
}

// ── Utilities ─────────────────────────────────────────────────────────────────

export function getFieldValue(
  doc: Record<string, unknown>,
  ...fieldNames: string[]
): string | null {
  for (const name of fieldNames) {
    const val = doc[name]
    if (val && typeof val === 'string' && val.trim() && !val.startsWith('enc:')) return val.trim()
  }
  return null
}

// Resolve a field value — decrypt if encrypted, return '' on failure
async function resolveFieldValue(value: unknown): Promise<string> {
  if (!value) return ''
  const str = String(value)
  if (!str.startsWith('enc:')) return str.trim()
  try {
    return await decryptField(str)
  } catch (err) {
    console.error('[prefill] decryptField failed:', err)
    return ''
  }
}

// ── Transform functions ────────────────────────────────────────────────────────

function applyTransform(value: string | null, transform: string | null): string {
  if (!value) return ''
  if (!transform) return value

  if (transform === 'uppercase') {
    return value.toUpperCase()
  }

  if (transform === 'reformat_date') {
    // Accept any ISO, MM/DD/YYYY, DD/MM/YYYY, or DD-MON-YYYY formats
    // Output: DD/MM/YYYY (VFS / government portal standard)
    const cleaned = value.trim()

    // Already DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) return cleaned

    // ISO: YYYY-MM-DD
    const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (isoMatch) {
      return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`
    }

    // MM/DD/YYYY
    const usMatch = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (usMatch) {
      return `${usMatch[2]}/${usMatch[1]}/${usMatch[3]}`
    }

    // DD-Mon-YYYY (e.g. 15-JAN-1990)
    const monMap: Record<string, string> = {
      JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
      JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
    }
    const monMatch = cleaned.toUpperCase().match(/^(\d{2})-([A-Z]{3})-(\d{4})$/)
    if (monMatch && monMap[monMatch[2]]) {
      return `${monMatch[1]}/${monMap[monMatch[2]]}/${monMatch[3]}`
    }

    return cleaned
  }

  if (transform.startsWith('hardcode:')) {
    return transform.slice('hardcode:'.length)
  }

  return value
}

// ── Address field fallbacks ────────────────────────────────────────────────────

function getAddressFallbacks(fieldId: string): string[] {
  const fallbacks: Record<string, string[]> = {
    address_line1: ['address', 'street_address', 'street', 'full_address', 'address1'],
    city: ['town', 'locality', 'municipality'],
    state: ['state_code', 'province', 'region', 'state_province'],
    zip: ['zip_code', 'postal_code', 'postcode', 'post_code'],
  }
  return fallbacks[fieldId] ?? []
}

// ── buildPrefillMap ────────────────────────────────────────────────────────────

export async function buildPrefillMap(
  service: ServiceConfig,
  userId: string,
  supabase: SupabaseClient,
): Promise<PrefillResult> {
  // 1. Fetch all documents in the user's locker
  const { data: docs, error } = await supabase
    .from('documents')
    .select('doc_type, extracted_data')
    .eq('user_id', userId)

  if (error || !docs) {
    return { prefilled: {}, sources: {}, coverage: 0, missing_sources: [] }
  }

  // Index by doc_type for fast lookup (keep the latest upload per type)
  const docMap: Record<string, Record<string, unknown>> = {}
  for (const doc of docs) {
    if (doc.extracted_data && typeof doc.extracted_data === 'object') {
      docMap[doc.doc_type as string] = doc.extracted_data as Record<string, unknown>
    }
  }

  // 2. Detect minor application — decrypt DOB if encrypted
  const applicantDoc = docMap['us_passport'] ?? docMap['child_passport']
  const applicantDOBRaw = applicantDoc
    ? ((applicantDoc['date_of_birth'] ?? applicantDoc['dob']) as string | undefined)
    : undefined
  const applicantDOB = applicantDOBRaw ? await resolveFieldValue(applicantDOBRaw) : ''
  const applicationIsForMinor = applicantDOB ? isMinor(applicantDOB) : false

  // 3. Walk the prefill_map and resolve each field
  const prefilled: Record<string, string> = {}
  const sources: Record<string, string> = {}
  let mappableCount = 0
  let resolvedCount = 0

  const missingSourceSet = new Set<string>()

  for (const mapping of service.prefill_map) {
    // Hardcode transforms need no source document — process last to prevent overwrite
    if (mapping.transform?.startsWith('hardcode:')) {
      continue
    }

    mappableCount++

    const sourceDoc = docMap[mapping.source_doc]
    if (!sourceDoc) {
      missingSourceSet.add(mapping.source_doc)
      continue
    }

    // Try all candidate field names; decrypt each if needed
    let resolvedValue = ''
    const candidates = mapping.source_field
      ? [mapping.source_field, ...getAddressFallbacks(mapping.field_id)]
      : []

    for (const candidate of candidates) {
      const dbVal = (sourceDoc as Record<string, unknown>)[candidate]
      if (!dbVal) continue
      const v = await resolveFieldValue(dbVal)
      if (v) { resolvedValue = v; break }
    }

    if (!resolvedValue) continue

    const transformed = applyTransform(resolvedValue, mapping.transform)
    if (transformed) {
      prefilled[mapping.field_id] = transformed
      sources[mapping.field_id] = mapping.source_doc
      resolvedCount++
    }
  }

  // Second pass: apply hardcodes
  for (const mapping of service.prefill_map) {
    if (!mapping.transform?.startsWith('hardcode:')) continue
    mappableCount++
    prefilled[mapping.field_id] = applyTransform(null, mapping.transform)
    sources[mapping.field_id] = 'hardcode'
    resolvedCount++
  }

  // 4. Minor-specific overrides
  if (applicationIsForMinor) {
    const fatherDoc = docMap['father_passport'] ?? docMap['indian_passport']
    const motherDoc = docMap['mother_passport']

    if (fatherDoc) {
      const firstName = getFieldValue(fatherDoc as Record<string, unknown>, 'first_name', 'given_name') ?? ''
      const lastName = getFieldValue(fatherDoc as Record<string, unknown>, 'last_name', 'surname') ?? ''
      const fatherName = `${firstName} ${lastName}`.trim()
      if (fatherName) {
        prefilled['father_name'] = fatherName
        sources['father_name'] = docMap['father_passport'] ? 'father_passport' : 'indian_passport'
      }
    }

    if (motherDoc) {
      const firstName = getFieldValue(motherDoc as Record<string, unknown>, 'first_name', 'given_name') ?? ''
      const lastName = getFieldValue(motherDoc as Record<string, unknown>, 'last_name', 'surname') ?? ''
      const motherName = `${firstName} ${lastName}`.trim()
      if (motherName) {
        prefilled['mother_name'] = motherName
        sources['mother_name'] = 'mother_passport'
      }
    }
  }

  const coverage = mappableCount > 0
    ? Math.round((resolvedCount / mappableCount) * 100)
    : 0

  return {
    prefilled,
    sources,
    coverage,
    missing_sources: Array.from(missingSourceSet),
  }
}
