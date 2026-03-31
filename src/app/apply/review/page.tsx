'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ProgressBar from '@/components/ProgressBar'
import AvaMessage from '@/components/AvaMessage'
import TrustBadges from '@/components/TrustBadges'
import { ValidationResult } from '@/types/supabase'
import { CheckCircle } from 'lucide-react'

export default function ReviewPage() {
  const router = useRouter()
  const params = useParams()
  const serviceType = params?.service as string ?? 'oci_new'

  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [applicationId, setApplicationId] = useState<string | null>(null)

  useEffect(() => {
    const id = sessionStorage.getItem('application_id')
    setApplicationId(id)
    if (!id) { setLoading(false); return }

    fetch(`/api/validate-application?application_id=${id}`)
      .then((r) => r.json())
      .then(({ data }) => { setValidation(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const blockers = validation?.blockers ?? []
  const warnings = validation?.warnings ?? []
  const passed = validation?.passed_checks ?? []
  const isReady = !loading && blockers.length === 0

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
    <main className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      <div className="max-w-2xl mx-auto">
        <ProgressBar currentStep={2} />
        <div className="px-6 py-8">
          <h1 className="font-display text-2xl font-semibold mb-1" style={{ color: 'var(--color-navy)' }}>
            Review your application
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
            AVA has validated everything against known rejection causes.
          </p>

          {loading ? (
            <div className="flex items-center gap-3 rounded-xl px-5 py-4"
              style={{ background: 'rgba(15,45,82,0.06)' }}>
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: 'var(--color-navy)', animationDelay: `${i*0.15}s` }} />
                ))}
              </div>
              <span className="text-sm" style={{ color: 'var(--color-navy)' }}>AVA is running final checks…</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Clean state */}
              {isReady && blockers.length === 0 && warnings.length === 0 && (
                <AvaMessage message="Everything looks perfect — no errors found. Your application is ready for submission." />
              )}

              {/* Blockers */}
              {blockers.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2"
                    style={{ color: 'var(--color-error)' }}>
                    Must fix before paying
                  </p>
                  <div className="flex flex-col gap-2">
                    {blockers.map((e, i) => (
                      <div key={i} className="rounded-xl px-4 py-3"
                        style={{ background: 'var(--color-error-bg)', border: '1px solid rgba(185,28,28,0.2)' }}>
                        <p className="text-sm font-semibold capitalize" style={{ color: 'var(--color-error)' }}>
                          {e.field.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--color-error)' }}>{e.issue}</p>
                        {e.fix && (
                          <p className="text-xs mt-1 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                            Fix: {e.fix}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {warnings.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2"
                    style={{ color: 'var(--color-warning)' }}>
                    Recommendations
                  </p>
                  <div className="flex flex-col gap-2">
                    {warnings.map((e, i) => (
                      <div key={i} className="rounded-xl px-4 py-3"
                        style={{ background: 'var(--color-warning-bg)', border: '1px solid rgba(146,64,14,0.2)' }}>
                        <p className="text-sm font-semibold capitalize" style={{ color: 'var(--color-warning)' }}>
                          {e.field.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--color-warning)' }}>{e.issue}</p>
                        {e.fix && (
                          <p className="text-xs mt-1 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                            Fix: {e.fix}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Passed checks */}
              {passed.length > 0 && (
                <div className="card">
                  <p className="text-xs font-semibold uppercase tracking-wide mb-3"
                    style={{ color: 'var(--color-success)' }}>
                    Passed checks
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {passed.map((check, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle size={13} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{check}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <TrustBadges />

              <div className="flex gap-3">
                <button onClick={() => router.back()}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors"
                  style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  Edit application
                </button>
                <button onClick={handlePay} disabled={!isReady || paying}
                  className="flex-1 btn-gold rounded-xl"
                  style={{ opacity: (!isReady || paying) ? 0.5 : 1 }}>
                  {paying ? 'Redirecting…' : 'Pay $29 and submit →'}
                </button>
              </div>

              {!isReady && blockers.length > 0 && (
                <p className="text-xs text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                  Fix all blockers above to enable payment.
                </p>
              )}

              <p className="text-xs text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                Protected by our rejection guarantee. If our validation causes a rejection, we fix it free.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
