'use client'

import { useRouter } from 'next/navigation'
import { ChevronRight, LucideIcon } from 'lucide-react'

interface Service {
  id: string
  title: string
  desc: string
  fee: string
  govFee: string
  icon: LucideIcon
}

export default function ServiceCards({ services }: { services: Service[] }) {
  const router = useRouter()

  async function pick(id: string) {
    sessionStorage.setItem('service_type', id)
    // Create application record and store the ID so the form can use it
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
      {services.map((s) => {
        const Icon = s.icon
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
