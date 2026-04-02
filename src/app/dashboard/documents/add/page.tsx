import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canAddDocument } from '@/lib/plan-utils'
import type { Plan } from '@/lib/plan-utils'
import UpgradePrompt from '@/components/UpgradePrompt'
import DashboardShell from '@/components/DashboardShell'
import AddDocumentForm from './AddDocumentForm'

export default async function AddDocumentPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [profileRes, countRes] = await Promise.all([
    supabase.from('profiles').select('plan').eq('id', user.id).single(),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const plan = ((profileRes.data?.plan) ?? 'free') as Plan
  const docCount = countRes.count ?? 0

  if (!canAddDocument(plan, docCount)) {
    return (
      <DashboardShell activePage="documents" pageTitle="Add Document">
        <UpgradePrompt
          title="You have reached your free limit"
          body="Free accounts can store up to 3 documents. Upgrade to Locker for unlimited storage and smart expiry alerts — just $19 per year."
          buttonText="Upgrade to Locker"
          targetPlan="locker"
        />
      </DashboardShell>
    )
  }

  return <AddDocumentForm />
}
