// GET /api/requirements?serviceId=oci_new
// Returns current requirements (24-hour cache).
// Authenticated — user must be signed in.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getService } from '@/lib/services/registry'
import { fetchRequirements } from '@/lib/requirements-engine'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised', code: 'auth_required' }, { status: 401 })

  const serviceId = req.nextUrl.searchParams.get('serviceId')
  if (!serviceId) {
    return NextResponse.json({ error: 'serviceId is required', code: 'missing_param' }, { status: 400 })
  }

  const service = getService(serviceId)
  if (!service) {
    return NextResponse.json({ error: 'Unknown service', code: 'not_found' }, { status: 404 })
  }

  try {
    const adminSupabase = createServiceClient()
    const result = await fetchRequirements(service, adminSupabase)
    return NextResponse.json({ data: result })
  } catch (err) {
    console.error('[requirements] fetch error', err)
    return NextResponse.json({ error: 'Failed to fetch requirements', code: 'fetch_error' }, { status: 500 })
  }
}
