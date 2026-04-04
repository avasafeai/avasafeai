'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, X } from 'lucide-react'

interface RequirementsAlertProps {
  serviceId: string
  summary: string
}

export default function RequirementsAlert({ serviceId, summary }: RequirementsAlertProps) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const key = `req_alert_dismissed_${serviceId}`
    if (localStorage.getItem(key) === summary) {
      setDismissed(true)
    }
  }, [serviceId, summary])

  function dismiss() {
    const key = `req_alert_dismissed_${serviceId}`
    localStorage.setItem(key, summary)
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <div style={{
      background: 'var(--warning-bg)',
      border: '1px solid #F59E0B',
      borderRadius: 12,
      padding: '14px 16px',
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
      marginBottom: 16,
    }}>
      <AlertCircle size={18} color="#92400E" style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, fontSize: 14, color: '#92400E', marginBottom: 2 }}>
          Requirements may have changed
        </p>
        <p style={{ fontSize: 13, color: '#78350F', lineHeight: 1.5 }}>{summary}</p>
      </div>
      <button
        onClick={dismiss}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0, color: '#92400E' }}
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  )
}
