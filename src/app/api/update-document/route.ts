import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Json } from '@/types/supabase'
import { z } from 'zod'

const bodySchema = z.object({
  document_id: z.string().uuid(),
  extracted_data: z.record(z.string(), z.unknown()),
})

export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: unknown = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { document_id, extracted_data } = parsed.data

  const { error } = await supabase
    .from('documents')
    .update({ extracted_data: extracted_data as unknown as Json })
    .eq('id', document_id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

  return NextResponse.json({ data: { ok: true } })
}
