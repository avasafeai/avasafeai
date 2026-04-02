import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ExtractedPassportData, Json } from '@/types/supabase'
import { z } from 'zod'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE = 10 * 1024 * 1024

const docTypeSchema = z.enum([
  'us_passport', 'indian_passport', 'oci_card',
  'renunciation', 'pan_card', 'address_proof', 'photo', 'signature',
])

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Your session has expired. Please sign in again.' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const docType = formData.get('doc_type') as string | null

  if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Please upload a JPG, PNG or PDF file.' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'This file is too large. Please use a file under 10MB.' }, { status: 400 })
  }

  const parsedDocType = docTypeSchema.safeParse(docType)
  if (!parsedDocType.success) {
    return NextResponse.json({ error: 'Invalid document type.' }, { status: 400 })
  }

  // Read file bytes for Claude and storage upload
  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')

  // Upload raw file to Supabase Storage using service role client (bypasses RLS on upload)
  const serviceClient = createServiceClient()
  const storagePath = `${user.id}/documents/${Date.now()}_${file.name}`
  const { error: uploadError } = await serviceClient.storage
    .from('documents')
    .upload(storagePath, Buffer.from(bytes), { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error('[extract-document] Storage upload error:', uploadError)
    return NextResponse.json({ error: 'Upload failed. Please check your connection and try again.' }, { status: 500 })
  }

  const isPdf = file.type === 'application/pdf'

  type ContentBlock =
    | { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } }
    | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg' | 'image/png' | 'image/webp'; data: string } }

  const docBlock: ContentBlock = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
    : { type: 'image', source: { type: 'base64', media_type: file.type as 'image/jpeg' | 'image/png' | 'image/webp', data: base64 } }

  // Call Claude to extract fields
  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: 'You are a document extraction specialist. Extract all visible fields from this identity document with perfect accuracy. Return only valid JSON, no explanation, no markdown.',
      messages: [{
        role: 'user',
        content: [
          docBlock,
          { type: 'text', text: `Extract all fields from this document:
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
  } catch (err) {
    console.error('[extract-document] Claude API error:', err)
    await serviceClient.storage.from('documents').remove([storagePath])
    return NextResponse.json({ error: "We couldn't read this document. Please try a clearer photo with good lighting." }, { status: 500 })
  }

  const content = message.content[0]
  if (content.type !== 'text') {
    console.error('[extract-document] Unexpected Claude response type:', content.type)
    return NextResponse.json({ error: "We couldn't read this document. Please try a clearer photo with good lighting." }, { status: 500 })
  }

  let extracted: ExtractedPassportData
  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    extracted = JSON.parse(jsonMatch[0]) as ExtractedPassportData
  } catch (err) {
    console.error('[extract-document] JSON parse error:', err, 'Raw response:', content.text)
    // Clean up uploaded file since extraction failed
    await serviceClient.storage.from('documents').remove([storagePath])
    return NextResponse.json({ error: "We couldn't read this document. Please try a clearer photo with good lighting." }, { status: 500 })
  }

  // Derive expiry date for document record
  const expiresAt = extracted.expiry_date
    ? new Date(extracted.expiry_date).toISOString()
    : null

  // Insert extracted data into documents table
  const { data: inserted, error: insertError } = await supabase.from('documents').insert({
    user_id: user.id,
    doc_type: parsedDocType.data,
    storage_path: storagePath,
    extracted_data: extracted as unknown as Json,
    expires_at: expiresAt,
  }).select('id').single()

  if (insertError || !inserted) {
    console.error('[extract-document] DB insert error:', insertError)
    // Clean up uploaded file since DB insert failed
    await serviceClient.storage.from('documents').remove([storagePath])
    return NextResponse.json({ error: 'Upload failed. Please check your connection and try again.' }, { status: 500 })
  }

  // Delete raw file from storage — only structured data is retained (per privacy policy)
  const { error: deleteError } = await serviceClient.storage.from('documents').remove([storagePath])
  if (deleteError) {
    console.error('[extract-document] Storage delete error (non-fatal):', deleteError)
  }

  return NextResponse.json({ data: extracted, document_id: inserted.id })
}
