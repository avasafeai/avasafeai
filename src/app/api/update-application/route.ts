import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const bodySchema = z.object({
  application_id: z.string().uuid(),
  registration_number: z.string().optional(),
  vfs_submitted: z.boolean().optional(),
  tracking_number: z.string().optional(),
  package_downloaded_at: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: unknown = await req.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { application_id, registration_number, vfs_submitted, tracking_number, package_downloaded_at } = parsed.data

  // Verify ownership
  const { data: app } = await supabase
    .from('applications')
    .select('id')
    .eq('id', application_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (registration_number !== undefined) updates.registration_number = registration_number
  if (vfs_submitted === true) updates.vfs_submitted_at = new Date().toISOString()
  if (tracking_number !== undefined) updates.tracking_number = tracking_number
  if (package_downloaded_at !== undefined) updates.package_downloaded_at = package_downloaded_at

  const { error } = await supabase
    .from('applications')
    .update(updates)
    .eq('id', application_id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

  return NextResponse.json({ data: { ok: true } })
}
