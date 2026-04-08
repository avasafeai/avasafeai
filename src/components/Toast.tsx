'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { _registerToastCallback, ToastType } from '@/lib/toast'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

const STYLES: Record<ToastType, { bg: string; border: string; color: string; icon: React.ReactNode }> = {
  error:   { bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C', icon: <XCircle size={16} color="#B91C1C" style={{ flexShrink: 0 }} /> },
  success: { bg: '#F0FFF4', border: '#BBF7D0', color: '#1A6B3A', icon: <CheckCircle size={16} color="#1A6B3A" style={{ flexShrink: 0 }} /> },
  warning: { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E', icon: <AlertCircle size={16} color="#92400E" style={{ flexShrink: 0 }} /> },
  info:    { bg: '#EFF6FF', border: '#BFDBFE', color: '#1E40AF', icon: <Info size={16} color="#1E40AF" style={{ flexShrink: 0 }} /> },
}

let nextId = 0

export default function Toast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = ++nextId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => dismiss(id), 4000)
  }, [dismiss])

  useEffect(() => {
    _registerToastCallback(addToast)
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      alignItems: 'center',
      pointerEvents: 'none',
    }}>
      {toasts.map(t => {
        const s = STYLES[t.type]
        return (
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: '12px 14px',
              maxWidth: 360,
              width: 'max-content',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              pointerEvents: 'all',
            }}
          >
            {s.icon}
            <span style={{ fontSize: 14, color: s.color, fontFamily: 'var(--font-body)', lineHeight: 1.4, flex: 1 }}>
              {t.message}
            </span>
            <button
              onClick={() => dismiss(t.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, flexShrink: 0, color: s.color, opacity: 0.6,
                display: 'flex', alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
