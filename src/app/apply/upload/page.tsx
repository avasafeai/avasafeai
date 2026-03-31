'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ProgressBar from '@/components/ProgressBar'
import { ExtractedPassportData } from '@/types/supabase'

type UploadState = 'idle' | 'uploading' | 'extracting' | 'done' | 'error'

interface ExtractedField {
  label: string
  key: keyof ExtractedPassportData
}

const FIELDS: ExtractedField[] = [
  { label: 'First name', key: 'first_name' },
  { label: 'Last name', key: 'last_name' },
  { label: 'Passport number', key: 'passport_number' },
  { label: 'Date of birth', key: 'date_of_birth' },
  { label: 'Place of birth', key: 'place_of_birth' },
  { label: 'Nationality', key: 'nationality' },
  { label: 'Issue date', key: 'issue_date' },
  { label: 'Expiry date', key: 'expiry_date' },
  { label: 'Gender', key: 'gender' },
]

export default function UploadPage() {
  const router = useRouter()
  const passportRef = useRef<HTMLInputElement>(null)
  const indianRef = useRef<HTMLInputElement>(null)

  const [passportFile, setPassportFile] = useState<File | null>(null)
  const [indianFile, setIndianFile] = useState<File | null>(null)
  const [state, setState] = useState<UploadState>('idle')
  const [editedData, setEditedData] = useState<ExtractedPassportData | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (f: File | null) => void
  ) {
    const file = e.target.files?.[0] ?? null
    if (file && file.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB.')
      return
    }
    setError(null)
    setter(file)
  }

  async function handleUpload() {
    if (!passportFile) {
      setError('Please upload your current foreign passport.')
      return
    }
    setState('uploading')
    setError(null)

    const formData = new FormData()
    formData.append('file', passportFile)
    formData.append('doc_type', 'passport')

    setState('extracting')
    const res = await fetch('/api/extract-document', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const body = (await res.json()) as { error: string }
      setError(body.error ?? 'Extraction failed.')
      setState('error')
      return
    }

    const { data } = (await res.json()) as { data: ExtractedPassportData }
    setEditedData(data)
    setState('done')
  }

  function handleFieldChange(key: keyof ExtractedPassportData, value: string) {
    setEditedData((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  async function handleConfirm() {
    router.push('/apply/form')
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto">
        <ProgressBar currentStep={0} />

        <div className="px-6 py-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Upload your documents</h1>
          <p className="text-slate-500 text-sm mb-8">
            AVA will read your passport and fill in your details automatically.
          </p>

          {state !== 'done' ? (
            <div className="flex flex-col gap-6">
              <DropZone
                label="Current foreign passport"
                hint="PDF, JPG, or PNG · Max 10MB"
                file={passportFile}
                inputRef={passportRef}
                onChange={(e) => handleFileChange(e, setPassportFile)}
                required
              />
              <DropZone
                label="Old Indian passport or birth certificate"
                hint="PDF, JPG, or PNG · Max 10MB"
                file={indianFile}
                inputRef={indianRef}
                onChange={(e) => handleFileChange(e, setIndianFile)}
              />

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
              )}

              {(state === 'uploading' || state === 'extracting') && (
                <div className="flex items-center gap-3 text-indigo-700 bg-indigo-50 rounded-xl px-5 py-4">
                  <span className="animate-spin text-lg">⏳</span>
                  <span className="font-medium text-sm">
                    {state === 'uploading'
                      ? 'Uploading your passport...'
                      : 'AVA is reading your passport...'}
                  </span>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!passportFile || state === 'uploading' || state === 'extracting'}
                className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                Extract my details
              </button>
            </div>
          ) : (
            <div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
                <h2 className="font-semibold text-slate-900 mb-4">
                  Review extracted details — edit anything that&apos;s wrong
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {FIELDS.map(({ label, key }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
                        {label}
                      </label>
                      <input
                        type="text"
                        value={editedData?.[key] ?? ''}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleConfirm}
                className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold hover:bg-indigo-700 transition-colors"
              >
                Confirm and continue →
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

interface DropZoneProps {
  label: string
  hint: string
  file: File | null
  inputRef: React.RefObject<HTMLInputElement>
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
}

function DropZone({ label, hint, file, inputRef, onChange, required }: DropZoneProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full border-2 border-dashed border-slate-300 rounded-xl px-6 py-8 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-colors cursor-pointer"
      >
        {file ? (
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">📄</span>
            <span className="text-sm font-medium text-slate-800">{file.name}</span>
            <span className="text-xs text-slate-400">
              {(file.size / 1024).toFixed(0)} KB · Click to replace
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl text-slate-400">↑</span>
            <span className="text-sm text-slate-600">Click to upload</span>
            <span className="text-xs text-slate-400">{hint}</span>
          </div>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={onChange}
        className="hidden"
      />
    </div>
  )
}
