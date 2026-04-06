import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AvaMessage from '@/components/AvaMessage'
import Logo from '@/components/Logo'
import ServiceCards from './ServiceCards'

export default async function ApplyPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: inProgressApps } = await supabase
    .from('applications')
    .select('id, service_type, tier, current_step, created_at, status')
    .eq('user_id', user.id)
    .eq('status', 'in_progress')
    .not('stripe_payment_id', 'is', null)
    .order('created_at', { ascending: false })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off-white)' }}>
      <header style={{ height: 64, background: 'white', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <Logo size="md" />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-tertiary)' }}>
          Choose service
        </span>
      </header>

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px 80px' }}>
        <AvaMessage
          message="I already have most of what I need from your documents. Which application would you like me to prepare?"
          className="mb-8"
        />

        <ServiceCards inProgressApps={inProgressApps ?? []} />

        <p style={{ marginTop: 32, fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center' }}>
          Not sure which to choose?{' '}
          <a href="mailto:support@avasafe.ai" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Ask us</a>
        </p>
      </main>
    </div>
  )
}
