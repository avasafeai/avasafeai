'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, RotateCcw, CheckCircle } from 'lucide-react'
import { getAvailableServices, getComingSoonServices, getService } from '@/lib/services/registry'
import { getResumeUrl } from '@/lib/plan-utils'
import { BETA_MODE, getBetaDisplayPrice } from '@/lib/beta'
import { triggerFeedback } from '@/lib/feedback'

const ICON_MAP: Record<string, React.ElementType> = {
  oci_new:          () => <span style={{ fontSize: 20 }}>🪪</span>,
  oci_renewal:      () => <span style={{ fontSize: 20 }}>🔄</span>,
  oci_misc:         () => <span style={{ fontSize: 20 }}>📋</span>,
  passport_renewal: () => <span style={{ fontSize: 20 }}>📗</span>,
}

function ServiceIcon({ serviceId }: { serviceId: string }) {
  const Icon = ICON_MAP[serviceId]
  return Icon ? <Icon /> : <span style={{ fontSize: 20 }}>📄</span>
}

interface InProgressApp {
  id: string
  service_type: string
  tier: string | null
  current_step: number | null
  created_at: string
  status: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form_data?: Record<string, any> | null
}

interface ServiceCardsProps {
  inProgressApps: InProgressApp[]
}

function getTotalSteps(serviceId: string): number {
  return getService(serviceId)?.form_steps ?? 13
}

const GUIDED_FEATURES = [
  'AVA pre-fills your application',
  'Validates against rejection causes',
  'Companion mode for portal',
  'PDF checklist',
  'Rejection guarantee',
]

const EXPERT_FEATURES = [
  'Everything in Guided',
  '45-minute live Zoom session',
  'Expert guides portal step by step',
  'You handle passwords only',
  'Priority 48-hour booking',
]

export default function ServiceCards({ inProgressApps }: ServiceCardsProps) {
  const router = useRouter()
  const available = getAvailableServices()
  const comingSoon = getComingSoonServices()
  const [expandedService, setExpandedService] = useState<string | null>(null)
  const [loadingTier, setLoadingTier] = useState<string | null>(null)

  async function handleCheckout(serviceType: string, tier: 'guided' | 'human_assisted') {
    setLoadingTier(tier)
    try {
      if (BETA_MODE) {
        const res = await fetch('/api/beta-start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serviceType, tier }),
        })

        if (res.status === 409) {
          alert('Expert Session slots are full for the beta period. Guided access is still free!')
          return
        }

        const json = await res.json() as { applicationId?: string }
        const appId = json.applicationId

        triggerFeedback('application_created')

        if (tier === 'human_assisted') {
          router.push(appId ? `/apply/human?applicationId=${appId}` : '/apply/human')
        } else {
          router.push(appId ? `/apply/prepare/${serviceType}?applicationId=${appId}&new=true` : `/apply/prepare/${serviceType}`)
        }
        return
      }

      // Original Stripe flow
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceType, tier }),
      })
      const json = await res.json() as { data?: { url: string } }
      if (json.data?.url) {
        window.location.href = json.data.url
      }
    } catch (err) {
      console.error('Checkout error:', err)
    } finally {
      setLoadingTier(null)
    }
  }

  function handleExpand(serviceId: string) {
    setExpandedService(serviceId)
    setTimeout(() => {
      document.getElementById(`service-${serviceId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Available services */}
      {available.map((s) => {
        const existingApp = inProgressApps.find(a => a.service_type === s.id)
        const currentStep = existingApp?.current_step ?? 0
        const totalSteps = getTotalSteps(s.id)
        const progressPct = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0
        const startedAt = existingApp
          ? new Date(existingApp.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : null
        const tierLabel = existingApp?.tier === 'human_assisted' ? 'Expert Session' : 'Guided'
        const isExpanded = expandedService === s.id

        return (
          <div
            key={s.id}
            id={`service-${s.id}`}
            style={{
              background: 'white',
              borderRadius: 16,
              padding: '24px 28px',
              boxShadow: 'var(--shadow-sm)',
              border: existingApp ? '2px solid var(--gold)' : '1px solid var(--border)',
            }}
          >
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ServiceIcon serviceId={s.id} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <p style={{ fontWeight: 600, fontSize: 17, color: 'var(--navy)', lineHeight: 1.3 }}>{s.name}</p>
                  {existingApp && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                      background: existingApp.tier === 'human_assisted' ? 'rgba(15,45,82,0.08)' : 'var(--gold-subtle)',
                      color: existingApp.tier === 'human_assisted' ? 'var(--navy)' : 'var(--gold)',
                    }}>
                      {tierLabel}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>{s.description}</p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {s.fees.government_usd > 0 ? `$${s.fees.government_usd} govt. fee` : 'Govt. fee varies'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-tertiary)' }}>
                    + $29 Guided / $79 Expert
                  </span>
                </div>
              </div>
            </div>

            {/* State A — Resume existing paid in_progress application */}
            {existingApp ? (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                      {currentStep === 0 ? 'Ready to start' : `Step ${currentStep} of ${totalSteps}`}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                      {currentStep === 0 ? 'Tap Resume to begin' : `${progressPct}%`}
                    </span>
                  </div>
                  <div style={{ height: 4, background: 'var(--border)', borderRadius: 100 }}>
                    <div style={{ height: '100%', background: 'var(--gold)', borderRadius: 100, width: `${progressPct}%`, transition: 'width 300ms ease' }} />
                  </div>
                  {startedAt && (
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Started {startedAt}</p>
                  )}
                </div>
                <button
                  onClick={() => router.push(getResumeUrl({ id: existingApp.id, service_type: s.id, tier: existingApp.tier, current_step: existingApp.current_step, form_data: existingApp.form_data }))}

                  style={{
                    width: '100%', height: 46, borderRadius: 12, border: 'none',
                    background: 'var(--gold)', color: 'white',
                    fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <RotateCcw size={16} />
                  Resume {s.short_name} →
                </button>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 8 }}>
                  Continue where you left off. No additional payment required.
                </p>
              </div>
            ) : (
              /* State B — No paid app: inline tier expansion */
              <div>
                {/* Collapsed: single start button */}
                {!isExpanded && (
                  <>
                    <button
                      onClick={() => handleExpand(s.id)}
                      style={{
                        width: '100%', height: 46, borderRadius: 12, border: 'none',
                        background: 'var(--navy)', color: 'white',
                        fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                    >
                      Start {s.short_name}
                    </button>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 8 }}>
                      Guided $29 · Expert Session $79
                    </p>
                    {s.processing_weeks && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
                        <Clock size={11} color="var(--text-tertiary)" />
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          Typically {s.processing_weeks} weeks processing
                        </span>
                      </div>
                    )}
                    {s.id === 'oci_misc' && (
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 8, background: 'var(--surface)', borderRadius: 8, padding: '10px 12px' }}>
                        <p style={{ fontWeight: 600, marginBottom: 6, fontSize: 11 }}>Do you need this service? Quick check:</p>
                        <p style={{ marginBottom: 4 }}>
                          <strong>Got a new passport after turning 20?</strong><br />
                          Yes, you need physical reissuance through VFS (this service).
                        </p>
                        <p>
                          <strong>Got a new passport under 20 or over 50?</strong><br />
                          Free online update at ociservices.gov.in. No mailing required.
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Expanded: inline tier selection */}
                {isExpanded && (<div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    How would you like to prepare?
                  </p>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {/* Guided card */}
                    <div style={{
                      flex: '1 1 160px', minWidth: 0,
                      border: '1.5px solid #C9882A',
                      borderRadius: 8, padding: 14,
                      background: '#FDF6EC',
                    }}>
                      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#C9882A', marginBottom: 6 }}>Guided</p>
                      {(() => { const { original, isBeta } = getBetaDisplayPrice('guided'); return isBeta ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 22, fontWeight: 600, color: '#1A6B3A', fontFamily: 'var(--font-body)' }}>$0</span>
                          <span style={{ fontSize: 14, color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>${original}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, background: '#F0FFF4', color: '#1A6B3A', padding: '2px 6px', borderRadius: 100 }}>Beta — Free</span>
                        </div>
                      ) : (
                        <p style={{ fontSize: 22, fontWeight: 600, color: 'var(--navy)', margin: '0 0 2px', fontFamily: 'var(--font-body)' }}>${original}</p>
                      )})()}
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>one-time</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                        {GUIDED_FEATURES.map(f => (
                          <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                            <CheckCircle size={11} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} />
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{f}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => handleCheckout(s.id, 'guided')}
                        disabled={loadingTier !== null}
                        style={{
                          width: '100%', height: 40, borderRadius: 6, border: 'none',
                          background: '#C9882A', color: 'white',
                          fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13,
                          cursor: loadingTier !== null ? 'not-allowed' : 'pointer',
                          opacity: loadingTier !== null ? 0.7 : 1,
                        }}
                      >
                        {loadingTier === 'guided' ? 'Loading…' : 'Start Guided ($29)'}
                      </button>
                    </div>

                    {/* Expert Session card */}
                    <div style={{
                      flex: '1 1 160px', minWidth: 0,
                      border: '1.5px solid #0F2D52',
                      borderRadius: 8, padding: 14,
                      background: 'var(--off-white)',
                    }}>
                      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0F2D52', marginBottom: 6 }}>Expert Session</p>
                      {(() => { const { original, isBeta } = getBetaDisplayPrice('human_assisted'); return isBeta ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 22, fontWeight: 600, color: '#1A6B3A', fontFamily: 'var(--font-body)' }}>$0</span>
                          <span style={{ fontSize: 14, color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>${original}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, background: '#F0FFF4', color: '#1A6B3A', padding: '2px 6px', borderRadius: 100 }}>Beta — Free</span>
                        </div>
                      ) : (
                        <p style={{ fontSize: 22, fontWeight: 600, color: 'var(--navy)', margin: '0 0 2px', fontFamily: 'var(--font-body)' }}>${original}</p>
                      )})()}
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>one-time</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                        {EXPERT_FEATURES.map(f => (
                          <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                            <CheckCircle size={11} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} />
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{f}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => handleCheckout(s.id, 'human_assisted')}
                        disabled={loadingTier !== null}
                        style={{
                          width: '100%', height: 40, borderRadius: 6, border: 'none',
                          background: '#0F2D52', color: 'white',
                          fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13,
                          cursor: loadingTier !== null ? 'not-allowed' : 'pointer',
                          opacity: loadingTier !== null ? 0.7 : 1,
                        }}
                      >
                        {loadingTier === 'human_assisted' ? 'Loading…' : 'Book Expert ($79)'}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedService(null)}
                    style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-tertiary)', padding: 0 }}
                  >
                    ← Back
                  </button>
                </div>)}
              </div>
            )}
          </div>
        )
      })}

      {/* Coming soon */}
      {comingSoon.map((s) => (
        <div
          key={s.id}
          style={{
            background: 'white', borderRadius: 16, padding: '24px 28px',
            boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 20, opacity: 0.6, cursor: 'default',
          }}
        >
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ServiceIcon serviceId={s.id} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 600, fontSize: 17, color: 'var(--text-secondary)', marginBottom: 4, lineHeight: 1.3 }}>{s.name}</p>
            <p style={{ fontSize: 14, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>{s.description}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', borderRadius: 8, padding: '4px 10px' }}>
            <Clock size={13} color="var(--text-tertiary)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)' }}>Coming soon</span>
          </div>
        </div>
      ))}
    </div>
  )
}
