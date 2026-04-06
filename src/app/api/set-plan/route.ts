import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Only 'free' can be set here. Locker requires Stripe checkout.
// Guided and Expert Session are per-application tiers, not user plans.
const bodySchema = z.object({
  plan: z.literal('free'),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Only plan=free is allowed here. Use /api/create-checkout for Locker, Guided, and Expert Session.' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('profiles')
    .update({ plan: 'free' })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })

  return NextResponse.json({ data: { plan: 'free' } })
}
