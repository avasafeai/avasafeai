'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProgressBar from '@/components/ProgressBar'
import { ValidationResult } from '@/types/supabase'

export default function ReviewPage() {
  const router = useRouter()
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    fetch('/api/validate-application', { method: 'GET' })
      .then((r) => r.json())
      .then(({ data }) => {
        setValidation(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const blockers = validation?.errors.filter((e) => e.severity === 'blocker') ?? []
  const warnings = validation?.errors.filter((e) => e.severity === 'warning') ?? []
  const isReady = !loading && blockers.length === 0

  async function handlePay() {
    setPaying(true)
    const res = await fetch('/api/create-checkout', { method: 'POST' })
    const { data } = (await res.json()) as { data: { url: string } }
    if (data?.url) {
      window.location.href = data.url
    } else {
      setPaying(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto">
        <ProgressBar currentStep={2} />

        <div className="px-6 py-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Review your application</h1>
          <p className="text-slate-500 text-sm mb-8">
            AVA has checked your application for common errors.
          </p>

          {loading ? (
            <div className="flex items-center gap-3 text-indigo-700 bg-indigo-50 rounded-xl px-5 py-4">
              <span className="animate-spin">⏳</span>
              <span className="text-sm font-medium">Running final checks...</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {isReady && blockers.length === 0 && warnings.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-semibold text-green-800">Your application is ready</p>
                    <p className="text-sm text-green-700">No errors found. You&apos;re good to go!</p>
                  </div>
                </div>
              )}

              {blockers.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-2">
                    Must fix before submitting
                  </h2>
                  <div className="flex flex-col gap-2">
                    {blockers.map((e, i) => (
                      <div
                        key={i}
                        className="bg-red-50 border border-red-200 rounded-xl px-4 py-3"
                      >
                        <p className="text-sm font-semibold text-red-800 capitalize">
                          {e.field.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-red-700">{e.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {warnings.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-yellow-700 uppercase tracking-wide mb-2">
                    Warnings — should fix but can proceed
                  </h2>
                  <div className="flex flex-col gap-2">
                    {warnings.map((e, i) => (
                      <div
                        key={i}
                        className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3"
                      >
                        <p className="text-sm font-semibold text-yellow-800 capitalize">
                          {e.field.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-yellow-700">{e.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => router.push('/apply/form')}
                  className="flex-1 px-6 py-3 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Edit application
                </button>
                <button
                  onClick={handlePay}
                  disabled={!isReady || paying}
                  className="flex-1 px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {paying ? 'Redirecting...' : 'Pay $39 and submit →'}
                </button>
              </div>

              {!isReady && (
                <p className="text-xs text-slate-500 text-center">
                  Fix all blockers above to enable payment.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
