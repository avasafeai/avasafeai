import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const bodySchema = z.object({
  service_type: z.enum(['oci_new', 'oci_renewal', 'passport_renewal']),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: unknown = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid service_type' }, { status: 400 })

  const { data, error } = await supabase
    .from('applications')
    .insert({ user_id: user.id, service_type: parsed.data.service_type, status: 'draft' })
    .select('id')
    .single()

  if (error || !data) return NextResponse.json({ error: 'Failed to create application' }, { status: 500 })

  return NextResponse.json({ data: { id: data.id } })
}
