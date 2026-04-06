'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Logo from '@/components/Logo'
import AvaMessage from '@/components/AvaMessage'
import { CheckCircle, Lock, Bell } from 'lucide-react'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    priceLabel: '$0 forever',
    description: 'Upload your passports and documents. AVA extracts every field and stores them securely.',
    features: [
      { text: 'Up to 3 documents', included: true },
      { text: 'AI field extraction', included: true },
      { text: 'Basic dashboard', included: true },
      { text: 'Smart expiry alerts', included: false },
      { text: 'Unlimited documents', included: false },
    ],
    icon: Lock,
    cta: 'Get started free',
    highlight: false,
    badge: null,
  },
  {
    id: 'locker',
    name: 'Locker',
    priceLabel: '$19 / year',
    description: 'Unlimited storage with smart expiry alerts. Never miss a passport renewal again.',
    features: [
      { text: 'Unlimited documents', included: true },
      { text: 'Smart expiry alerts', included: true },
      { text: 'Encrypted download', included: true },
      { text: 'Field masking', included: true },
      { text: 'Priority support', included: true },
    ],
    icon: Bell,
    cta: 'Get Locker — $19/year',
    highlight: true,
    badge: 'Most popular',
  },
] as const

export default function OnboardingPlanPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleContinue() {
    if (!selected || loading) return
    setLoading(true)

    if (selected === 'free') {
      await fetch('/api/set-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'free' }),
      })
      router.push('/dashboard')
      return
    }

    // Locker → Stripe checkout
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'locker' }),
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
        <div className="w-full max-w-[520px]">

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
            message="Your passport is saved. How would you like to store your documents?"
            className="mb-8"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {PLANS.map((plan, i) => {
              const Icon = plan.icon
              const isSelected = selected === plan.id
              return (
                <motion.button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelected(plan.id)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  style={{
                    textAlign: 'left',
                    borderRadius: 14,
                    border: isSelected
                      ? '2px solid var(--gold, #C9882A)'
                      : plan.highlight
                        ? '2px solid var(--gold, #C9882A)'
                        : '1.5px solid var(--border, #E8E8E4)',
                    background: isSelected ? 'var(--gold-subtle, #FDF6EC)' : 'white',
                    padding: '18px 20px',
                    cursor: 'pointer',
                    width: '100%',
                    position: 'relative',
                    boxShadow: isSelected ? 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08))' : 'none',
                    transition: 'border-color 150ms ease, background 150ms ease, box-shadow 150ms ease',
                  }}
                >
                  {plan.badge && (
                    <span style={{
                      position: 'absolute', top: -11, left: 20,
                      background: 'var(--gold, #C9882A)', color: 'white',
                      fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
                      padding: '3px 10px', borderRadius: 20, letterSpacing: '0.04em',
                    }}>
                      {plan.badge}
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
                        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
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
            transition={{ duration: 0.3, delay: 0.18 }}
            style={{ width: '100%', opacity: (!selected || loading) ? 0.5 : 1 }}
          >
            {loading
              ? 'Setting up...'
              : selected
                ? `${PLANS.find(p => p.id === selected)?.cta ?? 'Continue'} →`
                : 'Choose a plan to continue'}
          </motion.button>

          <p style={{ textAlign: 'center', marginTop: 14, fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
            Ready to apply? Start any application from your dashboard.{' '}
            Guided ($29) and Expert sessions ($79) are pay-per-application.
          </p>
        </div>
      </div>
    </main>
  )
}
