import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AvaMessage from '@/components/AvaMessage'
import Logo from '@/components/Logo'
import { FileText, Award, ScrollText, ChevronRight } from 'lucide-react'

const SERVICES = [
  {
    id: 'oci_new',
    title: 'OCI Card (New Application)',
    desc: 'First-time OCI card for Indian-origin US citizens and residents.',
    fee: '$29 Avasafe fee',
    govFee: '$275 govt. fee',
    icon: Award,
  },
  {
    id: 'oci_renewal',
    title: 'OCI Card (Renewal)',
    desc: 'Renew your OCI card after a new passport or name change.',
    fee: '$29 Avasafe fee',
    govFee: '$25 govt. fee',
    icon: FileText,
  },
  {
    id: 'passport_renewal',
    title: 'Indian Passport Renewal',
    desc: 'Renew your Indian passport from the US.',
    fee: '$29 Avasafe fee',
    govFee: 'Govt. fee varies',
    icon: ScrollText,
  },
]

export default async function ApplyPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off-white)' }}>
      {/* Header */}
      <header
        style={{
          height: 64,
          background: 'white',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        <Logo size="md" />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--text-tertiary)',
          }}
        >
          Choose service
        </span>
      </header>

      {/* Content */}
      <main
        style={{
          maxWidth: 640,
          margin: '0 auto',
          padding: '48px 24px 80px',
        }}
      >
        <AvaMessage
          message="I already have most of what I need from your documents. Which application would you like me to prepare?"
          className="mb-8"
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SERVICES.map((s) => {
            const Icon = s.icon
            return (
              <Link
                key={s.id}
                href="/apply/form"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('service_type', s.id)
                  }
                }}
                style={{ textDecoration: 'none' }}
              >
                <div
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
                  {/* Icon */}
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: 'var(--navy)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={22} color="white" />
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontWeight: 600,
                        fontSize: 17,
                        color: 'var(--navy)',
                        marginBottom: 4,
                        lineHeight: 1.3,
                      }}
                    >
                      {s.title}
                    </p>
                    <p
                      style={{
                        fontSize: 14,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        marginBottom: 6,
                      }}
                    >
                      {s.desc}
                    </p>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          color: 'var(--text-tertiary)',
                        }}
                      >
                        {s.govFee}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          color: 'var(--text-tertiary)',
                        }}
                      >
                        + {s.fee}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight size={20} color="var(--gold)" style={{ flexShrink: 0 }} />
                </div>
              </Link>
            )
          })}
        </div>

        <p
          style={{
            marginTop: 32,
            fontSize: 13,
            color: 'var(--text-tertiary)',
            textAlign: 'center',
          }}
        >
          Not sure which to choose?{' '}
          <a
            href="mailto:support@avasafe.ai"
            style={{ color: 'var(--gold)', textDecoration: 'none' }}
          >
            Ask us
          </a>
        </p>
      </main>
    </div>
  )
}
