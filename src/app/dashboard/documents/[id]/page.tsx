import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import DeleteDocumentButton from './DeleteDocumentButton'
import DocumentFields from './DocumentFields'
import DownloadButton from './DownloadButton'
import { Globe, BookOpen, ShieldCheck, FileText, CreditCard, MapPin, Image, PenLine } from 'lucide-react'
import { decryptSensitiveFields } from '@/lib/field-encryption'

const DOC_TYPE_LABELS: Record<string, string> = {
  us_passport: 'US Passport', indian_passport: 'Indian Passport', oci_card: 'OCI Card',
  renunciation: 'Renunciation Certificate', pan_card: 'PAN Card',
  address_proof: 'Address Proof', photo: 'Photo', signature: 'Signature',
}
const DOC_ICONS: Record<string, React.ElementType> = {
  us_passport: Globe, indian_passport: BookOpen, oci_card: ShieldCheck,
  renunciation: FileText, pan_card: CreditCard, address_proof: MapPin, photo: Image, signature: PenLine,
}

function fmtDate(e: string) { return new Date(e).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }
function expiryStatus(e: string | null) {
  if (!e) return null
  const d = (new Date(e).getTime() - Date.now()) / 86400000
  return d < 90 ? 'critical' : d < 180 ? 'warning' : 'ok'
}
function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default async function DocumentDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const serviceClient = createServiceClient()
  const { data: doc } = await serviceClient
    .from('documents')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!doc) redirect('/dashboard/documents')

  const rawExtracted = doc.extracted_data as Record<string, string> | null

  // Decrypt sensitive fields server-side before rendering
  let extracted: Record<string, string> | null = null
  if (rawExtracted) {
    try {
      extracted = await decryptSensitiveFields(rawExtracted)
    } catch {
      extracted = rawExtracted
    }
  }

  const Icon = DOC_ICONS[doc.doc_type] ?? FileText
  const status = expiryStatus(doc.expires_at)

  const storagePath = doc.storage_path
  const fileType = doc.file_type
  const isImage = fileType?.startsWith('image/')
  const isPdf = fileType === 'application/pdf'

  // Files are encrypted in storage — serve through /api/document-preview/[id]
  const previewUrl = storagePath ? `/api/document-preview/${doc.id}` : null

  // Build ordered field list — skip meta fields
  const SKIP_KEYS = new Set(['document_type', 'confidence_notes'])
  const fields: [string, string][] = extracted
    ? Object.entries(extracted).filter(([k, v]) => !SKIP_KEYS.has(k) && v) as [string, string][]
    : []

  return (
    <DashboardShell activePage="documents" pageTitle={DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}>
      <div style={{ maxWidth: 720 }}>
        {/* Back link */}
        <Link href="/dashboard/documents" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 24 }}>
          ← Back to documents
        </Link>

        {/* Header card */}
        <div className="doc-detail-header" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 32px', boxShadow: 'var(--shadow-sm)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={24} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--navy)', margin: '0 0 6px' }}>
              {DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>
              Added {fmtDate(doc.created_at)}
            </p>
          </div>
          {doc.expires_at && (
            <span className="badge" style={{
              background: status === 'critical' ? 'var(--error-bg)' : status === 'warning' ? 'var(--warning-bg)' : 'var(--success-bg)',
              color: status === 'critical' ? 'var(--error)' : status === 'warning' ? 'var(--warning)' : 'var(--success)',
              fontSize: 13, padding: '6px 14px',
            }}>
              {status === 'critical' ? 'Action needed' : status === 'warning' ? 'Expiring soon' : `Valid until ${fmtDate(doc.expires_at)}`}
            </span>
          )}
        </div>

        {/* File preview — served via decrypt API, never via signed URL */}
        {previewUrl && isImage && (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow-sm)', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '18px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--navy)', margin: 0 }}>Document preview</h2>
              <DownloadButton documentId={doc.id} />
            </div>
            <div style={{ padding: 24, display: 'flex', justifyContent: 'center', background: 'var(--off-white)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={DOC_TYPE_LABELS[doc.doc_type] ?? 'Document'}
                style={{ maxHeight: 250, maxWidth: '100%', width: '100%', objectFit: 'contain', borderRadius: 8, boxShadow: 'var(--shadow-sm)' }}
              />
            </div>
            {(doc.file_size_bytes || doc.original_filename) && (
              <div className="doc-file-metadata" style={{ padding: '12px 28px', borderTop: '1px solid var(--border)', display: 'flex', gap: 20 }}>
                {doc.original_filename && (
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{doc.original_filename}</span>
                )}
                {doc.file_size_bytes && (
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{fmtBytes(doc.file_size_bytes)}</span>
                )}
              </div>
            )}
          </div>
        )}

        {previewUrl && isPdf && (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 28px', boxShadow: 'var(--shadow-sm)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--error-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={20} color="var(--error)" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--navy)', margin: '0 0 2px' }}>Original document</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                Decrypted on demand — never cached
                {doc.file_size_bytes ? ` · ${fmtBytes(doc.file_size_bytes)}` : ''}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'white', color: 'var(--navy)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
              >
                View PDF
              </a>
              <DownloadButton documentId={doc.id} />
            </div>
          </div>
        )}

        {!storagePath && (
          <div style={{ background: 'var(--off-white)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 20px', marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>
              Original file not available — only extracted data is stored for this document.
            </p>
          </div>
        )}

        {/* Fields grid — client component handles masking */}
        {fields.length > 0 && (
          <DocumentFields fields={fields} />
        )}

        {/* Danger zone */}
        <div style={{ border: '1px solid rgba(220,38,38,0.25)', borderRadius: 16, padding: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--error)', marginBottom: 8 }}>Remove document</h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
            This permanently removes the document, all extracted data, and the encrypted file from your locker.
          </p>
          <DeleteDocumentButton documentId={doc.id} />
        </div>
      </div>
    </DashboardShell>
  )
}
