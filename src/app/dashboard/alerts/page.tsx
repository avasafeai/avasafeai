import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { Bell, AlertTriangle, CheckCircle } from 'lucide-react'
import MarkReadButton from './MarkReadButton'
import UpgradePrompt from '@/components/UpgradePrompt'
import type { Plan } from '@/lib/plan-utils'
import { PLAN_LIMITS } from '@/lib/plan-utils'

export default async function AlertsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [alertsRes, profileRes] = await Promise.all([
    supabase.from('alerts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('profiles').select('plan').eq('id', user.id).single(),
  ])

  const plan = ((profileRes.data?.plan) ?? 'free') as Plan
  const alertsEnabled = PLAN_LIMITS[plan].alertsEnabled

  const alerts = alertsRes.data
  const unread = alerts?.filter(a => !a.read_at) ?? []
  const read = alerts?.filter(a => a.read_at) ?? []

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (!alertsEnabled) {
    return (
      <DashboardShell activePage="alerts" pageTitle="Alerts">
        <div style={{ position: 'relative', maxWidth: 680 }}>
          {/* Greyed-out preview cards */}
          <div style={{ opacity: 0.3, pointerEvents: 'none', userSelect: 'none', marginBottom: 24 }}>
            {[
              'Your Indian passport expires in 8 months — start renewal soon.',
              'Your OCI card expires in 3 months — apply for renewal.',
            ].map((msg, i) => (
              <div key={i} style={{
                background: 'white', border: '1px solid var(--border)', borderLeft: '3px solid var(--warning)',
                borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14,
                boxShadow: 'var(--shadow-sm)', marginBottom: 8,
              }}>
                <AlertTriangle size={18} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.5 }}>{msg}</p>
              </div>
            ))}
          </div>

          {/* Upgrade overlay */}
          <UpgradePrompt
            title="Upgrade to receive smart alerts before documents expire"
            body="AVA monitors all your documents and notifies you months before expiry — so you never miss a renewal. Available on Locker and above."
            buttonText="Upgrade to Locker"
            targetPlan="locker"
          />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell activePage="alerts" pageTitle="Alerts">
      {(!alerts || alerts.length === 0) ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <CheckCircle size={32} color="var(--success)" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 24, color: 'var(--navy)', marginBottom: 10 }}>All caught up</h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 360 }}>
            No alerts right now. AVA will notify you when any documents are approaching expiry.
          </p>
        </div>
      ) : (
        <div style={{ maxWidth: 680 }}>
          {unread.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Unread ({unread.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {unread.map(alert => (
                  <div key={alert.id} style={{
                    background: 'white', border: '1px solid var(--border)', borderLeft: '3px solid var(--warning)',
                    borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14,
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    <AlertTriangle size={18} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.5 }}>{alert.message}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                        {fmtDate(alert.created_at)}
                      </p>
                      {alert.document_id && (
                        <Link href={`/dashboard/documents/${alert.document_id}`} style={{ fontSize: 13, color: 'var(--gold)', textDecoration: 'none', marginTop: 6, display: 'inline-block' }}>
                          View document →
                        </Link>
                      )}
                    </div>
                    <MarkReadButton alertId={alert.id} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {read.length > 0 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Past alerts
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {read.map(alert => (
                  <div key={alert.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <Bell size={15} color="var(--text-tertiary)" style={{ flexShrink: 0, marginTop: 3 }} />
                    <div>
                      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{alert.message}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>
                        {fmtDate(alert.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  )
}
