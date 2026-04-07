import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { CheckCircle, Circle, Clock, ClipboardList, Plus } from 'lucide-react'
import { getService } from '@/lib/services/registry'

const STATUS_TIMELINE = [
  {
    key: 'validated',
    label: 'Application prepared',
    desc: 'AVA validated your application against 10 rejection rules.',
    statusKeys: ['validated', 'paid', 'package_generated', 'submitted', 'approved'],
  },
  {
    key: 'paid',
    label: 'Validated by AVA',
    desc: 'Payment received and application confirmed.',
    statusKeys: ['paid', 'package_generated', 'submitted', 'approved'],
  },
  {
    key: 'package_generated',
    label: 'Government portal submitted',
    desc: 'AVA completed your government portal application.',
    statusKeys: ['package_generated', 'submitted', 'approved'],
  },
  {
    key: 'submitted',
    label: 'VFS portal submitted',
    desc: 'AVA registered your application on VFS and generated your shipping label.',
    statusKeys: ['submitted', 'approved'],
  },
  {
    key: 'mailed',
    label: 'Package mailed',
    desc: 'Your physical package is on its way to VFS.',
    statusKeys: ['approved'],
    extraField: 'tracking_number',
  },
  {
    key: 'processing',
    label: 'Processing at VFS',
    desc: 'VFS is reviewing your submitted documents.',
    statusKeys: [],
  },
  {
    key: 'consulate',
    label: 'Forwarded to consulate',
    desc: 'Your application has been forwarded to the Indian consulate for review.',
    statusKeys: [],
  },
  {
    key: 'approved',
    label: 'OCI card issued',
    desc: 'Your OCI card has been issued and dispatched.',
    statusKeys: ['approved'],
  },
]

// Status order for index comparison
const STATUS_ORDER = [
  'draft', 'locker_ready', 'form_complete', 'validated', 'paid',
  'package_generated', 'submitted', 'approved',
]

const STAGE_STATUS_MAP: Record<string, string> = {
  validated:        'validated',
  paid:             'paid',
  package_generated:'package_generated',
  submitted:        'submitted',
  mailed:           'submitted',  // mailed is inferred from tracking_number
  processing:       'submitted',
  consulate:        'submitted',
  approved:         'approved',
}


export default async function StatusPage({
  searchParams,
}: {
  searchParams: { id?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  let app: Record<string, unknown> | null = null
  if (searchParams.id) {
    const { data } = await supabase
      .from('applications')
      .select('*')
      .eq('id', searchParams.id)
      .eq('user_id', user.id)
      .maybeSingle()
    app = data
  } else {
    const { data } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    app = data
  }

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

  const currentIndex = STATUS_ORDER.indexOf(app.status as string)
  const hasMailed = !!(app as Record<string, unknown>).tracking_number

  function isStageComplete(stageKey: string): boolean {
    if (stageKey === 'mailed') return hasMailed
    if (stageKey === 'processing') return false // always future unless explicitly set
    if (stageKey === 'consulate') return false
    const mappedStatus = STAGE_STATUS_MAP[stageKey]
    if (!mappedStatus) return false
    const mappedIndex = STATUS_ORDER.indexOf(mappedStatus)
    return currentIndex > mappedIndex
  }

  function isStageCurrent(stageKey: string): boolean {
    if (stageKey === 'mailed') return app!.status === 'submitted' && !hasMailed
    if (stageKey === 'processing') return app!.status === 'submitted' && hasMailed
    if (stageKey === 'consulate') return false
    const mappedStatus = STAGE_STATUS_MAP[stageKey]
    if (!mappedStatus) return false
    const mappedIndex = STATUS_ORDER.indexOf(mappedStatus)
    return currentIndex === mappedIndex
  }

  const a = app as Record<string, string>

  return (
    <DashboardShell activePage="applications" pageTitle="Application Status">
      <div style={{ maxWidth: 640 }}>

        {/* App summary card */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 28, marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}>
          <p style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 6 }}>Service</p>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, color: 'var(--navy)', marginBottom: 16 }}>
            {getService(a.service_type)?.name ?? a.service_type}
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {a.vfs_reference && (
              <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '12px 16px' }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 4 }}>VFS Reference</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>{a.vfs_reference}</p>
              </div>
            )}
            {a.arn && (
              <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '12px 16px' }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Application Reference (ARN)</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>{a.arn}</p>
              </div>
            )}
            {a.registration_number && (
              <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '12px 16px' }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Registration Number</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>{a.registration_number}</p>
              </div>
            )}
            {a.tracking_number && (
              <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '12px 16px' }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 4 }}>UPS Tracking</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>{a.tracking_number}</p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--navy)', marginBottom: 24 }}>Progress</h2>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
            {STATUS_TIMELINE.map((s, i) => {
              const done = isStageComplete(s.key)
              const active = isStageCurrent(s.key)
              const isLast = i === STATUS_TIMELINE.length - 1

              return (
                <li key={s.key} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                  {/* Connector line */}
                  {!isLast && (
                    <div style={{
                      position: 'absolute', left: 15, top: 32, bottom: 0, width: 2,
                      background: done ? 'var(--success)' : 'var(--border)',
                    }} />
                  )}

                  {/* Icon */}
                  <div style={{
                    flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', zIndex: 1,
                    background: done ? 'var(--success)' : active ? 'var(--navy)' : 'var(--surface)',
                    border: active ? 'none' : done ? 'none' : '2px solid var(--border)',
                  }}>
                    {done
                      ? <CheckCircle size={16} color="white" />
                      : active
                      ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white', animation: 'pulse 2s ease-in-out infinite' }} />
                      : <Circle size={14} color="var(--text-tertiary)" />
                    }
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, paddingBottom: isLast ? 0 : 28 }}>
                    <p style={{ fontSize: 15, fontWeight: done || active ? 600 : 400, color: done || active ? 'var(--text-primary)' : 'var(--text-tertiary)', marginBottom: 3 }}>
                      {s.label}
                    </p>
                    {active && (
                      <p style={{ fontSize: 13, color: 'var(--navy)', fontWeight: 500 }}>In progress…</p>
                    )}
                    {done && (
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
