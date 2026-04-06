import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

const SERVICE_LABELS: Record<string, string> = {
  oci_new:          'OCI Card — New Application',
  oci_renewal:      'OCI Card — Renewal',
  passport_renewal: 'Indian Passport Renewal',
}

const TIER_AMOUNTS: Record<string, number> = {
  guided:         2900,
  human_assisted: 7900,
}

const bodySchema = z.union([
  // Locker subscription
  z.object({ plan: z.literal('locker') }),
  // Per-application checkout
  z.object({
    serviceType: z.string(),
    tier: z.enum(['guided', 'human_assisted']),
  }),
])

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // ── Locker subscription ──────────────────────────────────────────────────────
  if ('plan' in parsed.data && parsed.data.plan === 'locker') {
    const priceId = process.env.STRIPE_LOCKER_PRICE_ID
    if (!priceId) {
      return NextResponse.json({ error: 'STRIPE_LOCKER_PRICE_ID not configured' }, { status: 500 })
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
  // Application record is created by the Stripe webhook AFTER successful payment.
  // Nothing is inserted into the DB here.
  if (!('serviceType' in parsed.data)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const { serviceType, tier } = parsed.data

  const priceId = tier === 'guided'
    ? process.env.STRIPE_GUIDED_PRICE_ID
    : process.env.STRIPE_HUMAN_PRICE_ID

  const tierLabel = tier === 'human_assisted' ? 'Expert Session' : 'Guided'
  const svcLabel = SERVICE_LABELS[serviceType] ?? 'Application preparation'

  // Success URL differs by tier: guided goes to prepare screen, expert goes to human page
  const successUrl = tier === 'guided'
    ? `${appUrl}/apply/prepare/${serviceType}?session_id={CHECKOUT_SESSION_ID}&new=true`
    : `${appUrl}/apply/human?session_id={CHECKOUT_SESSION_ID}&service_type=${serviceType}&new=true`

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
                ? '45-min expert Zoom session, AVA pre-fill, validation, full PDF package, rejection guarantee.'
                : 'AI-validated application: both portals completed, full PDF package, rejection guarantee.',
            },
            unit_amount: TIER_AMOUNTS[tier],
          },
          quantity: 1,
        }],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: `${appUrl}/apply`,
    metadata: { user_id: user.id, service_type: serviceType, tier },
    customer_email: user.email,
  })

  return NextResponse.json({ data: { url: session.url } })
}
