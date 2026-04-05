import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Locker requires payment — must go through /api/create-checkout
// free / guided / human_assisted are intent-only and set here for free
const bodySchema = z.object({
  plan: z.enum(['free', 'guided', 'human_assisted']),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))

  // Reject locker — must go through Stripe checkout
  if (body?.plan === 'locker') {
    return NextResponse.json(
      { error: 'Locker requires payment. Use /api/create-checkout', code: 'use_checkout' },
      { status: 400 }
    )
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const { error } = await supabase
    .from('profiles')
    .update({ plan: parsed.data.plan })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })

  return NextResponse.json({ data: { plan: parsed.data.plan } })
}
