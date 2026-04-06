'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import AvaMessage from '@/components/AvaMessage'
import Logo from '@/components/Logo'
import { createClient } from '@/lib/supabase/client'

import { CheckCircle } from 'lucide-react'

const VFS_CENTERS: Record<string, string> = {
  CA: 'San Francisco VFS Global',
  NY: 'New York VFS Global',
  NJ: 'New York VFS Global',
  TX: 'Houston VFS Global',
  OK: 'Houston VFS Global',
  IL: 'Chicago VFS Global',
  WA: 'San Francisco VFS Global',
  GA: 'Atlanta VFS Global',
  FL: 'Atlanta VFS Global',
  VA: 'Washington DC VFS Global',
  DC: 'Washington DC VFS Global',
  MA: 'New York VFS Global',
  PA: 'New York VFS Global',
  CT: 'New York VFS Global',
  OH: 'Chicago VFS Global',
  MI: 'Chicago VFS Global',
  WI: 'Chicago VFS Global',
  MN: 'Chicago VFS Global',
  AZ: 'San Francisco VFS Global',
  CO: 'San Francisco VFS Global',
  NC: 'Atlanta VFS Global',
  MD: 'Washington DC VFS Global',
}

const ALL_US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
]

interface FormData {
  first_name: string
  last_name: string
  date_of_birth: string
  place_of_birth: string
  gender: string
  email: string
  phone: string
  passport_number: string
  passport_issue_date: string
  passport_expiry_date: string
  passport_issued_by: string
  indian_origin_proof: string
  address_line1: string
  address_city: string
  address_state: string
  address_zip: string
  father_name: string
  mother_name: string
  spouse_name: string
}

const INITIAL: FormData = {
  first_name: '', last_name: '', date_of_birth: '', place_of_birth: '',
  gender: '', email: '', phone: '', passport_number: '', passport_issue_date: '',
  passport_expiry_date: '', passport_issued_by: '', indian_origin_proof: '',
  address_line1: '', address_city: '', address_state: '', address_zip: '',
  father_name: '', mother_name: '', spouse_name: '',
}

interface Step {
  id: string
  ava: string
  label: string
  field?: keyof FormData
  type?: string
  placeholder?: string
  options?: string[]
  optional?: boolean
  group?: Array<{ field: keyof FormData; label: string; type?: string; placeholder?: string; options?: string[] }>
}

const STEPS: Step[] = [
  {
    id: 'name',
    ava: "Let's start with your name exactly as it appears on your passport.",
    label: 'Your name',
    group: [
      { field: 'first_name', label: 'First name', placeholder: 'Priya' },
      { field: 'last_name', label: 'Last name', placeholder: 'Sharma' },
    ],
  },
  {
    id: 'dob',
    ava: 'When were you born, and where? This goes directly on your OCI application.',
    label: 'Date and place of birth',
    group: [
      { field: 'date_of_birth', label: 'Date of birth', type: 'date' },
      { field: 'place_of_birth', label: 'Place of birth', placeholder: 'Mumbai, India' },
    ],
  },
  {
    id: 'gender',
    ava: 'What gender is listed on your passport?',
    label: 'Gender',
    field: 'gender',
    options: ['Male', 'Female', 'Other'],
  },
  {
    id: 'email',
    ava: "What's your email address? I'll send application updates here.",
    label: 'Email address',
    field: 'email',
    type: 'email',
    placeholder: 'you@example.com',
  },
  {
    id: 'phone',
    ava: "What's your phone number? I'll send status updates via WhatsApp and SMS.",
    label: 'Phone number',
    field: 'phone',
    type: 'tel',
    placeholder: '+1 (555) 000-0000',
  },
  {
    id: 'passport_number',
    ava: "What's your US passport number? You'll find it in the top right corner of the bio data page.",
    label: 'Passport number',
    field: 'passport_number',
    placeholder: 'A12345678',
  },
  {
    id: 'passport_dates',
    ava: 'When was your passport issued and when does it expire?',
    label: 'Passport dates',
    group: [
      { field: 'passport_issue_date', label: 'Issue date', type: 'date' },
      { field: 'passport_expiry_date', label: 'Expiry date', type: 'date' },
    ],
  },
  {
    id: 'passport_country',
    ava: 'Which country issued your passport?',
    label: 'Issuing country',
    field: 'passport_issued_by',
    placeholder: 'United States',
  },
  {
    id: 'origin_proof',
    ava: 'To qualify for an OCI card, you need to show proof of Indian origin. Which document do you have?',
    label: 'Indian origin proof',
    field: 'indian_origin_proof',
    options: ['Old Indian Passport', 'Birth Certificate', 'Parent Indian Passport'],
  },
  {
    id: 'address',
    ava: "What's your current US address? I'll use this to assign the right VFS centre for your application.",
    label: 'Your address',
    group: [
      { field: 'address_line1', label: 'Street address', placeholder: '123 Main Street, Apt 4' },
      { field: 'address_city', label: 'City', placeholder: 'Austin' },
      {
        field: 'address_state', label: 'State',
        options: ALL_US_STATES,
      },
      { field: 'address_zip', label: 'ZIP code', placeholder: '78701' },
    ],
  },
  {
    id: 'father',
    ava: "What's your father's full name? Enter it exactly as it appears on your documents.",
    label: "Father's full name",
    field: 'father_name',
    placeholder: 'Rajesh Sharma',
  },
  {
    id: 'mother',
    ava: "And your mother's full name?",
    label: "Mother's full name",
    field: 'mother_name',
    placeholder: 'Sunita Sharma',
  },
  {
    id: 'spouse',
    ava: "If you're married, what's your spouse's full name? You can skip this if not applicable.",
    label: "Spouse's full name (optional)",
    field: 'spouse_name',
    optional: true,
    placeholder: 'Leave blank if not applicable',
  },
]

// ── Prefill mapping ─────────────────────────────────────────────────────────────

const PREFILL_TO_FORM: Array<{
  prefillId: string
  formKey: keyof FormData
  transform?: (v: string) => string
}> = [
  { prefillId: 'surname', formKey: 'last_name' },
  { prefillId: 'given_name', formKey: 'first_name' },
  { prefillId: 'date_of_birth', formKey: 'date_of_birth', transform: ddmmToISO },
  { prefillId: 'place_of_birth', formKey: 'place_of_birth' },
  { prefillId: 'passport_number', formKey: 'passport_number' },
  { prefillId: 'date_of_issue', formKey: 'passport_issue_date', transform: ddmmToISO },
  { prefillId: 'date_of_expiry', formKey: 'passport_expiry_date', transform: ddmmToISO },
  { prefillId: 'place_of_issue', formKey: 'passport_issued_by' },
  { prefillId: 'sex', formKey: 'gender', transform: normGender },
  { prefillId: 'father_name', formKey: 'father_name' },
  { prefillId: 'mother_name', formKey: 'mother_name' },
  { prefillId: 'address_line1', formKey: 'address_line1' },
  { prefillId: 'city', formKey: 'address_city' },
  { prefillId: 'state', formKey: 'address_state' },
  { prefillId: 'zip', formKey: 'address_zip' },
]

const SOURCE_LABELS: Record<string, string> = {
  us_passport: 'US passport',
  indian_passport: 'Indian passport',
  address_proof: 'address proof',
  hardcode: 'AVA',
  avasafe: 'AVA',
}

function ddmmToISO(v: string): string {
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  return m ? `${m[3]}-${m[2]}-${m[1]}` : v
}

function normGender(v: string): string {
  const u = v.toUpperCase()
  if (u === 'M' || u === 'MALE') return 'Male'
  if (u === 'F' || u === 'FEMALE') return 'Female'
  return v
}

// ── Step helpers ───────────────────────────────────────────────────────────────

function stepIsComplete(step: Step, form: FormData): boolean {
  if (step.optional) return true
  if (step.group) {
    return step.group.every((g) => g.field === 'spouse_name' || !!form[g.field])
  }
  if (step.field) return !!form[step.field]
  return true
}

function getAvaMessage(
  step: Step,
  prefillSources: Partial<Record<keyof FormData, string>>,
): string {
  const fields = step.group ? step.group.map(g => g.field) : step.field ? [step.field] : []
  const prefilledField = fields.find(f => prefillSources[f])
  if (prefilledField) {
    const src = prefillSources[prefilledField]!
    return `I found this in your ${SOURCE_LABELS[src] ?? 'documents'}. Confirm it looks correct. You can edit if needed..`
  }
  return step.ava
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FormPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL)
  const [saving, setSaving] = useState(false)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [prefillSources, setPrefillSources] = useState<Partial<Record<keyof FormData, string>>>({})
  const [editedFields, setEditedFields] = useState<Set<keyof FormData>>(new Set())
  const [showResumeBanner, setShowResumeBanner] = useState(false)

  // Load applicationId from URL params or sessionStorage, then load prefill data and saved progress
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlId = urlParams.get('applicationId')
    const id = urlId ?? sessionStorage.getItem('application_id')
    setApplicationId(id)
    if (id) {
      sessionStorage.setItem('application_id', id)
      // Restore saved form progress
      const savedForm = sessionStorage.getItem(`form_progress_${id}`)
      const savedStep = sessionStorage.getItem(`form_step_${id}`)
      if (savedForm) {
        try {
          const parsed = JSON.parse(savedForm) as Partial<FormData>
          const hasProgress = Object.values(parsed).some(v => !!v)
          if (hasProgress) {
            setForm(prev => ({ ...prev, ...parsed }))
            setShowResumeBanner(true)
            if (savedStep) setStep(Math.min(parseInt(savedStep, 10), STEPS.length - 1))
          }
        } catch { /* ignore */ }
      }
      loadPrefill(id).catch(() => { /* non-fatal */ })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadPrefill(appId: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('applications')
      .select('form_data, prefill_sources')
      .eq('id', appId)
      .single()

    if (!data?.form_data) return

    const prefillData = data.form_data as Record<string, string>
    const srcData = (data.prefill_sources as Record<string, string>) ?? {}

    const mapped: Partial<FormData> = {}
    const src: Partial<Record<keyof FormData, string>> = {}

    for (const m of PREFILL_TO_FORM) {
      const val = prefillData[m.prefillId]
      if (val) {
        const transformed = m.transform ? m.transform(val) : val
        if (transformed) {
          mapped[m.formKey] = transformed
          src[m.formKey] = srcData[m.prefillId] ?? 'avasafe'
        }
      }
    }

    setForm(prev => ({ ...prev, ...mapped }))
    setPrefillSources(src)
  }

  function update(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    // Track edits to pre-filled fields
    if (prefillSources[key]) {
      setEditedFields(prev => {
        const next = new Set(Array.from(prev))
        next.add(key)
        return next
      })
    }
  }

  function saveProgress(currentForm: FormData, currentStep: number) {
    if (!applicationId) return
    sessionStorage.setItem(`form_progress_${applicationId}`, JSON.stringify(currentForm))
    sessionStorage.setItem(`form_step_${applicationId}`, String(currentStep))
    // Also persist to sessionStorage as form_data for review page
    sessionStorage.setItem('form_data', JSON.stringify(currentForm))
    // Fire-and-forget DB save
    const supabase = createClient()
    supabase.from('applications')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ form_data: currentForm as any, current_step: currentStep })
      .eq('id', applicationId)
      .then(() => { /* non-fatal */ })
  }

  function goNext() {
    setDirection(1)
    setStep((s) => {
      const next = s + 1
      saveProgress(form, next)
      return next
    })
  }

  function goBack() {
    setDirection(-1)
    setStep((s) => {
      const prev = Math.max(0, s - 1)
      saveProgress(form, prev)
      return prev
    })
  }

  async function handleFinish() {
    if (!applicationId) return
    setSaving(true)
    sessionStorage.setItem('form_data', JSON.stringify(form))
    // Clear saved step progress — form is complete
    sessionStorage.removeItem(`form_progress_${applicationId}`)
    sessionStorage.removeItem(`form_step_${applicationId}`)
    const res = await fetch('/api/validate-application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form_data: form, application_id: applicationId }),
    })
    setSaving(false)
    if (res.ok) router.push(`/apply/review?applicationId=${applicationId}`)
  }

  const current = STEPS[step]
  const totalSteps = STEPS.length
  const progressPct = ((step + 1) / totalSteps) * 100
  const canContinue = stepIsComplete(current, form)
  const vfsCenter = form.address_state ? VFS_CENTERS[form.address_state] : null
  const avaMessage = getAvaMessage(current, prefillSources)

  const baseInputStyle: React.CSSProperties = {
    width: '100%',
    height: 56,
    borderRadius: 10,
    padding: '0 16px',
    fontSize: 16,
    fontFamily: 'var(--font-body)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 150ms ease, background 150ms ease',
    boxSizing: 'border-box',
  }

  function inputStyle(fieldKey: keyof FormData): React.CSSProperties {
    const isPrefilled = !!prefillSources[fieldKey]
    const isEdited = editedFields.has(fieldKey)
    if (isPrefilled && !isEdited) {
      return { ...baseInputStyle, border: '1.5px solid var(--gold)', background: '#FDF6EC' }
    }
    if (isPrefilled && isEdited) {
      return { ...baseInputStyle, border: '1.5px solid #F59E0B', background: '#FFFBEB' }
    }
    return { ...baseInputStyle, border: '1.5px solid var(--border)', background: 'white' }
  }

  function PrefillBadge({ fieldKey }: { fieldKey: keyof FormData }) {
    const src = prefillSources[fieldKey]
    if (!src) return null
    const isEdited = editedFields.has(fieldKey)
    return (
      <span style={{
        position: 'absolute', top: -10, right: 8,
        background: isEdited ? '#F59E0B' : 'var(--gold)',
        color: 'white', fontSize: 10, fontWeight: 600,
        padding: '2px 8px', borderRadius: 100,
        pointerEvents: 'none', zIndex: 1,
        whiteSpace: 'nowrap',
      }}>
        {isEdited ? 'Edited' : `From your ${SOURCE_LABELS[src] ?? 'documents'}`}
      </span>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off-white)', display: 'flex', flexDirection: 'column' }}>
      {/* Progress bar */}
      <div style={{ height: 2, background: 'var(--border)', width: '100%' }}>
        <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--navy)', transition: 'width 400ms ease' }} />
      </div>

      {/* Header */}
      <header style={{ height: 64, background: 'white', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
        <Logo size="md" href="/dashboard" />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-tertiary)' }}>
          Step {step + 1} of {totalSteps}
        </span>
      </header>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px 24px' }}>
        <div style={{ width: '100%', maxWidth: 560 }}>

          {/* Resume banner */}
          {showResumeBanner && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#EEF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '12px 16px', marginBottom: 20, gap: 12 }}>
              <p style={{ fontSize: 13, color: '#1E40AF', fontWeight: 500, margin: 0 }}>
                Picking up where you left off.
              </p>
              <button onClick={() => { setShowResumeBanner(false) }} style={{ fontSize: 12, color: '#1E40AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                Dismiss
              </button>
            </div>
          )}

          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: direction * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -24 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {/* AVA message */}
              <div style={{ marginBottom: 24 }}>
                <AvaMessage message={avaMessage} />
              </div>

              {/* Question card */}
              <div style={{ background: 'white', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
                <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 28, color: 'var(--navy)', marginBottom: 24, lineHeight: 1.25 }}>
                  {current.label}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {current.group ? (
                    current.group.map((g) => (
                      <div key={g.field} style={{ position: 'relative' }}>
                        <PrefillBadge fieldKey={g.field} />
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>
                          {g.label}
                        </label>
                        {g.options ? (
                          <select
                            value={form[g.field]}
                            onChange={(e) => update(g.field, e.target.value)}
                            style={inputStyle(g.field)}
                          >
                            <option value="">Select…</option>
                            {g.options.map((o) => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={g.type ?? 'text'}
                            value={form[g.field]}
                            onChange={(e) => update(g.field, e.target.value)}
                            placeholder={g.placeholder}
                            style={inputStyle(g.field)}
                            onFocus={(e) => {
                              if (!prefillSources[g.field]) e.currentTarget.style.borderColor = 'var(--gold)'
                            }}
                            onBlur={(e) => {
                              if (!prefillSources[g.field]) e.currentTarget.style.borderColor = 'var(--border)'
                            }}
                          />
                        )}
                      </div>
                    ))
                  ) : current.options ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {current.options.map((o) => {
                        const selected = form[current.field!] === o
                        return (
                          <button
                            key={o}
                            type="button"
                            onClick={() => update(current.field!, o)}
                            style={{
                              width: '100%', minHeight: 64, textAlign: 'left',
                              padding: '16px 20px', borderRadius: 16,
                              border: selected ? '2px solid var(--gold)' : '1.5px solid var(--border)',
                              background: selected ? 'var(--gold-subtle)' : 'white',
                              color: 'var(--text-primary)', fontSize: 15,
                              fontWeight: selected ? 500 : 400, fontFamily: 'var(--font-body)',
                              cursor: 'pointer', display: 'flex', alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'border-color 150ms ease, background 150ms ease',
                            }}
                            onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = 'var(--navy-light)' }}
                            onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = 'var(--border)' }}
                          >
                            <span>{o}</span>
                            {selected && <CheckCircle size={18} color="var(--gold)" />}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <PrefillBadge fieldKey={current.field!} />
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>
                        {current.label}
                      </label>
                      <input
                        type={current.type ?? 'text'}
                        value={form[current.field!]}
                        onChange={(e) => update(current.field!, e.target.value)}
                        placeholder={current.placeholder}
                        style={inputStyle(current.field!)}
                        onFocus={(e) => {
                          if (!prefillSources[current.field!]) e.currentTarget.style.borderColor = 'var(--gold)'
                        }}
                        onBlur={(e) => {
                          if (!prefillSources[current.field!]) e.currentTarget.style.borderColor = 'var(--border)'
                        }}
                      />
                    </div>
                  )}

                  {/* VFS center auto-detection */}
                  {current.id === 'address' && vfsCenter && (
                    <div style={{ borderRadius: 10, padding: '12px 16px', background: 'var(--gold-subtle)', border: '1px solid var(--gold)', fontSize: 14, color: 'var(--navy)' }}>
                      <span style={{ fontWeight: 600 }}>Your VFS centre: </span>
                      <span>{vfsCenter}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div
            className="form-sticky-cta"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, gap: 12 }}
          >
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className="btn-ghost"
              style={{ opacity: step === 0 ? 0.3 : 1, cursor: step === 0 ? 'not-allowed' : 'pointer' }}
            >
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!canContinue}
                className="btn-navy"
                style={{ opacity: canContinue ? 1 : 0.4, cursor: canContinue ? 'pointer' : 'not-allowed' }}
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={saving || !canContinue}
                className="btn-gold"
                style={{ opacity: (saving || !canContinue) ? 0.4 : 1, cursor: (saving || !canContinue) ? 'not-allowed' : 'pointer' }}
              >
                {saving ? 'Saving…' : 'Review my application →'}
              </button>
            )}
          </div>

          {/* Step dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 32 }}>
            {STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 999, height: 6,
                  width: i === step ? 20 : 6,
                  background: i === step ? 'var(--navy)' : i < step ? 'var(--gold)' : 'var(--border)',
                  transition: 'all 300ms ease', flexShrink: 0,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
