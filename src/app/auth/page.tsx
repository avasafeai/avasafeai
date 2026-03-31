'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'signup' | 'magic'

export default function AuthPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicSent, setMagicSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (mode === 'magic') {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/apply` },
      })
      if (error) {
        setError(error.message)
      } else {
        setMagicSent(true)
      }
      setLoading(false)
      return
    }

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      router.push('/apply')
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/apply')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-slate-50">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center font-bold text-xl mb-8 text-slate-900">
          Avasafe AI
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-xl font-semibold text-slate-900 mb-6">
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h1>

          {magicSent ? (
            <div className="text-center py-4">
              <p className="text-slate-700 font-medium">Check your email</p>
              <p className="text-slate-500 text-sm mt-1">
                We sent a magic link to <strong>{email}</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Full name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Priya Sharma"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="you@example.com"
                />
              </div>

              {mode !== 'magic' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="••••••••"
                    minLength={8}
                  />
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {loading
                  ? 'Please wait...'
                  : mode === 'magic'
                  ? 'Send magic link'
                  : mode === 'signup'
                  ? 'Create account'
                  : 'Sign in'}
              </button>
            </form>
          )}

          <div className="mt-5 flex flex-col gap-2 text-center text-sm">
            {mode === 'login' && (
              <>
                <button
                  onClick={() => setMode('magic')}
                  className="text-indigo-600 hover:underline"
                >
                  Sign in with magic link instead
                </button>
                <button
                  onClick={() => setMode('signup')}
                  className="text-slate-500 hover:text-slate-900"
                >
                  Don&apos;t have an account? Sign up
                </button>
              </>
            )}
            {mode === 'signup' && (
              <button
                onClick={() => setMode('login')}
                className="text-slate-500 hover:text-slate-900"
              >
                Already have an account? Sign in
              </button>
            )}
            {mode === 'magic' && (
              <button
                onClick={() => setMode('login')}
                className="text-slate-500 hover:text-slate-900"
              >
                Back to password sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
