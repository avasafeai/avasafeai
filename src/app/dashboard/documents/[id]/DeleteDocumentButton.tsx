'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeleteDocumentButton({ documentId }: { documentId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('documents').delete().eq('id', documentId)
    router.push('/dashboard/documents')
  }

  if (confirming) {
    return (
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setConfirming(false)} className="btn-ghost" style={{ fontSize: 14, height: 40, padding: '0 16px' }}>
          Cancel
        </button>
        <button onClick={handleDelete} disabled={deleting}
          style={{ background: 'var(--error)', color: 'white', border: 'none', borderRadius: 10, padding: '0 20px', height: 40, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: deleting ? 0.6 : 1 }}>
          {deleting ? 'Deleting…' : 'Yes, delete it'}
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)}
      style={{ background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '0 16px', height: 40, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
      Delete document
    </button>
  )
}
