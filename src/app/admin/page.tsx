import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Star, Users, FileText, MessageSquare, TrendingUp, BarChart2 } from 'lucide-react'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
const EMOJIS: Record<number, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😍' }

interface FeedbackRow {
  id: string
  created_at: string
  rating: number
  note: string | null
  tags: string[] | null
  trigger_location: string | null
  service_type: string | null
}

interface ProfileRow {
  id: string
  plan: string
  created_at: string
  email?: string
}

export default async function AdminPage() {
  // Auth check — regular client for session only
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const isAdmin = ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(user.email ?? '')
  if (!isAdmin) redirect('/dashboard')

  // All data queries use service-role client — bypasses RLS
  const supabaseAdmin = createAdminClient()

  const [
    { count: userCount },
    { count: appCount },
    { count: docCount },
    { data: feedbackData },
    { data: ratingData },
    { data: recentProfiles },
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('applications').select('*', { count: 'exact', head: true }).not('stripe_payment_id', 'is', null),
    supabaseAdmin.from('documents').select('*', { count: 'exact', head: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabaseAdmin as any).from('feedback').select('*').order('created_at', { ascending: false }).limit(20),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabaseAdmin as any).from('feedback').select('rating'),
    supabaseAdmin.from('profiles').select('id, plan, created_at').order('created_at', { ascending: false }).limit(10),
  ])

  // Map emails onto profiles via auth.admin.listUsers
  let userEmailMap: Record<string, string> = {}
  try {
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    userEmailMap = Object.fromEntries(users.map(u => [u.id, u.email ?? '']))
  } catch { /* non-fatal */ }

  const feedback = (feedbackData ?? []) as FeedbackRow[]
  const ratings = (ratingData ?? []) as { rating: number }[]
  const profiles = (recentProfiles ?? []) as ProfileRow[]

  const recentUsers: ProfileRow[] = profiles.map(p => ({
    ...p,
    email: userEmailMap[p.id] ?? '',
  }))

  const avgRating = ratings.length
    ? (ratings.reduce((sum, f) => sum + f.rating, 0) / ratings.length).toFixed(1)
    : null

  const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const { rating } of ratings) {
    ratingDist[rating] = (ratingDist[rating] ?? 0) + 1
  }

  return (
    <main style={{ minHeight: '100vh', background: '#FAFAF8', padding: '48px 24px', fontFamily: 'var(--font-body)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--color-navy)', marginBottom: 8 }}>
          Admin Dashboard
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 40 }}>
          Avasafe AI internal metrics
        </p>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 40 }}>
          {[
            { icon: <Users size={18} />, label: 'Total users', value: userCount ?? 0 },
            { icon: <FileText size={18} />, label: 'Paid applications', value: appCount ?? 0 },
            { icon: <BarChart2 size={18} />, label: 'Documents', value: docCount ?? 0 },
            { icon: <MessageSquare size={18} />, label: 'Feedback', value: ratings.length },
            { icon: <Star size={18} />, label: 'Avg rating', value: avgRating ? `${avgRating} / 5` : 'N/A' },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ background: 'white', borderRadius: 12, padding: '20px 24px', border: '1px solid var(--color-border)' }}>
              <div style={{ color: 'var(--color-navy)', marginBottom: 8 }}>{icon}</div>
              <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-navy)', marginBottom: 2 }}>{value}</p>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Rating distribution */}
        {ratings.length > 0 && (
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--color-border)', padding: '24px', marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <TrendingUp size={18} color="var(--color-navy)" />
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-navy)' }}>Rating distribution</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[5, 4, 3, 2, 1].map(r => {
                const count = ratingDist[r] ?? 0
                const pct = ratings.length > 0 ? (count / ratings.length) * 100 : 0
                return (
                  <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{EMOJIS[r]}</span>
                    <div style={{ flex: 1, height: 8, background: '#F3F4F6', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-navy)', borderRadius: 100 }} />
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', minWidth: 40, textAlign: 'right' }}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent signups */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--color-border)', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} color="var(--color-navy)" />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-navy)' }}>Recent signups</h2>
          </div>
          {recentUsers.length === 0 ? (
            <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 14 }}>No users yet.</div>
          ) : (
            <div>
              {recentUsers.map(u => (
                <div key={u.id} style={{ padding: '12px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 14, color: 'var(--color-text-primary)', margin: 0 }}>{u.email || '—'}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', margin: '2px 0 0' }}>
                      {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: '#F3F4F6', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {u.plan}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feedback table */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={18} color="var(--color-navy)" />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-navy)' }}>Recent feedback</h2>
          </div>
          {feedback.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 14 }}>No feedback yet.</div>
          ) : (
            <div>
              {feedback.map(row => (
                <div key={row.id} style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{EMOJIS[row.rating] ?? '❓'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: row.note ? 6 : 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-navy)' }}>{row.rating}/5</span>
                      {row.trigger_location && (
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: '#F3F4F6', color: 'var(--color-text-secondary)' }}>
                          {row.trigger_location}
                        </span>
                      )}
                      {row.service_type && (
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: '#EFF6FF', color: '#1D4ED8' }}>
                          {row.service_type}
                        </span>
                      )}
                      {(row.tags ?? []).map(tag => (
                        <span key={tag} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: '#FEF9EC', color: '#92400E' }}>{tag}</span>
                      ))}
                    </div>
                    {row.note && (
                      <p style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.6, margin: 0 }}>{row.note}</p>
                    )}
                    <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                      {new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
