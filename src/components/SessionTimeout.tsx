'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const SESSION_TIMEOUT_MS = 30 * 60 * 1000
const WARNING_BEFORE_MS = 2 * 60 * 1000

export function SessionTimeout() {
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(120)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  const resetTimer = () => {
    setShowWarning(false)
    setCountdown(120)

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)

    warningRef.current = setTimeout(() => {
      setShowWarning(true)
    }, SESSION_TIMEOUT_MS - WARNING_BEFORE_MS)

    timeoutRef.current = setTimeout(async () => {
      await supabase.auth.signOut()
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/auth?reason=timeout'
    }, SESSION_TIMEOUT_MS)
  }

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach(event => window.addEventListener(event, resetTimer))
    resetTimer()
    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer))
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!showWarning) return
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [showWarning])

  if (!showWarning) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      background: '#0F2D52',
      color: 'white',
      padding: '16px 20px',
      borderRadius: 12,
      boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
      zIndex: 9999,
      maxWidth: 320,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>🔒</span>
        <p style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'white' }}>
          Session expiring
        </p>
      </div>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.5 }}>
        For your security your session will expire in {countdown} seconds.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={resetTimer}
          style={{
            flex: 1, background: '#C9882A', color: 'white',
            border: 'none', borderRadius: 8, padding: 8,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Stay signed in
        </button>
        <button
          onClick={async () => {
            await supabase.auth.signOut()
            localStorage.clear()
            sessionStorage.clear()
            window.location.href = '/'
          }}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white',
            border: 'none', borderRadius: 8, padding: 8,
            fontSize: 13, cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
