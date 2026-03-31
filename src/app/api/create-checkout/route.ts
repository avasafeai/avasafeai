import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

const PRICE_CENTS = 3900

export async function POST() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: appData } = await supabase
    .from('applications')
    .select('id, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const app = appData as { id: string; status: string } | null

  if (!app) {
    return NextResponse.json({ error: 'No application found' }, { status: 400 })
  }

  if (app.status !== 'ready') {
    return NextResponse.json({ error: 'Application is not ready for payment' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'OCI Card Application — Avasafe AI',
            description: 'AI-validated OCI application submission service',
          },
          unit_amount: PRICE_CENTS,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${appUrl}/apply/status`,
    cancel_url: `${appUrl}/apply/review`,
    metadata: {
      application_id: app.id,
      user_id: user.id,
    },
    customer_email: user.email,
  })

  return NextResponse.json({ data: { url: session.url } })
}
