'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Clock, RotateCcw } from 'lucide-react'
import { getAvailableServices, getComingSoonServices } from '@/lib/services/registry'
import { ApplyPrompt } from '@/components/UpgradePrompt'
import type { Plan } from '@/lib/plan-utils'

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
  current_step: number | null
  created_at: string
  status: string
}

interface ServiceCardsProps {
  userPlan: Plan
  inProgressApps: InProgressApp[]
}

// Total form steps per service (for progress display)
const TOTAL_STEPS: Record<string, number> = {
  oci_new:          13,
  oci_renewal:      11,
  passport_renewal: 10,
}

export default function ServiceCards({ userPlan, inProgressApps }: ServiceCardsProps) {
  const router = useRouter()
  const available = getAvailableServices()
  const comingSoon = getComingSoonServices()
  const [upgradeServiceId, setUpgradeServiceId] = useState<string | null>(null)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)

  const canApply = userPlan === 'guided' || userPlan === 'human_assisted'

  async function startApplication(serviceId: string) {
    setCheckingOut(serviceId)
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_type: serviceId }),
      })
      const { data } = await res.json() as { data?: { url: string } }
      if (data?.url) {
        window.location.href = data.url
      } else {
        setCheckingOut(null)
      }
    } catch {
      setCheckingOut(null)
    }
  }

  function resumeApplication(serviceId: string, appId: string) {
    router.push(`/apply/prepare/${serviceId}?applicationId=${appId}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Available services */}
      {available.map((s) => {
        const existingApp = inProgressApps.find(a => a.service_type === s.id)
        const currentStep = existingApp?.current_step ?? 0
        const totalSteps = TOTAL_STEPS[s.id] ?? 13
        const progressPct = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0
        const startedAt = existingApp
          ? new Date(existingApp.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : null
        const isCheckingOut = checkingOut === s.id
        const price = userPlan === 'human_assisted' ? '$79' : '$29'

        return (
          <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                background: 'white',
                borderRadius: 16,
                padding: '24px 28px',
                boxShadow: 'var(--shadow-sm)',
                border: existingApp ? '2px solid var(--gold)' : '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ServiceIcon serviceId={s.id} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 17, color: 'var(--navy)', marginBottom: 4, lineHeight: 1.3 }}>{s.name}</p>
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

              {/* State 1 — Resume (existing in-progress application) */}
              {existingApp && (
                <div>
                  {/* Progress bar */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        Step {currentStep} of {totalSteps}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        {progressPct}%
                      </span>
                    </div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 100 }}>
                      <div style={{ height: '100%', background: 'var(--gold)', borderRadius: 100, width: `${progressPct}%`, transition: 'width 300ms ease' }} />
                    </div>
                    {startedAt && (
                      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                        Started {startedAt}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => resumeApplication(s.id, existingApp.id)}
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
              )}

              {/* State 2/3 — Pay to start (guided or human_assisted, no existing app) */}
              {!existingApp && canApply && (
                <div>
                  <button
                    onClick={() => startApplication(s.id)}
                    disabled={isCheckingOut}
                    style={{
                      width: '100%', height: 46, borderRadius: 12, border: 'none',
                      background: 'var(--navy)', color: 'white',
                      fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15,
                      cursor: isCheckingOut ? 'not-allowed' : 'pointer',
                      opacity: isCheckingOut ? 0.7 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'opacity 150ms ease',
                    }}
                  >
                    {isCheckingOut ? (
                      <>Redirecting to payment...</>
                    ) : (
                      <>
                        Start {s.short_name} — {price}
                        <ChevronRight size={16} />
                      </>
                    )}
                  </button>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 8 }}>
                    One-time payment per application
                  </p>
                </div>
              )}

              {/* State 4 — Upgrade prompt (free or locker, no existing app) */}
              {!existingApp && !canApply && upgradeServiceId !== s.id && (
                <button
                  onClick={() => setUpgradeServiceId(s.id)}
                  style={{
                    width: '100%', height: 46, borderRadius: 12,
                    background: 'transparent', border: '1.5px solid var(--gold)',
                    color: 'var(--gold)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  Start {s.short_name}
                  <ChevronRight size={16} />
                </button>
              )}
            </div>

            {/* Upgrade prompt expands inline when free/locker user picks this service */}
            {upgradeServiceId === s.id && !existingApp && !canApply && (
              <ApplyPrompt serviceId={s.id} onClose={() => setUpgradeServiceId(null)} />
            )}
          </div>
        )
      })}

      {/* Coming soon services */}
      {comingSoon.map((s) => (
        <div
          key={s.id}
          style={{
            background: 'white',
            borderRadius: 16,
            padding: '24px 28px',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            opacity: 0.6,
            cursor: 'default',
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
