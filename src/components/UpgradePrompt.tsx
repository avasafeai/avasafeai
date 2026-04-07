'use client'

import { useState } from 'react'
import { ShieldCheck, Users, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

// ── Document limit prompt ─────────────────────────────────────────────────────

interface DocLimitPromptProps {
  className?: string
}

export function DocLimitPrompt({ className = '' }: DocLimitPromptProps) {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'locker' }),
    })
    const { data } = await res.json() as { data?: { url: string } }
    if (data?.url) window.location.href = data.url
    else setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.32, 1] }}
      className={className}
      style={{
        background: 'var(--off-white)',
        borderLeft: '3px solid var(--gold)',
        borderRadius: 14,
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        maxWidth: 560,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(201,136,42,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ShieldCheck size={20} color="var(--gold)" />
        </div>
        <div>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 17, color: 'var(--navy)', marginBottom: 6 }}>
            You&apos;ve reached the free limit
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Free accounts store up to 3 documents. Upgrade to Locker for unlimited storage and smart expiry alerts, just $19 per year.
          </p>
        </div>
      </div>
      <button
        onClick={handleUpgrade}
        disabled={loading}
        style={{
          alignSelf: 'flex-start', height: 44, padding: '0 20px', borderRadius: 12,
          border: 'none', background: 'var(--gold)', color: 'white',
          fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1, transition: 'opacity 200ms',
        }}
      >
        {loading ? 'Redirecting...' : 'Upgrade to Locker ($19/year)'}
      </button>
    </motion.div>
  )
}

// ── Apply access prompt — two-option (Guided / Expert Session) ───────────────

interface ApplyPromptProps {
  serviceId: string
  onClose?: () => void
  className?: string
}

export function ApplyPrompt({ serviceId, onClose, className = '' }: ApplyPromptProps) {
  const [loadingGuided, setLoadingGuided] = useState(false)
  const [loadingHuman, setLoadingHuman] = useState(false)

  async function selectTier(tier: 'guided' | 'human_assisted') {
    const setter = tier === 'guided' ? setLoadingGuided : setLoadingHuman
    setter(true)
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceType: serviceId, tier }),
    })
    const { data } = await res.json() as { data?: { url: string } }
    if (data?.url) {
      window.location.href = data.url
    } else {
      setter(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.32, 1] }}
      className={className}
      style={{
        background: 'white',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 28,
        boxShadow: 'var(--shadow-sm)',
        maxWidth: 580,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 18, color: 'var(--navy)', margin: 0 }}>
          Ready to apply?
        </p>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 8px', color: 'var(--text-tertiary)', fontSize: 18, lineHeight: 1 }}>×</button>
        )}
      </div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
        Choose how you&apos;d like to prepare your application.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Guided */}
        <div style={{ border: '2px solid var(--gold)', borderRadius: 14, padding: '20px 22px', position: 'relative', background: 'rgba(201,136,42,0.02)' }}>
          <div style={{ position: 'absolute', top: -11, left: 18, background: 'var(--gold)', color: 'white', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-body)', padding: '3px 10px', borderRadius: 20, letterSpacing: '0.04em' }}>
            Most popular
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(201,136,42,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
              <Zap size={16} color="var(--gold)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 16, color: 'var(--navy)' }}>Guided</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>$29</p>
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                AVA pre-fills everything, validates against rejection causes, and guides you through the portal step by step.
              </p>
            </div>
          </div>
          <button
            onClick={() => selectTier('guided')}
            disabled={loadingGuided || loadingHuman}
            style={{
              width: '100%', height: 44, borderRadius: 10,
              background: 'var(--gold)', color: 'white', border: 'none',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
              cursor: (loadingGuided || loadingHuman) ? 'not-allowed' : 'pointer',
              opacity: (loadingGuided || loadingHuman) ? 0.7 : 1,
              transition: 'opacity 200ms',
            }}
          >
            {loadingGuided ? 'Setting up...' : 'Start Guided ($29)'}
          </button>
        </div>

        {/* Expert Session */}
        <div style={{ border: '1.5px solid var(--navy)', borderRadius: 14, padding: '20px 22px', background: 'rgba(15,45,82,0.015)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(15,45,82,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
              <Users size={16} color="var(--navy)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 16, color: 'var(--navy)' }}>Expert Session</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>$79</p>
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Everything in Guided plus a 45-minute 1-on-1 Zoom session. An expert guides you through portal submission live.
              </p>
            </div>
          </div>
          <button
            onClick={() => selectTier('human_assisted')}
            disabled={loadingGuided || loadingHuman}
            style={{
              width: '100%', height: 44, borderRadius: 10,
              background: 'var(--navy)', color: 'white', border: 'none',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
              cursor: (loadingGuided || loadingHuman) ? 'not-allowed' : 'pointer',
              opacity: (loadingGuided || loadingHuman) ? 0.7 : 1,
              transition: 'opacity 200ms',
            }}
          >
            {loadingHuman ? 'Setting up...' : 'Book Expert Session ($79)'}
          </button>
        </div>

      </div>
    </motion.div>
  )
}

// ── Legacy default export — single-button (backward compat) ──────────────────

interface UpgradePromptProps {
  title: string
  body: string
  buttonText: string
  targetPlan: 'locker'
}

export default function UpgradePrompt({ title, body, buttonText, targetPlan }: UpgradePromptProps) {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: targetPlan }),
    })
    const { data } = await res.json() as { data?: { url: string } }
    if (data?.url) window.location.href = data.url
    else setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.32, 1] }}
      style={{
        background: 'var(--off-white)',
        borderLeft: '3px solid var(--gold)',
        borderRadius: 14,
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        maxWidth: 560,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(201,136,42,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ShieldCheck size={20} color="var(--gold)" />
        </div>
        <div>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 17, color: 'var(--navy)', marginBottom: 6 }}>{title}</p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{body}</p>
        </div>
      </div>
      <button
        onClick={handleUpgrade}
        disabled={loading}
        style={{
          alignSelf: 'flex-start', height: 44, padding: '0 20px', borderRadius: 12,
          border: 'none', background: 'var(--gold)', color: 'white',
          fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1, transition: 'opacity 200ms',
        }}
      >
        {loading ? 'Redirecting...' : buttonText}
      </button>
    </motion.div>
  )
}
