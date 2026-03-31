import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { Json, ValidationResult } from '@/types/supabase'
import { z } from 'zod'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const bodySchema = z.object({
  form_data: z.record(z.string(), z.unknown()),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: unknown = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { form_data } = parsed.data

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system:
      'You are an expert OCI card application reviewer. Identify errors that would cause rejection. Be specific and actionable. Explain in plain English. Return JSON only.',
    messages: [
      {
        role: 'user',
        content: `Review this OCI application and return:
{ "errors": [{"field": "", "message": "", "severity": "blocker|warning"}], "warnings": [{"field": "", "message": ""}] }

Severity: "blocker" means prevents submission, "warning" means should fix but can proceed.

Application data: ${JSON.stringify(form_data)}

Return JSON only.`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected AI response' }, { status: 500 })
  }

  let validation: ValidationResult
  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    validation = JSON.parse(jsonMatch[0]) as ValidationResult
  } catch {
    return NextResponse.json({ error: 'Failed to parse validation result' }, { status: 500 })
  }

  // Persist validation errors to application
  const { data: app } = await supabase
    .from('applications')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (app) {
    const hasBlockers = validation.errors.some((e) => e.severity === 'blocker')
    await supabase
      .from('applications')
      .update({
        form_data: form_data as unknown as Json,
        validation_errors: validation as unknown as Json,
        status: hasBlockers ? 'draft' : 'ready',
      })
      .eq('id', app.id)
  }

  return NextResponse.json({ data: validation })
}

export async function GET() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: app } = await supabase
    .from('applications')
    .select('validation_errors')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({ data: app?.validation_errors ?? { errors: [], warnings: [] } })
}
