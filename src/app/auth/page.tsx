'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'
import { ShieldCheck, Lock, Star, Mail, CheckCircle, X, Loader2, AlertCircle } from 'lucide-react'

const APP_URL = 'https://avasafe.ai'
const RESEND_COOLDOWN = 60 // seconds

// ─── Password rules ──────────────────────────────────────────────────────────

const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'number', label: 'At least one number', test: (p: string) => /\d/.test(p) },
  { id: 'letter', label: 'At least one letter', test: (p: string) => /[a-zA-Z]/.test(p) },
]

function passwordValid(p: string) {
  return PASSWORD_RULES.every(r => r.test(p))
}

// ─── Error translation ───────────────────────────────────────────────────────

function translateError(raw: string, mode?: 'login' | 'signup'): { field: 'email' | 'password' | 'general'; message: string } {
  const msg = raw.toLowerCase()
  // Duplicate email — Supabase returns several variants
  if (
    msg.includes('already registered') ||
    msg.includes('already in use') ||
    msg.includes('user already exists') ||
    msg.includes('already been registered') ||
    msg.includes('email address is already')
  ) {
    return { field: 'email', message: 'An account with this email already exists.' }
  }
  if (msg.includes('invalid email') || msg.includes('unable to validate email') || msg.includes('email address is invalid')) {
    return { field: 'email', message: 'Please enter a valid email address.' }
  }
  if (msg.includes('password') && (msg.includes('weak') || msg.includes('short') || msg.includes('least 6'))) {
    return { field: 'password', message: "Password must be at least 8 characters." }
  }
  // Login-specific errors
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return { field: 'general', message: 'Incorrect email or password. Please try again.' }
  }
  if (msg.includes('wrong password')) {
    return { field: 'general', message: 'Incorrect password. Try again or reset your password.' }
  }
  if (msg.includes('user not found') || (mode === 'login' && msg.includes('no user found'))) {
    return { field: 'email', message: 'No account found with this email.' }
  }
  if (msg.includes('email not confirmed') || msg.includes('email link is invalid or has expired')) {
    return { field: 'general', message: 'Please confirm your email before signing in.' }
  }
  if (msg.includes('too many requests') || msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
    return { field: 'general', message: 'Too many attempts. Please wait a minute and try again.' }
  }
  return { field: 'general', message: 'Something went wrong. Please try again.' }
}

// ─── Resend state machine ────────────────────────────────────────────────────

type ResendState = 'idle' | 'loading' | 'success' | 'error'

// ─── Shared styles ───────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--text-primary, #0A1628)',
}

const hintStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--text-tertiary, #9CA3AF)',
  marginTop: 4,
  lineHeight: 1.5,
}

const fieldErrorStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: '#B91C1C',
  marginTop: 4,
}

// ─── Confirmation screen ─────────────────────────────────────────────────────

function ConfirmationScreen({ email, onBack }: { email: string; onBack: () => void }) {
  const supabase = createClient()
  const [resendState, setResendState] = useState<ResendState>('idle')
  const [countdown, setCountdown] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function clearCountdown() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    return () => clearCountdown()
  }, [])

  async function handleResend() {
    if (resendState === 'loading') return
    clearCountdown()
    setResendState('loading')

    const { error } = await supabase.auth.resend({ type: 'signup', email })

    if (error) {
      setResendState('error')
      // Auto-reset to idle after 5s if user doesn't click
      const t = setTimeout(() => setResendState('idle'), 5000)
      return () => clearTimeout(t)
    }

    setResendState('success')
    setCountdown(RESEND_COOLDOWN)

    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearCountdown()
          setResendState('idle')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  return (
    <motion.div
      className="w-full max-w-[400px] text-center"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(201,136,42,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
      }}>
        <Mail size={40} color="var(--gold, #C9882A)" />
      </div>

      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 600, fontSize: 28,
        color: 'var(--navy, #0A1628)',
        marginBottom: 12,
      }}>
        Check your email
      </h1>

      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 15, color: 'var(--text-secondary, #4A5568)',
        lineHeight: 1.6, marginBottom: 28,
      }}>
        We sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account.
      </p>

      {/* Resend area */}
      <div style={{ marginBottom: 24 }}>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13, color: 'var(--text-tertiary, #9CA3AF)',
          lineHeight: 1.6, marginBottom: 8,
        }}>
          Didn&apos;t receive it? Check your spam folder or
        </p>

        {/* Resend button — 4 states */}
        {resendState === 'idle' && (
          <button
            onClick={handleResend}
            style={{
              background: 'none', border: 'none', padding: 0,
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: 'var(--gold, #C9882A)', fontWeight: 500,
              cursor: 'pointer', textDecoration: 'underline',
              textUnderlineOffset: 2,
            }}
          >
            resend the email
          </button>
        )}

        {resendState === 'loading' && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-tertiary)' }}>
            <Loader2 size={14} color="var(--gold)" style={{ animation: 'spin 0.8s linear infinite' }} />
            Sending…
          </span>
        )}

        {resendState === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 13, color: '#1A6B3A', fontWeight: 500 }}>
              <CheckCircle size={14} color="#1A6B3A" />
              Email sent — check your inbox.
            </span>
            {countdown > 0 && (
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-tertiary)' }}>
                Resend again in {countdown}s
              </span>
            )}
          </div>
        )}

        {resendState === 'error' && (
          <button
            onClick={handleResend}
            style={{
              background: 'none', border: 'none', padding: 0,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: '#B91C1C', fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <AlertCircle size={14} color="#B91C1C" />
            Failed to send. Try again.
          </button>
        )}
      </div>

      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 28 }}>
        The link expires in 24 hours.
      </p>

      <button
        onClick={onBack}
        style={{
          background: 'none', border: 'none', padding: 0,
          fontFamily: 'var(--font-body)', fontSize: 13,
          color: 'var(--text-secondary)',
          cursor: 'pointer',
        }}
      >
        ← Wrong email? Go back
      </button>
    </motion.div>
  )
}

// ─── Magic link sent screen ───────────────────────────────────────────────────

function MagicSentScreen({ email, onBack }: { email: string; onBack: () => void }) {
  return (
    <motion.div
      className="w-full max-w-[400px] text-center"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(201,136,42,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
      }}>
        <Mail size={40} color="var(--gold, #C9882A)" />
      </div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 28, color: 'var(--navy, #0A1628)', marginBottom: 12 }}>
        Check your email
      </h1>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
        We sent a magic sign-in link to <strong>{email}</strong>. Click the link to sign in instantly.
      </p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 28 }}>
        The link expires in 24 hours.
      </p>
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}
      >
        ← Back to sign in
      </button>
    </motion.div>
  )
}

// ─── Left panel ──────────────────────────────────────────────────────────────

function LeftPanel() {
  return (
    <div className="hidden md:flex md:w-[40%] flex-col justify-between p-10 relative overflow-hidden" style={{ background: 'var(--navy, #0A1628)' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(201,136,42,0.08) 0%, transparent 70%)' }} />
      <div className="relative z-10">
        <Link href="/" className="inline-flex items-baseline gap-0.5">
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: '#FFFFFF', letterSpacing: '-0.02em' }}>ava</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--gold, #C9882A)', letterSpacing: '-0.02em' }}>safe</span>
        </Link>
      </div>
      <div className="relative z-10 flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36, lineHeight: 1.15, color: '#FFFFFF' }}>
            Your documents,<br />handled.
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            Join thousands of NRIs who&apos;ve stopped fighting government portals.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { icon: Lock, label: 'Bank-level encryption' },
            { icon: ShieldCheck, label: 'No human sees your documents' },
            { icon: Star, label: 'Rejection guarantee' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="inline-flex items-center gap-2.5 self-start px-4 py-2 rounded-full" style={{ border: '1px solid rgba(201,136,42,0.35)', background: 'rgba(201,136,42,0.06)' }}>
              <Icon size={14} style={{ color: 'var(--gold, #C9882A)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.88)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="relative z-10">
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          &copy; {new Date().getFullYear()} Avasafe AI. All rights reserved.
        </p>
      </div>
    </div>
  )
}

// ─── Auth form ───────────────────────────────────────────────────────────────

type Mode = 'login' | 'signup' | 'magic'
type View = 'form' | 'confirmation' | 'magic-sent'

function AuthForm() {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient()

  const [mode, setMode] = useState<Mode>((params.get('mode') as Mode) ?? 'login')
  const [view, setView] = useState<View>('form')

  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')

  // UI state
  const [loading, setLoading] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)

  // Per-field errors
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [generalError, setGeneralError] = useState<string | null>(null)

  function clearErrors() {
    setEmailError(null)
    setPasswordError(null)
    setGeneralError(null)
  }

  function resetForm() {
    setEmail('')
    setPassword('')
    setFullName('')
    clearErrors()
    setPasswordTouched(false)
    setView('form')
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function switchMode(m: Mode) {
    setMode(m)
    clearErrors()
    setPasswordTouched(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    clearErrors()
    setLoading(true)

    if (mode === 'magic') {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${APP_URL}/dashboard` },
      })
      if (error) {
        const t = translateError(error.message)
        if (t.field === 'email') setEmailError(t.message)
        else setGeneralError(t.message)
      } else {
        setView('magic-sent')
      }
      setLoading(false)
      return
    }

    if (mode === 'signup') {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${APP_URL}/dashboard`,
        },
      })
      if (error) {
        const t = translateError(error.message)
        if (t.field === 'email') setEmailError(t.message)
        else if (t.field === 'password') setPasswordError(t.message)
        else setGeneralError(t.message)
        setLoading(false)
        return
      }
      // Supabase silent duplicate: no error but user.identities is empty
      if (!signUpData?.user || (signUpData.user.identities?.length ?? 0) === 0) {
        setEmailError('An account with this email already exists.')
        setLoading(false)
        return
      }
      setLoading(false)
      setView('confirmation')
      return
    }

    // Login
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const t = translateError(error.message, 'login')
      if (t.field === 'email') setEmailError(t.message)
      else if (t.field === 'password') setPasswordError(t.message)
      else setGeneralError(t.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  const submitDisabled = loading || (mode === 'signup' && !passwordValid(password))

  return (
    <div className="flex min-h-screen w-full">
      <LeftPanel />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
        <AnimatePresence mode="wait">
          {view === 'confirmation' && (
            <ConfirmationScreen key="confirmation" email={email} onBack={resetForm} />
          )}

          {view === 'magic-sent' && (
            <MagicSentScreen key="magic-sent" email={email} onBack={resetForm} />
          )}

          {view === 'form' && (
            <motion.div
              key={`form-${mode}`}
              className="w-full max-w-[400px]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {/* Mobile logo */}
              <div className="flex justify-center mb-8 md:hidden">
                <Link href="/"><Logo size="lg" /></Link>
              </div>

              {/* Mode pill tabs */}
              <div style={{
                display: 'flex', gap: 4,
                background: 'var(--surface, #F9F9F7)',
                border: '1px solid var(--border)',
                borderRadius: 12, padding: 4,
                marginBottom: 28, width: '100%',
              }}>
                {(['login', 'signup'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => switchMode(m)}
                    style={{
                      flex: 1, height: 36, borderRadius: 8, border: 'none',
                      fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
                      cursor: 'pointer',
                      background: mode === m ? 'white' : 'transparent',
                      color: mode === m ? 'var(--navy, #0A1628)' : 'var(--text-secondary)',
                      boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 150ms ease',
                    }}
                  >
                    {m === 'login' ? 'Sign in' : 'Create account'}
                  </button>
                ))}
              </div>

              {/* Heading */}
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 26, color: 'var(--navy, #0A1628)', lineHeight: 1.2 }}>
                  {mode === 'signup' ? 'Create your account' : mode === 'magic' ? 'Sign in with email' : 'Welcome back'}
                </h1>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>
                  {mode === 'signup' ? 'Start securing your documents today.' : mode === 'magic' ? "We'll email you a secure sign-in link." : 'Sign in to access your document locker.'}
                </p>
              </div>

              {/* General error */}
              <AnimatePresence>
                {generalError && (
                  <motion.div
                    key="general-error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      background: '#FEF2F2', color: '#B91C1C',
                      fontFamily: 'var(--font-body)', fontSize: 13,
                      border: '1px solid rgba(185,28,28,0.12)',
                      borderRadius: 10, padding: '10px 14px', marginBottom: 16,
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                    }}
                  >
                    <AlertCircle size={14} color="#B91C1C" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>
                      {generalError}
                      {generalError.includes('confirm your email') && (
                        <> <button type="button" onClick={async () => { await supabase.auth.resend({ type: 'signup', email }); setGeneralError('Confirmation email resent — check your inbox.') }} style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'var(--font-body)', fontSize: 13, color: '#B91C1C', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}>Resend confirmation →</button></>
                      )}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Full name */}
                {mode === 'signup' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelStyle}>Full name</label>
                    <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="input-field" placeholder="Priya Sharma" />
                  </div>
                )}

                {/* Email */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={labelStyle}>Email address</label>
                  <input
                    type="email" required
                    value={email}
                    onChange={e => { setEmail(e.target.value); setEmailError(null) }}
                    className="input-field"
                    placeholder="you@example.com"
                    style={emailError ? { borderColor: '#B91C1C' } : undefined}
                  />
                  {mode === 'signup' && !emailError && (
                    <p style={hintStyle}>We&apos;ll send a confirmation link to this address.</p>
                  )}
                  {emailError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
                      <AlertCircle size={13} color="#B91C1C" style={{ flexShrink: 0 }} />
                      <span style={fieldErrorStyle}>{emailError}</span>
                      {mode === 'signup' && emailError.includes('already exists') && (
                        <button type="button" onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--navy, #0A1628)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                          Sign in instead →
                        </button>
                      )}
                      {mode === 'login' && emailError.includes('No account found') && (
                        <button type="button" onClick={() => switchMode('signup')} style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--navy, #0A1628)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                          Create an account instead →
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Password */}
                {mode !== 'magic' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelStyle}>Password</label>
                    <input
                      type="password" required
                      value={password}
                      onChange={e => { setPassword(e.target.value); setPasswordTouched(true); setPasswordError(null) }}
                      className="input-field"
                      placeholder="••••••••"
                      style={passwordError ? { borderColor: '#B91C1C' } : undefined}
                    />
                    {passwordError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                        <AlertCircle size={13} color="#B91C1C" style={{ flexShrink: 0 }} />
                        <span style={fieldErrorStyle}>{passwordError}</span>
                      </div>
                    )}

                    {/* Password rules — signup only, after first keystroke */}
                    <AnimatePresence>
                      {mode === 'signup' && passwordTouched && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden', paddingTop: 4 }}
                        >
                          {PASSWORD_RULES.map(rule => {
                            const passes = rule.test(password)
                            return (
                              <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {passes
                                  ? <CheckCircle size={12} color="#1A6B3A" />
                                  : <X size={12} color="var(--text-tertiary, #9CA3AF)" />}
                                <span style={{
                                  fontFamily: 'var(--font-body)', fontSize: 12,
                                  color: passes ? '#1A6B3A' : 'var(--text-tertiary, #9CA3AF)',
                                  transition: 'color 150ms ease',
                                }}>
                                  {rule.label}
                                </span>
                              </div>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitDisabled}
                  className="btn-navy w-full mt-1"
                  style={{ opacity: submitDisabled ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {loading && <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />}
                  {loading
                    ? mode === 'signup' ? 'Creating account…' : mode === 'magic' ? 'Sending…' : 'Signing in…'
                    : mode === 'magic' ? 'Send magic link'
                    : mode === 'signup' ? 'Create account'
                    : 'Sign in'}
                </button>

                {/* Terms */}
                {mode === 'signup' && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.5 }}>
                    By creating an account you agree to our{' '}
                    <Link href="/terms" style={{ color: 'var(--navy)', fontWeight: 500 }}>Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/privacy" style={{ color: 'var(--navy)', fontWeight: 500 }}>Privacy Policy</Link>.
                  </p>
                )}
              </form>

              {/* Mode toggles */}
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'center' }}>
                {mode === 'login' && (
                  <>
                    <button type="button" onClick={() => switchMode('magic')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--navy-mid, #0F2D52)' }}>
                      Sign in with magic link instead
                    </button>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>
                      Don&apos;t have an account?{' '}
                      <button type="button" onClick={() => switchMode('signup')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--navy-mid)' }}>
                        Sign up
                      </button>
                    </p>
                  </>
                )}
                {mode === 'signup' && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>
                    Already have an account?{' '}
                    <button type="button" onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--navy-mid)' }}>
                      Sign in
                    </button>
                  </p>
                )}
                {mode === 'magic' && (
                  <button type="button" onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>
                    ← Back to password sign in
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  )
}
