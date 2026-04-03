import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const bodySchema = z.object({
  document_id: z.string().uuid(),
})

export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { document_id } = parsed.data

  // Fetch document — verify it belongs to the requesting user
  const serviceClient = createServiceClient()
  const { data: document } = await serviceClient
    .from('documents')
    .select('id, user_id, storage_path')
    .eq('id', document_id)
    .eq('user_id', user.id)   // ownership check — users can only delete their own
    .maybeSingle()

  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  // Delete from storage if a file exists
  if (document.storage_path) {
    const { error: storageError } = await serviceClient.storage
      .from('documents')
      .remove([document.storage_path])

    if (storageError) {
      console.error('[delete-document] Storage delete failed (continuing with DB delete):', storageError.message)
    }
  }

  // Delete from database
  const { error: dbError } = await serviceClient
    .from('documents')
    .delete()
    .eq('id', document_id)
    .eq('user_id', user.id)

  if (dbError) {
    console.error('[delete-document] DB delete error:', dbError)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }

  return NextResponse.json({ data: { deleted: true } })
}
