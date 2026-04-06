'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// Clears cached per-user data from storage whenever the auth state changes.
// Prevents data from a previous user session leaking into a new one.
export default function AuthStateListener() {
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        // New login — clear any data left from a previous session
        sessionStorage.clear()
      }
      if (event === 'SIGNED_OUT') {
        localStorage.clear()
        sessionStorage.clear()
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return null
}
