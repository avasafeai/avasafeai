import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getDocumentFile } from '@/lib/storage-helpers'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authenticate the requesting user
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const isDownload = req.nextUrl.searchParams.get('download') === 'true'

  // Fetch document — scoped to owner so users cannot preview each other's files
  const serviceClient = createServiceClient()
  const { data: document } = await serviceClient
    .from('documents')
    .select('storage_path, file_type, original_filename, user_id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!document?.storage_path) {
    return new NextResponse('Not found', { status: 404 })
  }

  // Download and decrypt — storage-helpers.ts handles both steps
  const fileBuffer = await getDocumentFile(document.storage_path)
  if (!fileBuffer) {
    return new NextResponse('File unavailable', { status: 404 })
  }

  const mimeType = document.file_type ?? 'application/octet-stream'
  const filename = document.original_filename ?? `document-${params.id}`
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
}
