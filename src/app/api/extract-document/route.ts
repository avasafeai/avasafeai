import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ExtractedPassportData, Json } from '@/types/supabase'
import { encryptFile } from '@/lib/document-encryption'
import { encryptSensitiveFields } from '@/lib/field-encryption'
import { z } from 'zod'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE = 10 * 1024 * 1024

const docTypeSchema = z.enum([
  'us_passport', 'indian_passport', 'oci_card',
  'renunciation', 'pan_card', 'address_proof', 'photo', 'signature',
  'marriage_certificate', 'birth_certificate', 'indian_visa',
  'father_passport', 'mother_passport', 'child_passport',
  'surrender_certificate', 'other',
])

export async function POST(req: NextRequest) {
  console.log('=== extract-document hit ===')
  console.log('method:', req.method)
  console.log('url:', req.url)
  console.log('content-type:', req.headers.get('content-type'))

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.log('extract-document: unauthenticated')
    return NextResponse.json({ error: 'Your session has expired. Please sign in again.' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const docType = formData.get('doc_type') as string | null

  console.log('extract-document: file=', file?.name, 'type=', file?.type, 'size=', file?.size, 'docType=', docType)

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

  // Read file bytes once for both Claude and storage
  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const fileBuffer = Buffer.from(bytes)

  const isPdf = file.type === 'application/pdf'

  type ContentBlock =
    | { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } }
    | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg' | 'image/png' | 'image/webp'; data: string } }

  const docBlock: ContentBlock = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
    : { type: 'image', source: { type: 'base64', media_type: file.type as 'image/jpeg' | 'image/png' | 'image/webp', data: base64 } }

  // Step 1 — Call Claude to extract fields
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
    return NextResponse.json({ error: "We couldn't read this document. Please try a clearer photo with good lighting." }, { status: 500 })
  }

  // Step 2 — Encrypt sensitive fields before saving to database
  const expiresAt = extracted.expiry_date
    ? new Date(extracted.expiry_date).toISOString()
    : null

  let extractedForStorage: Record<string, string>
  try {
    extractedForStorage = await encryptSensitiveFields(extracted as unknown as Record<string, string>)
  } catch (encErr) {
    console.error('[extract-document] Field encryption error (non-fatal, storing plaintext):', encErr)
    extractedForStorage = extracted as unknown as Record<string, string>
  }

  const { data: inserted, error: insertError } = await supabase.from('documents').insert({
    user_id: user.id,
    doc_type: parsedDocType.data,
    extracted_data: extractedForStorage as unknown as Json,
    expires_at: expiresAt,
  }).select('id').single()

  if (insertError || !inserted) {
    console.error('[extract-document] DB insert error:', insertError)
    return NextResponse.json({ error: 'Upload failed. Please check your connection and try again.' }, { status: 500 })
  }

  // Step 3 — Non-blocking storage upload. If this fails, extraction still succeeds.
  const serviceClient = createServiceClient()
  const fileExt = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg'
  const storagePath = `${user.id}/documents/${inserted.id}.${fileExt}`

  try {
    // Encrypt with AES-256-GCM + GCP KMS envelope encryption before storing
    const encryptedBuffer = await encryptFile(fileBuffer)

    const { error: storageError } = await serviceClient.storage
      .from('documents')
      .upload(storagePath, encryptedBuffer, {
        contentType: 'application/octet-stream',  // encrypted blob — not the original MIME type
        upsert: false,
      })

    if (storageError) {
      console.error('[extract-document] Storage upload failed (non-fatal):', storageError.message)
    } else {
      // Update document record with storage metadata
      await serviceClient.from('documents').update({
        storage_path: storagePath,
        file_type: file.type,          // original MIME type — needed for decrypted preview
        file_size_bytes: file.size,
        original_filename: file.name,
      }).eq('id', inserted.id)
      console.log('[extract-document] Encrypted file stored at:', storagePath)
    }
  } catch (storageErr) {
    // Never let storage/encryption errors break the extraction response
    console.error('[extract-document] Storage/encryption error (non-fatal):', storageErr)
  }

  return NextResponse.json({ data: extracted, document_id: inserted.id })
}
