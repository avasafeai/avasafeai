import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/DashboardShell'
import { Download, ExternalLink, CheckCircle, Package } from 'lucide-react'

export default async function PackagePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: app } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!app) redirect('/apply')

  return (
    <DashboardShell activePage="applications" pageTitle="Your Package Is Ready">
      <div style={{ maxWidth: 640 }}>

        {/* AVA message */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderLeft: '3px solid var(--gold)', borderRadius: 16, padding: 24, marginBottom: 28, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>A</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold)' }}>AVA</span>
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 17, color: 'var(--text-primary)', lineHeight: 1.6 }}>
            I&apos;ve completed both your government application and your VFS registration. There are just two things left for you to do.
          </p>
        </div>

        {/* Two step cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>

          {/* Step 1 — Pay government fee */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'white', fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)' }}>1</span>
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--navy)' }}>Pay the government fee</p>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>One tap. Directly to the Indian government.</p>
              </div>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 18 }}>
              The Indian government requires this fee to be paid directly. AVA has pre-filled everything — just tap pay.
            </p>
            <a
              href="https://ociservices.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <button className="btn-navy" style={{ height: 48, padding: '0 24px', fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Pay government fee <ExternalLink size={14} />
              </button>
            </a>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 10 }}>
              Paid directly to the Indian government. Takes about 30 seconds.
            </p>
          </div>

          {/* Step 2 — Drop at UPS */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'white', fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)' }}>2</span>
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--navy)' }}>Drop this envelope at UPS</p>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>About 5 minutes. Any UPS location.</p>
              </div>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 18 }}>
              Print your package, sign where marked in red, and drop it at any UPS location. The label is pre-addressed — no address to copy, no decisions to make.
            </p>

            {app.package_url ? (
              <a href={app.package_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <button className="btn-gold" style={{ height: 48, padding: '0 24px', fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Download size={16} /> Download your package (PDF)
                </button>
              </a>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', opacity: 0.7,
                      animation: 'bounce 1.2s ease-in-out infinite', animationDelay: `${i*0.15}s` }} />
                  ))}
                </div>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>AVA is generating your package...</span>
              </div>
            )}

            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 10 }}>
              Includes: every completed form, document copies, photo, signing markers, and a pre-addressed UPS label to your VFS centre.
            </p>
          </div>
        </div>

        {/* Application summary */}
        {(app.arn || app.vfs_reference) && (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Package size={16} color="var(--text-tertiary)" />
              <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>Your Reference Numbers</p>
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {app.arn && (
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>ARN (Government)</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>{app.arn}</p>
                </div>
              )}
              {app.vfs_reference && (
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>VFS Reference</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>{app.vfs_reference}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AVA closing message */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 0' }}>
          <CheckCircle size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            That&apos;s it. AVA will track your application and notify you at every step.{' '}
            <a href="/apply/status" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>View status →</a>
          </p>
        </div>
      </div>
    </DashboardShell>
  )
}
