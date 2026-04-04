'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getService } from '@/lib/services/registry'
import type { DocumentRequirement } from '@/lib/services/registry'
import type { RequirementsResult } from '@/lib/requirements-engine'
import { isMinor } from '@/lib/prefill-engine'
import Logo from '@/components/Logo'
import AvaMessage from '@/components/AvaMessage'
import { CheckCircle, AlertCircle, ChevronRight, ChevronDown, UploadCloud, RefreshCw, Baby } from 'lucide-react'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

interface DocUploadStatus {
  presentInLocker: boolean
  uploadState: UploadState
  errorMsg: string | null
  summary: string | null   // key field extracted, e.g. "John Smith"
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getExtractedSummary(docType: string, data: Record<string, string>): string {
  if (['us_passport', 'indian_passport', 'oci_card'].includes(docType)) {
    const name = data.full_name || `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim()
    if (name) return name
  }
  if (docType === 'photo') return 'Photo ready'
  if (docType === 'signature') return 'Signature ready'
  const count = Object.values(data).filter(v => v && v !== 'null' && v !== '').length
  return `${count} fields extracted`
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PreparePage({ params }: { params: { serviceId: string } }) {
  const { serviceId } = params
  const router = useRouter()
  const service = getService(serviceId)

  const [docStatuses, setDocStatuses] = useState<Record<string, DocUploadStatus>>({})
  const [coverage, setCoverage] = useState<number | null>(null)
  const [requirements, setRequirements] = useState<RequirementsResult | null>(null)
  const [, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [optionalExpanded, setOptionalExpanded] = useState(false)
  const [isMinorApplication, setIsMinorApplication] = useState<boolean | null>(null)

  // Compute coverage whenever docStatuses changes
  const computeCoverage = useCallback((statuses: Record<string, DocUploadStatus>) => {
    if (!service) return
    const presentTypes = new Set(
      Object.entries(statuses)
        .filter(([, s]) => s.presentInLocker || s.uploadState === 'success')
        .map(([docType]) => docType)
    )
    const total = service.prefill_map.filter(m => !m.transform?.startsWith('hardcode:')).length
    const resolved = service.prefill_map.filter(m => {
      if (m.transform?.startsWith('hardcode:')) return false
      return presentTypes.has(m.source_doc)
    }).length
    const hardcoded = service.prefill_map.filter(m => m.transform?.startsWith('hardcode:')).length
    const fullTotal = total + hardcoded
    const fullResolved = resolved + hardcoded
    setCoverage(fullTotal > 0 ? Math.round((fullResolved / fullTotal) * 100) : 0)
  }, [service])

  useEffect(() => {
    if (!service) return
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()
    const { data: docs } = await supabase.from('documents').select('doc_type, extracted_data')
    const presentTypes = new Set((docs ?? []).map(d => d.doc_type as string))

    // Detect minor from existing locker docs
    const passportDoc = (docs ?? []).find(d => d.doc_type === 'us_passport' || d.doc_type === 'child_passport')
    if (passportDoc?.extracted_data) {
      const pData = passportDoc.extracted_data as Record<string, string>
      const dob = pData.date_of_birth
      if (dob) {
        const minor = isMinor(dob)
        setIsMinorApplication(minor)
        if (minor) setOptionalExpanded(true)
      }
    }

    if (service) {
      const allDocs = [...service.required_documents, ...service.optional_documents]
      const statuses: Record<string, DocUploadStatus> = {}
      for (const doc of allDocs) {
        statuses[doc.doc_type] = {
          presentInLocker: presentTypes.has(doc.doc_type),
          uploadState: 'idle',
          errorMsg: null,
          summary: null,
        }
      }
      setDocStatuses(statuses)
      computeCoverage(statuses)
    }

    try {
      const res = await fetch(`/api/requirements?serviceId=${serviceId}`)
      if (res.ok) {
        const json = await res.json() as { data: RequirementsResult }
        setRequirements(json.data)
      }
    } catch { /* use static */ }

    setLoading(false)
  }

  function onDocUploaded(docType: string, extractedData: Record<string, string>) {
    // Minor detection: if user uploads applicant's passport, check DOB
    if (docType === 'us_passport' || docType === 'child_passport') {
      const dob = extractedData.date_of_birth
      if (dob) {
        const minor = isMinor(dob)
        setIsMinorApplication(minor)
        // Ensure parent passport slots exist in docStatuses
        if (minor) {
          setOptionalExpanded(true)
          setDocStatuses(prev => {
            const next = { ...prev }
            if (!next['father_passport']) next['father_passport'] = { presentInLocker: false, uploadState: 'idle', errorMsg: null, summary: null }
            if (!next['mother_passport']) next['mother_passport'] = { presentInLocker: false, uploadState: 'idle', errorMsg: null, summary: null }
            return next
          })
        }
      }
    }
    setDocStatuses(prev => {
      const next = {
        ...prev,
        [docType]: {
          ...prev[docType],
          uploadState: 'success' as UploadState,
          summary: getExtractedSummary(docType, extractedData),
          errorMsg: null,
        },
      }
      computeCoverage(next)
      return next
    })
  }

  function onDocUploadError(docType: string, msg: string) {
    setDocStatuses(prev => ({
      ...prev,
      [docType]: { ...prev[docType], uploadState: 'error', errorMsg: msg },
    }))
  }

  function onDocUploading(docType: string) {
    setDocStatuses(prev => ({
      ...prev,
      [docType]: { ...prev[docType], uploadState: 'uploading', errorMsg: null },
    }))
  }

  function onDocReset(docType: string) {
    setDocStatuses(prev => {
      const next = {
        ...prev,
        [docType]: { ...prev[docType], uploadState: 'idle' as UploadState, errorMsg: null, summary: null },
      }
      computeCoverage(next)
      return next
    })
  }

  async function startApplication() {
    if (!service) return
    setStarting(true)
    const res = await fetch('/api/create-application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_type: service.id }),
    })
    if (!res.ok) { setStarting(false); return }

    const { data } = await res.json() as { data: { id: string } }
    const appId = data.id
    // Keep sessionStorage for compat with downstream pages
    sessionStorage.setItem('application_id', appId)
    sessionStorage.setItem('service_type', service.id)

    // Run prefill server-side (non-blocking if it fails)
    try {
      await fetch('/api/prefill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: appId, serviceId: service.id }),
      })
    } catch {
      // Non-fatal — form still works, just won't be pre-filled
    }

    router.push(`/apply/form?applicationId=${appId}`)
  }

  if (!service) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--off-white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>
          Service not found. <Link href="/apply" style={{ color: 'var(--gold)' }}>Go back</Link>
        </p>
      </div>
    )
  }

  const requiredDocs = service.required_documents
  // Show conditional docs only when condition is met
  const optionalDocs = service.optional_documents.filter(doc => {
    if (doc.condition === 'minor_application') return isMinorApplication === true
    return true
  })

  const missingRequired = requiredDocs.filter(d => {
    const s = docStatuses[d.doc_type]
    return s ? (!s.presentInLocker && s.uploadState !== 'success') : true
  })
  const allRequiredPresent = missingRequired.length === 0
  const nonePresent = requiredDocs.every(d => {
    const s = docStatuses[d.doc_type]
    return s ? (!s.presentInLocker && s.uploadState !== 'success') : true
  })

  // Celebration: all required docs now present (and at least one was just uploaded)
  const justCompleted = allRequiredPresent && Object.values(docStatuses).some(s => s.uploadState === 'success')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off-white)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 4, background: 'var(--border)' }}>
        <div style={{ height: '100%', width: '10%', background: 'var(--navy)', transition: 'width 500ms ease' }} />
      </div>

      <header style={{ height: 64, background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <Logo size="sm" href="/dashboard" onDark />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{service.short_name}</span>
        <div style={{ width: 80 }} />
      </header>

      <main style={{ maxWidth: 640, margin: '0 auto', width: '100%', padding: '32px 24px 80px' }}>

        <AvaMessage
          message={
            justCompleted
              ? 'All required documents found. I can now pre-fill everything — ready to start.'
              : allRequiredPresent
              ? `I already have everything I need. Let me show you what I'll pre-fill — then we can start.`
              : `I need a few documents to prepare your ${service.short_name} application. Upload them below — I'll read them instantly.`
          }
          className="mb-6"
        />

        {/* Pre-fill coverage */}
        {coverage !== null && (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--navy)' }}>Pre-fill coverage</p>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700,
                color: coverage >= 90 ? 'var(--success)' : coverage >= 50 ? 'var(--gold)' : 'var(--text-tertiary)',
                transition: 'color 600ms ease',
              }}>
                {coverage}%
              </span>
            </div>
            <div style={{ height: 8, background: 'var(--surface)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${coverage}%`,
                background: coverage >= 90 ? 'var(--success)' : 'var(--gold)',
                borderRadius: 4, transition: 'width 600ms ease-out, background 600ms ease',
              }} />
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 8 }}>
              {coverage >= 90
                ? `AVA will pre-fill ${coverage}% of your application automatically.`
                : `Upload the missing documents below to increase coverage to 100%.`}
            </p>
          </div>
        )}

        {/* Celebration banner */}
        {justCompleted && (
          <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success)', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
            <CheckCircle size={18} color="var(--success)" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--success)' }}>
              All required documents found! AVA can now pre-fill everything.
            </p>
          </div>
        )}

        {/* Minor application banner */}
        {isMinorApplication === true && (
          <div style={{ background: '#EFF6FF', border: '1px solid #93C5FD', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Baby size={18} color="#1D4ED8" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, color: '#1D4ED8', marginBottom: 2 }}>Minor application detected</p>
              <p style={{ fontSize: 13, color: '#1E40AF', lineHeight: 1.5 }}>
                Both parents&apos; passports are needed to pre-fill family details. They&apos;ll appear in the Optional documents section below.
              </p>
            </div>
          </div>
        )}

        {/* Requirements change notice */}
        {requirements?.changed_from_previous && requirements.changes_summary && (
          <div style={{ background: 'var(--warning-bg)', border: '1px solid #F59E0B', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <AlertCircle size={18} color="#92400E" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, color: '#92400E', marginBottom: 4 }}>Requirements updated</p>
              <p style={{ fontSize: 13, color: '#78350F', lineHeight: 1.5 }}>{requirements.changes_summary}</p>
            </div>
          </div>
        )}

        {/* Required documents */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
          <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--navy)', marginBottom: 16 }}>Required documents</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {requiredDocs.map(doc => (
              <DocCard
                key={doc.id}
                doc={doc}
                status={docStatuses[doc.doc_type]}

                onUploading={() => onDocUploading(doc.doc_type)}
                onUploaded={(data) => onDocUploaded(doc.doc_type, data)}
                onError={(msg) => onDocUploadError(doc.doc_type, msg)}
                onReset={() => onDocReset(doc.doc_type)}
              />
            ))}
          </div>
        </div>

        {/* Optional documents — collapsible */}
        {optionalDocs.length > 0 && (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, marginBottom: 16, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            <button
              onClick={() => setOptionalExpanded(e => !e)}
              style={{ width: '100%', padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
            >
              <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--navy)' }}>
                Optional documents <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(recommended)</span>
              </p>
              <ChevronDown
                size={18}
                color="var(--text-tertiary)"
                style={{ flexShrink: 0, transition: 'transform 200ms ease', transform: optionalExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>
            {optionalExpanded && (
              <div style={{ padding: '0 24px 24px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
                  {optionalDocs.map(doc => (
                    <DocCard
                      key={doc.id}
                      doc={doc}
                      status={docStatuses[doc.doc_type]}
      
                      onUploading={() => onDocUploading(doc.doc_type)}
                      onUploaded={(data) => onDocUploaded(doc.doc_type, data)}
                      onError={(msg) => onDocUploadError(doc.doc_type, msg)}
                      onReset={() => onDocReset(doc.doc_type)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Processing time */}
        {requirements?.processing_time && (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 18px', marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--navy)' }}>Processing time: </strong>
              {`Typically ${requirements.processing_time.includes('week') ? requirements.processing_time : `${requirements.processing_time} weeks`} after VFS receives your application`}
            </p>
          </div>
        )}

        {/* Continue button */}
        <ContinueButton
          allPresent={allRequiredPresent}
          nonePresent={nonePresent}
          missingCount={missingRequired.length}
          starting={starting}
          onClick={startApplication}
        />
      </main>
    </div>
  )
}

// ── DocCard ───────────────────────────────────────────────────────────────────

function DocCard({
  doc, status,
  onUploading, onUploaded, onError, onReset,
}: {
  doc: DocumentRequirement
  status: DocUploadStatus | undefined
  onUploading: () => void
  onUploaded: (data: Record<string, string>) => void
  onError: (msg: string) => void
  onReset: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const presentInLocker = status?.presentInLocker ?? false
  const uploadState = status?.uploadState ?? 'idle'

  async function handleFile(file: File) {
    onUploading()
    const fd = new FormData()
    fd.append('file', file)
    fd.append('doc_type', doc.doc_type)
    try {
      const res = await fetch('/api/extract-document', { method: 'POST', body: fd })
      const json = await res.json() as { data?: Record<string, string>; error?: string }
      if (!res.ok || json.error) {
        onError(json.error ?? "We couldn't read this document. Try a clearer photo or different file.")
      } else {
        onUploaded(json.data ?? {})
      }
    } catch {
      onError("Upload failed. Please check your connection and try again.")
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  // ── Already in locker ──────────────────────────────────────────────────────
  if (presentInLocker) {
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <CheckCircle size={20} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{doc.name}</p>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)', background: 'var(--success-bg)', borderRadius: 5, padding: '1px 7px' }}>In locker</span>
          </div>
          {doc.notes && <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{doc.notes}</p>}
        </div>
      </div>
    )
  }

  // ── Uploading ──────────────────────────────────────────────────────────────
  if (uploadState === 'uploading') {
    return (
      <div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{doc.name}</p>
          {doc.mandatory && <span style={{ fontSize: 11, fontWeight: 600, color: '#B91C1C', background: '#FEF2F2', borderRadius: 4, padding: '1px 6px' }}>Required</span>}
        </div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 20, height: 20, border: '2px solid var(--navy)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--navy)' }}>Reading…</p>
          </div>
          <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '70%', background: 'var(--navy)', borderRadius: 2, animation: 'indeterminate 1.4s ease-in-out infinite' }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>AVA is extracting fields from your document</p>
        </div>
      </div>
    )
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (uploadState === 'success') {
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <CheckCircle size={20} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{doc.name}</p>
          {status?.summary && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 3 }}>{status.summary}</p>
          )}
          <button
            onClick={onReset}
            style={{ fontSize: 12, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
          >
            Replace
          </button>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)', background: 'var(--success-bg)', borderRadius: 5, padding: '1px 7px', flexShrink: 0, marginTop: 2 }}>
          Uploaded
        </span>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (uploadState === 'error') {
    return (
      <div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{doc.name}</p>
          {doc.mandatory && <span style={{ fontSize: 11, fontWeight: 600, color: '#B91C1C', background: '#FEF2F2', borderRadius: 4, padding: '1px 6px' }}>Required</span>}
        </div>
        <div style={{ border: '1px solid #FECACA', borderRadius: 10, padding: '14px 16px', background: '#FEF2F2' }}>
          <p style={{ fontSize: 13, color: '#B91C1C', marginBottom: 10 }}>
            {status?.errorMsg ?? "We couldn't read this document. Try a clearer photo or different file."}
          </p>
          <button
            onClick={onReset}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#B91C1C', background: 'white', border: '1px solid #FECACA', borderRadius: 7, padding: '6px 12px', cursor: 'pointer' }}
          >
            <RefreshCw size={13} /> Try again
          </button>
        </div>
      </div>
    )
  }

  // ── Idle — upload zone ─────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{doc.name}</p>
        {doc.mandatory && <span style={{ fontSize: 11, fontWeight: 600, color: '#B91C1C', background: '#FEF2F2', borderRadius: 4, padding: '1px 6px' }}>Required</span>}
      </div>
      {doc.notes && <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, lineHeight: 1.5 }}>{doc.notes}</p>}

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${isDragOver ? 'var(--navy)' : 'var(--border)'}`,
          borderRadius: 10,
          padding: '18px 16px',
          background: isDragOver ? 'rgba(15,45,82,0.04)' : 'var(--surface)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          transition: 'border-color 150ms ease, background 150ms ease',
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadCloud size={22} color={isDragOver ? 'var(--navy)' : 'var(--text-tertiary)'} />
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
          Drop file here or{' '}
          <span style={{ color: 'var(--navy)', fontWeight: 600, textDecoration: 'underline' }}>choose file</span>
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>JPG, PNG or PDF · max 10MB</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        style={{ display: 'none' }}
        onChange={onInputChange}
      />
    </div>
  )
}

// ── ContinueButton ────────────────────────────────────────────────────────────

function ContinueButton({
  allPresent, nonePresent, missingCount, starting, onClick,
}: {
  allPresent: boolean
  nonePresent: boolean
  missingCount: number
  starting: boolean
  onClick: () => void
}) {
  let bg = 'var(--gold)'
  let color = 'white'
  let border = 'none'
  let label = starting ? 'Preparing your application…' : 'Continue — AVA will pre-fill everything →'

  if (!allPresent && !nonePresent) {
    bg = 'transparent'
    color = 'var(--navy)'
    border = '2px solid var(--navy)'
    label = starting ? 'Preparing your application…' : `Continue with ${missingCount} missing document${missingCount > 1 ? 's' : ''}`
  } else if (nonePresent) {
    bg = 'var(--surface)'
    color = 'var(--text-tertiary)'
    border = '1px solid var(--border)'
    label = starting ? 'Preparing your application…' : 'Upload documents to continue'
  }

  return (
    <div>
      <button
        onClick={onClick}
        disabled={starting}
        style={{
          width: '100%', height: 56, borderRadius: 14,
          background: bg, color, border,
          cursor: starting ? 'default' : 'pointer',
          fontWeight: 700, fontSize: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'opacity 200ms ease',
          opacity: starting ? 0.6 : 1,
        }}
      >
        {label}
        {allPresent && !starting && <ChevronRight size={18} />}
      </button>
      {!allPresent && missingCount > 0 && (
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)', marginTop: 10 }}>
          You can proceed without all documents — AVA will flag what&apos;s missing during review.
        </p>
      )}
    </div>
  )
}
