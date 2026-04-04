import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Json, ReadinessCheck, ReadinessResult } from '@/types/supabase'
import { decryptSensitiveFields } from '@/lib/field-encryption'
import { z } from 'zod'

const bodySchema = z.object({
  form_data: z.record(z.string(), z.unknown()),
  application_id: z.string().uuid(),
})

// ── VFS centre jurisdiction map ───────────────────────────────────────────────
const STATE_VFS: Record<string, string> = {
  TX: 'Houston', OK: 'Houston', AR: 'Houston', LA: 'Houston', MS: 'Houston',
  CA: 'San Francisco', NV: 'San Francisco', AZ: 'San Francisco',
  HI: 'San Francisco', AK: 'San Francisco',
  WA: 'San Francisco', OR: 'San Francisco', ID: 'San Francisco',
  MT: 'San Francisco', WY: 'San Francisco', CO: 'San Francisco',
  UT: 'San Francisco', NM: 'San Francisco',
  NY: 'New York', NJ: 'New York', CT: 'New York', PA: 'New York',
  DE: 'New York', MA: 'New York', RI: 'New York', VT: 'New York',
  NH: 'New York', ME: 'New York',
  IL: 'Chicago', OH: 'Chicago', MI: 'Chicago', IN: 'Chicago',
  WI: 'Chicago', MN: 'Chicago', IA: 'Chicago', MO: 'Chicago',
  ND: 'Chicago', SD: 'Chicago', NE: 'Chicago', KS: 'Chicago',
  FL: 'Atlanta', GA: 'Atlanta', SC: 'Atlanta', NC: 'Atlanta',
  TN: 'Atlanta', AL: 'Atlanta', KY: 'Atlanta', WV: 'Atlanta',
  VA: 'Atlanta', MD: 'Atlanta', DC: 'Atlanta',
}

// ── Scoring constants ─────────────────────────────────────────────────────────
const DEDUCTIONS: Record<string, number> = {
  blocker: 15, warning: 8, medium: 4, suggestion: 1,
}

function calcScore(checks: ReadinessCheck[]): number {
  let score = 100
  for (const c of checks) {
    if (c.status !== 'passed' && c.severity) {
      score -= DEDUCTIONS[c.severity] ?? 0
    }
  }
  return Math.max(0, score)
}

function calcStatus(score: number): ReadinessResult['status'] {
  if (score >= 90) return 'ready'
  if (score >= 70) return 'almost_ready'
  return 'needs_attention'
}

// ── Run all 10 rules ──────────────────────────────────────────────────────────
async function runChecks(
  formData: Record<string, string>,
  passportData: Record<string, string> | null,
  locker: string[],  // doc_types present in locker
): Promise<ReadinessCheck[]> {
  const checks: ReadinessCheck[] = []
  const f = formData
  const p = passportData ?? {}
  const now = Date.now()

  // Rule 1 — Name match
  if (p.last_name) {
    const passportLast = p.last_name.trim().toUpperCase()
    const formLast = (f.last_name ?? '').trim().toUpperCase()
    if (formLast && formLast !== passportLast) {
      checks.push({
        id: 'name_match',
        title: 'Surname mismatch',
        status: 'failed',
        severity: 'blocker',
        message: `Your surname "${f.last_name}" does not match your passport "${p.last_name}". Middle names must also be included exactly as printed.`,
        fix: `Update to: ${p.last_name}`,
        field: 'last_name',
        correct_value: p.last_name,
      })
    } else {
      checks.push({ id: 'name_match', title: 'Name matches passport', status: 'passed', severity: null, message: 'Surname verified against stored passport.', fix: null, field: null, correct_value: null })
    }
  } else {
    checks.push({ id: 'name_match', title: 'Name match (unverified)', status: 'warning', severity: 'medium', message: 'No passport stored to verify name. Upload your US passport to enable cross-check.', fix: null, field: null, correct_value: null })
  }

  // Rule 2 — Place of issue
  const passportCountry = (f.passport_issued_by ?? '').toLowerCase()
  if (passportCountry.includes('united states') || passportCountry === 'us' || passportCountry === 'usa') {
    checks.push({
      id: 'place_of_issue',
      title: 'Place of issue must be USDOS',
      status: 'failed',
      severity: 'blocker',
      message: 'Place of issue must be entered as "USDOS" for US passports. This is the most common rejection cause.',
      fix: 'Change to: USDOS',
      field: 'passport_issued_by',
      correct_value: 'USDOS',
    })
  } else if (f.passport_issued_by === 'USDOS') {
    checks.push({ id: 'place_of_issue', title: 'Place of issue correct', status: 'passed', severity: null, message: 'Place of issue is correctly set to USDOS.', fix: null, field: null, correct_value: null })
  } else if (!f.passport_issued_by) {
    checks.push({ id: 'place_of_issue', title: 'Place of issue missing', status: 'warning', severity: 'warning', message: 'Place of issue is required. For US passports enter USDOS.', fix: 'Enter: USDOS', field: 'passport_issued_by', correct_value: 'USDOS' })
  } else {
    checks.push({ id: 'place_of_issue', title: 'Place of issue entered', status: 'passed', severity: null, message: `Place of issue: ${f.passport_issued_by}`, fix: null, field: null, correct_value: null })
  }

  // Rule 3 — Place of birth format
  const pob = f.place_of_birth ?? ''
  if (pob) {
    const hasExtraDetail = /[,]/.test(pob) || pob.split(' ').length > 3
    if (hasExtraDetail) {
      checks.push({
        id: 'place_of_birth',
        title: 'Place of birth may be too detailed',
        status: 'warning',
        severity: 'medium',
        message: `Place of birth "${pob}" may include a city or state. It must match your passport exactly — typically just "India" or country name only.`,
        fix: null,
        field: 'place_of_birth',
        correct_value: p.place_of_birth ?? null,
      })
    } else {
      checks.push({ id: 'place_of_birth', title: 'Place of birth format OK', status: 'passed', severity: null, message: 'Place of birth looks correctly formatted.', fix: null, field: null, correct_value: null })
    }
  } else {
    checks.push({ id: 'place_of_birth', title: 'Place of birth missing', status: 'failed', severity: 'blocker', message: 'Place of birth is required.', fix: null, field: 'place_of_birth', correct_value: null })
  }

  // Rule 4 — Passport expiry
  const expiryStr = f.passport_expiry_date
  if (expiryStr) {
    const expiry = new Date(expiryStr).getTime()
    const daysLeft = (expiry - now) / 86400000
    if (daysLeft < 180) {
      checks.push({
        id: 'passport_expiry',
        title: 'Passport expires too soon',
        status: 'failed',
        severity: 'blocker',
        message: `Your passport expires in ${Math.max(0, Math.floor(daysLeft))} days. OCI requires minimum 6 months validity. Renew your passport before applying.`,
        fix: 'Renew your US passport first, then return to apply.',
        field: 'passport_expiry_date',
        correct_value: null,
      })
    } else {
      checks.push({ id: 'passport_expiry', title: 'Passport has sufficient validity', status: 'passed', severity: null, message: `Passport valid for ${Math.floor(daysLeft)} more days — well above 180-day minimum.`, fix: null, field: null, correct_value: null })
    }
  } else {
    checks.push({ id: 'passport_expiry', title: 'Passport expiry missing', status: 'failed', severity: 'blocker', message: 'Passport expiry date is required to verify minimum validity.', fix: null, field: 'passport_expiry_date', correct_value: null })
  }

  // Rule 5 — Photo
  if (locker.includes('photo')) {
    checks.push({ id: 'photo', title: 'Photo uploaded', status: 'passed', severity: null, message: 'Passport-style photo found in your locker.', fix: null, field: null, correct_value: null })
  } else {
    checks.push({
      id: 'photo',
      title: 'No photo uploaded',
      status: 'failed',
      severity: 'warning',
      message: 'OCI requires a square photo minimum 51×51mm with white background and 80% face coverage.',
      fix: 'Upload a compliant photo',
      field: null,
      correct_value: null,
    })
  }

  // Rule 6 — Document completeness (OCI New)
  const requiredDocs = [
    { type: 'us_passport', label: 'US Passport' },
    { type: 'indian_passport', label: 'Indian Passport (or old Indian passport)' },
    { type: 'address_proof', label: 'US Address Proof (dated within 3 months)' },
  ]
  for (const rd of requiredDocs) {
    if (!locker.includes(rd.type)) {
      checks.push({
        id: `doc_${rd.type}`,
        title: `Missing: ${rd.label}`,
        status: 'failed',
        severity: 'blocker',
        message: `${rd.label} is required for OCI applications. Application will be returned unprocessed without it.`,
        fix: `Add ${rd.label} to your document locker`,
        field: null,
        correct_value: null,
      })
    } else {
      checks.push({ id: `doc_${rd.type}`, title: `${rd.label} in locker`, status: 'passed', severity: null, message: `${rd.label} verified in your locker.`, fix: null, field: null, correct_value: null })
    }
  }

  // Rule 7 — VFS jurisdiction
  const state = (f.address_state ?? '').toUpperCase()
  if (state && STATE_VFS[state]) {
    const correctCenter = STATE_VFS[state]
    // We just inform them which center they'll use
    checks.push({ id: 'vfs_jurisdiction', title: `VFS centre: ${correctCenter}`, status: 'passed', severity: null, message: `Based on your ${state} address, you'll apply to the ${correctCenter} VFS centre.`, fix: null, field: null, correct_value: null })
  } else if (state) {
    checks.push({ id: 'vfs_jurisdiction', title: 'VFS jurisdiction needs verification', status: 'warning', severity: 'warning', message: `Could not auto-detect VFS centre for state "${state}". Verify you are applying to the correct jurisdiction.`, fix: null, field: null, correct_value: null })
  } else {
    checks.push({ id: 'vfs_jurisdiction', title: 'State not provided', status: 'failed', severity: 'blocker', message: 'Address state is required to assign the correct VFS centre.', fix: null, field: 'address_state', correct_value: null })
  }

  // Rule 8 — Apostille warning (not triggered for standard documents in locker)
  checks.push({ id: 'apostille', title: 'Apostille not required', status: 'passed', severity: null, message: 'Standard OCI application does not require apostille for listed documents.', fix: null, field: null, correct_value: null })

  // Rule 9 — Date of birth consistency
  if (p.date_of_birth) {
    const formDob = f.date_of_birth ?? ''
    if (formDob && formDob !== p.date_of_birth) {
      checks.push({
        id: 'dob_match',
        title: 'Date of birth mismatch',
        status: 'failed',
        severity: 'blocker',
        message: `Date of birth "${formDob}" does not match your stored passport date "${p.date_of_birth}".`,
        fix: `Update to: ${p.date_of_birth}`,
        field: 'date_of_birth',
        correct_value: p.date_of_birth,
      })
    } else {
      checks.push({ id: 'dob_match', title: 'Date of birth verified', status: 'passed', severity: null, message: 'Date of birth matches your stored passport.', fix: null, field: null, correct_value: null })
    }
  } else {
    if (!f.date_of_birth) {
      checks.push({ id: 'dob_match', title: 'Date of birth missing', status: 'failed', severity: 'blocker', message: 'Date of birth is required.', fix: null, field: 'date_of_birth', correct_value: null })
    } else {
      checks.push({ id: 'dob_match', title: 'Date of birth entered', status: 'passed', severity: null, message: 'Date of birth provided (unverified — no passport in locker).', fix: null, field: null, correct_value: null })
    }
  }

  // Rule 10 — Email
  const email = f.email ?? ''
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  if (!emailValid) {
    checks.push({ id: 'email', title: 'Valid email required', status: 'warning', severity: 'suggestion', message: 'A valid email is required for VFS portal registration and status updates.', fix: null, field: 'email', correct_value: null })
  } else {
    checks.push({ id: 'email', title: 'Email valid', status: 'passed', severity: null, message: `Application updates will be sent to ${email}`, fix: null, field: null, correct_value: null })
  }

  return checks
}

// ── POST — run validation ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: unknown = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  const { form_data, application_id } = parsed.data

  // Verify application belongs to user
  const { data: app } = await supabase
    .from('applications')
    .select('id, service_type')
    .eq('id', application_id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  // Fetch user's stored document types
  const serviceClient = createServiceClient()
  const { data: docRows } = await serviceClient
    .from('documents')
    .select('doc_type, extracted_data')
    .eq('user_id', user.id)

  const locker = (docRows ?? []).map(d => d.doc_type as string)

  // Get passport data for cross-reference (prefer US passport)
  const passportRow = (docRows ?? []).find(d => d.doc_type === 'us_passport') ??
                      (docRows ?? []).find(d => d.doc_type === 'indian_passport')

  let passportData: Record<string, string> | null = null
  if (passportRow?.extracted_data) {
    try {
      const raw = passportRow.extracted_data as Record<string, string>
      passportData = await decryptSensitiveFields(raw)
    } catch {
      passportData = passportRow.extracted_data as Record<string, string>
    }
  }

  const fStr = form_data as Record<string, string>
  const checks = await runChecks(fStr, passportData, locker)
  const score = calcScore(checks)
  const status = calcStatus(score)
  const passed = checks.filter(c => c.status === 'passed').length
  const failedChecks = checks.filter(c => c.status !== 'passed')
  const blockerCount = checks.filter(c => c.severity === 'blocker' && c.status !== 'passed').length
  const warningCount = checks.filter(c => (c.severity === 'warning' || c.severity === 'medium') && c.status !== 'passed').length

  const result: ReadinessResult = {
    score,
    status,
    checks_passed: passed,
    issues_total: failedChecks.length,
    blockers: blockerCount,
    warnings: warningCount,
    checks,
  }

  const hasBlockers = blockerCount > 0
  await supabase.from('applications').update({
    form_data: form_data as unknown as Json,
    validation_results: result as unknown as Json,
    readiness_score: score,
    status: hasBlockers ? 'form_complete' : 'validated',
  }).eq('id', application_id)

  return NextResponse.json({ data: result })
}

// ── GET — return saved results ────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const appId = url.searchParams.get('application_id')
  if (!appId) return NextResponse.json({ error: 'Missing application_id' }, { status: 400 })

  const { data: app } = await supabase
    .from('applications')
    .select('validation_results, form_data, readiness_score')
    .eq('id', appId)
    .eq('user_id', user.id)
    .maybeSingle()

  const empty: ReadinessResult = { score: 0, status: 'needs_attention', checks_passed: 0, issues_total: 0, blockers: 0, warnings: 0, checks: [] }

  return NextResponse.json({
    data: (app?.validation_results as unknown as ReadinessResult) ?? empty,
    form_data: app?.form_data ?? {},
    readiness_score: app?.readiness_score ?? 0,
  })
}
