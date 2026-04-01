'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'
import { ShieldCheck, Lock, Star } from 'lucide-react'

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
        options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/dashboard` },
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
    <div className="flex min-h-screen w-full">
      {/* Left panel — navy, trust-building, hidden on mobile */}
      <div
        className="hidden md:flex md:w-[40%] flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: 'var(--navy, #0A1628)' }}
      >
        {/* Subtle radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 20% 50%, rgba(201,136,42,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Top: Inline logo for dark bg */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-baseline gap-0.5">
            <span
              style={{
                fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
                fontWeight: 700,
                fontSize: '32px',
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
              }}
            >
              ava
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
                fontWeight: 700,
                fontSize: '32px',
                color: 'var(--gold, #C9882A)',
                letterSpacing: '-0.02em',
              }}
            >
              safe
            </span>
          </Link>
        </div>

        {/* Middle: Headline + trust badges */}
        <div className="relative z-10 flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h2
              style={{
                fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
                fontWeight: 700,
                fontSize: '36px',
                lineHeight: '1.15',
                color: '#FFFFFF',
                textWrap: 'balance',
              }}
            >
              Your documents,<br />handled.
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body, Inter, sans-serif)',
                fontWeight: 400,
                fontSize: '16px',
                color: 'rgba(255,255,255,0.6)',
                lineHeight: '1.6',
              }}
            >
              Join thousands of NRIs who&apos;ve stopped fighting government portals.
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex flex-col gap-3">
            {[
              { icon: Lock, label: 'Bank-level encryption' },
              { icon: ShieldCheck, label: 'No human sees your documents' },
              { icon: Star, label: 'Rejection guarantee' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="inline-flex items-center gap-2.5 self-start px-4 py-2 rounded-full"
                style={{
                  border: '1px solid rgba(201,136,42,0.35)',
                  background: 'rgba(201,136,42,0.06)',
                }}
              >
                <Icon
                  size={14}
                  style={{ color: 'var(--gold, #C9882A)', flexShrink: 0 }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-body, Inter, sans-serif)',
                    fontWeight: 400,
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.88)',
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: copyright */}
        <div className="relative z-10">
          <p
            style={{
              fontFamily: 'var(--font-body, Inter, sans-serif)',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.3)',
            }}
          >
            &copy; {new Date().getFullYear()} Avasafe AI. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right panel — white, form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
        <motion.div
          className="w-full max-w-[400px]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {/* Logo (mobile only — shown on right panel; hidden on md since left panel has it) */}
          <div className="flex justify-center mb-8 md:hidden">
            <Link href="/">
              <Logo size="lg" />
            </Link>
          </div>

          {/* Form heading */}
          <div className="mb-8">
            <h1
              style={{
                fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
                fontWeight: 600,
                fontSize: '28px',
                color: 'var(--navy, #0A1628)',
                lineHeight: 1.2,
              }}
            >
              {mode === 'signup' ? 'Create your account' : 'Welcome back'}
            </h1>
            <p
              className="mt-2"
              style={{
                fontFamily: 'var(--font-body, Inter, sans-serif)',
                fontSize: '15px',
                color: 'var(--text-secondary, #4A5568)',
              }}
            >
              {mode === 'signup'
                ? 'Start securing your documents today.'
                : mode === 'magic'
                ? 'We\'ll email you a secure sign-in link.'
                : 'Sign in to access your document locker.'}
            </p>
          </div>

          {magicSent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl px-6 py-8 text-center"
              style={{
                background: 'var(--gold-subtle, #FDF6EC)',
                border: '1px solid rgba(201,136,42,0.2)',
              }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(201,136,42,0.12)' }}
              >
                <span style={{ fontSize: '22px' }}>✉️</span>
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
                  fontWeight: 600,
                  fontSize: '17px',
                  color: 'var(--navy, #0A1628)',
                }}
              >
                Check your email
              </p>
              <p
                className="mt-1.5"
                style={{
                  fontFamily: 'var(--font-body, Inter, sans-serif)',
                  fontSize: '14px',
                  color: 'var(--text-secondary, #4A5568)',
                  lineHeight: 1.5,
                }}
              >
                Magic link sent to <strong>{email}</strong>.
                <br />Click the link to sign in instantly.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {mode === 'signup' && (
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-primary, #0A1628)', fontFamily: 'var(--font-body, Inter, sans-serif)' }}
                  >
                    Full name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-field"
                    placeholder="Priya Sharma"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary, #0A1628)', fontFamily: 'var(--font-body, Inter, sans-serif)' }}
                >
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                />
              </div>

              {mode !== 'magic' && (
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-primary, #0A1628)', fontFamily: 'var(--font-body, Inter, sans-serif)' }}
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="••••••••"
                    minLength={8}
                  />
                </div>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm rounded-xl px-4 py-3"
                  style={{
                    background: '#FEF2F2',
                    color: '#B91C1C',
                    fontFamily: 'var(--font-body, Inter, sans-serif)',
                    border: '1px solid rgba(185,28,28,0.12)',
                  }}
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-navy w-full mt-1"
                style={{ opacity: loading ? 0.65 : 1 }}
              >
                {loading
                  ? 'Please wait…'
                  : mode === 'magic'
                  ? 'Send magic link'
                  : mode === 'signup'
                  ? 'Create account'
                  : 'Sign in'}
              </button>
            </form>
          )}

          {/* Mode toggles */}
          {!magicSent && (
            <div className="mt-6 flex flex-col gap-2.5 text-center">
              {mode === 'login' && (
                <>
                  <button
                    onClick={() => setMode('magic')}
                    className="text-sm hover:underline underline-offset-2 transition-opacity hover:opacity-80"
                    style={{
                      color: 'var(--navy-mid, #0F2D52)',
                      fontFamily: 'var(--font-body, Inter, sans-serif)',
                      fontWeight: 500,
                    }}
                  >
                    Sign in with magic link instead
                  </button>
                  <button
                    onClick={() => setMode('signup')}
                    className="text-sm transition-opacity hover:opacity-70"
                    style={{
                      color: 'var(--text-secondary, #4A5568)',
                      fontFamily: 'var(--font-body, Inter, sans-serif)',
                    }}
                  >
                    Don&apos;t have an account?{' '}
                    <span className="font-medium" style={{ color: 'var(--navy-mid, #0F2D52)' }}>
                      Sign up
                    </span>
                  </button>
                </>
              )}
              {mode === 'signup' && (
                <button
                  onClick={() => setMode('login')}
                  className="text-sm transition-opacity hover:opacity-70"
                  style={{
                    color: 'var(--text-secondary, #4A5568)',
                    fontFamily: 'var(--font-body, Inter, sans-serif)',
                  }}
                >
                  Already have an account?{' '}
                  <span className="font-medium" style={{ color: 'var(--navy-mid, #0F2D52)' }}>
                    Sign in
                  </span>
                </button>
              )}
              {mode === 'magic' && (
                <button
                  onClick={() => setMode('login')}
                  className="text-sm transition-opacity hover:opacity-70"
                  style={{
                    color: 'var(--text-secondary, #4A5568)',
                    fontFamily: 'var(--font-body, Inter, sans-serif)',
                  }}
                >
                  Back to password sign in
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  )
}
