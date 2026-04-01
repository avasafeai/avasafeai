import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { Plus, ClipboardList, ChevronRight } from 'lucide-react'

const SERVICE_LABELS: Record<string, string> = {
  oci_new: 'OCI Card — New Application',
  oci_renewal: 'OCI Card — Renewal',
  passport_renewal: 'Indian Passport Renewal',
}

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  draft:             { label: 'Draft',          bg: 'var(--surface)',      color: 'var(--text-tertiary)' },
  locker_ready:      { label: 'Ready',           bg: 'rgba(10,22,40,0.06)', color: 'var(--navy-mid)' },
  form_complete:     { label: 'In progress',     bg: 'rgba(10,22,40,0.06)', color: 'var(--navy-mid)' },
  validated:         { label: 'Validated',       bg: 'rgba(10,22,40,0.06)', color: 'var(--navy-mid)' },
  paid:              { label: 'Paid',            bg: 'var(--gold-subtle)',  color: 'var(--gold)' },
  package_generated: { label: 'Package ready',  bg: 'var(--gold-subtle)',  color: 'var(--gold)' },
  submitted:         { label: 'Submitted',       bg: 'var(--success-bg)',   color: 'var(--success)' },
  approved:          { label: 'Approved',        bg: 'var(--success-bg)',   color: 'var(--success)' },
}

export default async function ApplicationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: apps } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const newBtn = (
    <Link href="/apply" className="btn-navy" style={{ height: 40, padding: '0 16px', fontSize: 14 }}>
      <Plus size={15} /> New application
    </Link>
  )

  return (
    <DashboardShell activePage="applications" pageTitle="Applications" topBarActions={newBtn}>
      {!apps || apps.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <ClipboardList size={32} color="var(--text-tertiary)" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 24, color: 'var(--navy)', marginBottom: 10 }}>No applications yet</h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 28, maxWidth: 360 }}>
            Ready to start your first application? AVA will use your documents to pre-fill everything.
          </p>
          <Link href="/apply" className="btn-navy"><Plus size={16} /> Start an application</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 720 }}>
          {apps.map(app => {
            const s = STATUS_MAP[app.status] ?? { label: app.status, bg: 'var(--surface)', color: 'var(--text-tertiary)' }
            return (
              <Link key={app.id} href={`/apply/status`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'white', border: '1px solid var(--border)', borderRadius: 14,
                  padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16,
                  boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
                  transition: 'background 200ms ease, box-shadow 200ms ease',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--off-white)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)' }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 3 }}>
                      {SERVICE_LABELS[app.service_type] ?? app.service_type}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <span className="badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                  <ChevronRight size={16} color="var(--text-tertiary)" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </DashboardShell>
  )
}
