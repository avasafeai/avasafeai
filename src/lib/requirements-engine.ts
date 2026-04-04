// ── Requirements Engine — live requirements from Claude web search ─────────────
// Fetches current requirements for any service, caches for 24 hours.
// Change detection flags when requirements differ from last cached version.

import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ServiceConfig } from './services/registry'

export interface RequirementItem {
  category: string
  item: string
  notes: string | null
  mandatory: boolean
}

export interface RequirementsResult {
  service_id: string
  fetched_at: string
  requirements: RequirementItem[]
  fees: { label: string; amount_usd: number }[]
  processing_time: string
  source_urls: string[]
  changed_from_previous: boolean
  changes_summary: string | null
}

const CACHE_TTL_HOURS = 24

// ── fetchRequirements ──────────────────────────────────────────────────────────

export async function fetchRequirements(
  service: ServiceConfig,
  supabase: SupabaseClient,
): Promise<RequirementsResult> {
  // 1. Check cache
  const { data: cached } = await supabase
    .from('requirements_cache')
    .select('*')
    .eq('service_id', service.id)
    .order('fetched_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (cached) {
    const ageHours = (Date.now() - new Date(cached.fetched_at as string).getTime()) / 3_600_000
    if (ageHours < CACHE_TTL_HOURS) {
      return cached.result as RequirementsResult
    }
  }

  // 2. Fetch fresh from Claude with web search
  const client = new Anthropic()

  const systemPrompt = `You are a specialist in Indian government documentation requirements for NRIs.
Your job is to return ONLY valid JSON — no markdown, no explanation, no prose.
The JSON must be exactly the schema provided. Use web search to get the most current requirements.`

  const userPrompt = `Search the web for current requirements for: ${service.requirements_search_query}

Return ONLY this JSON structure (no markdown, no explanation):
{
  "requirements": [
    { "category": "Documents", "item": "US passport (bio data page)", "notes": "Clear colour copy", "mandatory": true }
  ],
  "fees": [
    { "label": "Government fee", "amount_usd": 275 }
  ],
  "processing_time": "8-10 weeks",
  "source_urls": ["https://..."]
}`

  let parsed: {
    requirements: RequirementItem[]
    fees: { label: string; amount_usd: number }[]
    processing_time: string
    source_urls: string[]
  } | null = null

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ type: 'web_search_20250305', name: 'web_search' }] as unknown as any[],
      messages: [{ role: 'user', content: userPrompt }],
    })

    // Extract text content from the response
    for (const block of response.content) {
      if (block.type === 'text') {
        const text = block.text.trim()
        // Strip any markdown code fences if present
        const jsonText = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '')
        try {
          parsed = JSON.parse(jsonText)
          break
        } catch {
          // Try to extract JSON from within the text
          const match = jsonText.match(/\{[\s\S]*\}/)
          if (match) {
            try {
              parsed = JSON.parse(match[0])
              break
            } catch { /* continue */ }
          }
        }
      }
    }
  } catch {
    // If Claude API fails, use the static config as fallback
  }

  // Fallback: build from static config
  if (!parsed) {
    parsed = {
      requirements: [
        ...service.required_documents.map(d => ({
          category: 'Required Documents',
          item: d.name,
          notes: d.notes,
          mandatory: true,
        })),
        ...service.optional_documents.map(d => ({
          category: 'Optional Documents',
          item: d.name,
          notes: d.notes,
          mandatory: false,
        })),
      ],
      fees: [
        { label: 'Government fee', amount_usd: service.fees.government_usd },
        { label: 'VFS service fee', amount_usd: service.fees.vfs_usd },
        { label: 'ICWF fee', amount_usd: service.fees.icwf_usd },
        { label: 'Avasafe fee', amount_usd: service.fees.avasafe_usd },
      ],
      processing_time: service.processing_weeks,
      source_urls: [service.portal_url],
    }
  }

  // 3. Detect changes vs previous cache
  let changed_from_previous = false
  let changes_summary: string | null = null

  if (cached) {
    const prev = (cached.result as RequirementsResult).requirements
    const curr = parsed.requirements
    const prevItems = new Set(prev.map((r: RequirementItem) => r.item))
    const currItems = new Set(curr.map(r => r.item))
    const added = curr.filter(r => !prevItems.has(r.item)).map(r => r.item)
    const removed = prev.filter((r: RequirementItem) => !currItems.has(r.item)).map((r: RequirementItem) => r.item)

    if (added.length > 0 || removed.length > 0) {
      changed_from_previous = true
      const parts: string[] = []
      if (added.length) parts.push(`Added: ${added.join(', ')}`)
      if (removed.length) parts.push(`Removed: ${removed.join(', ')}`)
      changes_summary = parts.join('. ')
    }
  }

  const result: RequirementsResult = {
    service_id: service.id,
    fetched_at: new Date().toISOString(),
    requirements: parsed.requirements,
    fees: parsed.fees,
    processing_time: parsed.processing_time,
    source_urls: parsed.source_urls,
    changed_from_previous,
    changes_summary,
  }

  // 4. Write to cache
  await supabase.from('requirements_cache').insert({
    service_id: service.id,
    fetched_at: result.fetched_at,
    result,
  })

  return result
}
