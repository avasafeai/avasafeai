'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'

const SPLIT_SCREEN_KEY = 'ava_split_screen_done'

export default function CompletePage() {
  const router = useRouter()
  const [score, setScore] = useState(0)
  const [checksPassed, setChecksPassed] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [os, setOs] = useState<'mac' | 'windows' | 'chromebook'>('mac')
  const [isHumanAssisted, setIsHumanAssisted] = useState(false)
  const ringRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    const s = parseInt(sessionStorage.getItem('readiness_score') ?? '94', 10)
    const c = parseInt(sessionStorage.getItem('checks_passed') ?? '10', 10)
    setScore(s || 94)
    setChecksPassed(c || 10)
    setIsHumanAssisted(sessionStorage.getItem('user_plan') === 'human_assisted')

    // Detect OS
    const p = navigator.userAgent.toLowerCase()
    if (p.includes('mac')) setOs('mac')
    else if (p.includes('win')) setOs('windows')
    else if (p.includes('cros')) setOs('chromebook')

    // Animate SVG checkmark
    setTimeout(() => {
      if (ringRef.current) {
        const el = ringRef.current
        el.style.transition = 'stroke-dashoffset 600ms cubic-bezier(0.4,0,0.2,1)'
        el.style.strokeDashoffset = '0'
      }
    }, 200)
  }, [])

  function handleSubmitToPortal() {
    const alreadyDone = localStorage.getItem(SPLIT_SCREEN_KEY)
    if (alreadyDone) {
      openPortalAndGoToCompanion()
    } else {
      setShowModal(true)
    }
  }

  function openPortalAndGoToCompanion() {
    const urlParams = new URLSearchParams(window.location.search)
    const appId = urlParams.get('applicationId') ?? sessionStorage.getItem('application_id') ?? ''
    const w = window.screen.availWidth
    const h = window.screen.availHeight
    window.open(
      'https://ociservices.gov.in/welcome',
      'oci_portal',
      `width=${Math.floor(w / 2)},height=${h},left=${Math.floor(w / 2)},top=0`
    )
    try {
      window.moveTo(0, 0)
      window.resizeTo(Math.floor(w / 2), h)
    } catch { /* browser may block */ }
    router.push(appId ? `/apply/submit?applicationId=${appId}` : '/apply/submit')
  }

  function handleSplitDone() {
    localStorage.setItem(SPLIT_SCREEN_KEY, '1')
    setShowModal(false)
    openPortalAndGoToCompanion()
  }

  const circumference = 2 * Math.PI * 36 // radius 36

  return (
    <main style={{ minHeight: '100vh', background: '#0F2D52', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <div style={{ maxWidth: 520, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>

        {/* Animated checkmark */}
        <div style={{ position: 'relative', width: 80, height: 80 }}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(201,136,42,0.25)" strokeWidth="4" />
            <circle
              ref={ringRef}
              cx="40" cy="40" r="36"
              fill="none" stroke="#C9882A" strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={circumference}
              strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
            <polyline points="24,42 35,53 56,30" fill="none" stroke="#C9882A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Headline */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: 'white', marginBottom: 12, lineHeight: 1.2 }}>
            Your application is ready.
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: 400 }}>
            AVA has validated your application against 10 common rejection causes. Everything looks correct.
          </p>
        </div>

        {/* Three validation pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['All fields verified', 'Documents complete', 'Rejection causes cleared'].map(pill => (
            <span key={pill} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 100, background: 'rgba(255,255,255,0.12)', color: 'white', fontSize: 13 }}>
              <span style={{ color: '#C9882A' }}>✓</span> {pill}
            </span>
          ))}
        </div>

        {/* Guarantee card */}
        <div style={{ width: '100%', background: 'rgba(201,136,42,0.08)', border: '1px solid rgba(201,136,42,0.3)', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <ShieldCheck size={22} color="#C9882A" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#C9882A', marginBottom: 4 }}>The Avasafe Guarantee</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              If rejected due to our validation, we fix it free.
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', width: '100%', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24 }}>
          {[
            { value: String(checksPassed), label: 'checks passed' },
            { value: `${score}%`, label: 'readiness' },
            { value: '0', label: 'blockers found' },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'white', lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
          {isHumanAssisted ? (
            <>
              <button
                onClick={() => {
                  const urlParams = new URLSearchParams(window.location.search)
                  const appId = urlParams.get('applicationId') ?? sessionStorage.getItem('application_id') ?? ''
                  router.push(appId ? `/apply/human?applicationId=${appId}` : '/apply/human')
                }}
                style={{ width: '100%', maxWidth: 360, height: 56, borderRadius: 14, background: '#C9882A', color: 'white', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
              >
                Book your expert session →
              </button>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                45 minutes on Zoom. Your expert guides every remaining step.
              </p>
            </>
          ) : (
            <>
              <button
                onClick={handleSubmitToPortal}
                style={{ width: '100%', maxWidth: 360, height: 56, borderRadius: 14, background: '#C9882A', color: 'white', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
              >
                Submit to government portal →
              </button>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                Opens the portal with your answers ready. Takes about 8 minutes.
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                Install Chrome extension to fill automatically (coming soon)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Split screen modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 480, width: '100%', boxShadow: '0 24px 48px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--navy)', marginBottom: 8 }}>Set up split screen</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
              Put Avasafe and the portal side by side. No tab switching at all.
            </p>

            {/* Visual diagram */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 24, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ flex: 1, background: 'var(--navy)', borderRadius: 6, padding: '16px 12px', textAlign: 'center' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'white', letterSpacing: '0.08em' }}>AVASAFE</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>← This window</p>
              </div>
              <div style={{ flex: 1, background: '#374A5C', borderRadius: 6, padding: '16px 12px', textAlign: 'center' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'white', letterSpacing: '0.08em' }}>OCI PORTAL</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Portal →</p>
              </div>
            </div>

            {/* OS tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
              {(['mac', 'windows', 'chromebook'] as const).map(o => (
                <button key={o} onClick={() => setOs(o)} style={{ flex: 1, height: 32, borderRadius: 8, border: os === o ? '1.5px solid var(--navy)' : '1px solid var(--border)', background: os === o ? 'var(--navy)' : 'white', color: os === o ? 'white' : 'var(--text-secondary)', fontSize: 12, fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize' }}>
                  {o === 'chromebook' ? 'Chromebook' : o.charAt(0).toUpperCase() + o.slice(1)}
                </button>
              ))}
            </div>

            {/* Instructions */}
            <div style={{ background: 'var(--off-white)', borderRadius: 10, padding: '16px 18px', marginBottom: 24 }}>
              {os === 'mac' && (
                <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <li style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>Hold <kbd style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', fontSize: 12, fontFamily: 'var(--font-mono)' }}>Control</kbd> and click the green dot on this browser window</li>
                  <li style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>Select &ldquo;Tile Window to Left of Screen&rdquo;</li>
                  <li style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>Click the government portal window on the right</li>
                </ol>
              )}
              {os === 'windows' && (
                <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <li style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>Press <kbd style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', fontSize: 12, fontFamily: 'var(--font-mono)' }}>Win + ←</kbd> on this browser window</li>
                  <li style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>Click the government portal window on the right side</li>
                </ol>
              )}
              {os === 'chromebook' && (
                <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <li style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>Press <kbd style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', fontSize: 12, fontFamily: 'var(--font-mono)' }}>Alt + [</kbd> on this window</li>
                  <li style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>Click the government portal window</li>
                </ol>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowModal(false); openPortalAndGoToCompanion() }} style={{ flex: 1, height: 40, borderRadius: 10, border: '1px solid var(--border)', background: 'white', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Skip, use tabs instead
              </button>
              <button onClick={handleSplitDone} style={{ flex: 2, height: 40, borderRadius: 10, background: 'var(--navy)', color: 'white', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                I&apos;ve set up split screen. Start filling.
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
