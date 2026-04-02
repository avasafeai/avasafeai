'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ValidationResult } from '@/types/supabase'
import { CheckCircle, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react'
import Logo from '@/components/Logo'

const FIELD_GROUPS = [
  {
    label: 'Personal details',
    fields: [
      { key: 'first_name', label: 'First name' },
      { key: 'last_name', label: 'Last name' },
      { key: 'date_of_birth', label: 'Date of birth' },
      { key: 'place_of_birth', label: 'Place of birth' },
      { key: 'gender', label: 'Gender' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
    ],
  },
  {
    label: 'Passport details',
    fields: [
      { key: 'passport_number', label: 'Passport number' },
      { key: 'passport_issue_date', label: 'Issue date' },
      { key: 'passport_expiry_date', label: 'Expiry date' },
      { key: 'passport_issued_by', label: 'Issuing country' },
    ],
  },
  {
    label: 'Indian origin',
    fields: [
      { key: 'indian_origin_proof', label: 'Origin proof' },
    ],
  },
  {
    label: 'Address & jurisdiction',
    fields: [
      { key: 'address_line1', label: 'Street address' },
      { key: 'address_city', label: 'City' },
      { key: 'address_state', label: 'State' },
      { key: 'address_zip', label: 'ZIP code' },
    ],
  },
  {
    label: 'Family details',
    fields: [
      { key: 'father_name', label: "Father's name" },
      { key: 'mother_name', label: "Mother's name" },
      { key: 'spouse_name', label: "Spouse's name" },
    ],
  },
]

const REQUIRED_DOCS = [
  { key: 'us_passport', label: 'US Passport (bio data page)' },
  { key: 'photo', label: 'Passport-style photo (square, white background)' },
  { key: 'address_proof', label: 'US address proof (dated within 3 months)' },
]

export default function ReviewPage() {
  const router = useRouter()

  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [serviceType, setServiceType] = useState('oci_new')

  useEffect(() => {
    const id = sessionStorage.getItem('application_id')
    const svc = sessionStorage.getItem('service_type') ?? 'oci_new'
    const stored = sessionStorage.getItem('form_data')
    setApplicationId(id)
    setServiceType(svc)
    if (stored) {
      try { setFormData(JSON.parse(stored)) } catch { /* ignore */ }
    }
    if (!id) { setLoading(false); return }

    fetch(`/api/validate-application?application_id=${id}`)
      .then((r) => r.json())
      .then(({ data, form_data }) => {
        setValidation(data)
        if (form_data && Object.keys(form_data).length > 0) setFormData(form_data)
        setLoading(false)
      })
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

  const hasFormData = Object.values(formData).some(v => !!v)

  return (
    <main style={{ minHeight: '100vh', background: 'var(--off-white)' }}>
      {/* Progress bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, background: 'var(--border)', zIndex: 50 }}>
        <div style={{ height: '100%', background: 'var(--navy)', width: '85%', transition: 'width 600ms ease' }} />
      </div>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, background: 'rgba(250,250,248,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', height: 64, display: 'flex', alignItems: 'center', padding: '0 24px', zIndex: 40 }}>
        <Logo size="sm" />
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
          STEP 4 OF 5
        </span>
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Title */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 32, color: 'var(--navy)', marginBottom: 8, lineHeight: 1.2 }}>
            Review your application
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            AVA has validated everything against known rejection causes. Confirm your details before paying.
          </p>
        </div>

        {loading ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 24px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', gap: 5 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)',
                  animation: 'bounce 1.2s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <span style={{ fontSize: 15, color: 'var(--text-secondary)' }}>AVA is running final checks...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── Validation status banner ── */}
            {blockers.length === 0 && warnings.length === 0 && (
              <div style={{ background: '#F0FFF4', border: '1px solid rgba(26,107,58,0.25)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <CheckCircle size={20} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--success)', marginBottom: 3 }}>Everything looks perfect</p>
                  <p style={{ fontSize: 14, color: '#276749', lineHeight: 1.5 }}>No errors found. Your application is ready for submission.</p>
                </div>
              </div>
            )}

            {blockers.length > 0 && (
              <div style={{ background: 'var(--error-bg)', border: '1px solid rgba(185,28,28,0.2)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <XCircle size={20} color="var(--error)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--error)', marginBottom: 3 }}>Issues found that may cause rejection</p>
                  <p style={{ fontSize: 14, color: '#991B1B' }}>Fix all blockers below before proceeding to payment.</p>
                </div>
              </div>
            )}

            {warnings.length > 0 && blockers.length === 0 && (
              <div style={{ background: 'var(--warning-bg)', border: '1px solid rgba(146,64,14,0.2)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <AlertTriangle size={20} color="var(--warning)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--warning)', marginBottom: 3 }}>A few things to double-check</p>
                  <p style={{ fontSize: 14, color: '#92400E' }}>These are recommendations. You can still proceed.</p>
                </div>
              </div>
            )}

            {/* ── Blockers ── */}
            {blockers.length > 0 && (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--error)', marginBottom: 14 }}>Must fix before paying</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {blockers.map((e, i) => (
                    <div key={i} style={{ borderRadius: 10, padding: '14px 16px', background: 'var(--error-bg)', border: '1px solid rgba(185,28,28,0.15)' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--error)', textTransform: 'capitalize', marginBottom: 3 }}>
                        {e.field.replace(/_/g, ' ')}
                      </p>
                      <p style={{ fontSize: 14, color: '#991B1B', lineHeight: 1.5 }}>{e.issue}</p>
                      {e.fix && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, fontWeight: 500 }}>Fix: {e.fix}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Warnings ── */}
            {warnings.length > 0 && (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--warning)', marginBottom: 14 }}>Recommendations</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {warnings.map((e, i) => (
                    <div key={i} style={{ borderRadius: 10, padding: '14px 16px', background: 'var(--warning-bg)', border: '1px solid rgba(146,64,14,0.15)' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--warning)', textTransform: 'capitalize', marginBottom: 3 }}>
                        {e.field.replace(/_/g, ' ')}
                      </p>
                      <p style={{ fontSize: 14, color: '#92400E', lineHeight: 1.5 }}>{e.issue}</p>
                      {e.fix && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, fontWeight: 500 }}>Fix: {e.fix}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Passed checks ── */}
            {passed.length > 0 && (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--success)', marginBottom: 14 }}>Passed checks</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {passed.map((check, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle size={14} color="var(--success)" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{check}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Application summary ── */}
            {hasFormData && (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--navy)', marginBottom: 24 }}>
                  Your application summary
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  {FIELD_GROUPS.map((group) => {
                    const groupFields = group.fields.filter(f => formData[f.key])
                    if (groupFields.length === 0) return null
                    return (
                      <div key={group.label}>
                        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: 10 }}>
                          {group.label}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          {groupFields.map((f, idx) => (
                            <div
                              key={f.key}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 12,
                                padding: '10px 0',
                                borderBottom: idx < groupFields.length - 1 ? '0.5px solid var(--border)' : 'none',
                                background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)',
                              }}
                            >
                              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                                {f.label}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', wordBreak: 'break-word' }}>
                                {formData[f.key]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Document checklist ── */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--navy)', marginBottom: 16 }}>
                Required documents
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {REQUIRED_DOCS.map((doc) => (
                  <div key={doc.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <CheckCircle size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{doc.label}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 14 }}>
                Make sure all documents are clear, current, and correctly sized.
              </p>
            </div>

            {/* ── Trust badge ── */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-sm)' }}>
              <ShieldCheck size={20} color="var(--gold)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Rejection guarantee included.</strong>{' '}
                If our validation causes a rejection, we fix it at no cost.
              </p>
            </div>

            {/* ── Actions ── */}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button onClick={() => router.back()}
                style={{ flex: 1, height: 52, borderRadius: 12, border: '1.5px solid var(--border)', background: 'white', fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                Edit application
              </button>
              <button onClick={handlePay} disabled={!isReady || paying}
                className="btn-gold"
                style={{ flex: 2, height: 52, borderRadius: 12, opacity: (!isReady || paying) ? 0.5 : 1, cursor: (!isReady || paying) ? 'not-allowed' : 'pointer' }}>
                {paying ? 'Redirecting...' : 'Pay $29 and continue →'}
              </button>
            </div>

            {!isReady && blockers.length > 0 && (
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)' }}>
                Fix all blockers above to enable payment.
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
