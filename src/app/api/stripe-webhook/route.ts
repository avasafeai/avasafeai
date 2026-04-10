import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { PostHog } from 'posthog-node'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const metadata = session.metadata || {}
  const userId = metadata.user_id
  const serviceType = metadata.service_type
  const tier = metadata.tier
  const plan = metadata.plan

  console.log('Webhook received:', {
    sessionId: session.id,
    userId,
    serviceType,
    tier,
    plan,
    paymentStatus: session.payment_status,
  })

  // Only process completed payments
  if (session.payment_status !== 'paid' && session.mode !== 'subscription') {
    console.log('Skipping — payment not completed:', session.payment_status)
    return NextResponse.json({ received: true })
  }

  const supabaseAdmin = createServiceClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://avasafe.ai'

  // ── Locker subscription ──────────────────────────────────────────────────────
  if (plan === 'locker') {
    if (!userId) {
      console.error('Missing metadata:', metadata)
      return NextResponse.json({ received: true })
    }
    const planExpires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    await supabaseAdmin
      .from('profiles')
      .update({ plan: 'locker', plan_expires: planExpires })
      .eq('id', userId)

    if (session.customer_email) {
      await resend.emails.send({
        from: 'Avasafe AI <noreply@avasafe.ai>',
        to: session.customer_email,
        subject: 'Welcome to Avasafe Locker. Your plan is active.',
        html: `<p>Hi,</p>
<p>Your <strong>Locker ($19/year)</strong> plan is now active. Unlimited document storage and smart expiry alerts are ready.</p>
<p><a href="${appUrl}/dashboard">${appUrl}/dashboard</a></p>
<p>The Avasafe AI team</p>`,
      })
    }

    return NextResponse.json({ received: true })
  }

  // ── Guided → Expert upgrade ───────────────────────────────────────────────────
  const upgradeType = metadata.upgrade_type
  const upgradeApplicationId = metadata.application_id

  if (upgradeType === 'guided_to_expert') {
    if (!upgradeApplicationId) {
      console.error('Missing application_id for upgrade:', metadata)
      return NextResponse.json({ received: true })
    }
    await supabaseAdmin
      .from('applications')
      .update({ tier: 'human_assisted', upgraded_at: new Date().toISOString() })
      .eq('id', upgradeApplicationId)
    console.log('Application upgraded to expert:', upgradeApplicationId)
    return NextResponse.json({ received: true })
  }

  // ── Per-application payment (Guided or Expert Session) ───────────────────────
  if (!userId || !serviceType || !tier) {
    console.error('Missing metadata:', metadata)
    return NextResponse.json({ received: true })
  }

  // Idempotency: skip if already processed this session
  const { data: existing } = await supabaseAdmin
    .from('applications')
    .select('id')
    .eq('stripe_payment_id', session.id)
    .maybeSingle()

  if (existing) {
    console.log('Already processed:', session.id, '→', existing.id)
    return NextResponse.json({ received: true })
  }

  // Create the application record — only valid columns, no extras
  const { data: app, error } = await supabaseAdmin
    .from('applications')
    .insert({
      user_id: userId,
      service_type: serviceType,
      tier: tier,
      status: 'in_progress',
      current_step: 0,
      stripe_payment_id: session.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Application insert failed:', error)
    return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
  }

  console.log('Application created successfully:', app.id, 'tier:', app.tier, 'service:', app.service_type)

  // Fire server-side paymentCompleted event
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    const phClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
    })
    const amount = tier === 'human_assisted' ? 79 : 29
    phClient.capture({
      distinctId: userId,
      event: 'payment_completed',
      properties: { serviceType, tier, amount, applicationId: app.id },
    })
    await phClient.shutdown()
  }

  // DO NOT update profile plan for guided/human_assisted —
  // plan only reflects document storage subscription (free/locker)

  const tierLabel = tier === 'human_assisted' ? 'Expert Session ($79)' : 'Guided ($29)'
  const amount = tier === 'human_assisted' ? '$79' : '$29'

  if (session.customer_email) {
    const emailBody = tier === 'human_assisted'
      ? `<p>Hi,</p>
<p>We received your <strong>${amount}</strong> payment for an <strong>Expert Session</strong>.</p>
<p>An Avasafe expert will contact you within 48 hours to schedule your 45-minute Zoom session.</p>
<p>Complete your document checklist and book your slot at <a href="${appUrl}/apply/human?applicationId=${app.id}">${appUrl}/apply/human</a>.</p>
<p>The Avasafe AI team</p>`
      : `<p>Hi,</p>
<p>We received your <strong>${amount}</strong> payment for <strong>${tierLabel}</strong>.</p>
<p>AVA is ready to pre-fill your application. Continue at <a href="${appUrl}/apply/prepare/${serviceType}?applicationId=${app.id}">${appUrl}/apply/prepare/${serviceType}</a>.</p>
<p>The Avasafe AI team</p>`

    await resend.emails.send({
      from: 'Avasafe AI <noreply@avasafe.ai>',
      to: session.customer_email,
      subject: 'Payment confirmed. AVA is ready.',
      html: emailBody,
    })
  }

  return NextResponse.json({ received: true })
}
