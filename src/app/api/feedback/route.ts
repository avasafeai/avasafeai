import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const bodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  note: z.string().max(2000).optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  triggerLocation: z.string().optional().default('manual'),
  serviceType: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { rating, note, tags, triggerLocation, serviceType } = parsed.data

  const serviceClient = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (serviceClient as any).from('feedback').insert({
    user_id: user.id,
    rating,
    note: note || null,
    tags: tags.length > 0 ? tags : null,
    trigger_location: triggerLocation,
    service_type: serviceType ?? null,
  })

  if (error) {
    console.error('[feedback] insert error:', error)
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
