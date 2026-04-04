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

  const pdfDoc = await PDFDocument.create()
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const courierBold = await pdfDoc.embedFont(StandardFonts.CourierBold)

  const NAVY = rgb(0.059, 0.176, 0.322) // #0F2D52
  const GOLD = rgb(0.788, 0.533, 0.165) // #C9882A
  const DARK = rgb(0.102, 0.102, 0.102)
  const GRAY = rgb(0.42, 0.42, 0.42)
  const LIGHT_GRAY = rgb(0.89, 0.91, 0.92)
  const WHITE = rgb(1, 1, 1)
  const RED = rgb(0.73, 0.11, 0.11)
  const WHITE_DIM = rgb(0.75, 0.75, 0.75) // replaces rgba(1,1,1,0.6) on dark bg
  const NAVY_LIGHT = rgb(0.23, 0.34, 0.47) // replaces rgba(0.059,0.176,0.322,0.06) bg tint

  function addHRule(page: ReturnType<typeof pdfDoc.addPage>, y: number, thickness = 0.5) {
    const { width } = page.getSize()
    page.drawLine({ start: { x: 48, y }, end: { x: width - 48, y }, thickness, color: LIGHT_GRAY })
  }

  // ── PAGE 1: Cover sheet ─────────────────────────────────────────────────────
  const coverPage = pdfDoc.addPage([612, 792])
  const { width: cW, height: cH } = coverPage.getSize()

  // Navy header band
  coverPage.drawRectangle({ x: 0, y: cH - 80, width: cW, height: 80, color: NAVY })
  coverPage.drawText('AVASAFE AI', { x: 48, y: cH - 44, size: 22, font: helveticaBold, color: WHITE })
  coverPage.drawText('Application Package', { x: 48, y: cH - 62, size: 11, font: helvetica, color: WHITE_DIM })

  // Gold accent bar
  coverPage.drawRectangle({ x: 0, y: cH - 84, width: cW, height: 4, color: GOLD })

  // Service title
  coverPage.drawText(serviceLabel, { x: 48, y: cH - 130, size: 24, font: helveticaBold, color: NAVY })
  coverPage.drawText('Prepared by AVA — AI-Validated Application Package', { x: 48, y: cH - 152, size: 12, font: helvetica, color: GRAY })

  addHRule(coverPage, cH - 172)

  // Applicant info block
  const infoY = cH - 210
  const infoFields: [string, string][] = [
    ['Full Name', `${formData.first_name ?? ''} ${formData.last_name ?? ''}`.trim() || '—'],
    ['Date of Birth', formData.date_of_birth ?? '—'],
    ['US Passport', formData.passport_number ?? '—'],
    ['Email', formData.email ?? '—'],
    ['VFS Centre', `${vfsInfo.center} VFS Global`],
    ['Application ID', appId],
    ['Generated', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
  ]

  infoFields.forEach(([label, value], i) => {
    const y = infoY - i * 30
    coverPage.drawText(label, { x: 48, y, size: 10, font: helveticaBold, color: GRAY })
    coverPage.drawText(value, { x: 200, y, size: 11, font: helvetica, color: DARK })
    addHRule(coverPage, y - 8, 0.3)
  })

  // What's inside
  const contentsY = infoY - infoFields.length * 30 - 40
  coverPage.drawText('WHAT\'S INSIDE THIS PACKAGE', { x: 48, y: contentsY, size: 10, font: helveticaBold, color: NAVY })

  const contents = [
    'Page 2   — OCI Application Form (pre-filled)',
    'Page 3   — Photo page (4 passport photos)',
    'Page 4   — Document checklist with sign markers',
    'Page 5+  — Supporting document copies',
    'Last page — Pre-addressed VFS shipping label',
  ]
  contents.forEach((line, i) => {
    coverPage.drawText('✓  ' + line, { x: 48, y: contentsY - 20 - i * 20, size: 11, font: helvetica, color: DARK })
  })

  // Two steps callout
  const stepsY = contentsY - contents.length * 20 - 50
  coverPage.drawRectangle({ x: 48, y: stepsY - 80, width: cW - 96, height: 90, color: NAVY_LIGHT, borderColor: NAVY, borderWidth: 1 })
  coverPage.drawText('YOUR TWO REMAINING STEPS', { x: 64, y: stepsY - 12, size: 10, font: helveticaBold, color: NAVY })
  coverPage.drawText('1.  Pay the government fee — opens from your Avasafe dashboard. One tap.', { x: 64, y: stepsY - 34, size: 10, font: helvetica, color: DARK })
  coverPage.drawText('2.  Print this package, sign where marked ★, drop at any UPS location.', { x: 64, y: stepsY - 52, size: 10, font: helvetica, color: DARK })
  coverPage.drawText('AVA has completed both portals on your behalf. You are essentially done.', { x: 64, y: stepsY - 74, size: 9, font: helvetica, color: GRAY })

  // Footer
  coverPage.drawText('avasafe.ai  ·  support@avasafe.ai', { x: 48, y: 36, size: 9, font: helvetica, color: rgb(0.7, 0.7, 0.7) })
  coverPage.drawText('Confidential — do not share', { x: cW - 48 - 120, y: 36, size: 9, font: helvetica, color: rgb(0.7, 0.7, 0.7) })

  // ── PAGE 2: Filled Application Form ────────────────────────────────────────
  const formPage = pdfDoc.addPage([612, 792])
  const { width: fW, height: fH } = formPage.getSize()

  formPage.drawRectangle({ x: 0, y: fH - 52, width: fW, height: 52, color: NAVY })
  formPage.drawText(serviceLabel + ' — Application Form', { x: 48, y: fH - 30, size: 13, font: helveticaBold, color: WHITE })
  formPage.drawText('Pre-filled by AVA · Verify all fields before signing', { x: 48, y: fH - 45, size: 9, font: helvetica, color: WHITE_DIM })

  const FORM_FIELDS: [string, string][] = [
    ['Surname (as per passport)', `${formData.last_name ?? '—'}`],
    ['Given Name (as per passport)', `${formData.first_name ?? '—'}`],
    ['Date of Birth', formData.date_of_birth ?? '—'],
    ['Place of Birth', formData.place_of_birth ?? '—'],
    ['Gender', formData.gender ?? '—'],
    ['Nationality / Citizenship', 'United States of America'],
    ['Passport Number', formData.passport_number ?? '—'],
    ['Passport Issue Date', formData.passport_issue_date ?? '—'],
    ['Passport Expiry Date', formData.passport_expiry_date ?? '—'],
    ['Place of Issue', formData.passport_issued_by ?? 'USDOS'],
    ['Father / Guardian Name', formData.father_name ?? '—'],
    ['Mother Name', formData.mother_name ?? '—'],
    ['Spouse Name', formData.spouse_name ?? '—'],
    ['Email', formData.email ?? '—'],
    ['Mobile', formData.phone ?? '—'],
    ['Address Line 1', formData.address_line1 ?? '—'],
    ['City', formData.address_city ?? '—'],
    ['State', formData.address_state ?? '—'],
    ['ZIP Code', formData.address_zip ?? '—'],
    ['Country', 'United States of America'],
    ['Evidence of Indian Origin', formData.indian_origin_proof ?? '—'],
  ]

  let formY = fH - 76
  const colLabelW = 200
  const lineH = 26

  FORM_FIELDS.forEach(([label, value]) => {
    if (formY < 80) return // safety
    formPage.drawText(label, { x: 48, y: formY, size: 9, font: helveticaBold, color: GRAY })
    formPage.drawText(value, { x: 48 + colLabelW, y: formY, size: 10, font: helvetica, color: DARK })
    addHRule(formPage, formY - 10, 0.3)
    formY -= lineH
  })

  // Signature line
  if (formY > 100) {
    formPage.drawText('★  SIGNATURE REQUIRED', { x: 48, y: formY - 20, size: 11, font: helveticaBold, color: RED })
    formPage.drawLine({ start: { x: 48, y: formY - 50 }, end: { x: 280, y: formY - 50 }, thickness: 1, color: DARK })
    formPage.drawText('Applicant Signature', { x: 48, y: formY - 64, size: 9, font: helvetica, color: GRAY })
    formPage.drawLine({ start: { x: 320, y: formY - 50 }, end: { x: 500, y: formY - 50 }, thickness: 1, color: DARK })
    formPage.drawText('Date', { x: 320, y: formY - 64, size: 9, font: helvetica, color: GRAY })
  }

  // ── PAGE 3: Photo page ──────────────────────────────────────────────────────
  const photoPage = pdfDoc.addPage([612, 792])
  const { width: ppW, height: ppH } = photoPage.getSize()

  photoPage.drawRectangle({ x: 0, y: ppH - 52, width: ppW, height: 52, color: NAVY })
  photoPage.drawText('Passport-Style Photo — 4 copies required', { x: 48, y: ppH - 30, size: 13, font: helveticaBold, color: WHITE })
  photoPage.drawText('Square, white background, no glasses, face centred', { x: 48, y: ppH - 45, size: 9, font: helvetica, color: WHITE_DIM })

  photoPage.drawText('Attach your passport-style photo below (4 copies, 35mm × 35mm each):', { x: 48, y: ppH - 80, size: 10, font: helvetica, color: DARK })

  const PHOTO_POSITIONS = [
    { x: 48, y: ppH - 240 },
    { x: 200, y: ppH - 240 },
    { x: 48, y: ppH - 420 },
    { x: 200, y: ppH - 420 },
  ]

  PHOTO_POSITIONS.forEach(({ x, y }, i) => {
    photoPage.drawRectangle({ x, y, width: 110, height: 140, borderColor: GRAY, borderWidth: 1, color: rgb(0.97, 0.97, 0.97) })
    photoPage.drawText(`Photo ${i + 1}`, { x: x + 35, y: y + 65, size: 11, font: helvetica, color: GRAY })
    photoPage.drawText('Affix here', { x: x + 30, y: y + 50, size: 9, font: helvetica, color: rgb(0.7, 0.7, 0.7) })
  })

  photoPage.drawText('Requirements: Square JPEG · White background · No glasses · Face centred · 200–1500px · Under 200kb', { x: 48, y: ppH - 460, size: 8, font: helvetica, color: GRAY })

  // ── PAGE 4: Document checklist ──────────────────────────────────────────────
  const checklistPage = pdfDoc.addPage([612, 792])
  const { width: clW, height: clH } = checklistPage.getSize()

  checklistPage.drawRectangle({ x: 0, y: clH - 52, width: clW, height: 52, color: NAVY })
  checklistPage.drawText('Document Checklist', { x: 48, y: clH - 30, size: 13, font: helveticaBold, color: WHITE })
  checklistPage.drawText('Check off each item before sealing your envelope', { x: 48, y: clH - 45, size: 9, font: helvetica, color: WHITE_DIM })

  const CHECKLIST = [
    { item: 'Completed OCI application form (Page 2 of this package)', sign: true },
    { item: 'US passport — bio data page (colour photocopy)', sign: false },
    { item: 'Old Indian passport OR parent\'s Indian passport (evidence of Indian origin)', sign: false },
    { item: 'US address proof dated within 3 months (utility bill, bank statement, etc.)', sign: false },
    { item: '4 passport-style photos (square, white background)', sign: false },
    { item: 'VFS shipping label (last page of this package)', sign: false },
  ]

  let clY = clH - 90
  CHECKLIST.forEach(({ item, sign }) => {
    checklistPage.drawRectangle({ x: 48, y: clY - 4, width: 16, height: 16, borderColor: DARK, borderWidth: 1 })
    checklistPage.drawText(item, { x: 76, y: clY, size: 11, font: helvetica, color: DARK, maxWidth: clW - 130 })
    if (sign) {
      checklistPage.drawText('★ SIGN', { x: clW - 90, y: clY, size: 9, font: helveticaBold, color: RED })
    }
    clY -= 36
  })

  addHRule(checklistPage, clY - 10)
  clY -= 40

  checklistPage.drawText('SIGNING INSTRUCTIONS', { x: 48, y: clY, size: 10, font: helveticaBold, color: RED })
  clY -= 20
  checklistPage.drawText('Items marked ★ SIGN require your signature. Use a ballpoint pen in BLUE or BLACK ink.', { x: 48, y: clY, size: 10, font: helvetica, color: DARK })
  clY -= 18
  checklistPage.drawText('Sign in the designated box on the application form — do NOT sign over any printed text.', { x: 48, y: clY, size: 10, font: helvetica, color: DARK })

  // ── PAGE 5: Document copies placeholder ────────────────────────────────────
  const docsPage = pdfDoc.addPage([612, 792])
  const { width: dpW, height: dpH } = docsPage.getSize()

  docsPage.drawRectangle({ x: 0, y: dpH - 52, width: dpW, height: 52, color: NAVY })
  docsPage.drawText('Supporting Documents', { x: 48, y: dpH - 30, size: 13, font: helveticaBold, color: WHITE })
  docsPage.drawText('Print and include all documents listed below', { x: 48, y: dpH - 45, size: 9, font: helvetica, color: WHITE_DIM })

  const docInstructions = [
    'US PASSPORT (bio data page)',
    'Print a clear colour copy of your US passport bio data page.',
    '',
    'INDIAN ORIGIN PROOF',
    'Print your old Indian passport (all pages) OR your parent\'s Indian passport.',
    '',
    'ADDRESS PROOF',
    'Print a utility bill, bank statement, or lease agreement dated within 3 months.',
    'Your name and current US address must be clearly visible.',
    '',
    'NOTE: All copies must be clear, complete, and unobstructed.',
    'Blurry or cropped documents are a leading cause of rejection.',
  ]

  let dpY = dpH - 90
  docInstructions.forEach(line => {
    if (!line) { dpY -= 10; return }
    const isHeader = !line.startsWith('Print') && !line.startsWith('Your') && !line.startsWith('NOTE') && !line.startsWith('Blurry')
    docsPage.drawText(line, {
      x: 48, y: dpY, size: isHeader ? 11 : 10,
      font: isHeader ? helveticaBold : helvetica,
      color: isHeader ? NAVY : DARK,
      maxWidth: dpW - 96,
    })
    dpY -= isHeader ? 22 : 18
  })

  // ── LAST PAGE: Shipping label ───────────────────────────────────────────────
  const labelPage = pdfDoc.addPage([612, 792])
  const { width: lW, height: lH } = labelPage.getSize()

  labelPage.drawRectangle({ x: 0, y: lH - 52, width: lW, height: 52, color: NAVY })
  labelPage.drawText('UPS Shipping Label', { x: 48, y: lH - 30, size: 13, font: helveticaBold, color: WHITE })
  labelPage.drawText('Pre-addressed to your VFS centre — drop at any UPS location', { x: 48, y: lH - 45, size: 9, font: helvetica, color: WHITE_DIM })

  // Label box
  const lblBoxY = lH - 280
  labelPage.drawRectangle({ x: 48, y: lblBoxY, width: lW - 96, height: 200, borderColor: DARK, borderWidth: 2 })

  // FROM
  labelPage.drawText('FROM:', { x: 64, y: lblBoxY + 178, size: 10, font: helveticaBold, color: GRAY })
  const applicantName = `${formData.first_name ?? ''} ${formData.last_name ?? ''}`.trim() || 'Applicant Name'
  const fromLines = [
    applicantName,
    formData.address_line1 ?? '',
    `${formData.address_city ?? ''}, ${formData.address_state ?? ''} ${formData.address_zip ?? ''}`.trim(),
  ].filter(Boolean)
  fromLines.forEach((line, i) => {
    labelPage.drawText(line, { x: 64, y: lblBoxY + 162 - i * 16, size: 11, font: helvetica, color: DARK })
  })

  // TO
  labelPage.drawRectangle({ x: 48, y: lblBoxY + 80, width: lW - 96, height: 2, color: DARK })
  labelPage.drawText('TO:', { x: 64, y: lblBoxY + 72, size: 10, font: helveticaBold, color: GRAY })
  labelPage.drawText(`VFS Global — ${vfsInfo.center}`, { x: 64, y: lblBoxY + 56, size: 13, font: helveticaBold, color: NAVY })
  labelPage.drawText(vfsInfo.address, { x: 64, y: lblBoxY + 38, size: 11, font: helvetica, color: DARK })
  labelPage.drawText('RE: OCI Application — ' + (formData.last_name ?? '').toUpperCase(), { x: 64, y: lblBoxY + 18, size: 10, font: courierBold, color: NAVY })

  // Instructions
  labelPage.drawText('MAILING INSTRUCTIONS', { x: 48, y: lblBoxY - 32, size: 10, font: helveticaBold, color: NAVY })
  const mailInstructions = [
    '1.  Use a standard 9×12 inch manila envelope or UPS Express envelope.',
    '2.  Place ALL documents in order: application form, photos, document copies.',
    '3.  Cut or print this label and affix to the outside of the envelope.',
    '4.  Drop at any UPS location. No appointment needed. Keep your tracking number.',
  ]
  mailInstructions.forEach((line, i) => {
    labelPage.drawText(line, { x: 48, y: lblBoxY - 54 - i * 20, size: 10, font: helvetica, color: DARK })
  })

  // Update application status
  await supabase
    .from('applications')
    .update({
      package_downloaded_at: new Date().toISOString(),
      status: 'package_generated',
      updated_at: new Date().toISOString(),
    })
    .eq('id', appId)
    .eq('user_id', user.id)

  const pdfBytes = await pdfDoc.save()
  const buffer = Buffer.from(pdfBytes)

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="avasafe-application-package.pdf"`,
      'Content-Length': buffer.length.toString(),
    },
  })
}
