'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SidebarSignOutProps {
  email: string
}

export default function SidebarSignOut({ email }: SidebarSignOutProps) {
  const supabase = createClient()
  const [hovering, setHovering] = useState(false)
  const [loading, setLoading] = useState(false)

  const initial = (email[0] ?? '?').toUpperCase()

  async function handleSignOut() {
    setLoading(true)
    await supabase.auth.signOut()
    localStorage.clear()
    sessionStorage.clear()
    window.location.href = '/'
  }

  return (
    <div style={{ padding: '12px 12px 20px' }}>
      {/* User row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', marginBottom: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'var(--navy-mid, #0F2D52)',
          border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'white' }}>
            {initial}
          </span>
        </div>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          color: 'var(--text-tertiary, rgba(255,255,255,0.4))',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
        }}>
          {email}
        </span>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />

      {/* Sign out button */}
      <button
        onClick={handleSignOut}
        disabled={loading}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          borderRadius: 10,
          border: 'none',
          background: hovering ? 'rgba(220,38,38,0.08)' : 'transparent',
          color: hovering ? '#DC2626' : 'rgba(255,255,255,0.5)',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          fontWeight: 400,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          transition: 'background 150ms ease, color 150ms ease',
          textAlign: 'left',
        }}
      >
        <LogOut
          size={18}
          color={hovering ? '#DC2626' : 'rgba(255,255,255,0.5)'}
          style={{ flexShrink: 0, transition: 'color 150ms ease' }}
        />
        {loading ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  )
}
