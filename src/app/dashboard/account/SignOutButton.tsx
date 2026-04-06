'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const supabase = createClient()
  const [hovering, setHovering] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    await supabase.auth.signOut()
    localStorage.clear()
    sessionStorage.clear()
    window.location.href = '/'
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        height: 40,
        padding: '0 20px',
        borderRadius: 8,
        border: `1.5px solid ${hovering ? '#DC2626' : 'var(--border)'}`,
        background: 'white',
        color: hovering ? '#DC2626' : 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        fontWeight: 500,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
        transition: 'border-color 150ms ease, color 150ms ease',
      }}
    >
      <LogOut
        size={16}
        color={hovering ? '#DC2626' : 'var(--text-primary)'}
        style={{ transition: 'color 150ms ease' }}
      />
      {loading ? 'Signing out…' : 'Sign out of Avasafe'}
    </button>
  )
}
