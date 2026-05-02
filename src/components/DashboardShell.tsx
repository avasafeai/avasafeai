import Link from 'next/link'
import { LayoutDashboard, FileText, ClipboardList, Bell, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import SidebarSignOut from './SidebarSignOut'
import { BETA_MODE } from '@/lib/beta'

interface DashboardShellProps {
  children: React.ReactNode
  activePage: 'dashboard' | 'documents' | 'applications' | 'alerts' | 'account'
  pageTitle: string
  topBarActions?: React.ReactNode
}

const NAV_ITEMS = [
  { id: 'dashboard',    href: '/dashboard',              label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'documents',    href: '/dashboard/documents',    label: 'My Documents', icon: FileText },
  { id: 'applications', href: '/dashboard/applications', label: 'Applications', icon: ClipboardList },
  { id: 'alerts',       href: '/dashboard/alerts',       label: 'Alerts',       icon: Bell },
  { id: 'account',      href: '/dashboard/account',      label: 'Account',      icon: User },
]

export default async function DashboardShell({
  children,
  activePage,
  pageTitle,
  topBarActions,
}: DashboardShellProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get unread alert count for badge and beta status
  const [{ data: unreadAlerts }, { data: profile }] = await Promise.all([
    supabase
      .from('alerts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user?.id ?? '')
      .is('read_at', null),
    supabase
      .from('profiles')
      .select('is_beta, beta_number')
      .eq('id', user?.id ?? '')
      .single() as unknown as Promise<{ data: { is_beta?: boolean; beta_number?: number | null } | null }>,
  ])

  const unreadCount = (unreadAlerts as unknown as { count: number } | null)?.count ?? 0
  const isBeta = (profile as { is_beta?: boolean } | null)?.is_beta ?? false
  const betaNumber = (profile as { beta_number?: number | null } | null)?.beta_number ?? null

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  const isAdmin = adminEmails.length > 0 && adminEmails.includes(user?.email ?? '')

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--off-white)' }}>

      {/* ── Sidebar (desktop) ───────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0"
        style={{
          width: 260,
          background: 'var(--navy)',
          minHeight: '100vh',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        {/* Wordmark */}
        <div style={{ padding: '28px 24px 24px' }}>
          <Link href="/dashboard" aria-label="Avasafe AI" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 0 }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 26,
                lineHeight: 1,
                letterSpacing: '-0.02em',
                color: 'white',
              }}>ava</span>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 26,
                lineHeight: 1,
                letterSpacing: '-0.02em',
                color: 'var(--gold)',
              }}>safe</span>
            </span>
            {BETA_MODE && (
              <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Beta
              </span>
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3 flex-1">
          {NAV_ITEMS.map(({ id, href, label, icon: Icon }) => {
            const isActive = activePage === id
            const showBadge = id === 'alerts' && unreadCount > 0
            return (
              <Link
                key={id}
                href={href}
                className={`sidebar-item${isActive ? ' active' : ''}`}
                style={{ justifyContent: 'space-between' }}
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={18} />
                  {label}
                </span>
                {showBadge && (
                  <span style={{
                    background: 'var(--gold)',
                    color: 'white',
                    borderRadius: '100px',
                    fontSize: 11,
                    fontWeight: 600,
                    minWidth: 20,
                    height: 20,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 6px',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Admin link — only visible to admin users */}
        {isAdmin && (
          <div style={{ margin: '4px 12px 4px', padding: '10px 14px' }}>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 }} />
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>
              Admin
            </p>
            <Link
              href="/admin"
              style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}
            >
              View admin dashboard →
            </Link>
          </div>
        )}

        {/* Beta badge */}
        {isBeta && (
          <div style={{ margin: '8px 12px 4px', padding: '10px 14px', borderRadius: 10, background: 'rgba(201,136,42,0.12)', border: '1px solid rgba(201,136,42,0.25)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold)', marginBottom: 2 }}>
              Beta member{betaNumber ? ` #${betaNumber}` : ''}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
              Free Guided access. Thank you for being early.
            </p>
          </div>
        )}

        {/* User avatar + sign out */}
        {user?.email && <SidebarSignOut email={user.email} />}
      </aside>

      {/* ── Main area ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top bar */}
        <header
          className="md:hidden flex items-center justify-between px-4"
          style={{
            height: 56,
            background: 'var(--navy)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          <Link href="/dashboard" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 0 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'white' }}>ava</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--gold)' }}>safe</span>
            </span>
            {BETA_MODE && (
              <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Beta
              </span>
            )}
          </Link>
          {/* Mobile nav: icon-only row */}
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map(({ id, href, icon: Icon }) => {
              const isActive = activePage === id
              const showBadge = id === 'alerts' && unreadCount > 0
              return (
                <Link
                  key={id}
                  href={href}
                  style={{
                    position: 'relative',
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isActive ? 'var(--gold-light)' : 'rgba(255,255,255,0.55)',
                    background: isActive ? 'rgba(201,136,42,0.15)' : 'transparent',
                    textDecoration: 'none',
                  }}
                >
                  <Icon size={18} />
                  {showBadge && (
                    <span style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--gold)',
                    }} />
                  )}
                </Link>
              )
            })}
          </div>
        </header>

        {/* Desktop top bar */}
        <div
          className="hidden md:flex items-center justify-between px-8 flex-shrink-0"
          style={{
            height: 64,
            background: 'white',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 20,
            color: 'var(--navy)',
            margin: 0,
          }}>
            {pageTitle}
          </h1>
          {topBarActions && (
            <div className="flex items-center gap-3">
              {topBarActions}
            </div>
          )}
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 md:p-8" style={{ maxWidth: '100%' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
