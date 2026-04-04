'use client'

import { useState } from 'react'

interface Props {
  targetPlan?: 'locker'
  currentPlan?: string
}

export default function PlanUpgradeButton({ targetPlan = 'locker', currentPlan }: Props) {
  const [loading, setLoading] = useState(false)

  // If already on locker or above, no upgrade to show
  if (currentPlan === 'locker' || currentPlan === 'guided' || currentPlan === 'human_assisted') {
    return null
  }

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
      {loading ? 'Redirecting...' : 'Upgrade to Locker — $19/year'}
    </button>
  )
}
