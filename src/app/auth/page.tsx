'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'signup' | 'magic'

function AuthForm() {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient()

  const [mode, setMode] = useState<Mode>((params.get('mode') as Mode) ?? 'login')
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
        options: { emailRedirectTo: `${window.location.origin}/onboarding` },
      })
      if (error) { setError(error.message) } else { setMagicSent(true) }
      setLoading(false)
      return
    }

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) { setError(error.message); setLoading(false); return }
      router.push('/onboarding')
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div className="w-full max-w-sm">
      <Link href="/" className="block text-center font-display font-semibold text-xl mb-8"
        style={{ color: 'var(--color-navy)' }}>
        Avasafe AI
      </Link>

      <div className="card">
        <h1 className="font-display text-xl font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          {mode === 'signup'
            ? 'Start securing your documents today.'
            : 'Sign in to access your document locker.'}
        </p>

        {magicSent ? (
          <div className="text-center py-4">
            <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Check your email</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Magic link sent to <strong>{email}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                  Full name
                </label>
                <input
                  type="text" required value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field"
                  placeholder="Priya Sharma"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                Email
              </label>
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            {mode !== 'magic' && (
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                  Password
                </label>
                <input
                  type="password" required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>
            )}

            {error && (
              <p className="text-sm rounded-lg px-4 py-2.5"
                style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-1"
              style={{ opacity: loading ? 0.6 : 1 }}>
              {loading
                ? 'Please wait…'
                : mode === 'magic' ? 'Send magic link'
                : mode === 'signup' ? 'Create account'
                : 'Sign in'}
            </button>
          </form>
        )}

        <div className="mt-5 flex flex-col gap-2 text-center text-sm">
          {mode === 'login' && (
            <>
              <button onClick={() => setMode('magic')} className="hover:underline"
                style={{ color: 'var(--color-navy)' }}>
                Sign in with magic link
              </button>
              <button onClick={() => setMode('signup')}
                style={{ color: 'var(--color-text-secondary)' }}>
                Don&apos;t have an account? Sign up
              </button>
            </>
          )}
          {mode === 'signup' && (
            <button onClick={() => setMode('login')} style={{ color: 'var(--color-text-secondary)' }}>
              Already have an account? Sign in
            </button>
          )}
          {mode === 'magic' && (
            <button onClick={() => setMode('login')} style={{ color: 'var(--color-text-secondary)' }}>
              Back to password sign in
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'var(--color-background)' }}>
      <Suspense>
        <AuthForm />
      </Suspense>
    </main>
  )
}
