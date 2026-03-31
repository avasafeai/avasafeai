'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProgressBar from '@/components/ProgressBar'

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
  // Personal
  first_name: string
  last_name: string
  date_of_birth: string
  place_of_birth: string
  gender: string
  email: string
  phone: string
  // Passport
  passport_number: string
  passport_issue_date: string
  passport_expiry_date: string
  passport_issued_by: string
  // Indian origin
  indian_origin_proof: string
  // Address
  address_line1: string
  address_city: string
  address_state: string
  address_zip: string
  address_country: string
  // Family
  father_name: string
  mother_name: string
  spouse_name: string
}

const INITIAL: FormData = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  place_of_birth: '',
  gender: '',
  email: '',
  phone: '',
  passport_number: '',
  passport_issue_date: '',
  passport_expiry_date: '',
  passport_issued_by: '',
  indian_origin_proof: '',
  address_line1: '',
  address_city: '',
  address_state: '',
  address_zip: '',
  address_country: 'US',
  father_name: '',
  mother_name: '',
  spouse_name: '',
}

const STEPS = ['Personal details', 'Passport details', 'Indian origin', 'Address', 'Family']

export default function FormPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL)
  const [saving, setSaving] = useState(false)

  function update(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function Field({
    label,
    field,
    type = 'text',
    tooltip,
    options,
  }: {
    label: string
    field: keyof FormData
    type?: string
    tooltip?: string
    options?: string[]
  }) {
    return (
      <div>
        <div className="flex items-center gap-1 mb-1">
          <label className="block text-sm font-medium text-slate-700">{label}</label>
          {tooltip && (
            <span
              className="text-xs text-slate-400 cursor-help"
              title={tooltip}
              aria-label={tooltip}
            >
              ?
            </span>
          )}
        </div>
        {options ? (
          <select
            value={form[field]}
            onChange={(e) => update(field, e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select…</option>
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={form[field]}
            onChange={(e) => update(field, e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
      </div>
    )
  }

  async function handleFinish() {
    setSaving(true)
    const res = await fetch('/api/validate-application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form_data: form }),
    })
    setSaving(false)
    if (res.ok) {
      router.push('/apply/review')
    }
  }

  const vfsCenter = form.address_state ? VFS_CENTERS[form.address_state] ?? 'VFS Global center in your state' : null

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto">
        <ProgressBar currentStep={1} />

        <div className="px-6 py-8">
          {/* Sub-step progress */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
            {STEPS.map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(i)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  i === step
                    ? 'bg-indigo-600 text-white'
                    : i < step
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {i + 1}. {s}
              </button>
            ))}
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-6">{STEPS[step]}</h1>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4">
            {step === 0 && (
              <>
                <Field label="First name" field="first_name" />
                <Field label="Last name" field="last_name" />
                <Field label="Date of birth" field="date_of_birth" type="date" />
                <Field label="Place of birth" field="place_of_birth" />
                <Field
                  label="Gender"
                  field="gender"
                  options={['Male', 'Female', 'Other']}
                />
                <Field label="Email address" field="email" type="email" />
                <Field
                  label="Phone number"
                  field="phone"
                  type="tel"
                  tooltip="We'll send status updates here via WhatsApp and SMS."
                />
              </>
            )}

            {step === 1 && (
              <>
                <Field
                  label="Passport number"
                  field="passport_number"
                  tooltip="Your current US or foreign passport number."
                />
                <Field label="Issue date" field="passport_issue_date" type="date" />
                <Field label="Expiry date" field="passport_expiry_date" type="date" />
                <Field label="Issued by (country)" field="passport_issued_by" />
              </>
            )}

            {step === 2 && (
              <>
                <Field
                  label="Indian origin proof type"
                  field="indian_origin_proof"
                  options={['Old Indian Passport', 'Birth Certificate', 'Parent Indian Passport']}
                  tooltip="What document proves your Indian origin? Usually an old Indian passport."
                />
              </>
            )}

            {step === 3 && (
              <>
                <Field label="Street address" field="address_line1" />
                <Field label="City" field="address_city" />
                <Field
                  label="State"
                  field="address_state"
                  options={Object.keys(VFS_CENTERS).sort()}
                  tooltip="Used to assign your VFS Global appointment center."
                />
                <Field label="ZIP code" field="address_zip" />
                {vfsCenter && (
                  <div className="text-sm text-indigo-700 bg-indigo-50 rounded-lg px-4 py-2">
                    Your VFS center: <strong>{vfsCenter}</strong>
                  </div>
                )}
              </>
            )}

            {step === 4 && (
              <>
                <Field label="Father&apos;s full name" field="father_name" />
                <Field label="Mother&apos;s full name" field="mother_name" />
                <Field label="Spouse&apos;s full name (if applicable)" field="spouse_name" />
              </>
            )}
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-30 transition-colors"
            >
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {saving ? 'Saving...' : 'Review my application →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
