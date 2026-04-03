import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  FileText, AlertTriangle, Plus, ChevronRight,
  ShieldCheck, Globe, CreditCard, Image, PenLine,
  MapPin, BookOpen,
} from 'lucide-react'
import DashboardShell from '@/components/DashboardShell'
import AlertDismiss from './AlertDismiss'

// ── Types ────────────────────────────────────────────────────────────
const DOC_TYPE_LABELS: Record<string, string> = {
  us_passport:     'US Passport',
  indian_passport: 'Indian Passport',
  oci_card:        'OCI Card',
  renunciation:    'Renunciation Certificate',
  pan_card:        'PAN Card',
  address_proof:   'Address Proof',
  photo:           'Photo',
  signature:       'Signature',
}

const DOC_ICONS: Record<string, React.ElementType> = {
  us_passport:     Globe,
  indian_passport: BookOpen,
  oci_card:        ShieldCheck,
  renunciation:    FileText,
  pan_card:        CreditCard,
  address_proof:   MapPin,
  photo:           Image,
  signature:       PenLine,
}

const SERVICE_LABELS: Record<string, string> = {
  oci_new:          'OCI Card — New',
  oci_renewal:      'OCI Card — Renewal',
  passport_renewal: 'Passport Renewal',
}

// ── Helpers ──────────────────────────────────────────────────────────
function expiryStatus(expiresAt: string | null): 'ok' | 'warning' | 'critical' | null {
  if (!expiresAt) return null
  const diffDays = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  if (diffDays < 90)  return 'critical'
  if (diffDays < 180) return 'warning'
  return 'ok'
}

function formatExpiry(expiresAt: string): string {
  return new Date(expiresAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function monthsUntil(expiresAt: string): number {
  return Math.floor((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))
}

// ── Status badge ─────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    draft:             { label: 'Draft',          bg: 'var(--surface)',      color: 'var(--text-tertiary)' },
    locker_ready:      { label: 'Ready',           bg: 'rgba(10,22,40,0.06)', color: 'var(--navy-mid)' },
    form_complete:     { label: 'In progress',     bg: 'rgba(10,22,40,0.06)', color: 'var(--navy-mid)' },
    validated:         { label: 'Validated',       bg: 'rgba(10,22,40,0.06)', color: 'var(--navy-mid)' },
    paid:              { label: 'Paid',            bg: 'var(--gold-subtle)',  color: 'var(--gold)' },
    package_generated: { label: 'Package ready',  bg: 'var(--gold-subtle)',  color: 'var(--gold)' },
    submitted:         { label: 'Submitted',       bg: 'var(--success-bg)',   color: 'var(--success)' },
    approved:          { label: 'Approved',        bg: 'var(--success-bg)',   color: 'var(--success)' },
  }
  const s = map[status] ?? { label: status, bg: 'var(--surface)', color: 'var(--text-tertiary)' }
  return (
    <span className="badge" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

// ── Document card ─────────────────────────────────────────────────────
function DocumentCard({ doc }: { doc: {
  id: string
  doc_type: string
  expires_at: string | null
  extracted_data: Record<string, string> | null
}}) {
  const status = expiryStatus(doc.expires_at)
  const IconComponent = DOC_ICONS[doc.doc_type] ?? FileText
  const extractedData = doc.extracted_data

  let expiryPill: React.ReactNode = null
  if (doc.expires_at) {
    const months = monthsUntil(doc.expires_at)
    if (status === 'critical') {
      expiryPill = (
        <span className="badge" style={{ background: 'var(--error-bg)', color: 'var(--error)', fontSize: 11 }}>
          Action needed
        </span>
      )
    } else if (status === 'warning') {
      expiryPill = (
        <span className="badge" style={{ background: 'var(--warning-bg)', color: 'var(--warning)', fontSize: 11 }}>
          Expires in {months}mo
        </span>
      )
    } else {
      expiryPill = (
        <span className="badge" style={{ background: 'var(--success-bg)', color: 'var(--success)', fontSize: 11 }}>
          Valid until {formatExpiry(doc.expires_at)}
        </span>
      )
    }
  }

  return (
    <Link
      href={`/dashboard/documents/${doc.id}`}
      className="block hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
      style={{
        background: 'white',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 24,
        boxShadow: 'var(--shadow-sm)',
        textDecoration: 'none',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: 'var(--navy)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
      }}>
        <IconComponent size={20} color="white" />
      </div>

      {/* Label + key field */}
      <p style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: 16,
        color: 'var(--text-primary)',
        margin: '0 0 4px',
      }}>
        {DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}
      </p>
      {extractedData?.full_name && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
          {extractedData.full_name}
        </p>
      )}
      {!extractedData?.full_name && extractedData?.passport_number && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px', fontFamily: 'var(--font-mono)' }}>
          {extractedData.passport_number}
        </p>
      )}

      {/* Expiry pill */}
      {expiryPill ?? (
        <span style={{ display: 'block', height: 22 }} />
      )}
    </Link>
  )
}

// ── Add document card ─────────────────────────────────────────────────
function AddDocumentCard() {
  return (
    <Link
      href="/dashboard/documents/add"
      className="hover:border-[var(--gold)] transition-colors duration-200"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        background: 'transparent',
        border: '2px dashed var(--border)',
        borderRadius: 16,
        padding: 24,
        minHeight: 148,
        textDecoration: 'none',
      }}
    >
      <div style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'var(--surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Plus size={18} color="var(--text-tertiary)" />
      </div>
      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-tertiary)', margin: 0 }}>
        Add document
      </p>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [
    { data: profile },
    { data: docs },
    { data: apps },
    { data: alerts },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('alerts').select('*').eq('user_id', user.id).is('read_at', null).order('created_at', { ascending: false }),
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const unreadAlerts = alerts?.length ?? 0

  const topBarActions = (
    <Link href="/apply" className="btn-gold" style={{ height: 40, fontSize: 14, padding: '0 18px' }}>
      + New application
    </Link>
  )

  return (
    <DashboardShell activePage="dashboard" pageTitle="Dashboard" topBarActions={topBarActions}>

      {/* ── Alert banner ─────────────────────────────── */}
      {unreadAlerts > 0 && alerts && alerts[0] && (
        <div
          style={{
            background: 'var(--warning-bg)',
            border: '1px solid rgba(217,119,6,0.25)',
            borderRadius: 14,
            padding: '14px 18px',
            marginBottom: 28,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <AlertTriangle size={18} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--warning)', margin: 0 }}>
              {alerts[0].message}
            </p>
            {unreadAlerts > 1 && (
              <p style={{ fontSize: 12, color: 'var(--warning)', margin: '2px 0 0', opacity: 0.8 }}>
                +{unreadAlerts - 1} more alert{unreadAlerts > 2 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/dashboard/alerts"
              style={{ fontSize: 13, fontWeight: 600, color: 'var(--warning)', textDecoration: 'none' }}
            >
              View all →
            </Link>
            <AlertDismiss alertId={alerts[0].id} />
          </div>
        </div>
      )}

      {/* ── Welcome ──────────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 28,
          color: 'var(--navy)',
          margin: '0 0 6px',
        }}>
          Welcome back, {firstName}.
        </h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: 0 }}>
          Your document locker and applications, all in one place.
        </p>
      </div>

      {/* ── Document Locker ───────────────────────────── */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 18,
            color: 'var(--text-primary)',
            margin: 0,
          }}>
            Document Locker
          </h3>
          <Link
            href="/dashboard/documents/add"
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 600, color: 'var(--navy-mid)', textDecoration: 'none' }}
          >
            <Plus size={15} /> Add document
          </Link>
        </div>

        {!docs || docs.length === 0 ? (
          <div style={{
            background: 'white',
            border: '2px dashed var(--border)',
            borderRadius: 16,
            padding: '48px 32px',
            textAlign: 'center',
          }}>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 17,
              color: 'var(--text-secondary)',
              margin: '0 0 8px',
            }}>
              Your locker is ready.
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-tertiary)', margin: '0 0 24px', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
              Add your Indian passport and OCI card so AVA can monitor everything and pre-fill your next application automatically.
            </p>
            <Link href="/dashboard/documents/add" className="btn-navy" style={{ height: 44, fontSize: 14, padding: '0 22px' }}>
              Add your first document
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}>
            {docs.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={{
                  id: doc.id,
                  doc_type: doc.doc_type,
                  expires_at: doc.expires_at,
                  extracted_data: doc.extracted_data as Record<string, string> | null,
                }}
              />
            ))}
            <AddDocumentCard />
          </div>
        )}
      </section>

      {/* ── Applications ─────────────────────────────── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 18,
            color: 'var(--text-primary)',
            margin: 0,
          }}>
            Applications
          </h3>
          <Link
            href="/apply"
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 600, color: 'var(--navy-mid)', textDecoration: 'none' }}
          >
            <Plus size={15} /> New application
          </Link>
        </div>

        {!apps || apps.length === 0 ? (
          <div style={{
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '24px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                Ready to apply for your OCI card?
              </p>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
                AVA has everything she needs from your locker.
              </p>
            </div>
            <Link href="/apply" className="btn-gold" style={{ height: 40, fontSize: 14, padding: '0 18px', flexShrink: 0 }}>
              Start now →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {apps.slice(0, 5).map((app) => (
              <Link
                key={app.id}
                href={`/apply/status?id=${app.id}`}
                style={{
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  boxShadow: 'var(--shadow-sm)',
                  textDecoration: 'none',
                  transition: 'box-shadow 200ms ease',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', margin: '0 0 3px' }}>
                    {SERVICE_LABELS[app.service_type] ?? app.service_type}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                    {new Date(app.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <StatusBadge status={app.status} />
                  <ChevronRight size={16} color="var(--text-tertiary)" />
                </div>
              </Link>
            ))}
            {apps.length > 5 && (
              <Link
                href="/dashboard/applications"
                style={{ textAlign: 'center', fontSize: 14, color: 'var(--navy-mid)', fontWeight: 600, textDecoration: 'none', padding: '8px 0' }}
              >
                View all {apps.length} applications →
              </Link>
            )}
          </div>
        )}
      </section>
    </DashboardShell>
  )
}
