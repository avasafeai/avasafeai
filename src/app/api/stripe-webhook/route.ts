import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
const resend = new Resend(process.env.RESEND_API_KEY!)

// Price ID → plan name mapping (set in Vercel env vars)
const priceIdToPlan: Record<string, string> = {}
if (process.env.STRIPE_LOCKER_PRICE_ID) priceIdToPlan[process.env.STRIPE_LOCKER_PRICE_ID] = 'locker'
if (process.env.STRIPE_GUIDED_PRICE_ID) priceIdToPlan[process.env.STRIPE_GUIDED_PRICE_ID] = 'guided'
if (process.env.STRIPE_HUMAN_PRICE_ID)  priceIdToPlan[process.env.STRIPE_HUMAN_PRICE_ID]  = 'human_assisted'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const { application_id, user_id, plan, tier } = session.metadata ?? {}

  if (!user_id) {
    return NextResponse.json({ error: 'Missing user_id in metadata' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://avasafe.ai'

  // ── Locker subscription payment ──────────────────────────────────────────
  if (plan === 'locker') {
    const planExpires = new Date(Date.now() + 366 * 24 * 60 * 60 * 1000).toISOString()

    await supabase
      .from('profiles')
      .update({ plan: 'locker', plan_expires: planExpires })
      .eq('id', user_id)

    if (session.customer_email) {
      await resend.emails.send({
        from: 'Avasafe AI <noreply@avasafe.ai>',
        to: session.customer_email,
        subject: 'Welcome to Avasafe Locker — your plan is active',
        html: `<p>Hi,</p>
<p>Your <strong>Locker ($19/year)</strong> plan is now active. Unlimited document storage and smart expiry alerts are ready.</p>
<p>Go to your dashboard: <a href="${appUrl}/dashboard">${appUrl}/dashboard</a></p>
<p>— The Avasafe AI team</p>`,
      })
    }

    return NextResponse.json({ received: true })
  }

  // ── Per-application payment (Guided $29 or Human Assisted $79) ───────────
  if (!application_id) {
    return NextResponse.json({ error: 'Missing application_id or plan in metadata' }, { status: 400 })
  }

  await supabase
    .from('applications')
    .update({
      status: 'paid',
      stripe_payment_id: session.payment_intent as string,
    })
    .eq('id', application_id)
    .eq('user_id', user_id)

  const paidTier = tier ?? 'guided'
  const tierLabel = paidTier === 'human_assisted' ? 'Human Assisted ($79)' : 'Guided ($29)'
  const amount = paidTier === 'human_assisted' ? '$79' : '$29'

  if (session.customer_email) {
    const emailBody = paidTier === 'human_assisted'
      ? `<p>Hi,</p>
<p>We received your <strong>${amount}</strong> payment for <strong>Human Assisted</strong> application preparation.</p>
<p>An Avasafe expert will contact you within 48 hours to schedule your 45-minute Zoom session. AVA has already pre-filled and validated your application.</p>
<p>You can track your application at <a href="${appUrl}/apply/package">${appUrl}/apply/package</a>.</p>
<p>— The Avasafe AI team</p>`
      : `<p>Hi,</p>
<p>We received your <strong>${amount}</strong> payment for <strong>${tierLabel}</strong>. AVA is now completing your application on both portals and assembling your mailing package.</p>
<p>We'll email you as soon as your package is ready. You can track progress at <a href="${appUrl}/apply/package">${appUrl}/apply/package</a>.</p>
<p>— The Avasafe AI team</p>`

    await resend.emails.send({
      from: 'Avasafe AI <noreply@avasafe.ai>',
      to: session.customer_email,
      subject: 'Payment received — AVA is preparing your application',
      html: emailBody,
    })
  }

  return NextResponse.json({ received: true })
}
