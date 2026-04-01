'use client'

import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AlertDismiss({ alertId }: { alertId: string }) {
  const router = useRouter()

  async function handleDismiss(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const supabase = createClient()
    await supabase
      .from('alerts')
      .update({ read_at: new Date().toISOString() })
      .eq('id', alertId)
    router.refresh()
  }

  return (
    <button
      onClick={handleDismiss}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--warning)',
        opacity: 0.6,
        borderRadius: 6,
      }}
      aria-label="Dismiss alert"
    >
      <X size={16} />
    </button>
  )
}
