'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check } from 'lucide-react'

export default function MarkReadButton({ alertId }: { alertId: string }) {
  const router = useRouter()

  async function mark() {
    const supabase = createClient()
    await supabase.from('alerts').update({ read_at: new Date().toISOString() }).eq('id', alertId)
    router.refresh()
  }

  return (
    <button onClick={mark}
      title="Mark as read"
      style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-tertiary)', flexShrink: 0 }}>
      <Check size={13} /> Done
    </button>
  )
}
