import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: app } = await supabase
    .from('applications')
    .select('id, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!app || app.status !== 'paid') {
    return NextResponse.json({ error: 'Application not paid or not found' }, { status: 400 })
  }

  const vfsReference = `VFS-${Date.now().toString(36).toUpperCase()}`

  const serviceSupabase = createServiceClient()
  await serviceSupabase
    .from('applications')
    .update({ status: 'submitted', vfs_reference: vfsReference })
    .eq('id', app.id)

  return NextResponse.json({ data: { vfs_reference: vfsReference } })
}
