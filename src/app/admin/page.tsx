'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Star, Users, FileText, MessageSquare, TrendingUp, BarChart2 } from 'lucide-react'

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)

interface FeedbackRow {
  id: string
  created_at: string
  rating: number
  note: string | null
  tags: string[] | null
  trigger_location: string | null
  service_type: string | null
  user_id: string
}

interface Stats {
  totalUsers: number
  totalApplications: number
  totalDocuments: number
  avgRating: number | null
  feedbackCount: number
  ratingDist: Record<number, number>
}

const EMOJIS: Record<number, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😍' }

export default function AdminPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [feedback, setFeedback] = useState<FeedbackRow[]>([])

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth'); return }

      const isAdmin = ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes(user.email ?? '')
      if (!isAdmin) { router.replace('/dashboard'); return }
      setAuthed(true)

      // Load stats
      const [
        { count: userCount },
        { count: appCount },
        { count: docCount },
        { data: fb },
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('applications').select('id', { count: 'exact', head: true }),
        supabase.from('documents').select('id', { count: 'exact', head: true }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('feedback').select('*').order('created_at', { ascending: false }).limit(100),
      ])

      const feedbackRows = (fb ?? []) as unknown as FeedbackRow[]
      setFeedback(feedbackRows)

      const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      let ratingSum = 0
      for (const row of feedbackRows) {
        ratingDist[row.rating] = (ratingDist[row.rating] ?? 0) + 1
        ratingSum += row.rating
      }
      const avgRating = feedbackRows.length > 0 ? ratingSum / feedbackRows.length : null

      setStats({
        totalUsers: userCount ?? 0,
        totalApplications: appCount ?? 0,
        totalDocuments: docCount ?? 0,
        avgRating,
        feedbackCount: feedbackRows.length,
        ratingDist,
      })
      setLoading(false)
    }
    init()
  }, [router])

  if (!authed || loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#FAFAF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>Loading…</p>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#FAFAF8', padding: '48px 24px', fontFamily: 'var(--font-body)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--color-navy)', marginBottom: 8 }}>
          Admin Dashboard
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 40 }}>
          Avasafe AI — internal metrics
        </p>

        {/* Stats grid */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 40 }}>
            {[
              { icon: <Users size={18} />, label: 'Users', value: stats.totalUsers },
              { icon: <FileText size={18} />, label: 'Applications', value: stats.totalApplications },
              { icon: <BarChart2 size={18} />, label: 'Documents', value: stats.totalDocuments },
              { icon: <MessageSquare size={18} />, label: 'Feedback', value: stats.feedbackCount },
              {
                icon: <Star size={18} />,
                label: 'Avg rating',
                value: stats.avgRating !== null ? `${stats.avgRating.toFixed(1)} / 5` : 'N/A',
              },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{ background: 'white', borderRadius: 12, padding: '20px 24px', border: '1px solid var(--color-border)' }}>
                <div style={{ color: 'var(--color-navy)', marginBottom: 8 }}>{icon}</div>
                <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-navy)', marginBottom: 2 }}>{value}</p>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Rating distribution */}
        {stats && stats.feedbackCount > 0 && (
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--color-border)', padding: '24px', marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <TrendingUp size={18} color="var(--color-navy)" />
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-navy)' }}>Rating distribution</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[5, 4, 3, 2, 1].map(r => {
                const count = stats.ratingDist[r] ?? 0
                const pct = stats.feedbackCount > 0 ? (count / stats.feedbackCount) * 100 : 0
                return (
                  <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{EMOJIS[r]}</span>
                    <div style={{ flex: 1, height: 8, background: '#F3F4F6', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-navy)', borderRadius: 100, transition: 'width 400ms ease' }} />
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', minWidth: 40, textAlign: 'right' }}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Feedback table */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={18} color="var(--color-navy)" />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-navy)' }}>Recent feedback</h2>
          </div>

          {feedback.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 14 }}>
              No feedback yet.
            </div>
          ) : (
            <div>
              {feedback.map(row => (
                <div key={row.id} style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{EMOJIS[row.rating] ?? '❓'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: row.note ? 6 : 0 }}>
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
                      <p style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.6, margin: 0 }}>
                        {row.note}
                      </p>
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
