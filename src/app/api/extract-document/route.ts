import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { ExtractedPassportData, Json } from '@/types/supabase'
import { z } from 'zod'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_SIZE = 10 * 1024 * 1024

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const docType = formData.get('doc_type') as string | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Upload PDF, JPG, or PNG.' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 })
  }

  const docTypeSchema = z.enum(['passport', 'renunciation', 'address_proof', 'photo', 'signature'])
  const parsedDocType = docTypeSchema.safeParse(docType)
  if (!parsedDocType.success) {
    return NextResponse.json({ error: 'Invalid doc_type' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')

  const mediaType = file.type === 'application/pdf' ? 'image/jpeg' : (file.type as 'image/jpeg' | 'image/png')

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system:
      'You are a document extraction specialist. Extract all fields from this passport image and return them as a JSON object. Be precise — extract exactly what is printed on the document.',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64,
            },
          },
          {
            type: 'text',
            text: `Extract all fields from this passport image and return JSON with these fields:
{
  "first_name": "",
  "last_name": "",
  "full_name": "",
  "passport_number": "",
  "nationality": "",
  "date_of_birth": "",
  "place_of_birth": "",
  "issue_date": "",
  "expiry_date": "",
  "issuing_country": "",
  "gender": ""
}
Return JSON only. No explanation.`,
          },
        ],
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response from AI' }, { status: 500 })
  }

  let extracted: ExtractedPassportData
  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    extracted = JSON.parse(jsonMatch[0]) as ExtractedPassportData
  } catch {
    return NextResponse.json({ error: 'Failed to parse extracted data' }, { status: 500 })
  }

  // Store document record (storage upload can be added later)
  const { data: app } = await supabase
    .from('applications')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (app) {
    await supabase.from('documents').insert({
      application_id: app.id,
      user_id: user.id,
      doc_type: parsedDocType.data,
      storage_path: `${user.id}/documents/${parsedDocType.data}_${Date.now()}`,
      extracted_data: extracted as unknown as Json,
    })
  }

  return NextResponse.json({ data: extracted })
}
