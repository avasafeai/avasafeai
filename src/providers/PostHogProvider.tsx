'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import posthog from 'posthog-js'
import { initAnalytics, resetAnalytics } from '@/lib/analytics'
import { createClient } from '@/lib/supabase/client'

export { resetAnalytics }

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Init once on mount — identify user if logged in
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      initAnalytics(user?.id, user?.email)
    })
  }, [])

  // Track pageview on every route change
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
    posthog.capture('$pageview')
  }, [pathname])

  return <>{children}</>
}
