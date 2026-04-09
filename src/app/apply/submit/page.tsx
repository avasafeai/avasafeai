'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, ChevronRight, ChevronDown } from 'lucide-react'
import Logo from '@/components/Logo'

const PROGRESS_KEY = 'portal_progress'

interface FieldDef {
  key: string
  label: string
  portalLabel: string
  isDropdown?: boolean
  isDate?: boolean
  hint?: string
}

interface SectionDef {
  id: number
  name: string
  avaNote: string
  timeNote: string
  fields: FieldDef[]
}

const SECTIONS: SectionDef[] = [
  {
    id: 1, name: 'Personal details', avaNote: 'Enter your details exactly as they appear on your US passport. No abbreviations.',
    timeNote: 'Takes about 90 seconds',
    fields: [
      { key: 'last_name',      label: 'Surname',         portalLabel: 'Surname (as per passport)' },
      { key: 'first_name',     label: 'Given name',      portalLabel: 'Given Name (as per passport)' },
      { key: 'date_of_birth',  label: 'Date of birth',   portalLabel: 'Date of Birth (DD/MM/YYYY)', isDate: true },
      { key: 'gender',         label: 'Gender',          portalLabel: 'Sex', isDropdown: true },
      { key: 'place_of_birth', label: 'Place of birth',  portalLabel: 'Place of Birth' },
      { key: 'nationality',    label: 'Nationality',     portalLabel: 'Country of Birth', isDropdown: true },
    ],
  },
  {
    id: 2, name: 'Passport details', avaNote: 'For US passports, place of issue must be entered as USDOS. This is the most common rejection cause.',
    timeNote: 'Takes about 2 minutes',
    fields: [
      { key: 'passport_number',      label: 'Passport number',  portalLabel: 'Passport No.' },
      { key: 'passport_issued_by',   label: 'Place of issue',   portalLabel: 'Place of Issue', hint: 'Must be USDOS for US passports' },
      { key: 'passport_issue_date',  label: 'Issue date',       portalLabel: 'Date of Issue (DD/MM/YYYY)', isDate: true },
      { key: 'passport_expiry_date', label: 'Expiry date',      portalLabel: 'Date of Expiry (DD/MM/YYYY)', isDate: true },
      { key: 'marital_status',       label: 'Marital status',   portalLabel: 'Marital Status', isDropdown: true },
    ],
  },
  {
    id: 3, name: 'Family details', avaNote: "Enter family names exactly as they appear on their documents.",
    timeNote: 'Takes about 90 seconds',
    fields: [
      { key: 'father_name',  label: "Father's name",   portalLabel: 'Father / Guardian Name' },
      { key: 'mother_name',  label: "Mother's name",   portalLabel: 'Mother Name' },
      { key: 'spouse_name',  label: 'Spouse name',     portalLabel: 'Spouse Name (if married)' },
    ],
  },
  {
    id: 4, name: 'Contact and address', avaNote: 'Use your current US mailing address. This must match your address proof document.',
    timeNote: 'Takes about 90 seconds',
    fields: [
      { key: 'email',         label: 'Email',           portalLabel: 'Email Id' },
      { key: 'phone',         label: 'Mobile',          portalLabel: 'Mobile No.' },
      { key: 'occupation',    label: 'Occupation',      portalLabel: 'Occupation', isDropdown: true },
      { key: 'address_line1', label: 'Street address',  portalLabel: 'Address Line 1' },
      { key: 'address_city',  label: 'City',            portalLabel: 'City' },
      { key: 'address_state', label: 'State',           portalLabel: 'State', isDropdown: true },
      { key: 'address_zip',   label: 'ZIP code',        portalLabel: 'Zip Code' },
    ],
  },
  {
    id: 5, name: 'Photo and signature', avaNote: 'Upload your JPEG photo (square, white background, 200x200px min, under 200kb) and your signature image.',
    timeNote: 'Takes about 2 minutes',
    fields: [
      { key: '_photo_req',     label: 'Photo requirements',    portalLabel: 'Photo upload (JPEG, square, white background, min 200x200px, max 200kb)', isDropdown: true, hint: 'Upload from your locker' },
      { key: '_sig_req',       label: 'Signature requirements', portalLabel: 'Signature (JPEG, aspect ratio 1:3, max 200kb)', isDropdown: true, hint: 'Upload from your locker' },
    ],
  },
]

function formatDateDDMMYYYY(iso: string): string {
  if (!iso || !iso.includes('-')) return iso
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function getDisplayValue(key: string, raw: string, isDate?: boolean): string {
  if (!raw) return '—'
  if (isDate) return formatDateDDMMYYYY(raw)
  return raw
}

export default function SubmitPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [sectionIdx, setSectionIdx] = useState(0)
  const [confirmedSections, setConfirmedSections] = useState<Record<number, boolean>>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [usanNumber, setUsanNumber] = useState('')
  const [savingUsan, setSavingUsan] = useState(false)
  const [showHalfway, setShowHalfway] = useState(false)
  const [activeFieldIdx, setActiveFieldIdx] = useState(0)
  const firstFieldRef = useRef<string | null>(null)
  const [appTier, setAppTier] = useState<string | null>(null)
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('form_data')
    if (stored) {
      try { setFormData(JSON.parse(stored) as Record<string, string>) } catch { /* ignore */ }
    }
    const progress = sessionStorage.getItem(PROGRESS_KEY)
    if (progress) {
      try { setConfirmedSections(JSON.parse(progress) as Record<number, boolean>) } catch { /* ignore */ }
    }

    // Load tier to decide whether to show upgrade prompt
    const urlParams = new URLSearchParams(window.location.search)
    const appId = urlParams.get('applicationId') ?? sessionStorage.getItem('application_id')
    if (appId) {
      setApplicationId(appId)
      import('@/lib/supabase/client').then(({ createClient }) => {
        const supabase = createClient()
        supabase.from('applications').select('tier').eq('id', appId).single()
          .then(({ data }) => { if (data?.tier) setAppTier(data.tier as string) })
      })
    }
  }, [])

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

  const currentSection = SECTIONS[sectionIdx]
  const textFields = currentSection.fields.filter(f => !f.isDropdown && f.key && !f.key.startsWith('_'))

  // Auto-copy first field on section load
  useEffect(() => {
    if (!textFields.length) return
    const firstField = textFields[0]
    firstFieldRef.current = firstField.key
    setActiveFieldIdx(0)
    const val = formData[firstField.key]
    if (val) {
      navigator.clipboard.writeText(firstField.isDate ? formatDateDDMMYYYY(val) : val).catch(() => {})
      setCopiedKey(firstField.key)
      setTimeout(() => setCopiedKey(null), 2000)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionIdx])

  // Space bar: copy active field and advance
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault()
      if (activeFieldIdx < textFields.length - 1) {
        const nextIdx = activeFieldIdx + 1
        const nextField = textFields[nextIdx]
        const val = formData[nextField.key]
        if (val) {
          navigator.clipboard.writeText(nextField.isDate ? formatDateDDMMYYYY(val) : val).catch(() => {})
          setCopiedKey(nextField.key)
          setTimeout(() => setCopiedKey(null), 1500)
        }
        setActiveFieldIdx(nextIdx)
      }
    }
    if (e.code === 'Escape' && sectionIdx > 0) {
      setSectionIdx(s => s - 1)
    }
  }, [activeFieldIdx, textFields, formData, sectionIdx])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  async function copyField(key: string, value: string, isDate?: boolean) {
    const val = isDate ? formatDateDDMMYYYY(value) : value
    await navigator.clipboard.writeText(val).catch(() => {})
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  async function copyAll() {
    const lines = textFields
      .filter(f => formData[f.key])
      .map(f => `${f.label.toUpperCase()}: ${getDisplayValue(f.key, formData[f.key], f.isDate)}`)
    await navigator.clipboard.writeText(lines.join('\n')).catch(() => {})
    setCopiedKey('_all')
    setTimeout(() => setCopiedKey(null), 2000)
  }

  function confirmSection() {
    const updated = { ...confirmedSections, [currentSection.id]: true }
    setConfirmedSections(updated)
    sessionStorage.setItem(PROGRESS_KEY, JSON.stringify(updated))

    // Halfway moment
    if (currentSection.id === 3) {
      setShowHalfway(true)
      return
    }

    if (sectionIdx < SECTIONS.length - 1) {
      setSectionIdx(s => s + 1)
      setActiveFieldIdx(0)
    }
  }

  function continueAfterHalfway() {
    setShowHalfway(false)
    setSectionIdx(s => s + 1)
    setActiveFieldIdx(0)
  }

  async function handleUsanSubmit() {
    if (!usanNumber.trim()) return
    const urlParams = new URLSearchParams(window.location.search)
    const appId = urlParams.get('applicationId') ?? sessionStorage.getItem('application_id')
    if (!appId) return
    setSavingUsan(true)
    await fetch('/api/update-application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: appId, registration_number: usanNumber }),
    }).catch(() => {})
    setSavingUsan(false)
    router.push(`/apply/submit-vfs?applicationId=${appId}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off-white)', display: 'flex', flexDirection: 'column' }}>
      {/* Progress bar */}
      <div style={{ height: 2, background: 'var(--border)' }}>
        <div style={{ height: '100%', width: `${((sectionIdx + 1) / SECTIONS.length) * 100}%`, background: 'var(--navy)', transition: 'width 400ms ease' }} />
      </div>

      {/* Header */}
      <header style={{ height: 64, background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
        <Logo size="sm" href="/dashboard" onDark />
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{currentSection.name}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Section {sectionIdx + 1} of {SECTIONS.length}</span>
        </div>
        <div style={{ width: 80 }} />
      </header>

      {/* Keyboard tip */}
      <div style={{ background: 'rgba(15,45,82,0.04)', borderBottom: '1px solid var(--border)', padding: '8px 24px', textAlign: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          <kbd style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontFamily: 'var(--font-mono)' }}>Space</kbd>
          {' '}to copy next field · {' '}
          <kbd style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontFamily: 'var(--font-mono)' }}>Esc</kbd>
          {' '}to go back
        </span>
      </div>

      {/* Section progress bar at top */}
      <div style={{ padding: '12px 24px 0', display: 'flex', gap: 6, maxWidth: 640, margin: '0 auto', width: '100%' }}>
        {SECTIONS.map((s) => (
          <div key={s.id} style={{ flex: 1, height: 4, borderRadius: 2, background: confirmedSections[s.id] ? 'var(--success)' : s.id === currentSection.id ? 'var(--navy)' : 'var(--border)' }} />
        ))}
      </div>

      <div style={{ flex: 1, maxWidth: 640, margin: '0 auto', width: '100%', padding: '24px 24px 80px' }}>

        {/* Subtle upgrade nudge — only for guided tier */}
        {appTier === 'guided' && (
          <div style={{ background: 'var(--off-white)', borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, border: '0.5px solid var(--border)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Feeling nervous about the portal?</span>
            <button
              onClick={handleExpertUpgrade}
              disabled={upgrading}
              style={{ fontSize: 12, color: '#0F2D52', fontWeight: 500, background: 'none', border: 'none', cursor: upgrading ? 'not-allowed' : 'pointer', padding: 0, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {upgrading ? 'Redirecting...' : 'Upgrade to Expert Session — $50 →'}
            </button>
          </div>
        )}

        {/* AVA note */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderLeft: '3px solid var(--gold)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 10 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: 'white', fontSize: 10, fontWeight: 700 }}>A</span>
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 2 }}>{currentSection.avaNote}</p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{currentSection.timeNote}</p>
          </div>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: 'white', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', marginBottom: 16 }}>
          {currentSection.fields.map((field, idx) => {
            const raw = formData[field.key] ?? ''
            const displayVal = getDisplayValue(field.key, raw, field.isDate)
            const isActive = activeFieldIdx === idx
            const isCopied = copiedKey === field.key

            return (
              <div
                key={field.key}
                onClick={() => setActiveFieldIdx(idx)}
                style={{
                  padding: '16px 20px',
                  borderBottom: idx < currentSection.fields.length - 1 ? '1px solid var(--border)' : 'none',
                  background: isActive ? 'rgba(15,45,82,0.03)' : 'white',
                  cursor: 'pointer',
                  transition: 'background 150ms ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 2 }}>{field.label}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }}>
                      Portal field: <em>{field.portalLabel}</em>
                    </p>
                    {field.isDropdown ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ChevronDown size={13} color="var(--text-tertiary)" />
                        <span style={{ fontSize: 14, color: 'var(--navy)' }}>Select: <strong>{displayVal}</strong></span>
                        {field.hint && <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 4 }}>({field.hint})</span>}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--text-primary)', fontWeight: 500 }}>{displayVal}</span>
                        {field.isDate && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>(DD/MM/YYYY format)</span>}
                      </div>
                    )}
                  </div>
                  {!field.isDropdown && !field.key.startsWith('_') && raw && (
                    <button
                      onClick={(e) => { e.stopPropagation(); copyField(field.key, raw, field.isDate) }}
                      style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: isCopied ? 'var(--success-bg)' : 'var(--off-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                    >
                      {isCopied ? <Check size={14} color="var(--success)" /> : <Copy size={14} color="var(--text-tertiary)" />}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Copy all button */}
        {textFields.length > 1 && (
          <button onClick={copyAll} style={{ width: '100%', height: 40, borderRadius: 10, border: '1px solid var(--border)', background: 'white', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            {copiedKey === '_all' ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
            {copiedKey === '_all' ? 'Copied all fields!' : 'Copy all text fields'}
          </button>
        )}

        {/* USAN input (section 5 complete) */}
        {currentSection.id === 5 && (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--navy)', marginBottom: 8 }}>Submit on the portal</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              Click Submit on the government portal. You&apos;ll receive a registration number starting with <strong>USAN</strong>.
            </p>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>
              Enter your registration number
            </label>
            <input
              type="text"
              value={usanNumber}
              onChange={e => setUsanNumber(e.target.value)}
              placeholder="USAN..."
              style={{ width: '100%', height: 48, borderRadius: 10, border: '1.5px solid var(--border)', padding: '0 16px', fontSize: 15, fontFamily: 'var(--font-mono)', marginBottom: 12, boxSizing: 'border-box' }}
            />
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>Find this on the confirmation page after submitting</p>
            <button
              onClick={handleUsanSubmit}
              disabled={!usanNumber.trim() || savingUsan}
              style={{ height: 48, padding: '0 24px', borderRadius: 12, background: 'var(--navy)', color: 'white', border: 'none', fontSize: 15, fontWeight: 600, cursor: !usanNumber.trim() ? 'not-allowed' : 'pointer', opacity: !usanNumber.trim() ? 0.4 : 1 }}
            >
              {savingUsan ? 'Saving...' : "I've submitted. Next step →"}
            </button>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 12 }}>
          {sectionIdx > 0 && (
            <button onClick={() => setSectionIdx(s => s - 1)} style={{ height: 52, padding: '0 20px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'white', fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              ← Back
            </button>
          )}
          {currentSection.id < 5 && (
            <button onClick={confirmSection} className="btn-navy" style={{ flex: 1, height: 52, borderRadius: 12, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Confirmed. Next section <ChevronRight size={16} />
              <span style={{ fontSize: 12, opacity: 0.6, fontFamily: 'var(--font-mono)' }}>[Space]</span>
            </button>
          )}
        </div>
      </div>

      {/* Halfway moment overlay */}
      {showHalfway && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Check size={28} color="var(--success)" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--navy)', marginBottom: 8 }}>Halfway there. Everything correct.</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>3 sections done · 2 remaining · about 4 minutes left</p>
            <button onClick={continueAfterHalfway} className="btn-navy" style={{ width: '100%', height: 48, borderRadius: 12, fontSize: 15 }}>
              Continue →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
