import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  FileText, AlertTriangle, Plus,
  ShieldCheck, Globe, CreditCard, Image, PenLine,
  MapPin, BookOpen, RotateCcw,
} from 'lucide-react'
import DashboardShell from '@/components/DashboardShell'
import AlertDismiss from './AlertDismiss'
import { getResumeUrl } from '@/lib/plan-utils'
import { getService } from '@/lib/services/registry'

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

function getTotalSteps(serviceType: string): number {
  return getService(serviceType)?.form_steps ?? 13
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
  // Safety guard: only show apps that belong to the authenticated user
  const inProgressApps = apps?.filter(a =>
    a.user_id === user.id && a.status === 'in_progress' && a.stripe_payment_id
  ) ?? []

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

      {/* ── In-progress applications ─────────────────── */}
      {inProgressApps.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--text-primary)', margin: '0 0 16px' }}>
            Your applications
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {inProgressApps.map((app) => {
              const currentStep = (app.current_step as number | null) ?? 0
              const totalSteps = getTotalSteps(app.service_type)
              const progressPct = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0
              const startedAt = new Date(app.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
              const tier = app.tier as string | null
              const isExpert = tier === 'human_assisted'
              const resumeUrl = getResumeUrl({ id: app.id, service_type: app.service_type, tier })
              return (
                <div
                  key={app.id}
                  style={{
                    background: 'white',
                    border: '2px solid var(--gold)',
                    borderRadius: 16,
                    padding: '20px 24px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--navy)', margin: 0 }}>
                          {getService(app.service_type)?.name ?? app.service_type}
                        </p>
                        {tier && (
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                            background: isExpert ? 'rgba(15,45,82,0.08)' : 'var(--gold-subtle)',
                            color: isExpert ? 'var(--navy)' : 'var(--gold)',
                          }}>
                            {isExpert ? 'Expert Session' : 'Guided'}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>
                        Started {startedAt}
                      </p>
                    </div>
                    <span className="badge" style={{ background: 'var(--gold-subtle)', color: 'var(--gold)', flexShrink: 0 }}>
                      In progress
                    </span>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        {currentStep === 0 ? 'Ready to start' : `Step ${currentStep} of ${totalSteps}`}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        {currentStep === 0 ? 'Tap Resume to begin' : `${progressPct}%`}
                      </span>
                    </div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 100 }}>
                      <div style={{ height: '100%', background: 'var(--gold)', borderRadius: 100, width: `${progressPct}%` }} />
                    </div>
                  </div>
                  <Link
                    href={resumeUrl}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      width: '100%', height: 44, borderRadius: 12,
                      background: isExpert ? 'var(--navy)' : 'var(--gold)', color: 'white',
                      fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
                      textDecoration: 'none',
                    }}
                  >
                    <RotateCcw size={15} />
                    {isExpert ? 'Prepare for session →' : 'Resume →'}
                  </Link>
                </div>
              )
            })}
          </div>
        </section>
      )}

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

    </DashboardShell>
  )
}
