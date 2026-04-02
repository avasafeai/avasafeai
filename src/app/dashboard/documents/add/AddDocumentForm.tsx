'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import AvaMessage from '@/components/AvaMessage'
import { CheckCircle, Upload } from 'lucide-react'
import { ExtractedPassportData } from '@/types/supabase'
import Link from 'next/link'

const DOC_TYPES = [
  { value: 'us_passport', label: 'US Passport' },
  { value: 'indian_passport', label: 'Indian Passport' },
  { value: 'oci_card', label: 'OCI Card' },
  { value: 'renunciation', label: 'Renunciation Certificate' },
  { value: 'pan_card', label: 'PAN Card' },
  { value: 'address_proof', label: 'Address Proof' },
  { value: 'photo', label: 'Photo' },
  { value: 'signature', label: 'Signature' },
]

const FIELD_LABELS: { key: keyof ExtractedPassportData; label: string }[] = [
  { key: 'full_name', label: 'Full name' },
  { key: 'date_of_birth', label: 'Date of birth' },
  { key: 'passport_number', label: 'Document number' },
  { key: 'expiry_date', label: 'Expiry date' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'gender', label: 'Gender' },
  { key: 'place_of_birth', label: 'Place of birth' },
  { key: 'issue_date', label: 'Issue date' },
]

type Stage = 'pick' | 'upload' | 'extracting' | 'confirm' | 'saving'

export default function AddDocumentForm() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>('pick')
  const [docType, setDocType] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<ExtractedPassportData | null>(null)
  const [visibleFields, setVisibleFields] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [documentId, setDocumentId] = useState<string | null>(null)

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (f && f.size > 10 * 1024 * 1024) { setError('File must be under 10MB.'); return }
    setError(null)
    setFile(f)
  }

  async function handleExtract() {
    if (!file || !docType) return
    setStage('extracting')
    setError(null)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('doc_type', docType)

    const res = await fetch('/api/extract-document', { method: 'POST', body: fd })
    if (!res.ok) {
      const body = await res.json() as { error: string }
      setError(body.error ?? 'Could not read document.')
      setStage('upload')
      return
    }

    const { data: extracted, document_id } = await res.json() as { data: ExtractedPassportData; document_id: string | null }
    setData(extracted)
    setDocumentId(document_id)
    setStage('confirm')
    for (let i = 1; i <= FIELD_LABELS.length; i++) {
      await new Promise(r => setTimeout(r, 80))
      setVisibleFields(i)
    }
  }

  async function handleConfirm() {
    setStage('saving')
    // Persist any field edits the user made on the confirm screen
    if (documentId && data) {
      await fetch(`/api/update-document`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: documentId, extracted_data: data }),
      })
    }
    router.push('/dashboard/documents')
  }

  function handleFieldEdit(key: keyof ExtractedPassportData, value: string) {
    setData(prev => prev ? { ...prev, [key]: value } : prev)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 48, borderRadius: 10, border: '1.5px solid var(--border)',
    padding: '0 14px', fontSize: 15, fontFamily: 'var(--font-body)', color: 'var(--text-primary)',
    background: 'white', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off-white)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ height: 64, background: 'white', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
        <Link href="/dashboard/documents" style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back to documents
        </Link>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--navy)' }}>Add document</span>
        <span style={{ width: 80 }} />
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px 80px' }}>
        <div style={{ width: '100%', maxWidth: 520 }}>
          {/* Step 1: Pick document type */}
          {stage === 'pick' && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <AvaMessage message="Which document would you like to add to your locker?" className="mb-8" />
              <div style={{ background: 'white', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>Document type</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {DOC_TYPES.map(dt => (
                    <button key={dt.value} type="button" onClick={() => setDocType(dt.value)}
                      style={{
                        textAlign: 'left', padding: '14px 18px', borderRadius: 12,
                        border: docType === dt.value ? '2px solid var(--gold)' : '1.5px solid var(--border)',
                        background: docType === dt.value ? 'var(--gold-subtle)' : 'white',
                        color: 'var(--text-primary)', fontSize: 15, cursor: 'pointer',
                        fontFamily: 'var(--font-body)', fontWeight: docType === dt.value ? 500 : 400,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        transition: 'border-color 150ms ease, background 150ms ease',
                      }}
                    >
                      {dt.label}
                      {docType === dt.value && <CheckCircle size={16} color="var(--gold)" />}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => docType && setStage('upload')} disabled={!docType}
                className="btn-navy" style={{ width: '100%', marginTop: 20 }}>
                Continue →
              </button>
            </motion.div>
          )}

          {/* Step 2: Upload */}
          {stage === 'upload' && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <AvaMessage message={`Great. Upload your ${DOC_TYPES.find(d => d.value === docType)?.label ?? 'document'} — a clear photo or scan works perfectly.`} className="mb-8" />
              <div
                onClick={() => inputRef.current?.click()}
                style={{
                  minHeight: 220, borderRadius: 20, border: `2px dashed ${file ? 'var(--navy-mid)' : 'var(--gold)'}`,
                  background: file ? 'rgba(15,45,82,0.03)' : 'var(--gold-subtle)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 14, cursor: 'pointer', padding: '32px 24px', transition: 'background 150ms ease',
                }}
              >
                {file ? (
                  <>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(15,45,82,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle size={24} color="var(--navy-mid)" />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15, color: 'var(--text-primary)' }}>{file.name}</p>
                      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>{(file.size / 1024).toFixed(0)} KB · Click to replace</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(201,136,42,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Upload size={26} color="var(--gold)" />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>Upload your document</p>
                      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>PDF, JPG, or PNG · Max 10MB</p>
                    </div>
                  </>
                )}
              </div>
              <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFilePick} style={{ display: 'none' }} />
              {error && <p style={{ marginTop: 12, fontSize: 14, color: 'var(--error)', background: 'var(--error-bg)', padding: '10px 14px', borderRadius: 10 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setStage('pick')} className="btn-ghost" style={{ flex: 1 }}>Back</button>
                <button onClick={handleExtract} disabled={!file} className="btn-navy" style={{ flex: 2 }}>
                  Read document
                </button>
              </div>
            </motion.div>
          )}

          {/* Extracting */}
          {stage === 'extracting' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center" style={{ padding: '60px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
                {[0, 1, 2].map(i => (
                  <motion.div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--gold)' }}
                    animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }} />
                ))}
              </div>
              <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 20, color: 'var(--text-primary)' }}>Reading your document…</p>
              <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginTop: 8 }}>This usually takes 5–10 seconds</p>
            </motion.div>
          )}

          {/* Confirm */}
          {(stage === 'confirm' || stage === 'saving') && data && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <AvaMessage message="I've read your document. Confirm the details look right." className="mb-8" />
              <div style={{ background: 'white', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <AnimatePresence>
                  {FIELD_LABELS.slice(0, visibleFields).map(({ key, label }) => (
                    data[key] ? (
                      <motion.div key={key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <label style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>{label}</label>
                          <CheckCircle size={14} color="var(--success)" />
                        </div>
                        <input type="text" value={data[key] ?? ''} onChange={e => handleFieldEdit(key, e.target.value)} style={inputStyle} />
                      </motion.div>
                    ) : null
                  ))}
                </AnimatePresence>
              </div>
              {visibleFields === FIELD_LABELS.length && (
                <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  onClick={handleConfirm} disabled={stage === 'saving'} className="btn-navy"
                  style={{ width: '100%', marginTop: 20 }}>
                  {stage === 'saving' ? 'Saving…' : 'Save to my locker →'}
                </motion.button>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
