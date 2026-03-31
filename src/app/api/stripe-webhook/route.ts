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
  const { application_id, user_id } = session.metadata ?? {}

  if (!application_id || !user_id) {
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
  }

  const supabase = createServiceClient()

  await supabase
    .from('applications')
    .update({
      status: 'paid',
      stripe_payment_id: session.payment_intent as string,
    })
    .eq('id', application_id)
    .eq('user_id', user_id)

  // Send confirmation email
  if (session.customer_email) {
    await resend.emails.send({
      from: 'Avasafe AI <noreply@avasafe.ai>',
      to: session.customer_email,
      subject: 'Payment received — your OCI application is being processed',
      html: `<p>Hi,</p>
<p>We received your payment of $39. Your OCI application is now being prepared for submission to VFS Global.</p>
<p>We'll email you when it's been submitted. You can track your status at <a href="${process.env.NEXT_PUBLIC_APP_URL}/apply/status">your dashboard</a>.</p>
<p>— The Avasafe AI team</p>`,
    })
  }

  return NextResponse.json({ received: true })
}
