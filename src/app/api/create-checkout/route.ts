import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

const SUBSCRIPTION_PRICE_IDS: Record<string, string | undefined> = {
  locker: process.env.STRIPE_LOCKER_PRICE_ID,
}

const PER_APP_PRICE_IDS: Record<string, string | undefined> = {
  guided:         process.env.STRIPE_GUIDED_PRICE_ID,
  human_assisted: process.env.STRIPE_HUMAN_PRICE_ID,
}

const PER_APP_FALLBACK_AMOUNTS: Record<string, number> = {
  guided:         2900,
  human_assisted: 7900,
}

const SERVICE_LABELS: Record<string, string> = {
  oci_new:          'OCI Card — New Application',
  oci_renewal:      'OCI Card — Renewal',
  passport_renewal: 'Indian Passport Renewal',
}

const bodySchema = z.object({
  plan: z.enum(['locker']).optional(),
  service_type: z.string().optional(),
  tier: z.enum(['guided', 'human_assisted']).optional(),
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

  const { plan, service_type, tier: bodyTier } = parsed.data
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // ── Locker subscription ──────────────────────────────────────────────────────
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

  // ── Per-application checkout ─────────────────────────────────────────────────
  // Application record is created by the webhook AFTER payment succeeds.
  // No draft records are created here.
  if (!service_type) {
    return NextResponse.json({ error: 'Provide plan or service_type' }, { status: 400 })
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const resolvedTier: 'guided' | 'human_assisted' =
    bodyTier ??
    (profileData?.plan === 'human_assisted' ? 'human_assisted' : 'guided')

  const tierLabel = resolvedTier === 'human_assisted' ? 'Human Assisted' : 'Guided'
  const priceId = PER_APP_PRICE_IDS[resolvedTier]
  const svcLabel = SERVICE_LABELS[service_type] ?? 'Application preparation'

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: priceId
      ? [{ price: priceId, quantity: 1 }]
      : [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${svcLabel} — ${tierLabel} (Avasafe AI)`,
              description: resolvedTier === 'human_assisted'
                ? '45-min expert Zoom session, AVA pre-fill, validation, full PDF mailing package, rejection guarantee.'
                : 'AI-validated application: both portals completed, full PDF mailing package, rejection guarantee.',
            },
            unit_amount: PER_APP_FALLBACK_AMOUNTS[resolvedTier],
          },
          quantity: 1,
        }],
    mode: 'payment',
    // {CHECKOUT_SESSION_ID} is replaced by Stripe with the actual session ID
    success_url: `${appUrl}/apply/prepare/${service_type}?session_id={CHECKOUT_SESSION_ID}&new=true`,
    cancel_url: `${appUrl}/apply`,
    metadata: { user_id: user.id, service_type, tier: resolvedTier },
    customer_email: user.email,
  })

  return NextResponse.json({ data: { url: session.url } })
}
