import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

console.log('STRIPE DEBUG', {
  keyExists: !!process.env.STRIPE_SECRET_KEY,
  keyLength: process.env.STRIPE_SECRET_KEY?.length,
  keyStart: process.env.STRIPE_SECRET_KEY?.substring(0, 10),
  keyEnd: process.env.STRIPE_SECRET_KEY?.slice(-4),
})

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

// Subscription plan price IDs (set in Vercel env vars)
const PLAN_PRICE_IDS: Record<string, string | undefined> = {
  locker: process.env.STRIPE_LOCKER_PRICE_ID,  // $19/year
  apply:  process.env.STRIPE_APPLY_PRICE_ID,   // $49/year
  family: process.env.STRIPE_FAMILY_PRICE_ID,  // $99/year
}

const bodySchema = z.object({
  // Subscription checkout — pass `plan`
  plan: z.enum(['locker', 'apply', 'family']).optional(),
  // Per-application checkout — pass `application_id` + `service_type`
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

  // ── Subscription checkout (plan selection from pricing page) ─────────────
  if (plan) {
    const priceId = PLAN_PRICE_IDS[plan]
    if (!priceId) {
      return NextResponse.json({ error: `Price ID for plan "${plan}" is not configured` }, { status: 500 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${appUrl}/dashboard?upgraded=1`,
      cancel_url: `${appUrl}/#pricing`,
      metadata: { user_id: user.id, plan },
      customer_email: user.email,
    })

    return NextResponse.json({ data: { url: session.url } })
  }

  // ── Per-application checkout ($29 one-time) ───────────────────────────────
  if (!application_id) {
    return NextResponse.json({ error: 'Provide either plan or application_id' }, { status: 400 })
  }

  // Verify application belongs to this user
  const { data: app } = await supabase
    .from('applications')
    .select('id, status, service_type')
    .eq('id', application_id)
    .eq('user_id', user.id)
    .single()

  if (!app) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  const SERVICE_LABELS: Record<string, string> = {
    oci_new:          'OCI Card — New Application',
    oci_renewal:      'OCI Card — Renewal',
    passport_renewal: 'Indian Passport Renewal',
  }
  const label = SERVICE_LABELS[service_type ?? app.service_type] ?? 'Application preparation'

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${label} — Avasafe AI`,
            description: 'AI-validated application: both portals completed, full PDF package included.',
          },
          unit_amount: 2900, // $29.00
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${appUrl}/apply/package`,
    cancel_url: `${appUrl}/apply/review`,
    metadata: { application_id, user_id: user.id },
    customer_email: user.email,
  })

  return NextResponse.json({ data: { url: session.url } })
}
