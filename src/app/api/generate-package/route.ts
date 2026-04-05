import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

const STATE_VFS_ADDRESSES: Record<string, { center: string; address: string }> = {
  TX: { center: 'Houston', address: '9800 Richmond Ave, Suite 235, Houston, TX 77042' },
  OK: { center: 'Houston', address: '9800 Richmond Ave, Suite 235, Houston, TX 77042' },
  CA: { center: 'San Francisco', address: '150 Pelican Way, San Rafael, CA 94901' },
  NY: { center: 'New York', address: '895 Broadway, 4th Floor, New York, NY 10003' },
  NJ: { center: 'New York', address: '895 Broadway, 4th Floor, New York, NY 10003' },
  IL: { center: 'Chicago', address: '180 N Michigan Ave, Suite 910, Chicago, IL 60601' },
  GA: { center: 'Atlanta', address: 'One Alliance Center, Suite 650, 3500 Lenox Rd NE, Atlanta, GA 30326' },
  FL: { center: 'Atlanta', address: 'One Alliance Center, Suite 650, 3500 Lenox Rd NE, Atlanta, GA 30326' },
  DC: { center: 'Washington DC', address: '1025 Vermont Ave NW, Suite 302, Washington, DC 20005' },
  VA: { center: 'Atlanta', address: 'One Alliance Center, Suite 650, 3500 Lenox Rd NE, Atlanta, GA 30326' },
  WA: { center: 'San Francisco', address: '150 Pelican Way, San Rafael, CA 94901' },
}
const FALLBACK_VFS = { center: 'San Francisco', address: '150 Pelican Way, San Rafael, CA 94901' }

const SERVICE_LABELS: Record<string, string> = {
  oci_new:          'OCI Card — New Application',
  oci_renewal:      'OCI Card — Renewal',
  passport_renewal: 'Indian Passport Renewal',
}

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const appId = searchParams.get('application_id')
  if (!appId) return NextResponse.json({ error: 'application_id required' }, { status: 400 })

  const { data: app } = await supabase
    .from('applications')
    .select('*')
    .eq('id', appId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const formData = (app.form_data ?? {}) as Record<string, string>
  const state = (formData.address_state ?? '').toUpperCase()
  const vfsInfo = STATE_VFS_ADDRESSES[state] ?? FALLBACK_VFS
  const serviceLabel = SERVICE_LABELS[app.service_type] ?? 'Application'
  const applicantName = `${formData.first_name ?? ''} ${formData.last_name ?? ''}`.trim() || 'Applicant'
  const generatedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const pdfDoc = await PDFDocument.create()
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const NAVY  = rgb(0.059, 0.176, 0.322)
  const GOLD  = rgb(0.788, 0.533, 0.165)
  const DARK  = rgb(0.102, 0.102, 0.102)
  const GRAY  = rgb(0.42, 0.42, 0.42)
  const LGRAY = rgb(0.89, 0.91, 0.92)
  const WHITE = rgb(1, 1, 1)
  const RED   = rgb(0.73, 0.11, 0.11)
  const GREEN = rgb(0.102, 0.420, 0.227)

  const page = pdfDoc.addPage([612, 792])
  const { width: W, height: H } = page.getSize()

  const pad = 48
  let y = H

  // ── Header band ──────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: H - 72, width: W, height: 72, color: NAVY })
  page.drawText('AVASAFE AI', { x: pad, y: H - 30, size: 16, font: bold, color: WHITE })
  page.drawText('Application Checklist', { x: pad, y: H - 48, size: 10, font: regular, color: rgb(0.75, 0.75, 0.75) })
  page.drawText(generatedDate, { x: W - pad - 100, y: H - 38, size: 9, font: regular, color: rgb(0.65, 0.65, 0.65) })
  page.drawRectangle({ x: 0, y: H - 74, width: W, height: 3, color: GOLD })
  y = H - 96

  // ── Service + applicant row ──────────────────────────────────────────────────
  page.drawText(serviceLabel, { x: pad, y, size: 15, font: bold, color: NAVY })
  y -= 18
  page.drawText(`${applicantName}  |  ${formData.email ?? ''}  |  ${formData.phone ?? ''}`, { x: pad, y, size: 9, font: regular, color: GRAY })
  y -= 14
  page.drawLine({ start: { x: pad, y }, end: { x: W - pad, y }, thickness: 0.5, color: LGRAY })
  y -= 18

  // ── Application details ──────────────────────────────────────────────────────
  page.drawText('APPLICATION DETAILS', { x: pad, y, size: 9, font: bold, color: NAVY })
  y -= 14

  const detailFields: [string, string][] = [
    ['Full name', applicantName],
    ['Date of birth', formData.date_of_birth ?? '—'],
    ['Place of birth', formData.place_of_birth ?? '—'],
    ['Passport number', formData.passport_number ?? '—'],
    ['Passport expiry', formData.passport_expiry_date ?? '—'],
    ['US address', [formData.address_line1, formData.address_city, formData.address_state, formData.address_zip].filter(Boolean).join(', ')],
    ['Father name', formData.father_name ?? '—'],
    ['Mother name', formData.mother_name ?? '—'],
    ...(formData.spouse_name ? [['Spouse name', formData.spouse_name] as [string, string]] : []),
  ]

  detailFields.forEach(([label, value]) => {
    page.drawText(label, { x: pad, y, size: 9, font: bold, color: GRAY })
    page.drawText(value, { x: pad + 130, y, size: 9, font: regular, color: DARK, maxWidth: W - pad - 130 - pad })
    y -= 14
  })

  y -= 6
  page.drawLine({ start: { x: pad, y }, end: { x: W - pad, y }, thickness: 0.5, color: LGRAY })
  y -= 18

  // ── Documents to include ─────────────────────────────────────────────────────
  page.drawText('DOCUMENTS TO INCLUDE IN YOUR ENVELOPE', { x: pad, y, size: 9, font: bold, color: NAVY })
  y -= 14

  const docs = [
    { item: 'Completed OCI application form (print from government portal)', sign: true },
    { item: 'US passport — colour copy of bio data page', sign: false },
    { item: 'Indian origin proof — old Indian passport or parent\'s Indian passport', sign: false },
    { item: 'US address proof dated within 3 months (utility bill, bank statement, or lease)', sign: false },
    { item: '4 passport-style photos (square, white background, no glasses)', sign: false },
  ]

  docs.forEach(({ item, sign }) => {
    page.drawRectangle({ x: pad, y: y - 3, width: 11, height: 11, borderColor: DARK, borderWidth: 1 })
    page.drawText(item, { x: pad + 18, y, size: 9, font: regular, color: DARK, maxWidth: W - pad - 18 - pad - (sign ? 50 : 0) })
    if (sign) page.drawText('SIGN', { x: W - pad - 28, y, size: 9, font: bold, color: RED })
    y -= 16
  })

  y -= 6
  page.drawLine({ start: { x: pad, y }, end: { x: W - pad, y }, thickness: 0.5, color: LGRAY })
  y -= 18

  // ── Photo requirements ────────────────────────────────────────────────────────
  page.drawText('PHOTO REQUIREMENTS', { x: pad, y, size: 9, font: bold, color: NAVY })
  y -= 14

  const photoReqs = [
    'Square format — 2x2 inches (51x51mm)',
    'White or off-white background — no patterns',
    'Face must fill 70-80% of the frame, looking straight at the camera',
    'No glasses, no headwear (except for religious reasons)',
    'Neutral expression, mouth closed',
    '4 copies required — do not staple or fold',
  ]

  photoReqs.forEach(req => {
    page.drawText('•  ' + req, { x: pad + 8, y, size: 9, font: regular, color: DARK, maxWidth: W - pad * 2 })
    y -= 14
  })

  y -= 6
  page.drawLine({ start: { x: pad, y }, end: { x: W - pad, y }, thickness: 0.5, color: LGRAY })
  y -= 18

  // ── Submission instructions ───────────────────────────────────────────────────
  page.drawText('SUBMISSION STEPS', { x: pad, y, size: 9, font: bold, color: NAVY })
  y -= 14

  const steps = [
    { n: '1', text: 'Print all documents listed above in colour where required.', bold: false },
    { n: '2', text: 'Sign the application form in the designated signature box — blue or black ink, ballpoint pen only.', bold: false },
    { n: '3', text: 'Place all documents in a 9x12 inch manila envelope.', bold: false },
    { n: '4', text: `Address the envelope to: VFS Global ${vfsInfo.center}, ${vfsInfo.address}`, bold: true },
    { n: '5', text: 'Drop at any UPS location. No appointment needed. Keep your receipt and tracking number.', bold: false },
  ]

  steps.forEach(({ n, text, bold: isBold }) => {
    page.drawText(n + '.', { x: pad, y, size: 9, font: bold, color: GOLD })
    page.drawText(text, { x: pad + 16, y, size: 9, font: isBold ? bold : regular, color: isBold ? NAVY : DARK, maxWidth: W - pad - 16 - pad })
    y -= 16
  })

  y -= 6
  page.drawLine({ start: { x: pad, y }, end: { x: W - pad, y }, thickness: 0.5, color: LGRAY })
  y -= 18

  // ── VFS address callout ───────────────────────────────────────────────────────
  page.drawRectangle({ x: pad, y: y - 38, width: W - pad * 2, height: 48, color: NAVY })
  page.drawText(`MAIL TO: VFS Global ${vfsInfo.center}`, { x: pad + 12, y: y - 14, size: 9, font: bold, color: rgb(0.75, 0.75, 0.75) })
  page.drawText(vfsInfo.address, { x: pad + 12, y: y - 28, size: 10, font: bold, color: WHITE })
  y -= 58

  // ── Guarantee + footer ────────────────────────────────────────────────────────
  y -= 10
  page.drawText('Rejection guarantee: if AVA\'s validation caused the rejection, we fix your application at no cost.', { x: pad, y, size: 8, font: regular, color: GREEN })
  y -= 16
  page.drawText(`avasafe.ai  |  support@avasafe.ai  |  Application ID: ${appId}`, { x: pad, y, size: 8, font: regular, color: GRAY })

  // Update application status
  await supabase
    .from('applications')
    .update({ status: 'package_generated', updated_at: new Date().toISOString() })
    .eq('id', appId)
    .eq('user_id', user.id)

  const pdfBytes = await pdfDoc.save()
  const buffer = Buffer.from(pdfBytes)

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="avasafe-checklist.pdf"`,
      'Content-Length': buffer.length.toString(),
    },
  })
}
