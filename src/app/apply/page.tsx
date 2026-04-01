import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AvaMessage from '@/components/AvaMessage'
import Logo from '@/components/Logo'

const SERVICES = [
  {
    id: 'oci_new',
    title: 'OCI Card (New Application)',
    desc: 'First-time OCI card for Indian-origin US citizens and residents.',
    fee: '$275 govt. fee + $29 Avasafe',
  },
  {
    id: 'oci_renewal',
    title: 'OCI Card (Renewal)',
    desc: 'Renew your OCI card after a new passport or name change.',
    fee: '$25 govt. fee + $29 Avasafe',
  },
  {
    id: 'passport_renewal',
    title: 'Indian Passport Renewal',
    desc: 'Renew your Indian passport from the US.',
    fee: 'Varies + $29 Avasafe',
  },
]

export default async function ApplyPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  return (
    <main className="min-h-screen flex flex-col items-center justify-start pt-16 px-4"
      style={{ background: 'var(--color-background)' }}>
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <Link href="/dashboard">
            <Logo size="lg" />
          </Link>
        </div>

        <AvaMessage
          message="I already have most of what I need from your documents. Which application would you like me to prepare?"
          className="mb-8"
        />

        <div className="flex flex-col gap-3">
          {SERVICES.map((s) => (
            <Link key={s.id} href={`/apply/${s.id}/form`}
              className="card flex items-start justify-between gap-4 hover:shadow-md transition-shadow">
              <div>
                <p className="font-medium text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  {s.title}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{s.desc}</p>
                <p className="text-xs mt-1.5 font-medium" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  {s.fee}
                </p>
              </div>
              <span style={{ color: 'var(--color-navy)', fontSize: 20 }}>→</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
