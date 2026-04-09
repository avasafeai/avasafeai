'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ReadinessResult, ReadinessCheck } from '@/types/supabase'
import { CheckCircle, XCircle, Info, ShieldCheck, Lock, Users } from 'lucide-react'
import Logo from '@/components/Logo'
import ReadinessRing from '@/components/ReadinessRing'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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
  const [continuing, setContinuing] = useState(false)
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [applyingFix, setApplyingFix] = useState<string | null>(null)
  const [isPaidViaStripe, setIsPaidViaStripe] = useState(false)
  const [appTier, setAppTier] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState(false)

  const loadValidation = useCallback(async (id: string, fd?: Record<string, string>) => {
    const res = await fetch(`/api/validate-application?application_id=${id}`)
    const json = await res.json()
    setResult(json.data as ReadinessResult)
    if (json.form_data && Object.keys(json.form_data).length > 0) {
      setFormData(json.form_data as Record<string, string>)
    }
    if (fd) {
      sessionStorage.setItem('readiness_score', String(json.data?.score ?? 0))
      sessionStorage.setItem('checks_passed', String(json.data?.checks_passed ?? 0))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlId = urlParams.get('applicationId')
    const id = urlId ?? sessionStorage.getItem('application_id')
    const stored = sessionStorage.getItem('form_data')
    setApplicationId(id)
    if (id) sessionStorage.setItem('application_id', id)
    let fd: Record<string, string> = {}
    if (stored) {
      try { fd = JSON.parse(stored) as Record<string, string>; setFormData(fd) } catch { /* ignore */ }
    }

    if (id) {
      const supabase = createClient()
      supabase.from('applications').select('stripe_payment_id, tier').eq('id', id).single()
        .then(({ data }) => {
          if (data?.stripe_payment_id) setIsPaidViaStripe(true)
          if (data?.tier) setAppTier(data.tier as string)
        })
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

  function handleContinue() {
    if (!applicationId) return
    setContinuing(true)
    router.push(`/apply/complete?applicationId=${applicationId}`)
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

  const isPaid = isPaidViaStripe
  const issueCount = (result?.blockers ?? 0) + (result?.warnings ?? 0)

  // Paywall CTA — unpaid users go to /apply to choose a tier
  function handleUpgrade() {
    router.push('/apply')
  }

  // Guided → Expert upgrade
  async function handleExpertUpgrade() {
    if (!applicationId) return
    setUpgrading(true)
    try {
      const res = await fetch('/api/create-upgrade-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
      })
      const data = await res.json() as { url?: string }
      if (data.url) window.location.href = data.url
    } finally {
      setUpgrading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--off-white)' }}>
      {/* Progress bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, background: 'var(--border)', zIndex: 50 }}>
        <div style={{ height: '100%', background: 'var(--navy)', width: '85%', transition: 'width 600ms ease' }} />
      </div>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, background: 'rgba(250,250,248,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', height: 64, display: 'flex', alignItems: 'center', padding: '0 24px', zIndex: 40 }}>
        <Logo size="sm" href="/dashboard" />
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
        ) : !isPaid ? (
          // ── PAYWALL STATE ──────────────────────────────────────────────────────
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Locked score */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '32px 24px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--off-white)', border: '3px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={36} color="var(--text-tertiary)" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>
                  AVA found {issueCount} issue{issueCount !== 1 ? 's' : ''}
                </p>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  Unlock the full report to see what needs fixing before you submit.
                </p>
              </div>
            </div>

            {/* Blurred issue preview */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--error)', marginBottom: 16 }}>
                Issues found ({issueCount})
              </p>
              {/* Blurred placeholder rows */}
              {Array.from({ length: Math.min(issueCount || 2, 4) }).map((_, i) => (
                <div key={i} style={{ height: 52, borderRadius: 10, background: 'var(--off-white)', marginBottom: 10, filter: 'blur(4px)', userSelect: 'none' }}>
                  <div style={{ height: '100%', borderLeft: '3px solid var(--error)', borderRadius: '0 10px 10px 0', padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 120, height: 12, borderRadius: 6, background: 'var(--border)' }} />
                    <div style={{ width: 180, height: 10, borderRadius: 6, background: 'var(--border)' }} />
                  </div>
                </div>
              ))}
              {/* Lock overlay */}
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(250,250,248,0.7)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'white', borderRadius: 100, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <Lock size={14} color="var(--text-secondary)" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Full report locked</span>
                </div>
              </div>
            </div>

            {/* Upgrade options */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-md)' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, color: 'var(--navy)', marginBottom: 6 }}>
                Unlock your full validation report
              </p>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
                See every issue, get exact fix instructions, and submit with confidence.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={() => handleUpgrade()} className="btn-gold" style={{ width: '100%', height: 56, borderRadius: 12, fontSize: 15, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <span style={{ fontWeight: 700 }}>Fix with AVA ($29)</span>
                  <span style={{ fontSize: 12, opacity: 0.85, fontWeight: 400 }}>AI-validated application + full mailing package</span>
                </button>
                <button onClick={() => handleUpgrade()} style={{ width: '100%', height: 56, borderRadius: 12, background: 'var(--navy)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 15, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, fontFamily: 'var(--font-body)' }}>
                  <span style={{ fontWeight: 700 }}>Book an Expert ($79)</span>
                  <span style={{ fontSize: 12, opacity: 0.75, fontWeight: 400 }}>45-min Zoom session with an Avasafe expert</span>
                </button>
              </div>
              <div style={{ marginTop: 20, display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px', background: 'var(--gold-subtle)', borderRadius: 10 }}>
                <ShieldCheck size={16} color="var(--gold)" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>The Avasafe Guarantee.</strong>{' '}
                  If your application is rejected due to an error in AVA&apos;s validation, we will prepare your resubmission at no cost.
                </p>
              </div>
            </div>

          </div>
        ) : (
          // ── FULL REVIEW (paid users) ───────────────────────────────────────────
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Readiness score ring */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '32px 24px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <ReadinessRing score={score} />
              <p style={{ fontSize: 14, color: 'var(--text-tertiary)', textAlign: 'center' }}>
                {result?.checks_passed ?? 0} checks passed · {result?.issues_total ?? 0} issues to fix
              </p>
            </div>

            {/* All clear */}
            {score >= 90 && (
              <div style={{ background: '#F0FFF4', border: '1px solid rgba(26,107,58,0.25)', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <ShieldCheck size={20} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--success)', marginBottom: 6 }}>The Avasafe Guarantee</p>
                  <p style={{ fontSize: 14, color: '#276749', lineHeight: 1.6, marginBottom: 6 }}>
                    If your application is rejected due to an error in AVA&apos;s validation, we will prepare your resubmission at no cost.
                  </p>
                  <p style={{ fontSize: 13, color: '#276749', lineHeight: 1.5, marginBottom: 2 }}>
                    <strong>Covered:</strong> field values AVA validated as correct, checks AVA marked as passed that were actually wrong.
                  </p>
                  <p style={{ fontSize: 13, color: '#4A8C6A', lineHeight: 1.5 }}>
                    <strong>Not covered:</strong> missing documents you chose not to upload, information you entered incorrectly, government portal errors, or processing delays.
                  </p>
                </div>
              </div>
            )}

            {/* Blockers */}
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

            {/* Warnings */}
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

            {/* Suggestions */}
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

            {/* Expert upgrade card — guided users whose score isn't perfect */}
            {appTier === 'guided' && isPaid && score < 95 && (
              <div style={{ background: 'var(--off-white)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 16, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <Users size={20} color="#0F2D52" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>
                    Want an expert to handle this for you?
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
                    Upgrade to an Expert Session and Siva will guide you through the portal live on a Zoom call. You handle passwords. He handles everything else.
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    You already paid $29 for Guided. Upgrade for just $50 more.
                  </p>
                  <button
                    onClick={handleExpertUpgrade}
                    disabled={upgrading}
                    style={{ background: '#0F2D52', color: 'white', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 500, cursor: upgrading ? 'not-allowed' : 'pointer', opacity: upgrading ? 0.6 : 1, fontFamily: 'var(--font-body)' }}
                  >
                    {upgrading ? 'Redirecting...' : 'Upgrade to Expert — $50'}
                  </button>
                </div>
              </div>
            )}

            {/* Passed checks summary */}
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

            {/* Application summary */}
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

            {/* Document checklist */}
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

            {/* Trust badge */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-sm)' }}>
              <ShieldCheck size={20} color="var(--gold)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Rejection guarantee included.</strong>{' '}
                If our validation causes a rejection, we fix it at no cost.
              </p>
            </div>

            {/* CTA */}
            <div className="review-cta" style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button onClick={() => router.back()} style={{ flex: 1, height: 52, borderRadius: 12, border: '1.5px solid var(--border)', background: 'white', fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                Edit application
              </button>
              {blockers > 0 ? (
                <button disabled style={{ flex: 2, height: 52, borderRadius: 12, border: '1.5px solid var(--navy)', background: 'white', fontSize: 15, fontWeight: 500, color: 'var(--navy)', opacity: 0.5, cursor: 'not-allowed', fontFamily: 'var(--font-body)' }}>
                  Fix {blockers} blocker{blockers !== 1 ? 's' : ''} to continue
                </button>
              ) : score === 0 ? (
                <button disabled style={{ flex: 2, height: 52, borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--off-white)', fontSize: 15, fontWeight: 500, color: 'var(--text-tertiary)', cursor: 'not-allowed', fontFamily: 'var(--font-body)' }}>
                  Complete validation to continue
                </button>
              ) : warnings > 0 ? (
                <button onClick={handleContinue} disabled={continuing} className="btn-gold" style={{ flex: 2, height: 52, borderRadius: 12, opacity: continuing ? 0.6 : 1 }}>
                  {continuing ? 'One moment...' : 'Continue with warnings →'}
                </button>
              ) : (
                <button onClick={handleContinue} disabled={continuing} className="btn-gold" style={{ flex: 2, height: 52, borderRadius: 12, opacity: continuing ? 0.6 : 1 }}>
                  {continuing ? 'One moment...' : 'Application ready. Continue →'}
                </button>
              )}
            </div>

            {blockers > 0 && (
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)' }}>
                Fix all blockers above to continue.
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
              {applying ? 'Applying...' : `Apply fix → ${check.correct_value}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
