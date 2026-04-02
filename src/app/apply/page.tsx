import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AvaMessage from '@/components/AvaMessage'
import Logo from '@/components/Logo'
import { FileText, Award, ScrollText } from 'lucide-react'
import ServiceCards from './ServiceCards'

const SERVICES = [
  {
    id: 'oci_new',
    title: 'OCI Card (New Application)',
    desc: 'First-time OCI card for Indian-origin US citizens and residents.',
    fee: '$29 Avasafe fee',
    govFee: '$275 govt. fee',
    icon: Award,
  },
  {
    id: 'oci_renewal',
    title: 'OCI Card (Renewal)',
    desc: 'Renew your OCI card after a new passport or name change.',
    fee: '$29 Avasafe fee',
    govFee: '$25 govt. fee',
    icon: FileText,
  },
  {
    id: 'passport_renewal',
    title: 'Indian Passport Renewal',
    desc: 'Renew your Indian passport from the US.',
    fee: '$29 Avasafe fee',
    govFee: 'Govt. fee varies',
    icon: ScrollText,
  },
]

export default async function ApplyPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off-white)' }}>
      {/* Header */}
      <header style={{ height: 64, background: 'white', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <Logo size="md" />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-tertiary)' }}>
          Choose service
        </span>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px 80px' }}>
        <AvaMessage
          message="I already have most of what I need from your documents. Which application would you like me to prepare?"
          className="mb-8"
        />

        <ServiceCards services={SERVICES} />

        <p style={{ marginTop: 32, fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center' }}>
          Not sure which to choose?{' '}
          <a href="mailto:support@avasafe.ai" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Ask us</a>
        </p>
      </main>
    </div>
  )
}
