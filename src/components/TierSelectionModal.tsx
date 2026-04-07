'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Users, CheckCircle, ShieldCheck } from 'lucide-react'
import { APPLICATION_TIERS, type ApplicationTier } from '@/lib/plan-utils'

interface TierSelectionModalProps {
  isOpen: boolean
  serviceName: string
  serviceType: string
  onClose: () => void
}

export default function TierSelectionModal({
  isOpen,
  serviceName,
  serviceType,
  onClose,
}: TierSelectionModalProps) {
  const [loading, setLoading] = useState<ApplicationTier | null>(null)

  async function handleCheckout(tier: ApplicationTier) {
    setLoading(tier)
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceType, tier }),
      })
      const { data } = await res.json() as { data?: { url: string } }
      if (data?.url) {
        window.location.href = data.url
      } else {
        setLoading(null)
      }
    } catch {
      setLoading(null)
    }
  }

  const guided = APPLICATION_TIERS.guided
  const expert = APPLICATION_TIERS.human_assisted

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 100,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.32, 1] }}
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%', maxWidth: 560,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'white',
              borderRadius: 20,
              padding: 28,
              boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
              zIndex: 101,
              margin: '0 16px',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, color: 'var(--navy)', marginBottom: 2 }}>
                  Start {serviceName}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                  Choose how you&apos;d like AVA to prepare your application.
                </p>
              </div>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)', lineHeight: 1, marginTop: -2 }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>

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
                      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 16, color: 'var(--navy)' }}>{guided.label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>{guided.priceLabel}</span>
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
                      {guided.description}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {guided.features.map(f => (
                        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CheckCircle size={12} color="var(--success)" />
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleCheckout('guided')}
                  disabled={!!loading}
                  style={{
                    width: '100%', height: 44, borderRadius: 10,
                    background: 'var(--gold)', color: 'white', border: 'none',
                    fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading && loading !== 'guided' ? 0.5 : 1,
                    transition: 'opacity 200ms',
                  }}
                >
                  {loading === 'guided' ? 'Redirecting to payment...' : `Start Guided (${guided.priceLabel})`}
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
                      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 16, color: 'var(--navy)' }}>{expert.label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>{expert.priceLabel}</span>
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
                      {expert.description}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {expert.features.map(f => (
                        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CheckCircle size={12} color="var(--success)" />
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleCheckout('human_assisted')}
                  disabled={!!loading}
                  style={{
                    width: '100%', height: 44, borderRadius: 10,
                    background: 'var(--navy)', color: 'white', border: 'none',
                    fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading && loading !== 'human_assisted' ? 0.5 : 1,
                    transition: 'opacity 200ms',
                  }}
                >
                  {loading === 'human_assisted' ? 'Redirecting to payment...' : `Book Expert (${expert.priceLabel})`}
                </button>
              </div>
            </div>

            {/* Trust note */}
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', background: 'var(--gold-subtle)', borderRadius: 10 }}>
              <ShieldCheck size={14} color="var(--gold)" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Pay once per application.</strong>{' '}
                No subscription. Rejection guarantee included on both plans.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
