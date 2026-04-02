'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Logo from '@/components/Logo'
import AvaMessage from '@/components/AvaMessage'
import { CheckCircle, Lock, Bell, Zap } from 'lucide-react'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: null,
    priceLabel: 'Free forever',
    description: 'Store up to 3 documents. No alerts. No applications.',
    features: [
      { text: 'Up to 3 documents', included: true },
      { text: 'AI extraction', included: true },
      { text: 'Expiry monitoring & alerts', included: false },
      { text: 'Application preparation', included: false },
    ],
    icon: Lock,
    cta: 'Start free',
    highlight: false,
  },
  {
    id: 'locker',
    name: 'Locker',
    price: '$19',
    priceLabel: '$19 / year',
    description: 'Unlimited documents, smart alerts, 2 family profiles.',
    features: [
      { text: 'Unlimited documents', included: true },
      { text: 'AI extraction', included: true },
      { text: 'Expiry monitoring & alerts', included: true },
      { text: '2 family profiles', included: true },
    ],
    icon: Bell,
    cta: 'Get Locker',
    highlight: false,
  },
  {
    id: 'apply',
    name: 'Locker + Apply',
    price: '$49',
    priceLabel: '$49 / year + $29 per application',
    description: 'Everything in Locker, plus fully automated OCI and passport applications.',
    features: [
      { text: 'Unlimited documents', included: true },
      { text: 'AI extraction', included: true },
      { text: 'Expiry monitoring & alerts', included: true },
      { text: 'Automated applications (OCI & passport)', included: true },
    ],
    icon: Zap,
    cta: 'Get Locker + Apply',
    highlight: true,
  },
]

export default function OnboardingPlanPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleContinue() {
    if (!selected) return
    setLoading(true)

    if (selected === 'free') {
      // No plan update needed — 'free' is the default
      router.push('/dashboard')
      return
    }

    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: selected }),
    })
    const { data } = await res.json() as { data?: { url: string } }
    if (data?.url) {
      window.location.href = data.url
    } else {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: '#FFFFFF' }}>
      {/* Progress bar */}
      <div className="h-1 w-full" style={{ background: 'var(--border, #E8E8E4)' }}>
        <div className="h-full" style={{ background: 'var(--navy-mid, #0F2D52)', width: '100%' }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-start pt-12 pb-20 px-4">
        <div className="w-full max-w-[640px]">

          {/* Header */}
          <div className="flex flex-col items-center gap-2 mb-10">
            <Logo size="md" />
            <span style={{
              fontFamily: 'var(--font-mono, "DM Mono", monospace)',
              fontSize: '12px',
              color: 'var(--text-tertiary, #9CA3AF)',
              letterSpacing: '0.04em',
            }}>
              Step 2 of 2
            </span>
          </div>

          <AvaMessage
            message="Your passport is saved. Choose a plan to get the most out of your locker — or continue with the free tier and upgrade any time."
            className="mb-8"
          />

          {/* Plan cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {PLANS.map((plan, i) => {
              const Icon = plan.icon
              const isSelected = selected === plan.id
              return (
                <motion.button
                  key={plan.id}
                  type="button"
                  onClick={() => {
                    if (plan.id === 'free') {
                      router.push('/dashboard')
                    } else {
                      setSelected(plan.id)
                    }
                  }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  style={{
                    textAlign: 'left',
                    borderRadius: 14,
                    border: isSelected
                      ? '2px solid var(--gold, #C9882A)'
                      : plan.highlight && !selected
                        ? '2px solid var(--navy, #0F2D52)'
                        : '1.5px solid var(--border, #E8E8E4)',
                    background: isSelected
                      ? 'var(--gold-subtle, #FDF6EC)'
                      : 'white',
                    padding: '18px 20px',
                    cursor: 'pointer',
                    width: '100%',
                    position: 'relative',
                    boxShadow: isSelected ? 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08))' : 'none',
                    transition: 'border-color 150ms ease, background 150ms ease, box-shadow 150ms ease',
                  }}
                >
                  {plan.highlight && !isSelected && (
                    <span style={{
                      position: 'absolute',
                      top: -11,
                      left: 20,
                      background: 'var(--navy, #0F2D52)',
                      color: 'white',
                      fontFamily: 'var(--font-body)',
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: 20,
                      letterSpacing: '0.04em',
                    }}>
                      Most popular
                    </span>
                  )}

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      background: isSelected ? 'rgba(201,136,42,0.15)' : 'var(--surface, #F9F9F7)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid var(--border)',
                    }}>
                      <Icon size={18} color={isSelected ? 'var(--gold, #C9882A)' : 'var(--text-secondary, #6B6B6B)'} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 16, color: 'var(--navy, #0F2D52)' }}>
                          {plan.name}
                        </span>
                        <span style={{ fontFamily: 'var(--font-body)', fontWeight: plan.price ? 600 : 400, fontSize: 14, color: plan.price ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                          {plan.priceLabel}
                        </span>
                      </div>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
                        {plan.description}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {plan.features.map(f => (
                          <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {f.included ? (
                              <CheckCircle size={13} color="var(--success, #1A6B3A)" />
                            ) : (
                              <span style={{ width: 13, height: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text-tertiary)' }}>✗</span>
                            )}
                            <span style={{
                              fontFamily: 'var(--font-body)', fontSize: 13,
                              color: f.included ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            }}>
                              {f.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {plan.id === 'free' && !isSelected && (
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary, #9CA3AF)', flexShrink: 0, marginTop: 2 }}>
                        Start free →
                      </span>
                    )}
                    {isSelected && (
                      <CheckCircle size={20} color="var(--gold, #C9882A)" style={{ flexShrink: 0, marginTop: 2 }} />
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>

          <motion.button
            onClick={handleContinue}
            disabled={!selected || loading}
            className="btn-navy"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            style={{ width: '100%', opacity: (!selected || loading) ? 0.5 : 1 }}
          >
            {loading
              ? 'Redirecting…'
              : selected === 'free'
                ? 'Continue free →'
                : `${PLANS.find(p => p.id === selected)?.cta ?? 'Continue'} →`}
          </motion.button>

          <p style={{ textAlign: 'center', marginTop: 12, fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-tertiary)' }}>
            You can upgrade any time from account settings.
          </p>
        </div>
      </div>
    </main>
  )
}
