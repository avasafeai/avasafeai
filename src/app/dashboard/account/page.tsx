import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/DashboardShell'
import DeleteAccountButton from './DeleteAccountButton'
import PlanUpgradeButton from './PlanUpgradeButton'
import SignOutButton from './SignOutButton'

const PLAN_LABELS: Record<string, string> = {
  free:           'Free',
  locker:         'Locker',
  guided:         'Guided',
  human_assisted: 'Human Assisted',
}

export default async function AccountPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const plan = profile?.plan ?? 'locker'
  const planLabel = PLAN_LABELS[plan] ?? plan
  const planExpires = profile?.plan_expires
    ? new Date(profile.plan_expires).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <DashboardShell activePage="account" pageTitle="Account">
      <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Profile */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--navy)', marginBottom: 20 }}>Profile</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Full name</p>
              <p style={{ fontSize: 16, color: 'var(--text-primary)' }}>{profile?.full_name ?? '—'}</p>
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Email</p>
              <p style={{ fontSize: 16, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{user.email}</p>
            </div>
            {profile?.phone && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Phone</p>
                <p style={{ fontSize: 16, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{profile.phone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Plan */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--navy)', marginBottom: 16 }}>Plan</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--text-primary)' }}>{planLabel}</p>
              {planExpires && (
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>Renews {planExpires}</p>
              )}
            </div>
            {(plan === 'free' || plan === 'locker') && <PlanUpgradeButton targetPlan="locker" currentPlan={plan} />}
          </div>
        </div>

        {/* Notifications (UI only) */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--navy)', marginBottom: 16 }}>Notifications</h2>
          {(['Email notifications', 'WhatsApp updates'] as const).map(label => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: label === 'Email notifications' ? '1px solid var(--border)' : 'none' }}>
              <p style={{ fontSize: 15, color: 'var(--text-primary)' }}>{label}</p>
              {/* Toggle — UI only */}
              <div style={{ width: 44, height: 24, borderRadius: 100, background: 'var(--gold)', display: 'flex', alignItems: 'center', padding: '0 3px', justifyContent: 'flex-end', cursor: 'pointer' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Session */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--navy)', marginBottom: 16 }}>Session</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
            You&apos;re signed in as <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{user.email}</span>
          </p>
          <SignOutButton />
        </div>

        {/* Danger zone */}
        <div style={{ border: '1px solid rgba(220,38,38,0.25)', borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--error)', marginBottom: 8 }}>Danger zone</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.6 }}>
            Permanently deletes your account, all documents, all extracted data, and all applications. This cannot be undone.
          </p>
          <DeleteAccountButton />
        </div>
      </div>
    </DashboardShell>
  )
}
