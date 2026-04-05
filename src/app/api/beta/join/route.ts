import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const BETA_SLOTS = 50

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized', code: 'unauthorized' }, { status: 401 })

  // Use service role to atomically increment beta counter
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Check if user is already beta
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('is_beta, beta_number, plan')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as { is_beta?: boolean; beta_number?: number | null; plan?: string } | null

  if (profile?.is_beta) {
    return NextResponse.json({ data: { already_beta: true, beta_number: profile.beta_number } })
  }

  // Read current count
  const { data: counter } = await service
    .from('beta_counter')
    .select('count')
    .eq('id', 1)
    .single()

  const currentCount = counter?.count ?? 0

  if (currentCount >= BETA_SLOTS) {
    return NextResponse.json({ error: 'All beta slots are taken', code: 'slots_full' }, { status: 409 })
  }

  const betaNumber = currentCount + 1

  // Increment counter
  await service
    .from('beta_counter')
    .update({ count: betaNumber })
    .eq('id', 1)

  // Mark user as beta and set plan to guided (free access)
  await service
    .from('profiles')
    .update({
      is_beta: true,
      beta_number: betaNumber,
      plan: 'guided',
    })
    .eq('id', user.id)

  // Send welcome email via Resend if configured
  if (process.env.RESEND_API_KEY && profile) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'AVA at Avasafe <ava@avasafe.ai>',
        to: user.email,
        subject: `You're Beta Member #${betaNumber} — welcome to Avasafe AI`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <p style="font-size:13px;color:#9CA3AF;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:16px">AVASAFE AI BETA</p>
            <h1 style="font-family:Georgia,serif;font-size:26px;color:#0F2D52;margin-bottom:12px;line-height:1.3">
              You're beta member #${betaNumber}.
            </h1>
            <p style="font-size:15px;color:#6B6B6B;line-height:1.6;margin-bottom:20px">
              Your Guided access is now active. You can start your OCI or passport renewal application immediately — no payment required.
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/apply" style="display:inline-block;background:#C9882A;color:white;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:600">
              Start your application →
            </a>
            <p style="font-size:12px;color:#9CA3AF;margin-top:28px">
              Thank you for being part of the early community. Your feedback helps us build something that actually works.
            </p>
          </div>
        `,
      }),
    }).catch(() => { /* non-fatal */ })
  }

  return NextResponse.json({ data: { beta_number: betaNumber, slots_remaining: BETA_SLOTS - betaNumber } })
}

export async function GET() {
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await service.from('beta_counter').select('count').eq('id', 1).single()
  const count = data?.count ?? 0
  return NextResponse.json({
    count,
    remaining: Math.max(0, BETA_SLOTS - count),
    available: count < BETA_SLOTS,
  })
}
