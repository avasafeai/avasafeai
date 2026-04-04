'use client'

import { useState, useEffect } from 'react'
import { Download, CheckCircle, Package, Truck, Loader2 } from 'lucide-react'
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

export default function PackagePage() {
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [vfsInfo, setVfsInfo] = useState(FALLBACK_VFS)
  const [appId, setAppId] = useState<string | null>(null)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [savingTracking, setSavingTracking] = useState(false)
  const [trackingSaved, setTrackingSaved] = useState(false)

  useEffect(() => {
    const id = sessionStorage.getItem('application_id')
    setAppId(id)
    const stored = sessionStorage.getItem('form_data')
    if (stored) {
      try {
        const fd = JSON.parse(stored) as Record<string, string>
        const state = fd.address_state?.toUpperCase()
        if (state && STATE_VFS_ADDRESSES[state]) {
          setVfsInfo(STATE_VFS_ADDRESSES[state])
        }
      } catch { /* ignore */ }
    }
  }, [])

  async function downloadPackage() {
    if (!appId) return
    setDownloading(true)
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
        setDownloaded(true)
      }
    } catch { /* ignore */ }
    setDownloading(false)
  }

  async function saveTracking() {
    if (!trackingNumber.trim() || !appId) return
    setSavingTracking(true)
    await fetch('/api/update-application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: appId, tracking_number: trackingNumber }),
    }).catch(() => {})
    setSavingTracking(false)
    setTrackingSaved(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off-white)', display: 'flex', flexDirection: 'column' }}>
      {/* Progress bar — full */}
      <div style={{ height: 2, background: 'var(--border)' }}>
        <div style={{ height: '100%', width: '100%', background: 'var(--navy)' }} />
      </div>

      <header style={{ height: 64, background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
        <Logo size="sm" href="/dashboard" onDark />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Your Package</span>
        <div style={{ width: 80 }} />
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', width: '100%', padding: '32px 24px 80px' }}>

        {/* AVA message */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderLeft: '3px solid var(--gold)', borderRadius: 16, padding: 24, marginBottom: 28, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>A</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--gold)' }}>AVA</span>
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 17, color: 'var(--text-primary)', lineHeight: 1.6 }}>
            Everything is ready to mail. Download your package, sign where marked, and drop it at any UPS location.
          </p>
        </div>

        {/* Download card */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 28, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: downloaded ? 'var(--success)' : 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {downloaded ? <CheckCircle size={22} color="white" /> : <Download size={20} color="white" />}
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--navy)', marginBottom: 4 }}>
                {downloaded ? 'Package downloaded ✓' : 'Download your application package'}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Print · Sign where marked ★ · Mail</p>
            </div>
          </div>

          {/* Package contents */}
          <div style={{ background: 'var(--off-white)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 12 }}>Package contents</p>
            {[
              'Pre-filled OCI application form',
              '4 passport-style photo placeholders',
              'Document checklist with sign markers',
              'Supporting document instructions',
              'Pre-addressed UPS shipping label',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <CheckCircle size={13} color="var(--success)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{item}</span>
              </div>
            ))}
          </div>

          <button
            onClick={downloadPackage}
            disabled={downloading || !appId}
            className="btn-gold"
            style={{ height: 52, padding: '0 28px', fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 10, borderRadius: 12, opacity: downloading ? 0.7 : 1 }}
          >
            {downloading ? (
              <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Generating PDF…</>
            ) : downloaded ? (
              <><CheckCircle size={18} /> Download again</>
            ) : (
              <><Download size={18} /> Download package (PDF)</>
            )}
          </button>
        </div>

        {/* UPS drop-off instructions */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 28, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Truck size={20} color="white" />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--navy)', marginBottom: 4 }}>Drop at any UPS location</p>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>About 5 minutes. No appointment needed.</p>
            </div>
          </div>

          <div style={{ background: 'var(--navy)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
              Mail to: VFS {vfsInfo.center}
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'white', lineHeight: 1.7 }}>{vfsInfo.address}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Print all pages of the PDF',
              'Sign the application form where marked with ★',
              'Place all documents in a 9×12 manila envelope',
              'Affix the pre-addressed UPS label from the last page',
              'Drop at any UPS Store — keep your tracking number',
            ].map((step, i) => (
              <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{i + 1}</span>
                </div>
                <span style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tracking number input */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Package size={16} color="var(--text-tertiary)" />
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Add your UPS tracking number</p>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
            AVA will monitor your shipment and update your application status automatically.
          </p>
          {trackingSaved ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success)', fontSize: 14, fontWeight: 500 }}>
              <CheckCircle size={16} /> Tracking number saved — AVA is watching your shipment.
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                placeholder="1Z..."
                style={{ flex: 1, height: 44, borderRadius: 10, border: '1.5px solid var(--border)', padding: '0 14px', fontSize: 14, fontFamily: 'var(--font-mono)' }}
              />
              <button
                onClick={saveTracking}
                disabled={!trackingNumber.trim() || savingTracking}
                className="btn-navy"
                style={{ height: 44, padding: '0 20px', borderRadius: 10, fontSize: 14, opacity: !trackingNumber.trim() ? 0.4 : 1 }}
              >
                {savingTracking ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {/* View status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
          <CheckCircle size={16} color="var(--success)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            AVA will notify you at every step.{' '}
            <a href={appId ? `/apply/status?id=${appId}` : '/apply/status'} style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>
              View application status →
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
