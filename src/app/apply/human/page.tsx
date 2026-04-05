'use client'

import { useEffect, useState } from 'react'
import { InlineWidget } from 'react-calendly'
import { ShieldCheck, CheckCircle } from 'lucide-react'
import Logo from '@/components/Logo'

export default function HumanBookingPage() {
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL ?? ''

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlId = urlParams.get('applicationId')
    setApplicationId(urlId ?? sessionStorage.getItem('application_id'))
  }, [])

  return (
    <main style={{ minHeight: '100vh', background: 'var(--off-white)' }}>
      {/* Progress bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, background: 'var(--border)', zIndex: 50 }}>
        <div style={{ height: '100%', background: 'var(--navy)', width: '100%', transition: 'width 600ms ease' }} />
      </div>

      <header style={{ position: 'sticky', top: 0, background: 'rgba(250,250,248,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', height: 64, display: 'flex', alignItems: 'center', padding: '0 24px', zIndex: 40 }}>
        <Logo size="sm" href="/dashboard" />
      </header>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* AVA message */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderLeft: '3px solid var(--gold)', borderRadius: 16, padding: 24, marginBottom: 28, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>A</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--gold)' }}>AVA</span>
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 17, color: 'var(--text-primary)', lineHeight: 1.6 }}>
            Your application is ready. Book your 45-minute session and an Avasafe expert will guide you through every remaining step on a live screen share.
          </p>
        </div>

        {/* What happens in the session */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 16 }}>What happens in your session</p>
          {[
            'Your expert reviews your validated application before the session',
            'Live screen share on Zoom — your expert guides every step',
            'You log in to both portals yourself, your passwords stay private',
            'Expert is on the call until submission is confirmed',
            'Full support until your card arrives',
          ].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
              <CheckCircle size={14} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>

        {/* Calendly embed */}
        {calendlyUrl ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', marginBottom: 24 }}>
            <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--navy)', marginBottom: 4 }}>Book your expert session</p>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', paddingBottom: 16 }}>45 minutes. Zoom. Priority 48-hour booking for Human Assisted members.</p>
            </div>
            <InlineWidget
              url={calendlyUrl}
              styles={{ height: 680 }}
              prefill={{
                customAnswers: {
                  a1: applicationId ?? '',
                },
              }}
            />
          </div>
        ) : (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 32, textAlign: 'center', boxShadow: 'var(--shadow-sm)', marginBottom: 24 }}>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 8 }}>Booking is not configured yet.</p>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Set NEXT_PUBLIC_CALENDLY_URL in your environment to enable booking.</p>
          </div>
        )}

        {/* Guarantee */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 20px', background: 'var(--gold-subtle)', borderRadius: 12, border: '1px solid rgba(201,136,42,0.2)' }}>
          <ShieldCheck size={18} color="var(--gold)" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Rejection guarantee included.</strong>{' '}
            If our validation causes a rejection, we fix it at no cost. Support continues until your card arrives.
          </p>
        </div>

      </div>
    </main>
  )
}
