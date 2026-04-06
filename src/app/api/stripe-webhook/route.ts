import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
const resend = new Resend(process.env.RESEND_API_KEY!)

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
  const { user_id, service_type, tier, plan } = session.metadata ?? {}

  if (!user_id) {
    return NextResponse.json({ error: 'Missing user_id in metadata' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://avasafe.ai'

  // Use session.id as the payment reference so prepare screen can poll by it
  const sessionId = session.id

  // ── Locker subscription ──────────────────────────────────────────────────────
  if (plan === 'locker') {
    const planExpires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

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

  // ── Per-application payment (Guided $29 or Human Assisted $79) ───────────────
  const paidTier = tier ?? 'guided'

  if (paidTier === 'guided' || paidTier === 'human_assisted') {
    if (!service_type) {
      return NextResponse.json({ error: 'Missing service_type in metadata' }, { status: 400 })
    }

    // Idempotency: only create one application per payment session
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('stripe_payment_id', sessionId)
      .single()

    if (!existing) {
      await supabase
        .from('applications')
        .insert({
          user_id,
          service_type,
          status: 'in_progress',
          current_step: 0,
          stripe_payment_id: sessionId,
        })
    }

    // Update user plan to reflect paid tier
    await supabase
      .from('profiles')
      .update({ plan: paidTier })
      .eq('id', user_id)

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
  }

  return NextResponse.json({ received: true })
}
