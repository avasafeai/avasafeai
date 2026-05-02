import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_BETA_MODE !== 'true') {
    return NextResponse.json({ error: 'Beta mode is not enabled' }, { status: 403 })
  }

  const { serviceType, tier } = await req.json()
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (tier === 'human_assisted') {
    const slotLimit = parseInt(process.env.NEXT_PUBLIC_BETA_EXPERT_SLOTS || '20', 10)
    // Use service client so the count is platform-wide (not RLS-scoped to current user)
    const serviceClient = createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (serviceClient as any)
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('tier', 'human_assisted')
      .eq('is_beta', true)

    if ((count ?? 0) >= slotLimit) {
      return NextResponse.json({ error: 'Expert Session slots are full for beta' }, { status: 409 })
    }
  }

  // Return existing application if user already started this service+tier in beta
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('applications')
    .select('id')
    .eq('user_id', user.id)
    .eq('service_type', serviceType)
    .eq('tier', tier)
    .eq('is_beta', true)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ applicationId: existing.id })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: application, error } = await (supabase as any)
    .from('applications')
    .insert({
      user_id: user.id,
      service_type: serviceType,
      tier,
      status: 'in_progress',
      current_step: 0,
      stripe_payment_id: `beta_${user.id}_${serviceType}_${tier}`,
      amount_paid: 0,
      is_beta: true,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ applicationId: application.id })
}
