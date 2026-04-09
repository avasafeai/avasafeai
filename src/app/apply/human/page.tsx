'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { InlineWidget } from 'react-calendly'
import { ShieldCheck, CheckCircle, CheckCheck, Calendar } from 'lucide-react'
import Logo from '@/components/Logo'
import { createClient } from '@/lib/supabase/client'

export default function HumanBookingPage() {
  const router = useRouter()
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [serviceType, setServiceType] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [pollingState, setPollingState] = useState<'checking' | 'polling' | 'ready' | 'timeout'>('checking')
  const [bookingConfirmed, setBookingConfirmed] = useState(false)
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false)
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL ?? ''

  useEffect(() => {
    async function init() {
      const params = new URLSearchParams(window.location.search)
      const sessionId = params.get('session_id')
      const appId = params.get('applicationId')
      if (params.get('upgraded') === 'true') setShowUpgradeBanner(true)
      const svcType = params.get('service_type') ?? sessionStorage.getItem('service_type')
      if (svcType) setServiceType(svcType)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth'); return }
      setUserEmail(user.email ?? null)

      // Case B — applicationId already known
      if (appId) {
        setApplicationId(appId)
        sessionStorage.setItem('application_id', appId)
        // Check if already booked
        const { data: existingApp } = await supabase
          .from('applications')
          .select('calendly_booked, service_type')
          .eq('id', appId)
          .eq('user_id', user.id)
          .maybeSingle()
        if (existingApp?.service_type) setServiceType(existingApp.service_type)
        if (existingApp?.calendly_booked) setBookingConfirmed(true)
        setPollingState('ready')
        return
      }

      // Case A — session_id present, poll for webhook to create application
      if (sessionId) {
        setPollingState('polling')
        let found: string | null = null
        const MAX_ATTEMPTS = 20
        const INTERVAL = 1500

        for (let i = 0; i < MAX_ATTEMPTS; i++) {
          await new Promise(r => setTimeout(r, INTERVAL))
          const { data } = await supabase
            .from('applications')
            .select('id, service_type, calendly_booked')
            .eq('stripe_payment_id', sessionId)
            .eq('user_id', user.id)
            .maybeSingle()
          if (data?.id) {
            found = data.id
            if (data.service_type) setServiceType(data.service_type)
            if (data.calendly_booked) setBookingConfirmed(true)
            break
          }
        }

        if (!found && svcType) {
          // Fallback: most recent human_assisted app
          const { data: fallback } = await supabase
            .from('applications')
            .select('id, calendly_booked')
            .eq('user_id', user.id)
            .eq('tier', 'human_assisted')
            .not('stripe_payment_id', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          if (fallback?.id) {
            found = fallback.id
            if (fallback.calendly_booked) setBookingConfirmed(true)
          }
        }

        if (found) {
          setApplicationId(found)
          sessionStorage.setItem('application_id', found)
          const url = new URL(window.location.href)
          url.searchParams.delete('session_id')
          url.searchParams.set('applicationId', found)
          window.history.replaceState({}, '', url.toString())
          setPollingState('ready')
        } else {
          setPollingState('timeout')
        }
        return
      }

      // Case C — check sessionStorage
      const stored = sessionStorage.getItem('application_id')
      if (stored) {
        setApplicationId(stored)
        // Check booking status
        const { data: existingApp } = await supabase
          .from('applications')
          .select('calendly_booked, service_type')
          .eq('id', stored)
          .eq('user_id', user.id)
          .maybeSingle()
        if (existingApp?.service_type) setServiceType(existingApp.service_type)
        if (existingApp?.calendly_booked) setBookingConfirmed(true)
        setPollingState('ready')
      } else {
        router.replace('/apply')
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Listen for Calendly booking confirmation
  useEffect(() => {
    if (!applicationId) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleCalendlyEvent = (e: any) => {
      if (e.data?.event === 'calendly.event_scheduled') {
        const supabase = createClient()
        supabase
          .from('applications')
          .update({
            calendly_booked: true,
            calendly_event_uri: e.data.payload?.event?.uri ?? null,
          })
          .eq('id', applicationId)
          .then(() => {/* non-fatal */})
        setBookingConfirmed(true)
      }
    }

    window.addEventListener('message', handleCalendlyEvent)
    return () => window.removeEventListener('message', handleCalendlyEvent)
  }, [applicationId])

  if (pollingState === 'checking' || pollingState === 'polling') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--off-white)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTop: '3px solid var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
          {pollingState === 'polling' ? 'Confirming your payment…' : 'Loading…'}
        </p>
      </div>
    )
  }

  if (pollingState === 'timeout') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--off-white)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 24px' }}>
        <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--navy)', textAlign: 'center' }}>Payment confirmed. Setting up your session.</p>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 400 }}>
          This is taking a moment. Please check your dashboard in a few seconds.
        </p>
        <button onClick={() => router.push('/dashboard')} className="btn-gold" style={{ height: 44, padding: '0 24px', fontSize: 14 }}>
          Go to dashboard
        </button>
      </div>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--off-white)' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Progress bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, background: 'var(--border)', zIndex: 50 }}>
        <div style={{ height: '100%', background: 'var(--navy)', width: '100%' }} />
      </div>

      <header style={{ position: 'sticky', top: 0, background: 'rgba(250,250,248,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', height: 64, display: 'flex', alignItems: 'center', padding: '0 24px', zIndex: 40 }}>
        <Logo size="sm" href="/dashboard" />
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-tertiary)' }}>Expert Session</span>
      </header>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Upgrade confirmation banner */}
        {showUpgradeBanner && (
          <div style={{ background: '#ECFDF5', border: '1px solid rgba(26,107,58,0.25)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <CheckCircle size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--success)', marginBottom: 4 }}>
                You have been upgraded to Expert Session
              </p>
              <p style={{ fontSize: 13, color: '#276749', lineHeight: 1.5 }}>
                Your $29 guided payment has been credited. You paid $50 for this upgrade. Book your session below.
              </p>
            </div>
          </div>
        )}

        {/* Confirmation header */}
        <div style={{ background: 'var(--navy)', borderRadius: 16, padding: '28px 28px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(201,136,42,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
            <CheckCheck size={22} color="var(--gold)" />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, color: 'white', marginBottom: 6, lineHeight: 1.3 }}>
              Expert session confirmed
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 16 }}>
              Complete the steps below before your session so your expert comes fully prepared.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Upload documents', 'Book your session', 'Join the call'].map((step, i) => (
                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '4px 12px' }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: i === 0 ? 'var(--gold)' : i === 1 && bookingConfirmed ? 'var(--gold)' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: i === 0 ? 'var(--gold)' : i === 1 && bookingConfirmed ? 'var(--gold)' : 'rgba(255,255,255,0.6)' }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* What happens section */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 16 }}>What happens in your session</p>
          {[
            'Your expert reviews your validated application before the session',
            'Live screen share on Zoom. Your expert guides every step.',
            'You log in to both portals yourself, your passwords stay private',
            'Expert stays on the call until submission is confirmed',
            'Full support until your card arrives',
          ].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
              <CheckCircle size={14} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>

        {/* Calendly section: booking confirmation OR widget */}
        {bookingConfirmed ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-sm)', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Calendar size={22} color="var(--success)" />
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, color: 'var(--navy)', marginBottom: 4 }}>
                  Your session is booked
                </p>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {userEmail
                    ? <>You will receive a Zoom link at <strong>{userEmail}</strong> before your session. Your expert will review your documents in advance.</>
                    : 'You will receive a Zoom link by email before your session. Your expert will review your documents in advance.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 20px', background: 'var(--surface)', borderRadius: 12, marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Before your session</p>
              {[
                'Upload all required documents below if not already done',
                'Have your portal login ready, or we will help you create one',
                'Join 5 minutes early',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setBookingConfirmed(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-tertiary)', padding: 0, textDecoration: 'underline', textUnderlineOffset: 2 }}
            >
              Need to reschedule?
            </button>
          </div>
        ) : calendlyUrl ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', marginBottom: 24 }}>
            <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--navy)', marginBottom: 4 }}>Book your expert session</p>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', paddingBottom: 16 }}>45 minutes · Zoom · Priority 48-hour booking</p>
            </div>
            <InlineWidget
              url={calendlyUrl}
              styles={{ height: 680 }}
              prefill={{
                customAnswers: {
                  a1: applicationId ?? '',
                  a2: serviceType ?? '',
                },
              }}
            />
          </div>
        ) : (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 32, textAlign: 'center', boxShadow: 'var(--shadow-sm)', marginBottom: 24 }}>
            <p style={{ fontWeight: 600, fontSize: 16, color: 'var(--navy)', marginBottom: 8 }}>Our team will reach out to schedule your session</p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>You&apos;ll receive a Zoom link by email within 2 hours with available time slots.</p>
          </div>
        )}

        {/* Security promise */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 20px', background: 'var(--gold-subtle)', borderRadius: 12, border: '1px solid rgba(201,136,42,0.2)', marginBottom: 20 }}>
          <ShieldCheck size={18} color="var(--gold)" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Your credentials stay with you.</strong>{' '}
            We guide. You submit. You log in to every portal yourself. Your passwords never leave your screen.
          </p>
        </div>

        {/* Link to prepare screen */}
        {applicationId && serviceType && (
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>
            <a
              href={`/apply/prepare/${serviceType}?applicationId=${applicationId}`}
              style={{ color: 'var(--gold)', fontWeight: 500, textDecoration: 'none' }}
            >
              Review my pre-filled application
            </a>
          </p>
        )}
      </div>
    </main>
  )
}
