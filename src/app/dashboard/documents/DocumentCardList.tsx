'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, Globe, BookOpen, ShieldCheck, CreditCard, MapPin, Image, PenLine, Trash2 } from 'lucide-react'

const DOC_TYPE_LABELS: Record<string, string> = {
  us_passport: 'US Passport', indian_passport: 'Indian Passport',
  oci_card: 'OCI Card', renunciation: 'Renunciation Certificate',
  pan_card: 'PAN Card', address_proof: 'Address Proof',
  photo: 'Photo', signature: 'Signature',
}
const DOC_ICONS: Record<string, React.ElementType> = {
  us_passport: Globe, indian_passport: BookOpen, oci_card: ShieldCheck,
  renunciation: FileText, pan_card: CreditCard, address_proof: MapPin,
  photo: Image, signature: PenLine,
}

interface Doc {
  id: string
  doc_type: string
  expires_at: string | null
  created_at: string
  extracted_data: Record<string, string> | null
}

function expiryStatus(e: string | null) {
  if (!e) return null
  const d = (new Date(e).getTime() - Date.now()) / 86400000
  if (d < 90) return 'critical'
  if (d < 180) return 'warning'
  return 'ok'
}
function monthsUntil(e: string) { return Math.floor((new Date(e).getTime() - Date.now()) / (86400000 * 30)) }
function fmtDate(e: string) { return new Date(e).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) }

export default function DocumentCardList({ docs }: { docs: Doc[] }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [localDocs, setLocalDocs] = useState(docs)

  async function handleDelete(docId: string) {
    setDeletingId(docId)
    const res = await fetch('/api/delete-document', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: docId }),
    })
    if (res.ok) {
      setLocalDocs(prev => prev.filter(d => d.id !== docId))
    }
    setDeletingId(null)
    setConfirmingId(null)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
      {localDocs.map((doc) => {
        const Icon = DOC_ICONS[doc.doc_type] ?? FileText
        const status = expiryStatus(doc.expires_at)
        const extracted = doc.extracted_data

        return (
          <div
            key={doc.id}
            style={{ position: 'relative' }}
            onMouseEnter={() => setHoveredId(doc.id)}
            onMouseLeave={() => { setHoveredId(null); if (confirmingId === doc.id) setConfirmingId(null) }}
          >
            <Link href={`/dashboard/documents/${doc.id}`} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'box-shadow 200ms ease, transform 200ms ease',
                  height: '100%',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
              >
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Icon size={20} color="white" />
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}
                </p>
                {extracted?.full_name && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{extracted.full_name}</p>
                )}
                {doc.expires_at && (
                  <span className="badge" style={{
                    background: status === 'critical' ? 'var(--error-bg)' : status === 'warning' ? 'var(--warning-bg)' : 'var(--success-bg)',
                    color: status === 'critical' ? 'var(--error)' : status === 'warning' ? 'var(--warning)' : 'var(--success)',
                    fontSize: 11,
                  }}>
                    {status === 'critical' ? 'Action needed' : status === 'warning' ? `Expires in ${monthsUntil(doc.expires_at)}mo` : `Valid until ${fmtDate(doc.expires_at)}`}
                  </span>
                )}
              </div>
            </Link>

            {/* Hover trash icon */}
            {hoveredId === doc.id && confirmingId !== doc.id && (
              <button
                onClick={e => { e.preventDefault(); setConfirmingId(doc.id) }}
                title="Delete document"
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'white',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  zIndex: 10,
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--error-bg)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white' }}
              >
                <Trash2 size={14} color="var(--error)" />
              </button>
            )}

            {/* Confirmation overlay */}
            {confirmingId === doc.id && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 16,
                  background: 'white',
                  border: '1.5px solid rgba(220,38,38,0.3)',
                  boxShadow: 'var(--shadow-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  padding: 20,
                  zIndex: 20,
                }}
              >
                <p style={{ fontSize: 13, color: 'var(--text-primary)', textAlign: 'center', margin: 0, fontWeight: 500 }}>
                  Delete this document?
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
                  This cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setConfirmingId(null)}
                    style={{
                      height: 34,
                      padding: '0 14px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'white',
                      fontSize: 13,
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    style={{
                      height: 34,
                      padding: '0 14px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'var(--error, #B91C1C)',
                      color: 'white',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: deletingId === doc.id ? 'not-allowed' : 'pointer',
                      opacity: deletingId === doc.id ? 0.6 : 1,
                    }}
                  >
                    {deletingId === doc.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
