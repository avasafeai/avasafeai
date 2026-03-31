import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProgressBar from '@/components/ProgressBar'

const STATUS_TIMELINE = [
  { key: 'paid', label: 'Payment received' },
  { key: 'submitted', label: 'Submitted to VFS' },
  { key: 'approved', label: 'Approved' },
]

const STATUS_ORDER = ['draft', 'ready', 'paid', 'submitted', 'approved']

export default async function StatusPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const { data: app } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!app) redirect('/apply')

  const currentIndex = STATUS_ORDER.indexOf(app.status)

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto">
        <ProgressBar currentStep={4} />

        <div className="px-6 py-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Application status</h1>
          <p className="text-slate-500 text-sm mb-8">
            We&apos;ll notify you by email and WhatsApp at each step.
          </p>

          {app.vfs_reference && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4 mb-6">
              <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide mb-0.5">
                VFS Reference Number
              </p>
              <p className="font-mono text-lg font-bold text-indigo-900">{app.vfs_reference}</p>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <ol className="relative flex flex-col gap-6">
              {STATUS_TIMELINE.map((s, i) => {
                const statusIdx = STATUS_ORDER.indexOf(s.key)
                const done = currentIndex >= statusIdx
                const active = currentIndex === statusIdx

                return (
                  <li key={s.key} className="flex items-start gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        done
                          ? 'bg-indigo-600 text-white'
                          : active
                          ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-600'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {done ? '✓' : i + 1}
                    </div>
                    <div>
                      <p
                        className={`font-medium ${
                          done ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {s.label}
                      </p>
                      {active && (
                        <p className="text-xs text-indigo-600 mt-0.5">In progress…</p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </div>
    </main>
  )
}
