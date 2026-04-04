'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Award, ScrollText, Clock } from 'lucide-react'
import { getAvailableServices, getComingSoonServices } from '@/lib/services/registry'
import { ApplyPrompt } from '@/components/UpgradePrompt'
import type { Plan } from '@/lib/plan-utils'

const ICON_MAP: Record<string, React.ElementType> = {
  oci_new:          Award,
  oci_renewal:      Award,
  oci_misc:         Award,
  passport_renewal: ScrollText,
}

interface ServiceCardsProps {
  userPlan: Plan
}

export default function ServiceCards({ userPlan }: ServiceCardsProps) {
  const router = useRouter()
  const available = getAvailableServices()
  const comingSoon = getComingSoonServices()
  const [upgradeServiceId, setUpgradeServiceId] = useState<string | null>(null)

  const canApply = userPlan === 'guided' || userPlan === 'human_assisted'

  function pick(serviceId: string) {
    if (canApply) {
      router.push(`/apply/prepare/${serviceId}`)
    } else {
      setUpgradeServiceId(serviceId)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Available services */}
      {available.map((s) => {
        const Icon = ICON_MAP[s.id] ?? Award
        const govFee = s.fees.government_usd > 0 ? `$${s.fees.government_usd} govt. fee` : 'Govt. fee varies'

        return (
          <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={() => pick(s.id)}
              style={{
                background: 'white',
                borderRadius: 16,
                padding: '24px 28px',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'box-shadow 200ms ease, transform 200ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={22} color="white" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 17, color: 'var(--navy)', marginBottom: 4, lineHeight: 1.3 }}>{s.name}</p>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>{s.description}</p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-tertiary)' }}>{govFee}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-tertiary)' }}>+ $29 Guided / $79 Expert</span>
                </div>
              </div>
              <ChevronRight size={20} color="var(--gold)" style={{ flexShrink: 0 }} />
            </button>

            {/* Upgrade prompt — expands inline when free/locker user picks this service */}
            {upgradeServiceId === s.id && (
              <ApplyPrompt serviceId={s.id} />
            )}
          </div>
        )
      })}

      {/* Coming soon services */}
      {comingSoon.map((s) => {
        const Icon = ICON_MAP[s.id] ?? ScrollText

        return (
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
              <Icon size={22} color="var(--text-tertiary)" />
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
        )
      })}
    </div>
  )
}
