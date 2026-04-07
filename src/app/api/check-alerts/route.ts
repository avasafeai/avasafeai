import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

// Cron: called by Vercel Cron daily
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Find documents expiring within 180 days
  const now = new Date()
  const in180 = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString()
  const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()

  const { data: docs } = await supabase
    .from('documents')
    .select('id, user_id, doc_type, expires_at')
    .not('expires_at', 'is', null)
    .lt('expires_at', in180)

  if (!docs || docs.length === 0) return NextResponse.json({ processed: 0 })

  let created = 0

  for (const doc of docs) {
    const expiresAt = doc.expires_at as string
    const isCritical = expiresAt < in90

    // Skip if alert already sent this week
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: existing } = await supabase
      .from('alerts')
      .select('id')
      .eq('document_id', doc.id)
      .gte('created_at', weekAgo)
      .limit(1)
      .single()

    if (existing) continue

    const docLabel = doc.doc_type.replace(/_/g, ' ')
    const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const message = isCritical
      ? `Your ${docLabel} expires in less than 3 months (${expiryDate}). Start your renewal now.`
      : `Your ${docLabel} expires in about 6 months (${expiryDate}). Start your renewal soon.`

    await supabase.from('alerts').insert({
      user_id: doc.user_id,
      document_id: doc.id,
      alert_type: isCritical ? 'expiry_critical' : 'expiry_warning',
      message,
      sent_at: now.toISOString(),
    })

    // Get user email
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const userEmail = users?.find((u) => u.id === doc.user_id)?.email

    if (userEmail) {
      await resend.emails.send({
        from: 'AVA at Avasafe <ava@avasafe.ai>',
        to: userEmail,
        subject: isCritical
          ? `⚠️ Your ${docLabel} expires soon. Start renewal now.`
          : `Your ${docLabel} expires in 6 months`,
        html: `<p>${message}</p>
<p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">View your document locker →</a></p>
<p style="color:#999;font-size:12px">Avasafe AI · Your documents, safe. Your applications, done.</p>`,
      })
    }

    created++
  }

  return NextResponse.json({ processed: created })
}
