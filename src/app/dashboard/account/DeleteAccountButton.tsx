'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeleteAccountButton() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  const confirmed = input === 'DELETE'

  async function handleDelete() {
    if (!confirmed) return
    setDeleting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    await supabase.from('alerts').delete().eq('user_id', user.id)
    await supabase.from('applications').delete().eq('user_id', user.id)
    await supabase.from('documents').delete().eq('user_id', user.id)
    await supabase.from('profiles').delete().eq('id', user.id)
    await supabase.auth.signOut()
    localStorage.clear()
    sessionStorage.clear()
    window.location.href = '/'
  }

  if (deleting) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--error)', opacity: 0.6,
              animation: 'bounce 1.2s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <span style={{ fontSize: 14, color: 'var(--error)' }}>Deleting your account…</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
        Type <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--error)' }}>DELETE</strong> to confirm. This cannot be undone.
      </p>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Type DELETE to confirm"
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 15, height: 44,
          border: `1.5px solid ${confirmed ? 'var(--error)' : 'rgba(220,38,38,0.3)'}`,
          borderRadius: 10, padding: '0 14px', outline: 'none',
          color: 'var(--error)', background: 'var(--error-bg)',
          width: '100%', boxSizing: 'border-box',
          transition: 'border-color 150ms ease',
        }}
      />
      <button
        onClick={handleDelete}
        disabled={!confirmed}
        style={{
          height: 40, borderRadius: 10, border: 'none', fontSize: 14,
          fontWeight: 600, cursor: confirmed ? 'pointer' : 'not-allowed',
          background: confirmed ? '#DC2626' : 'rgba(220,38,38,0.3)',
          color: 'white', transition: 'background 200ms',
          alignSelf: 'flex-start', padding: '0 18px',
        }}
      >
        Delete my account permanently
      </button>
    </div>
  )
}
