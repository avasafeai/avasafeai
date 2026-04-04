'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, Lock, ArrowRight } from 'lucide-react'
import Logo from '@/components/Logo'

const SERVICE_LABELS: Record<string, string> = {
  oci_new: 'OCI Card — New Application',
  oci_renewal: 'OCI Card — Renewal',
  passport_renewal: 'Indian Passport Renewal',
}

export default function PaymentPage() {
  const [serviceType, setServiceType] = useState('oci_new')
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [tier, setTier] = useState<'guided' | 'human_assisted'>('guided')

  useEffect(() => {
    setServiceType(sessionStorage.getItem('service_type') ?? 'oci_new')
    const urlParams = new URLSearchParams(window.location.search)
    const urlId = urlParams.get('applicationId')
    setApplicationId(urlId ?? sessionStorage.getItem('application_id'))
    // Detect tier from a /api call or sessionStorage if needed — default guided
    const storedPlan = sessionStorage.getItem('user_plan') ?? 'guided'
    setTier(storedPlan === 'human_assisted' ? 'human_assisted' : 'guided')
  }, [])

  const price = tier === 'human_assisted' ? '$79' : '$29'
  const tierLabel = tier === 'human_assisted' ? 'Human Assisted' : 'Guided'

  async function handlePay() {
    setPaying(true)
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: applicationId, service_type: serviceType }),
    })
    const { data } = (await res.json()) as { data: { url: string } }
    if (data?.url) window.location.href = data.url
    else setPaying(false)
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--off-white)' }}>
      {/* Progress bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, background: 'var(--border)', zIndex: 50 }}>
        <div style={{ height: '100%', background: 'var(--navy)', width: '95%', transition: 'width 600ms ease' }} />
      </div>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, background: 'rgba(250,250,248,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', height: 64, display: 'flex', alignItems: 'center', padding: '0 24px', zIndex: 40 }}>
        <Logo size="sm" />
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
          STEP 5 OF 5
        </span>
      </header>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px', display: 'flex', gap: 32, flexWrap: 'wrap' }}>

        {/* Left — Order summary */}
        <div style={{ flex: '1 1 280px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 28, color: 'var(--navy)', marginBottom: 24, lineHeight: 1.2 }}>
            Complete your order
          </h1>

          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-sm)', marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 16 }}>Order summary</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 3 }}>
                  {SERVICE_LABELS[serviceType] ?? serviceType} — {tierLabel}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                  {tier === 'human_assisted' ? '45-min expert Zoom session + full application package' : 'AI-validated application + full mailing package'}
                </p>
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>{price}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Total today</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 20, color: 'var(--navy)' }}>{price}</p>
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-sm)' }}>
            <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 14 }}>What&apos;s included</p>
            {[
              'Government portal submitted by AVA',
              'VFS registration completed by AVA',
              'Complete PDF application package',
              'Pre-addressed UPS shipping label',
              'Rejection guarantee',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--gold-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)' }} />
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Payment */}
        <div style={{ flex: '1 1 280px' }}>
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-md)', position: 'sticky', top: 88 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, color: 'var(--navy)', marginBottom: 24 }}>
              Secure payment
            </h2>

            <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '18px 20px', marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                You&apos;ll be securely redirected to Stripe to complete payment. Your card details are never stored by Avasafe.
              </p>
            </div>

            <button onClick={handlePay} disabled={paying}
              className="btn-gold"
              style={{ width: '100%', height: 56, borderRadius: 12, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: paying ? 0.7 : 1 }}>
              {paying ? (
                <>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'white', opacity: 0.8,
                        animation: 'bounce 1.2s ease-in-out infinite', animationDelay: `${i*0.15}s` }} />
                    ))}
                  </div>
                  Redirecting...
                </>
              ) : (
                <>Pay {price} securely <ArrowRight size={16} /></>
              )}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, justifyContent: 'center' }}>
              <Lock size={12} color="var(--text-tertiary)" />
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Secured by Stripe. We never store your card details.</span>
            </div>

            <div style={{ marginTop: 20, display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px', background: 'var(--gold-subtle)', borderRadius: 10 }}>
              <ShieldCheck size={16} color="var(--gold)" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Rejection guarantee.</strong>{' '}
                If our validation causes a rejection, we fix it free.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
