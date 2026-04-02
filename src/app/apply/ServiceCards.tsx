'use client'

import { useRouter } from 'next/navigation'
import { ChevronRight, FileText, Award, ScrollText } from 'lucide-react'

const SERVICES = [
  {
    id: 'oci_new',
    title: 'OCI Card (New Application)',
    desc: 'First-time OCI card for Indian-origin US citizens and residents.',
    fee: '$29 Avasafe fee',
    govFee: '$275 govt. fee',
    Icon: Award,
  },
  {
    id: 'oci_renewal',
    title: 'OCI Card (Renewal)',
    desc: 'Renew your OCI card after a new passport or name change.',
    fee: '$29 Avasafe fee',
    govFee: '$25 govt. fee',
    Icon: FileText,
  },
  {
    id: 'passport_renewal',
    title: 'Indian Passport Renewal',
    desc: 'Renew your Indian passport from the US.',
    fee: '$29 Avasafe fee',
    govFee: 'Govt. fee varies',
    Icon: ScrollText,
  },
]

export default function ServiceCards() {
  const router = useRouter()

  async function pick(id: string) {
    sessionStorage.setItem('service_type', id)
    const res = await fetch('/api/create-application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_type: id }),
    })
    if (res.ok) {
      const { data } = await res.json() as { data: { id: string } }
      sessionStorage.setItem('application_id', data.id)
    }
    router.push('/apply/form')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {SERVICES.map((s) => {
        const { Icon } = s
        return (
          <button
            key={s.id}
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
              const el = e.currentTarget
              el.style.boxShadow = 'var(--shadow-md)'
              el.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.boxShadow = 'var(--shadow-sm)'
              el.style.transform = 'translateY(0)'
            }}
          >
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={22} color="white" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: 17, color: 'var(--navy)', marginBottom: 4, lineHeight: 1.3 }}>{s.title}</p>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>{s.desc}</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-tertiary)' }}>{s.govFee}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-tertiary)' }}>+ {s.fee}</span>
              </div>
            </div>
            <ChevronRight size={20} color="var(--gold)" style={{ flexShrink: 0 }} />
          </button>
        )
      })}
    </div>
  )
}
