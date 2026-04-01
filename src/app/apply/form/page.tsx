'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import AvaMessage from '@/components/AvaMessage'
import Logo from '@/components/Logo'
import Link from 'next/link'

const VFS_CENTERS: Record<string, string> = {
  CA: 'San Francisco VFS Global',
  NY: 'New York VFS Global',
  TX: 'Houston VFS Global',
  IL: 'Chicago VFS Global',
  WA: 'Seattle VFS Global',
  GA: 'Atlanta VFS Global',
  FL: 'Orlando VFS Global',
  NJ: 'New York VFS Global',
  VA: 'Washington DC VFS Global',
  MA: 'Boston VFS Global',
}

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
        options: Object.keys(VFS_CENTERS).sort(),
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

function stepIsComplete(step: Step, form: FormData): boolean {
  if (step.optional) return true
  if (step.group) {
    return step.group.every((g) => g.field === 'spouse_name' || !!form[g.field])
  }
  if (step.field) return !!form[step.field]
  return true
}

export default function FormPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL)
  const [saving, setSaving] = useState(false)
  const [direction, setDirection] = useState<1 | -1>(1)

  function update(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function goNext() {
    setDirection(1)
    setStep((s) => s + 1)
  }

  function goBack() {
    setDirection(-1)
    setStep((s) => Math.max(0, s - 1))
  }

  async function handleFinish() {
    setSaving(true)
    const res = await fetch('/api/validate-application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form_data: form }),
    })
    setSaving(false)
    if (res.ok) router.push('/apply/review')
  }

  const current = STEPS[step]
  const totalSteps = STEPS.length
  const progress = ((step + 1) / totalSteps) * 100
  const canContinue = stepIsComplete(current, form)
  const vfsCenter = form.address_state ? VFS_CENTERS[form.address_state] : null

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--color-background)' }}>
      {/* Progress bar */}
      <div className="h-1 w-full" style={{ background: 'var(--color-border)' }}>
        <div
          className="h-full transition-all duration-400"
          style={{ width: `${progress}%`, background: 'var(--color-navy)' }}
        />
      </div>

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
          <Link href="/apply">
            <Logo />
          </Link>
          <span className="font-mono text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            Step {step + 1} of {totalSteps}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                initial={{ opacity: 0, x: direction * 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -32 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
              >
                {/* AVA message */}
                <AvaMessage message={current.ava} className="mb-8" />

                {/* Question card */}
                <div className="card">
                  <h2 className="font-display font-semibold text-lg mb-5" style={{ color: 'var(--color-navy)' }}>
                    {current.label}
                  </h2>

                  <div className="flex flex-col gap-4">
                    {current.group ? (
                      current.group.map((g) => (
                        <div key={g.field}>
                          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                            {g.label}
                          </label>
                          {g.options ? (
                            <select
                              value={form[g.field]}
                              onChange={(e) => update(g.field, e.target.value)}
                              className="input-field"
                              style={{ height: 48 }}
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
                              className="input-field"
                            />
                          )}
                        </div>
                      ))
                    ) : current.options ? (
                      <div className="flex flex-col gap-2">
                        {current.options.map((o) => (
                          <button
                            key={o}
                            type="button"
                            onClick={() => update(current.field!, o)}
                            className="w-full text-left px-4 py-3.5 rounded-lg border text-sm font-medium transition-all"
                            style={{
                              borderColor: form[current.field!] === o ? 'var(--color-navy)' : 'var(--color-border)',
                              background: form[current.field!] === o ? 'rgba(15,45,82,0.06)' : 'var(--color-surface)',
                              color: form[current.field!] === o ? 'var(--color-navy)' : 'var(--color-text-primary)',
                            }}
                          >
                            {o}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                          {current.label}
                        </label>
                        <input
                          type={current.type ?? 'text'}
                          value={form[current.field!]}
                          onChange={(e) => update(current.field!, e.target.value)}
                          placeholder={current.placeholder}
                          className="input-field"
                        />
                      </div>
                    )}

                    {/* VFS center auto-detection */}
                    {current.id === 'address' && vfsCenter && (
                      <div
                        className="rounded-lg px-4 py-3 text-sm"
                        style={{ background: 'rgba(15,45,82,0.06)', color: 'var(--color-navy)' }}
                      >
                        <span className="font-medium">Your VFS centre:</span>{' '}
                        <span>{vfsCenter}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 0}
                className="px-6 py-3 rounded-xl border text-sm font-medium transition-colors disabled:opacity-30"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                Back
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canContinue}
                  className="btn-primary px-8 py-3 text-sm disabled:opacity-40"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={saving || !canContinue}
                  className="btn-gold px-8 py-3 text-sm disabled:opacity-40"
                >
                  {saving ? 'Saving…' : 'Review my application →'}
                </button>
              )}
            </div>

            {/* Step dots */}
            <div className="flex justify-center gap-1.5 mt-8">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === step ? 20 : 6,
                    height: 6,
                    background: i === step ? 'var(--color-navy)' : i < step ? 'var(--color-gold)' : 'var(--color-border)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
