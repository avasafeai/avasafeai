'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import Logo from '@/components/Logo'

const STATE_VFS_ADDRESSES: Record<string, { center: string; address: string }> = {
  TX: { center: 'Houston', address: '9800 Richmond Ave, Suite 235, Houston, TX 77042' },
  OK: { center: 'Houston', address: '9800 Richmond Ave, Suite 235, Houston, TX 77042' },
  CA: { center: 'San Francisco', address: '150 Pelican Way, San Rafael, CA 94901' },
  NY: { center: 'New York', address: '895 Broadway, 4th Floor, New York, NY 10003' },
  NJ: { center: 'New York', address: '895 Broadway, 4th Floor, New York, NY 10003' },
  IL: { center: 'Chicago', address: '180 N Michigan Ave, Suite 910, Chicago, IL 60601' },
  GA: { center: 'Atlanta', address: 'One Alliance Center, Suite 650, 3500 Lenox Rd NE, Atlanta, GA 30326' },
  FL: { center: 'Atlanta', address: 'One Alliance Center, Suite 650, 3500 Lenox Rd NE, Atlanta, GA 30326' },
  DC: { center: 'Washington DC', address: '1025 Vermont Ave NW, Suite 302, Washington, DC 20005' },
  VA: { center: 'Atlanta', address: 'One Alliance Center, Suite 650, 3500 Lenox Rd NE, Atlanta, GA 30326' },
  WA: { center: 'San Francisco', address: '150 Pelican Way, San Rafael, CA 94901' },
}

const FALLBACK_VFS = { center: 'San Francisco', address: '150 Pelican Way, San Rafael, CA 94901' }

const UPLOAD_DOCS = [
  { label: 'Completed OCI application form', category: 'Application Form', note: 'Download from the package below' },
  { label: 'US passport (bio data page)', category: 'Current Passport', note: 'Clear colour copy' },
  { label: 'Old Indian passport OR parent\'s Indian passport', category: 'Old Passport', note: 'Evidence of Indian origin' },
  { label: 'US address proof', category: 'Address Proof', note: 'Dated within 3 months' },
  { label: 'Passport-style photo', category: 'Photo', note: 'Square JPEG, white background' },
]

interface VFSStep { id: number; title: string; done: boolean }

export default function SubmitVFSPage() {
  const router = useRouter()
  const [steps, setSteps] = useState<VFSStep[]>([
    { id: 1, title: 'Create VFS account or log in', done: false },
    { id: 2, title: 'Upload application form PDF', done: false },
    { id: 3, title: 'Upload supporting documents', done: false },
    { id: 4, title: 'Select service and pay VFS fee', done: false },
    { id: 5, title: 'Generate shipping label', done: false },
  ])
  const [activeStep, setActiveStep] = useState(1)
  const [vfsAddress, setVfsAddress] = useState(FALLBACK_VFS)
  const [email, setEmail] = useState('')
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Open VFS portal in right-half window
    const w = window.screen.availWidth
    const h = window.screen.availHeight
    window.open(
      'https://services.vfsglobal.com/usa/en/ind',
      'vfs_portal',
      `width=${Math.floor(w / 2)},height=${h},left=${Math.floor(w / 2)},top=0`
    )

    // Get user's state for VFS address
    const stored = sessionStorage.getItem('form_data')
    if (stored) {
      try {
        const fd = JSON.parse(stored) as Record<string, string>
        const state = fd.address_state?.toUpperCase()
        if (state && STATE_VFS_ADDRESSES[state]) {
          setVfsAddress(STATE_VFS_ADDRESSES[state])
        }
        setEmail(fd.email ?? '')
      } catch { /* ignore */ }
    }
  }, [])

  function markStepDone(id: number) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, done: true } : s))
    if (id < 5) setActiveStep(id + 1)
  }

  async function downloadApplicationForm() {
    setGeneratingPdf(true)
    const appId = sessionStorage.getItem('application_id')
    if (!appId) { setGeneratingPdf(false); return }
    try {
      const res = await fetch(`/api/generate-package?application_id=${appId}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'avasafe-application-package.pdf'
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch { /* ignore */ }
    setGeneratingPdf(false)
  }

  async function handleVFSComplete() {
    setSubmitting(true)
    const appId = sessionStorage.getItem('application_id')
    if (appId) {
      await fetch('/api/update-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: appId, vfs_submitted: true }),
      }).catch(() => {})
    }
    router.push('/apply/package')
  }

  const allDone = steps.every(s => s.done)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off-white)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 2, background: 'var(--border)' }}>
        <div style={{ height: '100%', width: '90%', background: 'var(--navy)' }} />
      </div>

      <header style={{ height: 64, background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
        <Logo size="sm" href="/dashboard" onDark />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>VFS Registration</span>
        <div style={{ width: 80 }} />
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', width: '100%', padding: '32px 24px 80px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 24, color: 'var(--navy)', marginBottom: 8 }}>VFS portal registration</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Complete these 5 steps on the VFS portal that just opened. Check each one off as you go.
          </p>
        </div>

        {/* Step 1 — VFS account */}
        <StepCard step={1} title={steps[0].title} done={steps[0].done} active={activeStep === 1} onDone={() => markStepDone(1)}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
            Create a new VFS account using your email address:
          </p>
          <div style={{ background: 'var(--off-white)', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--navy)', marginBottom: 12 }}>{email || 'your email address'}</div>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Use a different password from your Avasafe account.</p>
        </StepCard>

        {/* Step 2 — Upload application form */}
        <StepCard step={2} title={steps[1].title} done={steps[1].done} active={activeStep === 2} onDone={() => markStepDone(2)}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
            Download your generated application form and upload it to VFS under &ldquo;Application Form&rdquo;.
          </p>
          <button
            onClick={downloadApplicationForm}
            disabled={generatingPdf}
            className="btn-navy"
            style={{ height: 40, padding: '0 18px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            {generatingPdf ? 'Generating…' : 'Download application form PDF'}
          </button>
        </StepCard>

        {/* Step 3 — Upload documents */}
        <StepCard step={3} title={steps[2].title} done={steps[2].done} active={activeStep === 3} onDone={() => markStepDone(3)}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
            Upload each of these documents to the correct VFS category:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {UPLOAD_DOCS.map(doc => (
              <div key={doc.label} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: 'var(--off-white)', borderRadius: 10 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{doc.label}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{doc.note}</p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)', background: 'rgba(15,45,82,0.08)', borderRadius: 6, padding: '2px 8px', whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>{doc.category}</span>
              </div>
            ))}
          </div>
        </StepCard>

        {/* Step 4 — Pay VFS fee */}
        <StepCard step={4} title={steps[3].title} done={steps[3].done} active={activeStep === 4} onDone={() => markStepDone(4)}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
            Select <strong>OCI — New Application</strong> and pay the VFS service fee. VFS accepts credit/debit cards.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Fee: approximately $25–$60 depending on service level.</p>
        </StepCard>

        {/* Step 5 — Shipping label */}
        <StepCard step={5} title={steps[4].title} done={steps[4].done} active={activeStep === 5} onDone={() => markStepDone(5)}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
            Generate your UPS shipping label on VFS. Mail to your assigned centre:
          </p>
          <div style={{ background: 'var(--navy)', borderRadius: 10, padding: '14px 18px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>VFS {vfsAddress.center}</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'white', lineHeight: 1.6 }}>{vfsAddress.address}</p>
          </div>
        </StepCard>

        {/* Continue button */}
        <div style={{ marginTop: 24 }}>
          <button
            onClick={handleVFSComplete}
            disabled={submitting}
            className="btn-gold"
            style={{ width: '100%', height: 52, borderRadius: 12, fontSize: 15, opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? 'Saving…' : "I've submitted to VFS — generate my package →"}
          </button>
          {!allDone && (
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)', marginTop: 10 }}>
              Check off all 5 steps above before continuing (or click to continue anyway)
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function StepCard({ step, title, done, active, onDone, children }: {
  step: number; title: string; done: boolean; active: boolean
  onDone: () => void; children?: React.ReactNode
}) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, marginBottom: 12, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: done ? 'var(--success)' : active ? 'var(--navy)' : 'var(--surface)', border: done ? 'none' : active ? 'none' : '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {done
            ? <CheckCircle size={16} color="white" />
            : <span style={{ fontSize: 13, fontWeight: 700, color: active ? 'white' : 'var(--text-tertiary)' }}>{step}</span>
          }
        </div>
        <p style={{ flex: 1, fontSize: 15, fontWeight: 600, color: done ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{title}</p>
        {!done && (
          <button onClick={onDone} style={{ height: 30, padding: '0 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--off-white)', fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            Done ✓
          </button>
        )}
      </div>
      {active && !done && children && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ paddingTop: 16 }}>{children}</div>
        </div>
      )}
    </div>
  )
}
