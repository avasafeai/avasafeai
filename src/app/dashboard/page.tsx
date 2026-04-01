import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, Bell, ChevronRight, Plus, AlertTriangle } from 'lucide-react'
import Logo from '@/components/Logo'

const DOC_TYPE_LABELS: Record<string, string> = {
  us_passport: 'US Passport',
  indian_passport: 'Indian Passport',
  oci_card: 'OCI Card',
  renunciation: 'Renunciation Certificate',
  pan_card: 'PAN Card',
  address_proof: 'Address Proof',
  photo: 'Photo',
  signature: 'Signature',
}

function expiryStatus(expiresAt: string | null): 'ok' | 'warning' | 'critical' | null {
  if (!expiresAt) return null
  const diff = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  if (diff < 90) return 'critical'
  if (diff < 180) return 'warning'
  return 'ok'
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [{ data: profile }, { data: docs }, { data: apps }, { data: alerts }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('alerts').select('*').eq('user_id', user.id).is('read_at', null).order('created_at', { ascending: false }),
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const unreadAlerts = alerts?.length ?? 0

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-background)' }}>
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r px-4 py-6 gap-1"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <Link href="/dashboard" className="mb-8 block px-3">
          <Logo />
        </Link>
        {[
          { href: '/dashboard', label: 'Dashboard', icon: FileText },
          { href: '/dashboard/documents', label: 'My Documents', icon: FileText },
          { href: '/dashboard/applications', label: 'Applications', icon: FileText },
          { href: '/dashboard/alerts', label: 'Alerts', icon: Bell, badge: unreadAlerts },
          { href: '/dashboard/account', label: 'Account', icon: FileText },
        ].map(({ href, label, icon: Icon, badge }) => (
          <Link key={href} href={href}
            className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-opacity-100"
            style={{ color: 'var(--color-text-secondary)' }}>
            <div className="flex items-center gap-2.5">
              <Icon size={15} />
              {label}
            </div>
            {badge ? (
              <span className="w-5 h-5 rounded-full text-xs font-medium flex items-center justify-center"
                style={{ background: 'var(--color-gold)', color: 'white' }}>
                {badge}
              </span>
            ) : null}
          </Link>
        ))}
      </aside>

      {/* Main */}
      <main className="flex-1 px-6 py-8 max-w-3xl">
        {/* Alerts */}
        {unreadAlerts > 0 && alerts && (
          <div className="mb-6 rounded-xl px-5 py-4 flex items-start gap-3"
            style={{ background: 'var(--color-warning-bg)', border: '1px solid rgba(146,64,14,0.2)' }}>
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-warning)' }} />
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--color-warning)' }}>
                {alerts[0].message}
              </p>
              {unreadAlerts > 1 && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-warning)' }}>
                  + {unreadAlerts - 1} more alert{unreadAlerts > 2 ? 's' : ''}
                </p>
              )}
            </div>
            <Link href="/dashboard/alerts" className="ml-auto text-xs font-medium flex-shrink-0"
              style={{ color: 'var(--color-warning)' }}>
              View all →
            </Link>
          </div>
        )}

        {/* Welcome */}
        <h1 className="font-display text-2xl font-semibold mb-1" style={{ color: 'var(--color-navy)' }}>
          {unreadAlerts === 0 ? `Welcome back, ${firstName}.` : `Hi, ${firstName}.`}
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
          Your document locker and applications, all in one place.
        </p>

        {/* Documents */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Document Locker</h2>
            <Link href="/dashboard/documents/add"
              className="flex items-center gap-1 text-sm font-medium"
              style={{ color: 'var(--color-navy)' }}>
              <Plus size={14} /> Add document
            </Link>
          </div>

          {!docs || docs.length === 0 ? (
            <div className="card text-center py-10"
              style={{ background: 'var(--color-surface)', borderStyle: 'dashed' }}>
              <p className="font-display italic text-base mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                Your locker is ready.
              </p>
              <p className="text-sm mb-5" style={{ color: 'var(--color-text-tertiary)' }}>
                Add your Indian passport and OCI card so AVA can monitor everything
                and pre-fill your next application automatically.
              </p>
              <Link href="/dashboard/documents/add" className="btn-primary inline-block text-sm px-5 py-2.5">
                Add your first document
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {docs.map((doc) => {
                const status = expiryStatus(doc.expires_at)
                const extractedData = doc.extracted_data as Record<string, string> | null
                return (
                  <Link key={doc.id} href={`/dashboard/documents/${doc.id}`}
                    className="card flex items-start justify-between gap-4 hover:shadow-md transition-shadow">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                          {DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}
                        </p>
                        {status === 'critical' && (
                          <span className="text-xs px-1.5 py-0.5 rounded"
                            style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)' }}>
                            Expires soon
                          </span>
                        )}
                        {status === 'warning' && (
                          <span className="text-xs px-1.5 py-0.5 rounded"
                            style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
                            Expires in 6mo
                          </span>
                        )}
                      </div>
                      {extractedData?.full_name && (
                        <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                          {extractedData.full_name}
                        </p>
                      )}
                      {doc.expires_at && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                          Expires {new Date(doc.expires_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-text-tertiary)' }} />
                  </Link>
                )
              })}
              <Link href="/dashboard/documents/add"
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 text-sm transition-colors hover:border-navy"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <Plus size={16} /> Add document
              </Link>
            </div>
          )}
        </section>

        {/* Applications */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Applications</h2>
            <Link href="/apply" className="flex items-center gap-1 text-sm font-medium"
              style={{ color: 'var(--color-navy)' }}>
              <Plus size={14} /> Start application
            </Link>
          </div>

          {!apps || apps.length === 0 ? (
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
                    Ready to apply for your OCI card?
                  </p>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    AVA has everything she needs from your locker.
                  </p>
                </div>
                <Link href="/apply/oci_new" className="btn-gold text-sm px-4 py-2.5 rounded-lg whitespace-nowrap ml-4">
                  Start now →
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {apps.slice(0, 5).map((app) => (
                <Link key={app.id} href={`/apply/${app.service_type}/status`}
                  className="card flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {app.service_type === 'oci_new' ? 'OCI Card (New)'
                        : app.service_type === 'oci_renewal' ? 'OCI Card (Renewal)'
                        : 'Passport Renewal'}
                    </p>
                    <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--color-text-secondary)' }}>
                      {app.status.replace(/_/g, ' ')} ·{' '}
                      {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <StatusBadge status={app.status} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    draft:              { label: 'Draft',         bg: 'var(--color-border)',      color: 'var(--color-text-secondary)' },
    locker_ready:       { label: 'Ready',          bg: 'rgba(15,45,82,0.08)',      color: 'var(--color-navy)' },
    validated:          { label: 'Validated',      bg: 'rgba(15,45,82,0.08)',      color: 'var(--color-navy)' },
    paid:               { label: 'Paid',           bg: 'rgba(201,136,42,0.1)',     color: 'var(--color-gold)' },
    package_generated:  { label: 'Package ready',  bg: 'rgba(201,136,42,0.1)',     color: 'var(--color-gold)' },
    submitted:          { label: 'Submitted',      bg: 'var(--color-success-bg)',  color: 'var(--color-success)' },
    approved:           { label: 'Approved',       bg: 'var(--color-success-bg)',  color: 'var(--color-success)' },
  }
  const s = map[status] ?? { label: status, bg: 'var(--color-border)', color: 'var(--color-text-secondary)' }
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}
