import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getService } from '@/lib/services/registry'
import { buildPrefillMap } from '@/lib/prefill-engine'
import { decryptField } from '@/lib/field-encryption'
import { z } from 'zod'

const bodySchema = z.object({
  applicationId: z.string().uuid(),
  serviceId: z.string().min(1),
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
  const { applicationId, serviceId } = parsed.data

  const serviceClient = createServiceClient()

  // Verify user owns this application
  const { data: application } = await serviceClient
    .from('applications')
    .select('id, user_id')
    .eq('id', applicationId)
    .eq('user_id', user.id)
    .single()

  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  const service = getService(serviceId)
  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  }

  try {
    const { prefilled, sources, coverage, missing_sources } = await buildPrefillMap(
      service,
      user.id,
      serviceClient,
      decryptField,
    )

    const { error: updateError } = await serviceClient
      .from('applications')
      .update({
        form_data: prefilled,
        prefill_sources: sources,
        prefill_coverage: coverage,
      })
      .eq('id', applicationId)

    if (updateError) {
      console.error('[prefill] DB update error:', updateError)
      return NextResponse.json({ error: 'Failed to save prefill' }, { status: 500 })
    }

    console.log('[prefill] saved:', {
      applicationId,
      coverage,
      fieldCount: Object.keys(prefilled).length,
      missing_sources,
    })

    return NextResponse.json({ prefilled, sources, coverage, missing_sources })
  } catch (err) {
    console.error('[prefill] error:', err)
    return NextResponse.json({ error: 'Prefill failed' }, { status: 500 })
  }
}
