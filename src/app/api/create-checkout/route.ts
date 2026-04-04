import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

// Locker is the only subscription. Guided/Human Assisted are per-application.
const SUBSCRIPTION_PRICE_IDS: Record<string, string | undefined> = {
  locker: process.env.STRIPE_LOCKER_PRICE_ID,  // $19/year recurring
}

const PER_APP_PRICE_IDS: Record<string, string | undefined> = {
  guided:         process.env.STRIPE_GUIDED_PRICE_ID,  // $29 one-time
  human_assisted: process.env.STRIPE_HUMAN_PRICE_ID,   // $79 one-time
}

const PER_APP_FALLBACK_AMOUNTS: Record<string, number> = {
  guided:         2900,
  human_assisted: 7900,
}

const bodySchema = z.object({
  plan: z.enum(['locker']).optional(),
  application_id: z.string().uuid().optional(),
  service_type: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { plan, application_id, service_type } = parsed.data
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // ── Locker subscription ──────────────────────────────────────────────────
  if (plan === 'locker') {
    const priceId = SUBSCRIPTION_PRICE_IDS.locker
    if (!priceId) {
      return NextResponse.json({ error: 'STRIPE_LOCKER_PRICE_ID is not configured' }, { status: 500 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${appUrl}/dashboard?upgraded=1`,
      cancel_url: `${appUrl}/#pricing`,
      metadata: { user_id: user.id, plan: 'locker' },
      customer_email: user.email,
    })

    return NextResponse.json({ data: { url: session.url } })
  }

  // ── Per-application checkout (Guided $29 or Human Assisted $79) ──────────
  if (!application_id) {
    return NextResponse.json({ error: 'Provide either plan or application_id' }, { status: 400 })
  }

  const [appResult, profileResult] = await Promise.all([
    supabase
      .from('applications')
      .select('id, status, service_type')
      .eq('id', application_id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single(),
  ])

  if (!appResult.data) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  const userPlan = profileResult.data?.plan ?? 'guided'
  const tier: 'guided' | 'human_assisted' = userPlan === 'human_assisted' ? 'human_assisted' : 'guided'
  const tierLabel = tier === 'human_assisted' ? 'Human Assisted' : 'Guided'
  const priceId = PER_APP_PRICE_IDS[tier]

  const SERVICE_LABELS: Record<string, string> = {
    oci_new:          'OCI Card — New Application',
    oci_renewal:      'OCI Card — Renewal',
    passport_renewal: 'Indian Passport Renewal',
  }
  const svcLabel = SERVICE_LABELS[service_type ?? appResult.data.service_type] ?? 'Application preparation'

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: priceId
      ? [{ price: priceId, quantity: 1 }]
      : [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${svcLabel} — ${tierLabel} (Avasafe AI)`,
              description: tier === 'human_assisted'
                ? '45-min expert Zoom session, AVA pre-fill, validation, full PDF mailing package, rejection guarantee.'
                : 'AI-validated application: both portals completed, full PDF mailing package, rejection guarantee.',
            },
            unit_amount: PER_APP_FALLBACK_AMOUNTS[tier],
          },
          quantity: 1,
        }],
    mode: 'payment',
    success_url: `${appUrl}/apply/complete?applicationId=${application_id}`,
    cancel_url: `${appUrl}/apply/review?applicationId=${application_id}`,
    metadata: { application_id, user_id: user.id, tier },
    customer_email: user.email,
  })

  return NextResponse.json({ data: { url: session.url } })
}
