import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { Plus, ClipboardList } from 'lucide-react'
import { getService } from '@/lib/services/registry'

const COMPLETED_STATUSES = ['package_generated', 'submitted', 'approved']

function getAppHref(app: { id: string; service_type: string; tier: string | null; status: string }): string {
  if (app.tier === 'human_assisted') {
    return `/apply/human?applicationId=${app.id}`
  }
  if (COMPLETED_STATUSES.includes(app.status)) {
    return `/apply/package?applicationId=${app.id}`
  }
  return `/apply/prepare/${app.service_type}?applicationId=${app.id}`
}

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  draft:             { label: 'Draft',          bg: 'rgba(0,0,0,0.04)',    color: 'var(--text-tertiary)' },
  locker_ready:      { label: 'Ready',           bg: 'rgba(10,22,40,0.06)', color: 'var(--navy)' },
  form_complete:     { label: 'In progress',     bg: '#FFF7ED',             color: '#C9882A' },
  validated:         { label: 'Validated',       bg: 'rgba(10,22,40,0.06)', color: 'var(--navy)' },
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

  return (
    <DashboardShell activePage="applications" pageTitle="Applications">
      {!apps || apps.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <ClipboardList size={32} color="var(--text-tertiary)" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 24, color: 'var(--navy)', marginBottom: 10 }}>No applications yet</h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 28, maxWidth: 360, lineHeight: 1.6 }}>
            Ready to start your first application? AVA will use your documents to pre-fill everything.
          </p>
          <Link href="/apply" className="btn-navy"><Plus size={16} /> Start an application</Link>
        </div>
      ) : (
        <div style={{ maxWidth: 720 }}>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Your applications</p>
            <Link href="/apply" style={{ fontSize: 13, color: '#C9882A', fontWeight: 500, textDecoration: 'none', fontFamily: 'var(--font-body)' }}>
              + New application
            </Link>
          </div>

          {/* Card grid */}
          <div className="app-card-grid">
            {apps.map(app => {
              const s = STATUS_MAP[app.status] ?? { label: app.status, bg: 'rgba(0,0,0,0.04)', color: 'var(--text-tertiary)' }
              const isExpert = app.tier === 'human_assisted'
              const service = getService(app.service_type)
              const totalSteps = service?.form_steps ?? 13
              const currentStep = (app.current_step as number | null) ?? 0
              const progressPct = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0
              const startedAt = new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              const accentColor = isExpert ? '#0F2D52' : '#C9882A'
              const href = getAppHref(app)

              return (
                <div key={app.id} className="app-card" style={{
                  background: 'white',
                  border: '0.5px solid var(--border)',
                  borderLeft: `3px solid ${accentColor}`,
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  transition: 'box-shadow 150ms ease',
                }}>
                  {/* Row 1 — service name + status */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {service?.name ?? app.service_type}
                    </p>
                    <span style={{
                      fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0,
                      background: s.bg, color: s.color,
                      padding: '2px 7px', borderRadius: 20,
                    }}>
                      {s.label}
                    </span>
                  </div>

                  {/* Row 2 — tier + started date */}
                  <div>
                    <span style={{
                      display: 'inline-block',
                      fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                      background: isExpert ? 'rgba(15,45,82,0.08)' : 'var(--gold-subtle)',
                      color: isExpert ? 'var(--navy)' : 'var(--gold)',
                      marginBottom: 4,
                    }}>
                      {isExpert ? 'Expert Session' : 'Guided'}
                    </span>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                      Started {startedAt}
                    </p>
                  </div>

                  {/* Row 3 — progress */}
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>
                      {currentStep === 0 ? 'Ready to start' : `Step ${currentStep} of ${totalSteps} · ${progressPct}%`}
                    </p>
                    <div style={{ height: 3, background: 'var(--border)', borderRadius: 100 }}>
                      <div style={{ height: '100%', width: `${progressPct}%`, background: accentColor, borderRadius: 100, transition: 'width 300ms ease' }} />
                    </div>
                  </div>

                  {/* Row 4 — CTA link */}
                  <Link href={href} style={{ display: 'block', width: '100%', textDecoration: 'none' }}>
                    <div style={{
                      width: '100%', height: 40, borderRadius: 8,
                      background: accentColor, color: 'white',
                      fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginTop: 2, boxSizing: 'border-box',
                    }}>
                      {isExpert ? 'Prepare →' : 'Continue →'}
                    </div>
                  </Link>

                  {/* Upgrade link — guided only */}
                  {!isExpert && (
                    <Link
                      href={`/apply/review?applicationId=${app.id}&upgrade=true`}
                      style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', display: 'block', textDecoration: 'none', marginTop: 2 }}
                    >
                      Want expert help? Upgrade — $50
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
