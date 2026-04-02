import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canApply } from '@/lib/plan-utils'
import type { Plan } from '@/lib/plan-utils'
import DashboardShell from '@/components/DashboardShell'
import UpgradePrompt from '@/components/UpgradePrompt'

export default async function ApplyLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .maybeSingle()

  const plan = ((profile?.plan) ?? 'free') as Plan

  if (!canApply(plan)) {
    return (
      <DashboardShell activePage="applications" pageTitle="Applications">
        <UpgradePrompt
          title="Application preparation is a paid feature"
          body="Let AVA prepare your complete OCI or passport renewal application automatically. Available on Locker + Apply — $49 per year."
          buttonText="Upgrade to Locker + Apply"
          targetPlan="apply"
        />
      </DashboardShell>
    )
  }

  return <>{children}</>
}
