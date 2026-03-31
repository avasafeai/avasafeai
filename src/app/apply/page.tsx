import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ApplyPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  // Check for existing draft application
  const { data: app } = await supabase
    .from('applications')
    .select('id, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (app) {
    if (app.status === 'draft') redirect('/apply/upload')
    if (app.status === 'ready') redirect('/apply/review')
    if (app.status === 'paid' || app.status === 'submitted' || app.status === 'approved') {
      redirect('/apply/status')
    }
  }

  // Create new draft application
  const { data: newApp, error } = await supabase
    .from('applications')
    .insert({ user_id: user.id })
    .select('id')
    .single()

  if (error || !newApp) {
    throw new Error('Failed to create application')
  }

  redirect('/apply/upload')
}
