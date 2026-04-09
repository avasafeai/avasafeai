import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { applicationId?: string }
  const { applicationId } = body
  if (!applicationId) return NextResponse.json({ error: 'applicationId required' }, { status: 400 })

  const { data: app } = await supabase
    .from('applications')
    .select('id, tier, service_type')
    .eq('id', applicationId)
    .eq('user_id', user.id)
    .single()

  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  if (app.tier === 'human_assisted') {
    return NextResponse.json({ error: 'Already on Expert Session' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://avasafe.ai'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price: process.env.STRIPE_EXPERT_UPGRADE_PRICE_ID!,
      quantity: 1,
    }],
    metadata: {
      user_id: user.id,
      application_id: applicationId,
      upgrade_type: 'guided_to_expert',
    },
    success_url: `${appUrl}/apply/human?applicationId=${applicationId}&upgraded=true`,
    cancel_url: `${appUrl}/apply/review?applicationId=${applicationId}`,
  })

  return NextResponse.json({ url: session.url })
}
