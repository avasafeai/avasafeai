'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ReadinessResult, ReadinessCheck } from '@/types/supabase'
import { CheckCircle, XCircle, Info, ShieldCheck } from 'lucide-react'
import Logo from '@/components/Logo'
import ReadinessRing from '@/components/ReadinessRing'
import Link from 'next/link'

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
      { key: 'passport_issued_by', label: 'Issuing country / place of issue' },
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
  { key: 'us_passport', label: 'US Passport' },
  { key: 'indian_passport', label: 'Indian Passport' },
  { key: 'address_proof', label: 'US Address Proof' },
  { key: 'photo', label: 'Passport-style photo' },
]

export default function ReviewPage() {
  const router = useRouter()

  const [result, setResult] = useState<ReadinessResult | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [serviceType, setServiceType] = useState('oci_new')
  const [applyingFix, setApplyingFix] = useState<string | null>(null)

  const loadValidation = useCallback(async (id: string, fd?: Record<string, string>) => {
    const res = await fetch(`/api/validate-application?application_id=${id}`)
    const json = await res.json()
    setResult(json.data as ReadinessResult)
    if (json.form_data && Object.keys(json.form_data).length > 0) {
      setFormData(json.form_data as Record<string, string>)
    }
    if (fd) {
      // Store for complete page
      sessionStorage.setItem('readiness_score', String(json.data?.score ?? 0))
      sessionStorage.setItem('checks_passed', String(json.data?.checks_passed ?? 0))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const id = sessionStorage.getItem('application_id')
    const svc = sessionStorage.getItem('service_type') ?? 'oci_new'
    const stored = sessionStorage.getItem('form_data')
    setApplicationId(id)
    setServiceType(svc)
    let fd: Record<string, string> = {}
    if (stored) {
      try { fd = JSON.parse(stored) as Record<string, string>; setFormData(fd) } catch { /* ignore */ }
    }
    if (!id) { setLoading(false); return }
    loadValidation(id, fd).catch(() => setLoading(false))
  }, [loadValidation])

  async function applyFix(check: ReadinessCheck) {
    if (!check.field || !check.correct_value || !applicationId) return
    setApplyingFix(check.id)
    const updated = { ...formData, [check.field]: check.correct_value }
    setFormData(updated)
    sessionStorage.setItem('form_data', JSON.stringify(updated))
    setLoading(true)
    const res = await fetch('/api/validate-application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form_data: updated, application_id: applicationId }),
    })
    const json = await res.json()
    setResult(json.data as ReadinessResult)
    setLoading(false)
    setApplyingFix(null)
    if (json.data?.score) {
      sessionStorage.setItem('readiness_score', String(json.data.score))
      sessionStorage.setItem('checks_passed', String(json.data.checks_passed ?? 0))
    }
  }

  async function handlePay() {
    if (!applicationId) return
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

  const score = result?.score ?? 0
  const blockers = result?.blockers ?? 0
  const warnings = result?.warnings ?? 0
  const checksArr = result?.checks ?? []
  const blockerChecks = checksArr.filter(c => c.severity === 'blocker' && c.status !== 'passed')
  const warningChecks = checksArr.filter(c => (c.severity === 'warning' || c.severity === 'medium') && c.status !== 'passed')
  const suggestionChecks = checksArr.filter(c => c.severity === 'suggestion' && c.status !== 'passed')
  const passedChecks = checksArr.filter(c => c.status === 'passed')
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
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>STEP 4 OF 5</span>
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 32, color: 'var(--navy)', marginBottom: 8, lineHeight: 1.2 }}>
            Application validation complete
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            AVA checked everything against 10 known rejection causes.
          </p>
        </div>

        {loading ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 24px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', gap: 5 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)', animation: 'bounce 1.2s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <span style={{ fontSize: 15, color: 'var(--text-secondary)' }}>AVA is running validation checks...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Readiness score ring ── */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '32px 24px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <ReadinessRing score={score} />
              <p style={{ fontSize: 14, color: 'var(--text-tertiary)', textAlign: 'center' }}>
                {result?.checks_passed ?? 0} checks passed · {result?.issues_total ?? 0} issues to fix
              </p>
            </div>

            {/* ── All clear ── */}
            {score >= 90 && (
              <div style={{ background: '#F0FFF4', border: '1px solid rgba(26,107,58,0.25)', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <CheckCircle size={20} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--success)', marginBottom: 4 }}>Validated against 10 rejection causes</p>
                  <p style={{ fontSize: 14, color: '#276749', lineHeight: 1.5 }}>Everything looks correct. The rejection guarantee applies to your application.</p>
                </div>
              </div>
            )}

            {/* ── Blockers ── */}
            {blockerChecks.length > 0 && (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--error)', marginBottom: 16 }}>Fix these before submitting</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {blockerChecks.map((c) => (
                    <IssueCard key={c.id} check={c} color="var(--error)" onApplyFix={applyFix} applying={applyingFix === c.id} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Warnings ── */}
            {warningChecks.length > 0 && (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--warning)', marginBottom: 16 }}>Recommendations</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {warningChecks.map((c) => (
                    <IssueCard key={c.id} check={c} color="var(--warning)" onApplyFix={applyFix} applying={applyingFix === c.id} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Suggestions ── */}
            {suggestionChecks.length > 0 && (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 16 }}>Suggestions</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {suggestionChecks.map((c) => (
                    <div key={c.id} style={{ borderLeft: '3px solid var(--border)', paddingLeft: 14, display: 'flex', gap: 10 }}>
                      <Info size={14} color="var(--text-tertiary)" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{c.title}</p>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Passed checks summary ── */}
            {passedChecks.length > 0 && (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--success)', marginBottom: 14 }}>{passedChecks.length} checks passed</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {passedChecks.map((c) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle size={13} color="var(--success)" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Application summary ── */}
            {hasFormData && (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--navy)', marginBottom: 24 }}>Application summary</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {FIELD_GROUPS.map((group) => {
                    const groupFields = group.fields.filter(f => formData[f.key])
                    if (!groupFields.length) return null
                    return (
                      <div key={group.label}>
                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: 10 }}>{group.label}</p>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          {groupFields.map((f, idx) => (
                            <div key={f.key} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '10px 0', borderBottom: idx < groupFields.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{f.label}</span>
                              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', wordBreak: 'break-word' }}>{formData[f.key]}</span>
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
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--navy)', marginBottom: 16 }}>Document checklist</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {REQUIRED_DOCS.map((doc) => {
                  const docCheck = checksArr.find(c => c.id === `doc_${doc.key}`)
                  const present = docCheck?.status === 'passed'
                  return (
                    <div key={doc.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {present
                        ? <CheckCircle size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                        : <XCircle size={16} color="var(--error)" style={{ flexShrink: 0 }} />
                      }
                      <span style={{ fontSize: 14, color: present ? 'var(--text-primary)' : 'var(--error)' }}>{doc.label}</span>
                      {!present && (
                        <Link href="/dashboard/documents/add" style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 500, marginLeft: 'auto', textDecoration: 'none' }}>
                          Add now →
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Trust badge ── */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-sm)' }}>
              <ShieldCheck size={20} color="var(--gold)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Rejection guarantee included.</strong>{' '}
                If our validation causes a rejection, we fix it at no cost.
              </p>
            </div>

            {/* ── CTA ── */}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button onClick={() => router.back()} style={{ flex: 1, height: 52, borderRadius: 12, border: '1.5px solid var(--border)', background: 'white', fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                Edit application
              </button>
              {blockers > 0 ? (
                <button disabled style={{ flex: 2, height: 52, borderRadius: 12, border: '1.5px solid var(--navy)', background: 'white', fontSize: 15, fontWeight: 500, color: 'var(--navy)', opacity: 0.5, cursor: 'not-allowed', fontFamily: 'var(--font-body)' }}>
                  Fix {blockers} blocker{blockers !== 1 ? 's' : ''} to continue
                </button>
              ) : warnings > 0 ? (
                <button onClick={handlePay} disabled={paying} className="btn-gold" style={{ flex: 2, height: 52, borderRadius: 12, opacity: paying ? 0.6 : 1 }}>
                  {paying ? 'Redirecting...' : 'Continue with warnings →'}
                </button>
              ) : (
                <button onClick={handlePay} disabled={paying} className="btn-gold" style={{ flex: 2, height: 52, borderRadius: 12, opacity: paying ? 0.6 : 1 }}>
                  {paying ? 'Redirecting...' : 'Application ready — continue →'}
                </button>
              )}
            </div>

            {blockers > 0 && (
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

// ── Issue card ───────────────────────────────────────────────────────────────
function IssueCard({ check, color, onApplyFix, applying }: {
  check: ReadinessCheck
  color: string
  onApplyFix: (c: ReadinessCheck) => void
  applying: boolean
}) {
  return (
    <div style={{ borderLeft: '3px solid ' + color, paddingLeft: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <XCircle size={15} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{check.title}</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{check.message}</p>
          {check.fix && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, fontStyle: 'italic' }}>{check.fix}</p>
          )}
          {check.field && check.correct_value && (
            <button
              onClick={() => onApplyFix(check)}
              disabled={applying}
              style={{
                marginTop: 10, height: 30, padding: '0 12px', borderRadius: 8,
                background: color, color: 'white', border: 'none', fontSize: 12,
                fontWeight: 600, cursor: applying ? 'not-allowed' : 'pointer', opacity: applying ? 0.6 : 1,
              }}
            >
              {applying ? 'Applying…' : `Apply fix → ${check.correct_value}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
