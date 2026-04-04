'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getService } from '@/lib/services/registry'
import type { DocumentRequirement } from '@/lib/services/registry'
import type { RequirementsResult } from '@/lib/requirements-engine'
import Logo from '@/components/Logo'
import AvaMessage from '@/components/AvaMessage'
import { CheckCircle, Circle, AlertCircle, ChevronRight, Upload } from 'lucide-react'
import Link from 'next/link'

interface LockerStatus {
  doc_type: string
  present: boolean
}

export default function PreparePage({ params }: { params: { serviceId: string } }) {
  const { serviceId } = params
  const router = useRouter()
  const service = getService(serviceId)

  const [lockerStatus, setLockerStatus] = useState<LockerStatus[]>([])
  const [coverage, setCoverage] = useState<number | null>(null)
  const [requirements, setRequirements] = useState<RequirementsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (!service) return
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()

    // 1. Fetch locker documents
    const { data: docs } = await supabase
      .from('documents')
      .select('doc_type')

    const presentTypes = new Set((docs ?? []).map(d => d.doc_type as string))

    if (service) {
      const allRequired = [...service.required_documents, ...service.optional_documents]
      const statuses: LockerStatus[] = allRequired.map(d => ({
        doc_type: d.doc_type,
        present: presentTypes.has(d.doc_type),
      }))
      setLockerStatus(statuses)

      // Coverage estimate: how many prefill fields can be resolved
      const total = service.prefill_map.filter(m => !m.transform?.startsWith('hardcode:')).length
      const resolved = service.prefill_map.filter(m => {
        if (m.transform?.startsWith('hardcode:')) return false
        return presentTypes.has(m.source_doc)
      }).length
      const hardcoded = service.prefill_map.filter(m => m.transform?.startsWith('hardcode:')).length
      const fullTotal = total + hardcoded
      const fullResolved = resolved + hardcoded
      setCoverage(fullTotal > 0 ? Math.round((fullResolved / fullTotal) * 100) : 0)
    }

    // 2. Fetch requirements (non-blocking)
    try {
      const res = await fetch(`/api/requirements?serviceId=${serviceId}`)
      if (res.ok) {
        const json = await res.json() as { data: RequirementsResult }
        setRequirements(json.data)
      }
    } catch { /* use static */ }

    setLoading(false)
  }

  async function startApplication() {
    if (!service) return
    setStarting(true)

    const res = await fetch('/api/create-application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_type: service.id }),
    })

    if (res.ok) {
      const { data } = await res.json() as { data: { id: string } }
      sessionStorage.setItem('application_id', data.id)
      sessionStorage.setItem('service_type', service.id)
    }

    router.push('/apply/form')
  }

  if (!service) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--off-white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Service not found. <Link href="/apply" style={{ color: 'var(--gold)' }}>Go back</Link></p>
      </div>
    )
  }

  const requiredDocs = service.required_documents
  const optionalDocs = service.optional_documents
  const missingRequired = requiredDocs.filter(d => {
    const s = lockerStatus.find(ls => ls.doc_type === d.doc_type)
    return s ? !s.present : true
  })
  const canProceed = missingRequired.length === 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off-white)', display: 'flex', flexDirection: 'column' }}>
      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--border)' }}>
        <div style={{ height: '100%', width: '10%', background: 'var(--navy)', transition: 'width 500ms ease' }} />
      </div>

      <header style={{ height: 64, background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <Logo size="sm" />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{service.short_name}</span>
        <div style={{ width: 80 }} />
      </header>

      <main style={{ maxWidth: 640, margin: '0 auto', width: '100%', padding: '32px 24px 80px' }}>
        <AvaMessage
          message={canProceed
            ? `I already have everything I need. Let me show you what I&apos;ll pre-fill — then we can start.`
            : `I need a couple more documents before I can fully prepare your ${service.short_name} application.`}
          className="mb-6"
        />

        {/* Pre-fill coverage card */}
        {coverage !== null && (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--navy)' }}>Pre-fill coverage</p>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: coverage >= 80 ? 'var(--success)' : 'var(--gold)' }}>{coverage}%</span>
            </div>
            <div style={{ height: 8, background: 'var(--surface)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${coverage}%`, background: coverage >= 80 ? 'var(--success)' : 'var(--gold)', borderRadius: 4, transition: 'width 800ms ease' }} />
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 8 }}>
              {coverage >= 80
                ? `AVA can pre-fill ${coverage}% of your application from your locker. You&apos;ll only need to confirm a few details.`
                : `Add the missing documents below to increase pre-fill coverage to 100%.`}
            </p>
          </div>
        )}

        {/* Required documents checklist */}
        <DocChecklist
          title="Required documents"
          docs={requiredDocs}
          lockerStatus={lockerStatus}
          loading={loading}
        />

        {optionalDocs.length > 0 && (
          <DocChecklist
            title="Optional documents (recommended)"
            docs={optionalDocs}
            lockerStatus={lockerStatus}
            loading={loading}
          />
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

        {/* Processing time */}
        {requirements?.processing_time && (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--navy)' }}>Processing time: </strong>
              {requirements.processing_time}
            </p>
          </div>
        )}

        {/* Add missing documents CTA */}
        {missingRequired.length > 0 && (
          <Link href="/dashboard/documents/add" style={{ display: 'block', background: 'var(--navy)', color: 'white', borderRadius: 12, padding: '14px 20px', textAlign: 'center', textDecoration: 'none', fontWeight: 600, fontSize: 15, marginBottom: 16 }}>
            <Upload size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
            Add missing documents to locker
          </Link>
        )}

        {/* Continue button */}
        <button
          onClick={startApplication}
          disabled={starting || !canProceed}
          style={{
            width: '100%', height: 56, borderRadius: 14,
            background: canProceed ? 'var(--gold)' : 'var(--surface)',
            color: canProceed ? 'white' : 'var(--text-tertiary)',
            border: 'none', cursor: canProceed ? 'pointer' : 'default',
            fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8, transition: 'opacity 200ms ease',
            opacity: starting ? 0.6 : 1,
          }}
        >
          {starting ? 'Starting…' : canProceed ? 'Start application →' : 'Add required documents first'}
          {canProceed && !starting && <ChevronRight size={18} />}
        </button>

        {canProceed && (
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)', marginTop: 10 }}>
            AVA will pre-fill everything it can from your locker.
          </p>
        )}
      </main>
    </div>
  )
}

function DocChecklist({
  title, docs, lockerStatus, loading,
}: {
  title: string
  docs: DocumentRequirement[]
  lockerStatus: LockerStatus[]
  loading: boolean
}) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
      <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--navy)', marginBottom: 16 }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {docs.map(doc => {
          const status = lockerStatus.find(ls => ls.doc_type === doc.doc_type)
          const present = status?.present ?? false

          return (
            <div key={doc.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {loading ? (
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--surface)', flexShrink: 0, marginTop: 1 }} />
              ) : present ? (
                <CheckCircle size={22} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} />
              ) : (
                <Circle size={22} color="var(--border)" style={{ flexShrink: 0, marginTop: 1 }} />
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: present ? 500 : 400, color: present ? 'var(--text-primary)' : 'var(--text-secondary)', marginBottom: 2 }}>
                  {doc.name}
                  {!present && doc.mandatory && (
                    <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 600, color: '#B91C1C', background: '#FEF2F2', borderRadius: 4, padding: '1px 6px' }}>Required</span>
                  )}
                </p>
                {doc.notes && (
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>{doc.notes}</p>
                )}
              </div>
              {!loading && present && (
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)', background: 'var(--success-bg)', borderRadius: 6, padding: '2px 8px', flexShrink: 0, marginTop: 2 }}>
                  In locker
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
