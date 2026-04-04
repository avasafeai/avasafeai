import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SessionTimeout } from '@/components/SessionTimeout'

// Plan checking happens inside ServiceCards on /apply — layout just guards auth
export default async function ApplyLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  return (
    <>
      {children}
      <SessionTimeout />
    </>
  )
}
