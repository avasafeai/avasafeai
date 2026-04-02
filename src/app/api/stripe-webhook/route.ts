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
  const { application_id, user_id, plan } = session.metadata ?? {}

  if (!user_id) {
    return NextResponse.json({ error: 'Missing user_id in metadata' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://avasafe.ai'

  // ── Subscription payment (locker / apply / family plan) ───────────────────
  if (plan) {
    const PLAN_EXPIRES_DAYS = 366
    const planExpires = new Date(Date.now() + PLAN_EXPIRES_DAYS * 24 * 60 * 60 * 1000).toISOString()

    await supabase
      .from('profiles')
      .update({ plan, plan_expires: planExpires })
      .eq('id', user_id)

    if (session.customer_email) {
      const PLAN_LABELS: Record<string, string> = {
        locker: 'Document Locker ($19/year)',
        apply:  'Locker + Apply ($49/year)',
        family: 'Family ($99/year)',
      }
      await resend.emails.send({
        from: 'Avasafe AI <noreply@avasafe.ai>',
        to: session.customer_email,
        subject: 'Welcome to Avasafe AI — your plan is active',
        html: `<p>Hi,</p>
<p>Your <strong>${PLAN_LABELS[plan] ?? plan}</strong> plan is now active.</p>
<p>Go to your dashboard: <a href="${appUrl}/dashboard">${appUrl}/dashboard</a></p>
<p>— The Avasafe AI team</p>`,
      })
    }

    return NextResponse.json({ received: true })
  }

  // ── Per-application payment ($29) ─────────────────────────────────────────
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

  if (session.customer_email) {
    await resend.emails.send({
      from: 'Avasafe AI <noreply@avasafe.ai>',
      to: session.customer_email,
      subject: 'Payment received — AVA is preparing your application',
      html: `<p>Hi,</p>
<p>We received your $29 payment. AVA is now completing your application on both portals and assembling your mailing package.</p>
<p>We'll email you as soon as your package is ready. You can track progress at <a href="${appUrl}/apply/package">${appUrl}/apply/package</a>.</p>
<p>— The Avasafe AI team</p>`,
    })
  }

  return NextResponse.json({ received: true })
}
