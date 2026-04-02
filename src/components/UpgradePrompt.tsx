'use client'

import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'

interface UpgradePromptProps {
  title: string
  body: string
  buttonText: string
  targetPlan: 'locker' | 'apply' | 'family'
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
    if (data?.url) {
      window.location.href = data.url
    } else {
      setLoading(false)
    }
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
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gold-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ShieldCheck size={20} color="var(--gold)" />
        </div>
        <div>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 17, color: 'var(--navy)', marginBottom: 6 }}>
            {title}
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            {body}
          </p>
        </div>
      </div>
      <button
        onClick={handleUpgrade}
        disabled={loading}
        style={{
          alignSelf: 'flex-start',
          height: 44,
          padding: '0 20px',
          borderRadius: 12,
          border: 'none',
          background: 'var(--gold)',
          color: 'white',
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: 14,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          transition: 'opacity 200ms',
        }}
      >
        {loading ? 'Redirecting...' : buttonText}
      </button>
    </motion.div>
  )
}
