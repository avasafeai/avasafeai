'use client'

import { useState, useEffect, useRef } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface MaskedFieldProps {
  value: string
  revealAll?: boolean
  isMonospace?: boolean
}

const AUTO_HIDE_SECONDS = 30

function maskValue(value: string): string {
  if (value.length <= 2) return '•'.repeat(value.length)
  return '•'.repeat(Math.max(value.length - 2, 5)) + value.slice(-2)
}

export default function MaskedField({ value, revealAll = false, isMonospace = false }: MaskedFieldProps) {
  const [revealed, setRevealed] = useState(false)
  const [countdown, setCountdown] = useState(AUTO_HIDE_SECONDS)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isVisible = revealAll || revealed

  useEffect(() => {
    if (revealAll) {
      setRevealed(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [revealAll])

  useEffect(() => {
    if (revealed && !revealAll) {
      setCountdown(AUTO_HIDE_SECONDS)
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            setRevealed(false)
            return AUTO_HIDE_SECONDS
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [revealed, revealAll])

  function toggle() {
    if (revealAll) return
    if (timerRef.current) clearInterval(timerRef.current)
    setRevealed(prev => !prev)
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          fontFamily: isMonospace ? 'var(--font-mono)' : 'var(--font-body)',
          fontSize: 15,
          color: 'var(--text-primary)',
          letterSpacing: isVisible ? 'normal' : '0.08em',
        }}
      >
        {isVisible ? value : maskValue(value)}
      </span>
      {!revealAll && (
        <button
          onClick={toggle}
          title={revealed ? 'Hide' : 'Show'}
          style={{
            background: 'none',
            border: 'none',
            padding: 2,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            color: 'var(--text-tertiary)',
            flexShrink: 0,
          }}
        >
          {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      )}
      {revealed && !revealAll && (
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          {countdown}s
        </span>
      )}
    </span>
  )
}
