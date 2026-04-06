'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, RotateCcw } from 'lucide-react'
import { getAvailableServices, getComingSoonServices } from '@/lib/services/registry'
import TierSelectionModal from '@/components/TierSelectionModal'
import { getResumeUrl } from '@/lib/plan-utils'

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
}

interface ServiceCardsProps {
  inProgressApps: InProgressApp[]
}

const TOTAL_STEPS: Record<string, number> = {
  oci_new:          13,
  oci_renewal:      11,
  passport_renewal: 10,
}

export default function ServiceCards({ inProgressApps }: ServiceCardsProps) {
  const router = useRouter()
  const available = getAvailableServices()
  const comingSoon = getComingSoonServices()
  const [modalServiceId, setModalServiceId] = useState<string | null>(null)

  const modalService = modalServiceId ? available.find(s => s.id === modalServiceId) : null

  return (
    <>
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
          const tierLabel = existingApp?.tier === 'human_assisted' ? 'Expert Session' : 'Guided'

          return (
            <div
              key={s.id}
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
                      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Started {startedAt}</p>
                    )}
                  </div>
                  <button
                    onClick={() => router.push(getResumeUrl({ id: existingApp.id, service_type: s.id, tier: existingApp.tier }))}
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
                /* State B — No paid app: open tier selection modal */
                <div>
                  <button
                    onClick={() => setModalServiceId(s.id)}
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
                    $29 Guided · $79 Expert Session
                  </p>
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

      {/* Tier selection modal */}
      <TierSelectionModal
        isOpen={!!modalServiceId}
        serviceName={modalService?.name ?? ''}
        serviceType={modalServiceId ?? ''}
        onClose={() => setModalServiceId(null)}
      />
    </>
  )
}
