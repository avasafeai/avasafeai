import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { Json, ValidationResult } from '@/types/supabase'
import { z } from 'zod'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const bodySchema = z.object({
  form_data: z.record(z.string(), z.unknown()),
  application_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: unknown = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { form_data, application_id } = parsed.data

  // Verify application belongs to user
  const { data: app } = await supabase
    .from('applications')
    .select('id')
    .eq('id', application_id)
    .eq('user_id', user.id)
    .single()

  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: 'You are an expert OCI card and Indian passport renewal reviewer with deep knowledge of VFS Global requirements and common rejection causes. Find errors before submission. Be specific and explain everything in plain English a non-expert can understand. Return only valid JSON, no markdown.',
    messages: [{
      role: 'user',
      content: `Review this application carefully and return:
{
  "blockers": [{"field": "", "issue": "", "fix": ""}],
  "warnings": [{"field": "", "issue": "", "fix": ""}],
  "passed_checks": [""]
}

Blocker = will likely cause rejection. Warning = should fix but can proceed.

Check for: name mismatches across documents, photo specification violations, wrong jurisdiction, passport validity under 6 months, missing required documents, address proof older than 3 months, apostille requirements, name change affidavits.

Application: ${JSON.stringify(form_data)}

Return JSON only.`,
    }],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected AI response' }, { status: 500 })
  }

  let validation: ValidationResult
  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')
    validation = JSON.parse(jsonMatch[0]) as ValidationResult
  } catch {
    return NextResponse.json({ error: 'Failed to parse validation result' }, { status: 500 })
  }

  const hasBlockers = validation.blockers.length > 0
  await supabase.from('applications').update({
    form_data: form_data as unknown as Json,
    validation_errors: validation as unknown as Json,
    status: hasBlockers ? 'form_complete' : 'validated',
  }).eq('id', application_id)

  return NextResponse.json({ data: validation })
}

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const appId = url.searchParams.get('application_id')
  if (!appId) return NextResponse.json({ error: 'Missing application_id' }, { status: 400 })

  const { data: app } = await supabase
    .from('applications')
    .select('validation_errors')
    .eq('id', appId)
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ data: app?.validation_errors ?? { blockers: [], warnings: [], passed_checks: [] } })
}
