'use client'

import { useState } from 'react'

const PLAN_LABELS: Record<string, string> = {
  apply:  'Locker + Apply — $49/year',
  family: 'Family — $99/year',
}

export default function PlanUpgradeButton({ targetPlan = 'apply' }: { targetPlan?: 'apply' | 'family' }) {
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
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="btn-gold"
      style={{ height: 40, padding: '0 18px', fontSize: 14, opacity: loading ? 0.7 : 1 }}
    >
      {loading ? 'Redirecting...' : `Upgrade to ${PLAN_LABELS[targetPlan] ?? targetPlan}`}
    </button>
  )
}
