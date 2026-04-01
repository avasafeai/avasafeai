import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import {
  FileText, Globe, BookOpen, ShieldCheck, CreditCard,
  MapPin, Image, PenLine, Plus,
} from 'lucide-react'

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

function expiryStatus(e: string | null) {
  if (!e) return null
  const d = (new Date(e).getTime() - Date.now()) / 86400000
  if (d < 90) return 'critical'
  if (d < 180) return 'warning'
  return 'ok'
}
function monthsUntil(e: string) { return Math.floor((new Date(e).getTime() - Date.now()) / (86400000 * 30)) }
function fmtDate(e: string) { return new Date(e).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) }

export default async function DocumentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: docs } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const addBtn = (
    <Link href="/dashboard/documents/add" className="btn-navy" style={{ height: 40, padding: '0 16px', fontSize: 14 }}>
      <Plus size={15} /> Add document
    </Link>
  )

  return (
    <DashboardShell activePage="documents" pageTitle="My Documents" topBarActions={addBtn}>
      {!docs || docs.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <FileText size={32} color="var(--text-tertiary)" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 24, color: 'var(--navy)', marginBottom: 10 }}>
            Your locker is empty
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 28, maxWidth: 380 }}>
            Add your passport and OCI card so AVA can monitor expiry dates and pre-fill every future application.
          </p>
          <Link href="/dashboard/documents/add" className="btn-navy">
            <Plus size={16} /> Add your first document
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {docs.map((doc) => {
            const Icon = DOC_ICONS[doc.doc_type] ?? FileText
            const status = expiryStatus(doc.expires_at)
            const extracted = doc.extracted_data as Record<string, string> | null
            return (
              <Link key={doc.id} href={`/dashboard/documents/${doc.id}`} style={{ textDecoration: 'none' }}>
                <div
                  style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-sm)', cursor: 'pointer', transition: 'box-shadow 200ms ease, transform 200ms ease', height: '100%' }}
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
            )
          })}

          {/* Add card */}
          <Link href="/dashboard/documents/add"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'transparent', border: '2px dashed var(--border)', borderRadius: 16, padding: 24, minHeight: 148, textDecoration: 'none', transition: 'border-color 200ms ease' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
          >
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={18} color="var(--text-tertiary)" />
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>Add document</span>
          </Link>
        </div>
      )}
    </DashboardShell>
  )
}
