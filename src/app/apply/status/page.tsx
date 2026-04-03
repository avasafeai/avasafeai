import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { CheckCircle, Circle, Clock, ClipboardList, Plus } from 'lucide-react'

const STATUS_TIMELINE = [
  { key: 'paid',              label: 'Payment received',    desc: 'Your application fee has been received.' },
  { key: 'package_generated', label: 'Package prepared',    desc: 'AVA has prepared your complete application package.' },
  { key: 'submitted',         label: 'Submitted to VFS',    desc: 'Your physical package has been received at VFS.' },
  { key: 'approved',          label: 'Approved',            desc: 'Your application has been approved.' },
]

const STATUS_ORDER = ['draft', 'locker_ready', 'form_complete', 'validated', 'paid', 'package_generated', 'submitted', 'approved']

const SERVICE_LABELS: Record<string, string> = {
  oci_new:          'OCI Card — New Application',
  oci_renewal:      'OCI Card — Renewal',
  passport_renewal: 'Indian Passport Renewal',
}

export default async function StatusPage({
  searchParams,
}: {
  searchParams: { id?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // If a specific id is provided, load that application
  let app = null
  if (searchParams.id) {
    const { data } = await supabase
      .from('applications')
      .select('*')
      .eq('id', searchParams.id)
      .eq('user_id', user.id)
      .maybeSingle()
    app = data
  } else {
    // Fall back to the most recent application
    const { data } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    app = data
  }

  // Empty state — no application found
  if (!app) {
    return (
      <DashboardShell activePage="applications" pageTitle="Application Status">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <ClipboardList size={32} color="var(--text-tertiary)" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 24, color: 'var(--navy)', marginBottom: 10 }}>
            No application in progress
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 28, maxWidth: 360 }}>
            Start a new application below.
          </p>
          <Link href="/apply" className="btn-navy">
            <Plus size={16} /> Start application
          </Link>
        </div>
      </DashboardShell>
    )
  }

  const currentIndex = STATUS_ORDER.indexOf(app.status)

  return (
    <DashboardShell activePage="applications" pageTitle="Application Status">
      <div style={{ maxWidth: 640 }}>

        {/* App summary card */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 28, marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}>
          <p style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 6 }}>Service</p>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, color: 'var(--navy)', marginBottom: 16 }}>
            {SERVICE_LABELS[app.service_type] ?? app.service_type}
          </p>

          {app.vfs_reference && (
            <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '12px 16px', display: 'inline-block' }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 4 }}>VFS Reference</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--navy)' }}>{app.vfs_reference}</p>
            </div>
          )}

          {app.arn && (
            <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '12px 16px', display: 'inline-block', marginLeft: app.vfs_reference ? 12 : 0 }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Application Reference (ARN)</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--navy)' }}>{app.arn}</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--navy)', marginBottom: 24 }}>Progress</h2>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
            {STATUS_TIMELINE.map((s, i) => {
              const statusIdx = STATUS_ORDER.indexOf(s.key)
              const done = currentIndex >= statusIdx
              const active = currentIndex === statusIdx
              const isLast = i === STATUS_TIMELINE.length - 1

              return (
                <li key={s.key} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                  {/* Line */}
                  {!isLast && (
                    <div style={{
                      position: 'absolute', left: 15, top: 32, bottom: 0, width: 2,
                      background: done && !active ? 'var(--success)' : 'var(--border)',
                    }} />
                  )}

                  {/* Icon */}
                  <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1,
                    background: done ? (active ? 'var(--navy)' : 'var(--success)') : 'var(--surface)',
                    border: active ? '2px solid var(--navy)' : done ? 'none' : '2px solid var(--border)',
                  }}>
                    {done && !active
                      ? <CheckCircle size={16} color="white" />
                      : active
                      ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white', animation: 'pulse 2s ease-in-out infinite' }} />
                      : <Circle size={14} color="var(--text-tertiary)" />
                    }
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, paddingBottom: isLast ? 0 : 28 }}>
                    <p style={{ fontSize: 15, fontWeight: done ? 600 : 400, color: done ? 'var(--text-primary)' : 'var(--text-tertiary)', marginBottom: 3 }}>
                      {s.label}
                    </p>
                    {active && (
                      <p style={{ fontSize: 13, color: 'var(--navy)', fontWeight: 500 }}>In progress...</p>
                    )}
                    {done && !active && (
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.desc}</p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        {/* Notification note */}
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Clock size={14} color="var(--text-tertiary)" />
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
            AVA will notify you by email at every stage.
          </p>
        </div>
      </div>
    </DashboardShell>
  )
}
