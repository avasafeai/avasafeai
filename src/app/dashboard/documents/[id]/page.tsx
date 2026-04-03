import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import DeleteDocumentButton from './DeleteDocumentButton'
import { Globe, BookOpen, ShieldCheck, FileText, CreditCard, MapPin, Image, PenLine, ExternalLink } from 'lucide-react'

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

export default async function DocumentDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Use service client to read full record including storage_path
  const serviceClient = createServiceClient()
  const { data: doc } = await serviceClient
    .from('documents')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!doc) redirect('/dashboard/documents')

  const extracted = doc.extracted_data as Record<string, string> | null
  const Icon = DOC_ICONS[doc.doc_type] ?? FileText
  const status = expiryStatus(doc.expires_at)

  // Generate signed URL server-side (never expose storage_path to client)
  let signedUrl: string | null = null
  const storagePath = (doc as Record<string, unknown>).storage_path as string | null
  const fileType = (doc as Record<string, unknown>).file_type as string | null

  if (storagePath) {
    const { data: urlData } = await serviceClient.storage
      .from('documents')
      .createSignedUrl(storagePath, 3600)  // 1 hour
    signedUrl = urlData?.signedUrl ?? null
  }

  const isImage = fileType?.startsWith('image/')
  const isPdf = fileType === 'application/pdf'

  // Build ordered field list — filter out internal/null fields
  const SKIP_KEYS = new Set(['document_type', 'confidence_notes'])
  const fields = extracted
    ? Object.entries(extracted).filter(([k, v]) => !SKIP_KEYS.has(k) && v)
    : []

  const LABELS: Record<string, string> = {
    full_name: 'Full name', first_name: 'First name', last_name: 'Last name',
    date_of_birth: 'Date of birth', place_of_birth: 'Place of birth',
    passport_number: 'Document number', nationality: 'Nationality',
    issue_date: 'Issue date', expiry_date: 'Expiry date',
    issuing_country: 'Issuing country', gender: 'Gender',
    oci_number: 'OCI number', certificate_number: 'Certificate number',
    issuing_authority: 'Issuing authority',
  }

  return (
    <DashboardShell activePage="documents" pageTitle={DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}>
      <div style={{ maxWidth: 720 }}>
        {/* Back link */}
        <Link href="/dashboard/documents" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 24 }}>
          ← Back to documents
        </Link>

        {/* Header card */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 32px', boxShadow: 'var(--shadow-sm)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
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

        {/* File preview */}
        {signedUrl && isImage && (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow-sm)', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '18px 28px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--navy)', margin: 0 }}>Document preview</h2>
            </div>
            <div style={{ padding: 24, display: 'flex', justifyContent: 'center', background: 'var(--off-white)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signedUrl}
                alt={DOC_TYPE_LABELS[doc.doc_type] ?? 'Document'}
                style={{ maxHeight: 300, maxWidth: '100%', objectFit: 'contain', borderRadius: 8, boxShadow: 'var(--shadow-sm)' }}
              />
            </div>
          </div>
        )}

        {signedUrl && isPdf && (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 28px', boxShadow: 'var(--shadow-sm)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--error-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={20} color="var(--error)" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--navy)', margin: '0 0 2px' }}>Original document</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>PDF — link expires in 1 hour</p>
            </div>
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', borderRadius: 10, background: 'var(--navy)', color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
            >
              View PDF <ExternalLink size={13} />
            </a>
          </div>
        )}

        {!storagePath && (
          <div style={{ background: 'var(--off-white)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 20px', marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>
              Original file not available — only extracted data is stored for this document.
            </p>
          </div>
        )}

        {/* Fields grid */}
        {fields.length > 0 && (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow-sm)', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '18px 28px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--navy)', margin: 0 }}>Extracted fields</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              {fields.map(([key, value], i) => (
                <div key={key} style={{
                  padding: '16px 28px',
                  background: i % 2 === 0 ? 'white' : 'var(--off-white)',
                  borderBottom: i < fields.length - 2 ? '1px solid var(--border)' : 'none',
                }}>
                  <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 4 }}>
                    {LABELS[key] ?? key.replace(/_/g, ' ')}
                  </p>
                  <p style={{ fontSize: 15, color: 'var(--text-primary)', fontFamily: key.includes('number') || key.includes('oci') ? 'var(--font-mono)' : 'var(--font-body)' }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Danger zone */}
        <div style={{ border: '1px solid rgba(220,38,38,0.25)', borderRadius: 16, padding: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--error)', marginBottom: 8 }}>Remove document</h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
            This permanently removes the document, all extracted data, and the stored file from your locker.
          </p>
          <DeleteDocumentButton documentId={doc.id} />
        </div>
      </div>
    </DashboardShell>
  )
}
