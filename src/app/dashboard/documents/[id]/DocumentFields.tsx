'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import MaskedField from '@/components/MaskedField'

const SENSITIVE_FIELD_KEYS = new Set([
  'passport_number', 'date_of_birth', 'place_of_birth', 'issue_date', 'expiry_date',
])

const LABELS: Record<string, string> = {
  full_name: 'Full name', first_name: 'First name', last_name: 'Last name',
  date_of_birth: 'Date of birth', place_of_birth: 'Place of birth',
  passport_number: 'Document number', nationality: 'Nationality',
  issue_date: 'Issue date', expiry_date: 'Expiry date',
  issuing_country: 'Issuing country', gender: 'Gender',
  oci_number: 'OCI number', certificate_number: 'Certificate number',
  issuing_authority: 'Issuing authority',
}

interface DocumentFieldsProps {
  fields: [string, string][]
}

export default function DocumentFields({ fields }: DocumentFieldsProps) {
  const [revealAll, setRevealAll] = useState(false)

  const hasSensitive = fields.some(([k]) => SENSITIVE_FIELD_KEYS.has(k))

  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow-sm)', overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--navy)', margin: 0 }}>Extracted fields</h2>
        {hasSensitive && (
          <button
            onClick={() => setRevealAll(prev => !prev)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 8, padding: '6px 12px',
              fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer',
              minHeight: 36, flexShrink: 0,
            }}
          >
            {revealAll ? <EyeOff size={13} /> : <Eye size={13} />}
            {revealAll ? 'Hide all' : 'Show all'}
          </button>
        )}
      </div>

      {/* Responsive grid: 2-col desktop, 1-col mobile via CSS class */}
      <div className="doc-fields-grid">
        {fields.map(([key, value], i) => {
          const isSensitive = SENSITIVE_FIELD_KEYS.has(key)
          const isMonoField = key.includes('number') || key.includes('oci')
          return (
            <div key={key} style={{
              padding: '14px 24px',
              background: i % 2 === 0 ? 'white' : 'var(--off-white)',
              borderBottom: i < fields.length - 2 ? '1px solid var(--border)' : 'none',
              minWidth: 0,      // prevent grid blowout
              overflow: 'hidden',
            }}>
              <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 4 }}>
                {LABELS[key] ?? key.replace(/_/g, ' ')}
              </p>
              {isSensitive ? (
                <MaskedField value={value} revealAll={revealAll} isMonospace={isMonoField} />
              ) : (
                <p className={isMonoField ? 'field-value-mono' : 'field-value'} style={{
                  fontSize: 14,
                  color: 'var(--text-primary)',
                  fontFamily: isMonoField ? 'var(--font-mono)' : 'var(--font-body)',
                  margin: 0,
                }}>
                  {value}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
