import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getDocumentFile } from '@/lib/storage-helpers'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const documentId = params.id
  const isDownload = req.nextUrl.searchParams.get('download') === 'true'

  // Authenticate the requesting user
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  console.log('[document-preview] Download requested:', { documentId, userId: user.id, isDownload })

  try {
    // Fetch document metadata — scoped to owner so users cannot access each other's files
    const serviceClient = createServiceClient()
    const { data: document, error: dbError } = await serviceClient
      .from('documents')
      .select('storage_path, file_type, original_filename, user_id')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (dbError) {
      console.error('[document-preview] DB error:', dbError.message)
      return NextResponse.json({ error: 'Could not fetch document.' }, { status: 500 })
    }

    console.log('[document-preview] Document found:', {
      hasStoragePath: !!document?.storage_path,
      fileType: document?.file_type,
      filename: document?.original_filename,
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
    }

    if (!document.storage_path) {
      console.warn('[document-preview] No storage path — file was not uploaded to storage for document:', documentId)
      return NextResponse.json({ error: 'No file uploaded for this document.' }, { status: 404 })
    }

    // Download and decrypt — storage-helpers.ts handles both steps
    const fileBuffer = await getDocumentFile(document.storage_path)

    if (!fileBuffer) {
      console.error('[document-preview] getDocumentFile returned null for path:', document.storage_path)
      return NextResponse.json({ error: 'File could not be decrypted or is unavailable.' }, { status: 404 })
    }

    const mimeType = document.file_type ?? 'application/octet-stream'
    const filename = document.original_filename ?? `document-${documentId}`
    const disposition = isDownload
      ? `attachment; filename="${filename}"`
      : 'inline'

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'private, no-store',   // never cache decrypted files
        'Content-Disposition': disposition,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[document-preview] Unhandled error:', message, err)
    return NextResponse.json({ error: 'Download failed.', detail: message }, { status: 500 })
  }
}
