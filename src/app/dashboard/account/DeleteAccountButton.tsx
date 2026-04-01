'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeleteAccountButton() {
  const router = useRouter()
  const [stage, setStage] = useState<'idle' | 'confirm' | 'deleting'>('idle')
  const [input, setInput] = useState('')

  async function handleDelete() {
    if (input !== 'DELETE') return
    setStage('deleting')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    // Delete user data in order
    await supabase.from('alerts').delete().eq('user_id', user.id)
    await supabase.from('applications').delete().eq('user_id', user.id)
    await supabase.from('documents').delete().eq('user_id', user.id)
    await supabase.from('profiles').delete().eq('id', user.id)
    await supabase.auth.signOut()
    router.push('/')
  }

  if (stage === 'idle') {
    return (
      <button onClick={() => setStage('confirm')}
        style={{ background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '0 18px', height: 40, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
        Delete my account
      </button>
    )
  }

  if (stage === 'confirm') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Type <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--error)' }}>DELETE</strong> to confirm. This cannot be undone.
        </p>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type DELETE"
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 15, height: 44,
            border: '1.5px solid rgba(220,38,38,0.4)', borderRadius: 10,
            padding: '0 14px', outline: 'none', color: 'var(--error)',
            background: 'var(--error-bg)', width: '100%', boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { setStage('idle'); setInput('') }}
            style={{ flex: 1, height: 40, border: '1px solid var(--border)', borderRadius: 10, background: 'white', fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleDelete} disabled={input !== 'DELETE'}
            style={{
              flex: 1, height: 40, borderRadius: 10, border: 'none', fontSize: 14,
              fontWeight: 600, cursor: input !== 'DELETE' ? 'not-allowed' : 'pointer',
              background: input === 'DELETE' ? 'var(--error)' : 'rgba(220,38,38,0.3)',
              color: 'white', transition: 'background 200ms',
            }}>
            Permanently delete
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--error)', opacity: 0.6,
            animation: 'bounce 1.2s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <span style={{ fontSize: 14, color: 'var(--error)' }}>Deleting your account…</span>
    </div>
  )
}
