import Link from 'next/link'
import { LayoutDashboard, FileText, ClipboardList, Bell, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

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

  // Get unread alert count for badge
  const { data: unreadAlerts } = await supabase
    .from('alerts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user?.id ?? '')
    .is('read_at', null)

  const unreadCount = (unreadAlerts as unknown as { count: number } | null)?.count ?? 0

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
          <Link href="/" aria-label="Avasafe AI" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'baseline', gap: 0 }}>
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

        {/* User email at bottom */}
        {user?.email && (
          <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.4)',
              fontFamily: 'var(--font-body)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {user.email}
            </p>
          </div>
        )}
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
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'baseline', gap: 0 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'white' }}>ava</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--gold)' }}>safe</span>
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
