'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import AvaMessage from '@/components/AvaMessage'
import { ExtractedPassportData } from '@/types/supabase'
import { CheckCircle, Upload } from 'lucide-react'

type State = 'idle' | 'uploading' | 'extracting' | 'confirming' | 'saving'

const FIELD_LABELS: { key: keyof ExtractedPassportData; label: string }[] = [
  { key: 'full_name', label: 'Full name' },
  { key: 'date_of_birth', label: 'Date of birth' },
  { key: 'passport_number', label: 'Passport number' },
  { key: 'expiry_date', label: 'Passport expires' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'gender', label: 'Gender' },
  { key: 'place_of_birth', label: 'Place of birth' },
  { key: 'issue_date', label: 'Issued on' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<State>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<ExtractedPassportData | null>(null)
  const [visibleFields, setVisibleFields] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (f && f.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB.')
      return
    }
    setError(null)
    setFile(f)
  }

  async function handleUpload() {
    if (!file) return
    setState('uploading')
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('doc_type', 'passport')

    setState('extracting')
    const res = await fetch('/api/extract-document', { method: 'POST', body: formData })

    if (!res.ok) {
      const body = (await res.json()) as { error: string }
      setError(body.error ?? 'Could not read the document. Please try a clearer photo.')
      setState('idle')
      return
    }

    const { data: extracted } = (await res.json()) as { data: ExtractedPassportData }
    setData(extracted)
    setState('confirming')

    // Animate fields appearing one by one
    for (let i = 1; i <= FIELD_LABELS.length; i++) {
      await new Promise((r) => setTimeout(r, 180))
      setVisibleFields(i)
    }
  }

  function handleFieldEdit(key: keyof ExtractedPassportData, value: string) {
    setData((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  async function handleConfirm() {
    setState('saving')
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--color-background)' }}>
      {/* Progress strip */}
      <div className="h-1 w-full" style={{ background: 'var(--color-border)' }}>
        <motion.div
          className="h-full"
          style={{ background: 'var(--color-navy)' }}
          initial={{ width: '0%' }}
          animate={{
            width: state === 'idle' ? '10%'
              : state === 'uploading' ? '30%'
              : state === 'extracting' ? '60%'
              : '90%',
          }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-start pt-16 px-4">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="font-display font-semibold text-xl" style={{ color: 'var(--color-navy)' }}>
              Avasafe AI
            </span>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Step 1 of 1 — Read your passport
            </p>
          </div>

          {/* Upload state */}
          {(state === 'idle' || state === 'uploading') && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <AvaMessage
                message="Hi, I'm AVA. I'm going to make sure you never have to struggle with a government application again. Let's start by reading your US passport."
                className="mb-8"
              />

              <div
                className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-opacity-100 transition-colors"
                style={{
                  borderColor: file ? 'var(--color-navy)' : 'var(--color-border)',
                  background: file ? 'rgba(15,45,82,0.03)' : 'var(--color-surface)',
                  padding: '48px 24px',
                  minHeight: 200,
                }}
                onClick={() => inputRef.current?.click()}
              >
                {file ? (
                  <>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(15,45,82,0.08)' }}>
                      <CheckCircle size={22} style={{ color: 'var(--color-navy)' }} />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{file.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                        {(file.size / 1024).toFixed(0)} KB · Click to replace
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(15,45,82,0.06)' }}>
                      <Upload size={20} style={{ color: 'var(--color-navy)' }} />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        Upload your US passport
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                        PDF, JPG, or PNG · Max 10MB · Photo or scan
                      </p>
                    </div>
                  </>
                )}
              </div>
              <input
                ref={inputRef} type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFilePick}
                className="hidden"
              />

              {error && (
                <p className="mt-4 text-sm rounded-lg px-4 py-2.5"
                  style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)' }}>
                  {error}
                </p>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || state === 'uploading'}
                className="btn-primary w-full mt-6"
                style={{ opacity: (!file || state === 'uploading') ? 0.5 : 1 }}
              >
                Read my passport
              </button>

              <p className="text-center text-xs mt-4" style={{ color: 'var(--color-text-tertiary)' }}>
                Your document is processed by AI only. No human sees it.
              </p>
            </motion.div>
          )}

          {/* Extracting state */}
          {state === 'extracting' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="flex items-center justify-center gap-1.5 mb-6">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ background: 'var(--color-navy)' }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                  />
                ))}
              </div>
              <p className="font-display italic text-lg" style={{ color: 'var(--color-text-primary)' }}>
                Reading your passport…
              </p>
              <p className="text-sm mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
                This usually takes 5–10 seconds
              </p>
            </motion.div>
          )}

          {/* Confirming state */}
          {(state === 'confirming' || state === 'saving') && data && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <AvaMessage
                message="I've read your passport. Take a moment to confirm everything looks right — then we're done with the hard part."
                className="mb-8"
              />

              <div className="card">
                <div className="flex flex-col gap-4">
                  <AnimatePresence>
                    {FIELD_LABELS.slice(0, visibleFields).map(({ key, label }, i) => (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <label className="text-xs font-medium uppercase tracking-wide"
                            style={{ color: 'var(--color-text-tertiary)' }}>
                            {label}
                          </label>
                          {i < 4 && (
                            <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                              style={{ background: 'rgba(201,136,42,0.1)', color: 'var(--color-gold)', fontFamily: 'var(--font-body)' }}>
                              From your passport
                            </span>
                          )}
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-auto"
                          >
                            <CheckCircle size={14} style={{ color: 'var(--color-success)' }} />
                          </motion.div>
                        </div>
                        <input
                          type="text"
                          value={data[key] ?? ''}
                          onChange={(e) => handleFieldEdit(key, e.target.value)}
                          className="input-field"
                          style={{ height: 40, fontSize: '0.875rem' }}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {visibleFields === FIELD_LABELS.length && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                  <button
                    onClick={handleConfirm}
                    disabled={state === 'saving'}
                    className="btn-primary w-full"
                    style={{ opacity: state === 'saving' ? 0.6 : 1 }}
                  >
                    {state === 'saving' ? 'Saving…' : 'Confirm and go to my locker →'}
                  </button>
                  <p className="text-center text-xs mt-3" style={{ color: 'var(--color-text-tertiary)' }}>
                    You can edit any field at any time in your locker.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </main>
  )
}
