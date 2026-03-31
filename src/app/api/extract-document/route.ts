import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { ExtractedPassportData, Json } from '@/types/supabase'
import { z } from 'zod'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_SIZE = 10 * 1024 * 1024

const docTypeSchema = z.enum([
  'us_passport', 'indian_passport', 'oci_card',
  'renunciation', 'pan_card', 'address_proof', 'photo', 'signature',
])

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const docType = formData.get('doc_type') as string | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Upload a PDF, JPG, or PNG.' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 })
  }

  const parsedDocType = docTypeSchema.safeParse(docType)
  if (!parsedDocType.success) {
    return NextResponse.json({ error: 'Invalid doc_type' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mediaType = file.type === 'application/pdf'
    ? 'image/jpeg'
    : (file.type as 'image/jpeg' | 'image/png')

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: 'You are a document extraction specialist. Extract all visible fields from this identity document image with perfect accuracy. Return only valid JSON, no explanation, no markdown.',
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
        { type: 'text', text: `Extract all fields from this document image:
{
  "document_type": "us_passport | indian_passport | oci_card | other",
  "first_name": "",
  "last_name": "",
  "full_name": "",
  "date_of_birth": "YYYY-MM-DD",
  "place_of_birth": "",
  "passport_number": "",
  "nationality": "",
  "issue_date": "YYYY-MM-DD",
  "expiry_date": "YYYY-MM-DD",
  "issuing_country": "",
  "gender": "M | F",
  "confidence_notes": "note any fields that were unclear or partially visible"
}` },
      ],
    }],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected AI response' }, { status: 500 })
  }

  let extracted: ExtractedPassportData
  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    extracted = JSON.parse(jsonMatch[0]) as ExtractedPassportData
  } catch {
    return NextResponse.json({ error: 'Could not read document. Try a clearer image.' }, { status: 500 })
  }

  // Derive expiry date for document record
  const expiresAt = extracted.expiry_date
    ? new Date(extracted.expiry_date).toISOString()
    : null

  // Store document in locker (storage upload placeholder — delete raw after extraction in production)
  await supabase.from('documents').insert({
    user_id: user.id,
    doc_type: parsedDocType.data,
    storage_path: null, // raw image not retained after extraction
    extracted_data: extracted as unknown as Json,
    expires_at: expiresAt,
  })

  return NextResponse.json({ data: extracted })
}
