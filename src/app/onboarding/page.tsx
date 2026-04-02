'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import AvaMessage from '@/components/AvaMessage'
import Logo from '@/components/Logo'
import { ExtractedPassportData } from '@/types/supabase'
import { CheckCircle, FileText, Upload } from 'lucide-react'

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

// Progress width per state
const PROGRESS_WIDTH: Record<State, string> = {
  idle: '10%',
  uploading: '30%',
  extracting: '60%',
  confirming: '90%',
  saving: '100%',
}

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

    // Animate fields appearing one by one — stagger 80ms
    for (let i = 1; i <= FIELD_LABELS.length; i++) {
      await new Promise((r) => setTimeout(r, 80))
      setVisibleFields(i)
    }
  }

  function handleFieldEdit(key: keyof ExtractedPassportData, value: string) {
    setData((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  async function handleConfirm() {
    setState('saving')
    router.push('/onboarding/plan')
  }

  const isUploadPhase = state === 'idle' || state === 'uploading'

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: '#FFFFFF' }}
    >
      {/* 4px progress bar */}
      <div className="h-1 w-full" style={{ background: 'var(--border, #E8E8E4)' }}>
        <motion.div
          className="h-full"
          style={{ background: 'var(--navy-mid, #0F2D52)' }}
          initial={{ width: '0%' }}
          animate={{ width: PROGRESS_WIDTH[state] }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </div>

      {/* Page body */}
      <div className="flex-1 flex flex-col items-center justify-start pt-12 pb-20 px-4">
        <div className="w-full max-w-[540px]">

          {/* Header: Logo + step indicator */}
          <div className="flex flex-col items-center gap-2 mb-12">
            <Logo size="md" />
            <span
              style={{
                fontFamily: 'var(--font-mono, "DM Mono", monospace)',
                fontSize: '12px',
                color: 'var(--text-tertiary, #9CA3AF)',
                letterSpacing: '0.04em',
              }}
            >
              Step 1 of 2
            </span>
          </div>

          {/* Upload / uploading state */}
          {isUploadPhase && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <AvaMessage
                message="Hi, I'm AVA. I'm going to make sure you never have to struggle with a government application again. Let's start by reading your US passport."
                className="mb-8"
              />

              {/* Upload zone */}
              <motion.div
                onClick={() => inputRef.current?.click()}
                className="relative flex flex-col items-center justify-center gap-5 cursor-pointer transition-colors"
                style={{
                  minHeight: '280px',
                  borderRadius: '24px',
                  border: `2px dashed ${file ? 'var(--navy-mid, #0F2D52)' : 'var(--gold, #C9882A)'}`,
                  background: file
                    ? 'rgba(15,45,82,0.03)'
                    : 'var(--gold-subtle, #FDF6EC)',
                  padding: '40px 32px',
                }}
                whileHover={{ background: file ? 'rgba(15,45,82,0.05)' : '#FAF0DE' }}
                transition={{ duration: 0.15 }}
              >
                {file ? (
                  <>
                    {/* File selected state */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: 'rgba(15,45,82,0.08)' }}
                      >
                        <CheckCircle size={26} style={{ color: 'var(--navy-mid, #0F2D52)' }} />
                      </div>
                      <div className="text-center">
                        <p
                          className="font-medium"
                          style={{
                            fontFamily: 'var(--font-body, Inter, sans-serif)',
                            fontSize: '15px',
                            color: 'var(--text-primary, #0A1628)',
                          }}
                        >
                          {file.name}
                        </p>
                        <p
                          className="mt-1"
                          style={{
                            fontFamily: 'var(--font-body, Inter, sans-serif)',
                            fontSize: '13px',
                            color: 'var(--text-tertiary, #9CA3AF)',
                          }}
                        >
                          {(file.size / 1024).toFixed(0)} KB &middot; Click to replace
                        </p>
                      </div>
                    </motion.div>
                  </>
                ) : (
                  <>
                    {/* Empty state */}
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(201,136,42,0.12)' }}
                    >
                      <FileText size={30} style={{ color: 'var(--gold, #C9882A)' }} />
                    </div>
                    <div className="text-center flex flex-col gap-1.5">
                      <p
                        className="font-medium"
                        style={{
                          fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
                          fontSize: '17px',
                          color: 'var(--text-primary, #0A1628)',
                        }}
                      >
                        Upload your US passport
                      </p>
                      <p
                        style={{
                          fontFamily: 'var(--font-body, Inter, sans-serif)',
                          fontSize: '13px',
                          color: 'var(--text-tertiary, #9CA3AF)',
                        }}
                      >
                        PDF, JPG, or PNG &middot; Max 10MB &middot; Photo or scan
                      </p>
                      <div className="flex items-center justify-center gap-1.5 mt-2">
                        <Upload size={14} style={{ color: 'var(--gold, #C9882A)' }} />
                        <span
                          style={{
                            fontFamily: 'var(--font-body, Inter, sans-serif)',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'var(--gold, #C9882A)',
                          }}
                        >
                          Click to browse or drag &amp; drop
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>

              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFilePick}
                className="hidden"
              />

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-sm rounded-xl px-4 py-3"
                  style={{
                    background: '#FEF2F2',
                    color: '#B91C1C',
                    border: '1px solid rgba(185,28,28,0.12)',
                    fontFamily: 'var(--font-body, Inter, sans-serif)',
                  }}
                >
                  {error}
                </motion.p>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || state === 'uploading'}
                className="btn-navy w-full mt-6"
                style={{ opacity: (!file || state === 'uploading') ? 0.5 : 1 }}
              >
                Read my passport
              </button>

              <p
                className="text-center mt-4"
                style={{
                  fontFamily: 'var(--font-body, Inter, sans-serif)',
                  fontSize: '12px',
                  color: 'var(--text-tertiary, #9CA3AF)',
                }}
              >
                Your document is processed by AI only. No human sees it.
              </p>
            </motion.div>
          )}

          {/* Extracting state */}
          {state === 'extracting' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-20 gap-6"
            >
              {/* Animated gold dots */}
              <div className="flex items-center gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: 'var(--gold, #C9882A)' }}
                    animate={{ opacity: [0.25, 1, 0.25] }}
                    transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.22 }}
                  />
                ))}
              </div>
              <div className="text-center flex flex-col gap-2">
                <p
                  style={{
                    fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
                    fontStyle: 'italic',
                    fontSize: '20px',
                    color: 'var(--text-primary, #0A1628)',
                  }}
                >
                  Reading your passport&hellip;
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-body, Inter, sans-serif)',
                    fontSize: '14px',
                    color: 'var(--text-tertiary, #9CA3AF)',
                  }}
                >
                  This usually takes 5&ndash;10 seconds
                </p>
              </div>
            </motion.div>
          )}

          {/* Confirming / saving state */}
          {(state === 'confirming' || state === 'saving') && data && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <AvaMessage
                message="I've read your passport. Take a moment to confirm everything looks right — then we're done with the hard part."
                className="mb-8"
              />

              {/* Fields list */}
              <div className="flex flex-col gap-3">
                <AnimatePresence>
                  {FIELD_LABELS.slice(0, visibleFields).map(({ key, label }, i) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="flex flex-col gap-1.5 rounded-2xl px-5 py-4"
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid var(--border, #E8E8E4)',
                        boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.06))',
                      }}
                    >
                      {/* Label row */}
                      <div className="flex items-center gap-2">
                        <span
                          style={{
                            fontFamily: 'var(--font-body, Inter, sans-serif)',
                            fontSize: '11px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.07em',
                            color: 'var(--text-tertiary, #9CA3AF)',
                          }}
                        >
                          {label}
                        </span>
                        {i < 4 && (
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              background: 'rgba(201,136,42,0.1)',
                              color: 'var(--gold, #C9882A)',
                              fontFamily: 'var(--font-body, Inter, sans-serif)',
                              fontSize: '11px',
                            }}
                          >
                            From your passport
                          </span>
                        )}
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                          className="ml-auto"
                        >
                          <CheckCircle
                            size={16}
                            style={{ color: '#1A6B3A' }}
                          />
                        </motion.div>
                      </div>

                      {/* Editable value */}
                      <input
                        type="text"
                        value={data[key] ?? ''}
                        onChange={(e) => handleFieldEdit(key, e.target.value)}
                        className="input-field"
                        style={{
                          height: '44px',
                          fontSize: '15px',
                          fontFamily: 'var(--font-body, Inter, sans-serif)',
                          fontWeight: 500,
                        }}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Confirm button — appears after all fields visible */}
              {visibleFields === FIELD_LABELS.length && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="mt-8"
                >
                  <button
                    onClick={handleConfirm}
                    disabled={state === 'saving'}
                    className="btn-navy w-full"
                    style={{ opacity: state === 'saving' ? 0.65 : 1 }}
                  >
                    {state === 'saving' ? 'Saving…' : 'Confirm and go to my locker →'}
                  </button>
                  <p
                    className="text-center mt-3"
                    style={{
                      fontFamily: 'var(--font-body, Inter, sans-serif)',
                      fontSize: '12px',
                      color: 'var(--text-tertiary, #9CA3AF)',
                    }}
                  >
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
