// ── Prefill Engine — works for ANY service ────────────────────────────────────
// Pass in a service config + userId → get back pre-filled portal fields
// with coverage percentage and source attribution.

import type { ServiceConfig } from './services/registry'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface PrefillResult {
  prefilled: Record<string, string>
  sources: Record<string, string>   // field_id → doc_type that sourced it
  coverage: number                   // 0-100
  missing_sources: string[]          // doc_types not in locker
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

    // Return as-is if unrecognised
    return cleaned
  }

  if (transform.startsWith('hardcode:')) {
    return transform.slice('hardcode:'.length)
  }

  return value
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
  const docMap: Record<string, Record<string, string>> = {}
  for (const doc of docs) {
    if (doc.extracted_data && typeof doc.extracted_data === 'object') {
      docMap[doc.doc_type as string] = doc.extracted_data as Record<string, string>
    }
  }

  // 2. Walk the prefill_map and resolve each field
  const prefilled: Record<string, string> = {}
  const sources: Record<string, string> = {}
  let mappableCount = 0
  let resolvedCount = 0

  const missingSourceSet = new Set<string>()

  for (const mapping of service.prefill_map) {
    // Hardcode transforms need no source document
    if (mapping.transform?.startsWith('hardcode:')) {
      prefilled[mapping.field_id] = applyTransform(null, mapping.transform)
      sources[mapping.field_id] = 'hardcode'
      mappableCount++
      resolvedCount++
      continue
    }

    mappableCount++

    const sourceDoc = docMap[mapping.source_doc]
    if (!sourceDoc) {
      missingSourceSet.add(mapping.source_doc)
      continue
    }

    const rawValue = mapping.source_field ? sourceDoc[mapping.source_field] : null
    if (!rawValue) continue

    const transformed = applyTransform(rawValue, mapping.transform)
    if (transformed) {
      prefilled[mapping.field_id] = transformed
      sources[mapping.field_id] = mapping.source_doc
      resolvedCount++
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
