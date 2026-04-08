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
type InitState = 'checking' | 'polling' | 'ready' | 'timeout'

interface DocUploadStatus {
  presentInLocker: boolean
  uploadState: UploadState
  errorMsg: string | null
  summary: string | null
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

  // Application identity — set after webhook confirms payment
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [initState, setInitState] = useState<InitState>('checking')
  const [isNewPayment, setIsNewPayment] = useState(false)

  const [docStatuses, setDocStatuses] = useState<Record<string, DocUploadStatus>>({})
  const [coverage, setCoverage] = useState<number | null>(null)
  const [requirements, setRequirements] = useState<RequirementsResult | null>(null)
  const [, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [optionalExpanded, setOptionalExpanded] = useState(false)
  const [isMinorApplication, setIsMinorApplication] = useState<boolean | null>(null)

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

  // ── Determine applicationId from URL ──────────────────────────────────────
  useEffect(() => {
    async function init() {
      const params = new URLSearchParams(window.location.search)
      const sessionId = params.get('session_id')
      const appId = params.get('applicationId')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth'); return }

      // Case B — applicationId provided (resume or post-redirect)
      if (appId) {
        setApplicationId(appId)
        sessionStorage.setItem('application_id', appId)
        sessionStorage.setItem('service_type', serviceId)
        const isNew = params.get('new') === 'true'
        if (isNew) setIsNewPayment(true)
        setInitState('ready')
        return
      }

      // Case A — session_id provided (just paid, webhook may still be processing)
      if (sessionId) {
        setInitState('polling')
        setIsNewPayment(true)
        let found: string | null = null
        const MAX_ATTEMPTS = 20
        const INTERVAL = 1500

        for (let i = 0; i < MAX_ATTEMPTS; i++) {
          await new Promise(r => setTimeout(r, INTERVAL))
          const { data } = await supabase
            .from('applications')
            .select('id')
            .eq('stripe_payment_id', sessionId)
            .eq('user_id', user.id)
            .maybeSingle()
          if (data?.id) { found = data.id; break }
        }

        if (!found) {
          // Fallback: look for most recent paid in_progress app for this service
          const { data: fallback } = await supabase
            .from('applications')
            .select('id')
            .eq('user_id', user.id)
            .eq('service_type', serviceId)
            .eq('status', 'in_progress')
            .not('stripe_payment_id', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          if (fallback?.id) found = fallback.id
        }

        if (found) {
          setApplicationId(found)
          sessionStorage.setItem('application_id', found)
          sessionStorage.setItem('service_type', serviceId)
          const url = new URL(window.location.href)
          url.searchParams.delete('session_id')
          url.searchParams.set('applicationId', found)
          url.searchParams.set('new', 'true')
          window.history.replaceState({}, '', url.toString())
          setInitState('ready')
        } else {
          setInitState('timeout')
        }
        return
      }

      // Case C — neither: look for existing paid in_progress app for this service
      const { data: existingApp } = await supabase
        .from('applications')
        .select('id')
        .eq('service_type', serviceId)
        .eq('status', 'in_progress')
        .not('stripe_payment_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existingApp?.id) {
        const url = new URL(window.location.href)
        url.searchParams.set('applicationId', existingApp.id)
        window.location.replace(url.toString())
      } else {
        // No paid application — must pay first
        router.replace('/apply')
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId])

  // ── Load document statuses ─────────────────────────────────────────────────
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
    if (docType === 'us_passport' || docType === 'child_passport') {
      const dob = extractedData.date_of_birth
      if (dob) {
        const minor = isMinor(dob)
        setIsMinorApplication(minor)
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

  // ── Continue to form (applicationId already exists from webhook) ───────────
  async function startApplication() {
    if (!service || !applicationId) return
    setStarting(true)

    sessionStorage.setItem('application_id', applicationId)
    sessionStorage.setItem('service_type', service.id)

    try {
      await fetch('/api/prefill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, serviceId: service.id }),
      })
    } catch {
      // Non-fatal — form still works without pre-fill
    }

    router.push(`/apply/form?applicationId=${applicationId}`)
  }

  // ── Loading / polling / error states ──────────────────────────────────────
  if (initState === 'checking' || initState === 'polling') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--off-white)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTop: '3px solid var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
          {initState === 'polling' ? 'Confirming your payment…' : 'Loading…'}
        </p>
      </div>
    )
  }

  if (initState === 'timeout') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--off-white)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 24px' }}>
        <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--navy)', textAlign: 'center' }}>Payment confirmed. Setting up your application.</p>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 400 }}>
          This is taking a moment. Please wait a few seconds and refresh the page, or go to your dashboard to resume.
        </p>
        <Link href="/dashboard" style={{ color: 'var(--gold)', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
          Go to dashboard →
        </Link>
      </div>
    )
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
              ? 'All required documents found. I can now pre-fill everything. Ready to start.'
              : allRequiredPresent
              ? `I already have everything I need. Let me show you what I'll pre-fill. Then we can start..`
              : `I need a few documents to prepare your ${service.short_name} application. Upload them below and I'll read them instantly..`
          }
          className="mb-6"
        />

        {/* Payment confirmed banner */}
        {isNewPayment && (
          <div style={{ background: '#F0FFF4', border: '1px solid rgba(26,107,58,0.25)', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <CheckCircle size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--success)', marginBottom: 2 }}>Payment confirmed. Let us get started.</p>
              <p style={{ fontSize: 13, color: '#276749', lineHeight: 1.5 }}>
                AVA will pre-fill your application from your documents. Most fields will already be filled in. Just confirm each one.
              </p>
            </div>
          </div>
        )}

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
              <p style={{ fontWeight: 600, fontSize: 14, color: '#1D4ED8', marginBottom: 6 }}>This is an application for a minor child</p>
              <p style={{ fontSize: 13, color: '#1E40AF', lineHeight: 1.6, marginBottom: 8 }}>
                To pre-fill parent names and complete the family section, please upload:
              </p>
              <ul style={{ fontSize: 13, color: '#1E40AF', lineHeight: 1.7, margin: '0 0 8px 16px', padding: 0 }}>
                <li>Father&apos;s current valid passport</li>
                <li>Mother&apos;s current valid passport</li>
              </ul>
              <p style={{ fontSize: 13, color: '#1E40AF', lineHeight: 1.5, marginBottom: 4 }}>
                You can upload these below in the optional documents section.
              </p>
              <p style={{ fontSize: 12, color: '#3B82F6', lineHeight: 1.5 }}>
                Both parents&apos; passports are required on the OCI application form regardless of whether parents have OCI cards.
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
        {(requirements?.processing_time || service?.processing_weeks) && (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 18px', marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--navy)' }}>Processing time: </strong>
              {(() => {
                const pt = requirements?.processing_time
                if (pt) return `Typically ${pt.includes('week') ? pt : `${pt} weeks`} after VFS receives your documents. Apply as early as possible.`
                return `Typically ${service!.processing_weeks} weeks after VFS receives your documents. Apply as early as possible.`
              })()}
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
  let label = starting ? 'Preparing your application…' : 'Continue: AVA will pre-fill everything →'

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
          You can proceed without all documents. AVA will flag what&apos;s missing during review.
        </p>
      )}
    </div>
  )
}
