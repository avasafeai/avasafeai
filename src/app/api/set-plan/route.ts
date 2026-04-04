import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const bodySchema = z.object({
  plan: z.enum(['guided', 'human_assisted']),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const { error } = await supabase
    .from('profiles')
    .update({ plan: parsed.data.plan })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })

  return NextResponse.json({ data: { plan: parsed.data.plan } })
}
