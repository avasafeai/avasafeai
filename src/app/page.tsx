'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, Shield, Check, Zap, ShieldCheck, EyeOff, Trash2, UserCheck, X } from 'lucide-react'
import Logo from '@/components/Logo'
import FaqAccordion from '@/components/FaqAccordion'

// ─── Animation constants ────────────────────────────────────────────────────
const EASE = [0.16, 1, 0.32, 1] as const

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE, delay },
  }),
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.4, ease: EASE, delay },
  }),
}

// ─── Data ───────────────────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Upload your documents',
    body: 'Take a photo of your passport. AVA reads every field instantly. Upload once and every future application is pre-filled automatically.',
  },
  {
    step: '02',
    title: 'AVA prepares everything',
    body: 'AVA fills both government portals, validates against every rejection cause, and generates your complete mailing package. Automatically.',
  },
  {
    step: '03',
    title: 'You submit in two steps',
    body: 'Pay the government fee: one tap. Drop the prepared envelope at UPS: five minutes. AVA tracks everything from there.',
  },
]

const PAIN_POINTS = [
  { title: 'Wrong photo size', body: 'Photo dimensions rejected by VFS.' },
  { title: 'Name mismatch', body: 'Different names across passport and Indian documents.' },
  { title: 'Wrong VFS centre', body: 'Applied to the wrong jurisdiction for your state.' },
  { title: 'Missing documents', body: 'Incomplete checklist causes immediate return.' },
  { title: 'Expired address proof', body: 'Utility bill older than 3 months not accepted.' },
  { title: 'Apostille missing', body: 'US-issued documents need apostille since December 2024.' },
]

const AVA_FILLS_COLUMNS = [
  {
    icon: Lock,
    title: 'Your documents stay private',
    body: 'AVA stores everything in your encrypted locker. No human at Avasafe ever sees your documents. Not even us.',
  },
  {
    icon: Zap,
    title: 'AVA pre-fills everything',
    body: 'Every field on both government portals pre-filled, validated, and copied to your clipboard. Open the portal and paste. Takes 10 minutes.',
  },
  {
    icon: ShieldCheck,
    title: 'You click submit',
    body: 'Your login credentials stay yours. AVA guides you through each step with every answer ready. You confirm and submit.',
  },
]

const TRUST_CARDS = [
  {
    icon: Lock,
    title: 'End-to-end encrypted',
    body: 'Your documents are encrypted with AES-256 before they leave your device. The same standard used by banks and financial institutions worldwide.',
  },
  {
    icon: EyeOff,
    title: 'No human access',
    body: 'No employee at Avasafe can see your documents. AI processes them. Humans never touch them. This is technically enforced, not just policy.',
  },
  {
    icon: Trash2,
    title: 'Delete anytime',
    body: 'You own your data. Delete any document or your entire account at any time. Everything is gone permanently within 24 hours.',
  },
  {
    icon: UserCheck,
    title: 'Built by someone who went through this',
    body: 'Built by a Spotify Engineering Manager who went through this exact process. We built what we wished existed.',
  },
]

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    period: ' forever',
    description: 'Start protecting your documents today',
    cta: 'Start free',
    highlighted: false,
    badge: null as string | null,
    href: '/auth?mode=signup',
    features: [
      { text: 'Store up to 3 documents', included: true },
      { text: 'AI extraction of every field', included: true },
      { text: 'Basic document dashboard', included: true },
      { text: 'Smart expiry alerts', included: false },
      { text: 'Application preparation', included: false },
    ],
  },
  {
    name: 'Locker',
    price: '$19',
    period: '/year',
    description: 'Keep your documents safe and up to date',
    cta: 'Get Locker',
    highlighted: false,
    badge: null as string | null,
    href: '/auth?mode=signup',
    features: [
      { text: 'Unlimited document storage', included: true },
      { text: 'AI extraction of every field', included: true },
      { text: 'Smart expiry alerts', included: true },
      { text: 'Encrypted document download', included: true },
      { text: 'Application preparation', included: false },
    ],
  },
  {
    name: 'Guided',
    price: '$29',
    period: '/application',
    description: "Let AVA prepare your application and guide you through the portal",
    cta: 'Start application',
    highlighted: true,
    badge: 'Most popular' as string | null,
    href: '/auth?mode=signup',
    features: [
      { text: 'Everything in Locker', included: true },
      { text: 'AVA pre-fills your application', included: true },
      { text: 'Validation against 10 rejection causes', included: true },
      { text: 'Companion mode for portal', included: true },
      { text: 'PDF mailing package', included: true },
      { text: 'Rejection guarantee', included: true },
    ],
  },
  {
    name: 'Expert Session',
    price: '$79',
    period: '/application',
    description: 'An Avasafe expert guides you through every step on a live screen share',
    cta: 'Book expert session',
    highlighted: false,
    badge: 'Best results' as string | null,
    href: '/auth?mode=signup',
    features: [
      { text: 'Everything in Guided', included: true },
      { text: '45-minute 1-on-1 Zoom session', included: true },
      { text: 'Expert guides portal submission', included: true },
      { text: 'You handle passwords only', included: true },
      { text: 'Priority 48-hour booking', included: true },
      { text: 'Support until card arrives', included: true },
    ],
  },
]

const FAQ = [
  {
    q: 'How is this different from services like human-powered application helpers?',
    a: "Traditional services send your passport details to a human over WhatsApp who manually fills out forms on your behalf. With Avasafe, your documents never leave your encrypted locker. AVA prepares everything automatically. No human at Avasafe ever sees your documents. It is faster, more private, and more reliable.",
  },
  {
    q: 'Is it safe to upload my passport?',
    a: 'Your documents are encrypted with AES-256-GCM and stored in your private locker. Encryption keys are managed by Google Cloud KMS, so even we cannot read your files directly. No human ever sees them. You can delete any document at any time.',
  },
  {
    q: 'How does per-application pricing work?',
    a: "You only pay when you need to apply. Guided ($29) and Expert Session ($79) are one-time payments per application, not subscriptions. Locker ($19/year) is the only recurring charge and keeps your documents safe between applications. You can store documents and monitor expiry dates without ever paying for an application.",
  },
  {
    q: 'What exactly does AVA do for my OCI application?',
    a: 'AVA fills both the Indian government portal and the VFS Global portal automatically: every field, every document upload. She captures your ARN, generates a pre-addressed shipping label, and assembles a complete checklist ready to mail.',
  },
  {
    q: 'What do I actually need to do myself?',
    a: "Two things only. Pay the government fee directly (one tap, AVA opens the pre-filled payment page). Drop an envelope at UPS. That is it. About 10 minutes total.",
  },
  {
    q: 'What if my application gets rejected?',
    a: "If the rejection is caused by an error in AVA's validation, we fix your application at no cost. Our validation checks every known rejection cause before you pay.",
  },
  {
    q: 'What about complex edge cases like name changes or previous rejections?',
    a: 'AVA handles most cases automatically. For genuine edge cases, choose Expert Session ($79) and an Avasafe expert will guide you through every step on a live Zoom session.',
  },
]

// ─── Hero word-by-word animation ────────────────────────────────────────────
const HEADLINE = 'Your OCI application, done right the first time.'

function AnimatedHeadline() {
  const words = HEADLINE.split(' ')
  return (
    <h1
      style={{
        fontSize: 'clamp(44px, 7vw, 80px)',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        color: 'var(--navy)',
        lineHeight: 1.1,
        letterSpacing: '-0.02em',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0 0.28em',
        justifyContent: 'center',
        marginBottom: 24,
      }}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            ease: EASE,
            delay: 0.2 + i * 0.08,
          }}
          style={{ display: 'inline-block' }}
        >
          {word}
        </motion.span>
      ))}
    </h1>
  )
}

// ─── Decorative document card ────────────────────────────────────────────────
function DocumentCard() {
  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50%       { transform: translateY(-12px) rotate(-2deg); }
        }
      `}</style>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE, delay: 1.6 }}
        style={{
          width: 260,
          height: 340,
          background: 'linear-gradient(135deg, var(--navy-mid), var(--navy))',
          borderRadius: 24,
          boxShadow: '0 40px 80px rgba(10,22,40,0.25), 0 0 0 1px rgba(201,136,42,0.15)',
          position: 'relative',
          padding: 28,
          animation: 'float 6s ease-in-out infinite',
          flexShrink: 0,
        }}
      >
        {/* Gold header bar */}
        <div
          style={{
            height: 4,
            background: 'linear-gradient(90deg, var(--gold), var(--gold-light))',
            borderRadius: 100,
            marginBottom: 20,
          }}
        />
        {/* Label */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.12em',
            color: 'rgba(201,136,42,0.7)',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          United States of America
        </div>
        {/* Fake photo placeholder */}
        <div
          style={{
            width: 52,
            height: 64,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.1)',
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
        </div>
        {/* Fake field rows */}
        {[80, 60, 100, 70, 90].map((w, i) => (
          <div
            key={i}
            style={{
              height: 6,
              width: `${w}%`,
              background: i === 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
              borderRadius: 100,
              marginBottom: 10,
            }}
          />
        ))}
        {/* Gold checkmark badge */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(201,136,42,0.2)',
            border: '1px solid rgba(201,136,42,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
          }}
        >
          ✓
        </div>
      </motion.div>
    </>
  )
}

// ─── Beta Section ────────────────────────────────────────────────────────────
function BetaSection() {
  const [slotsRemaining, setSlotsRemaining] = useState<number>(50)
  const [betaAvailable, setBetaAvailable] = useState<boolean>(true)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/beta/join')
      .then(r => r.json())
      .then(d => {
        setSlotsRemaining(d.remaining ?? 50)
        setBetaAvailable(d.available ?? true)
      })
      .catch(() => { /* keep defaults */ })
  }, [])

  async function handleJoin() {
    setJoining(true)
    setError('')
    const res = await fetch('/api/beta/join', { method: 'POST' })
    const json = await res.json() as { data?: { already_beta?: boolean; beta_number?: number }; error?: string }
    if (res.ok && json.data) {
      setJoined(true)
      setSlotsRemaining(prev => Math.max(0, prev - (json.data?.already_beta ? 0 : 1)))
    } else if (res.status === 401) {
      window.location.href = '/auth?mode=signup'
    } else {
      setError(json.error ?? 'Something went wrong')
    }
    setJoining(false)
  }

  const isFull = !betaAvailable

  return (
    <section
      id="beta"
      style={{
        background: '#0A1628',
        padding: '100px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative gold dots */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 100%, rgba(201,136,42,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 560, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Slot counter pill */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, border: '1px solid rgba(201,136,42,0.4)', marginBottom: 28 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: isFull ? '#9CA3AF' : '#C9882A', animation: isFull ? 'none' : 'pulse 2s ease-in-out infinite' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: isFull ? 'rgba(255,255,255,0.4)' : 'rgba(201,136,42,0.9)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {isFull ? 'Beta full' : `${slotsRemaining} of 50 spots remaining`}
          </span>
        </div>

        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(26px, 4vw, 40px)', color: 'white', marginBottom: 16, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
          Get free Guided access as a beta member.
        </h2>

        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 36, maxWidth: 460, margin: '0 auto 36px' }}>
          The first 50 members get free access to AVA&apos;s Guided application preparation. No payment, no credit card. In exchange, we ask for honest feedback.
        </p>

        {joined ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 24px', borderRadius: 12, background: 'rgba(201,136,42,0.12)', border: '1px solid rgba(201,136,42,0.3)' }}>
            <span style={{ fontSize: 20 }}>✓</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#C9882A' }}>You are in. Check your email for your beta confirmation.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleJoin}
              disabled={joining || isFull}
              style={{
                height: 52, padding: '0 36px', borderRadius: 12,
                background: isFull ? 'rgba(255,255,255,0.1)' : '#C9882A',
                color: 'white', border: 'none', fontSize: 15, fontWeight: 700,
                cursor: joining || isFull ? 'not-allowed' : 'pointer',
                opacity: joining ? 0.7 : 1,
                fontFamily: 'var(--font-body)',
              }}
            >
              {joining ? 'Claiming your spot...' : isFull ? 'All spots taken' : 'Claim your free spot'}
            </button>
            {error && <p style={{ fontSize: 13, color: '#F87171' }}>{error}</p>}
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Requires a free account. Takes 30 seconds.</p>
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </section>
  )
}

// ─── Navigation ──────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      style={{
        position: 'sticky',
        top: 24,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 24px',
        pointerEvents: 'none',
      }}
    >
      <nav
        style={{
          width: '100%',
          maxWidth: 900,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          borderRadius: 100,
          background: scrolled
            ? 'rgba(255,255,255,0.92)'
            : 'rgba(255,255,255,0.80)',
          border: '1px solid var(--border)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: scrolled ? 'var(--shadow-md)' : 'var(--shadow-sm)',
          transition: 'background 300ms ease, box-shadow 300ms ease',
          pointerEvents: 'auto',
        }}
      >
        <Logo size="md" />
        <div className="hidden sm:flex items-center gap-6">
          <Link
            href="#pricing"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontFamily: 'var(--font-body)',
            }}
          >
            Pricing
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            href="/auth"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontFamily: 'var(--font-body)',
            }}
          >
            Sign in
          </Link>
          <Link href="/auth?mode=signup" className="btn-pill-navy" style={{ padding: '10px 20px', fontSize: 14 }}>
            Get started free
          </Link>
        </div>
      </nav>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [hoveredPainCard, setHoveredPainCard] = useState<number | null>(null)
  const [hoveredTrustCard, setHoveredTrustCard] = useState<number | null>(null)

  return (
    <main style={{ background: 'var(--off-white)', overflowX: 'hidden' }}>
      <Nav />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px 100px',
          background: 'var(--off-white)',
        }}
      >
        <div
          style={{
            maxWidth: 760,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <AnimatedHeadline />

          {/* Gold killer line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.9 }}
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: 20,
              color: 'var(--gold)',
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            Upload your passport once. AVA pre-fills every field on every future application.
          </motion.p>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE, delay: 1.1 }}
            style={{
              fontSize: 18,
              fontFamily: 'var(--font-body)',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              maxWidth: 560,
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            AVA reads your documents, prepares your complete application, and tells you exactly what to do next. No government portals. No confusing forms. No rejected applications.
          </motion.p>

          {/* Supporting line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: EASE, delay: 1.2 }}
            style={{
              fontSize: 14,
              color: 'var(--text-tertiary)',
              fontFamily: 'var(--font-body)',
              marginBottom: 40,
              textAlign: 'center',
            }}
          >
            Government paperwork, handled.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 1.3 }}
            style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}
          >
            <Link href="/auth?mode=signup" className="btn-pill-navy">
              Start your OCI application
            </Link>
            <Link
              href="#how-it-works"
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: 'var(--navy)',
                fontFamily: 'var(--font-display)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              See how it works →
            </Link>
          </motion.div>

          {/* Micro-trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 1.5 }}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              justifyContent: 'center',
              marginBottom: 80,
            }}
          >
            {[
              { icon: Lock, label: 'End-to-end encrypted' },
              { icon: Shield, label: 'No human sees your docs' },
              { icon: Check, label: 'Fix rejections free' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 100,
                  border: '1px solid var(--border)',
                  background: 'var(--white)',
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <Icon size={12} style={{ color: 'var(--gold)' }} />
                {label}
              </div>
            ))}
          </motion.div>

          {/* Decorative doc card */}
          <DocumentCard />
        </div>
      </section>

      {/* ── SOUND FAMILIAR ───────────────────────────────────────────────── */}
      <section
        id="sound-familiar"
        style={{
          background: '#0A1628',
          padding: '100px 24px',
        }}
      >
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(28px, 4vw, 44px)',
              color: 'white',
              textAlign: 'center',
              marginBottom: 16,
              letterSpacing: '-0.02em',
            }}
          >
            Sound familiar?
          </motion.h2>

          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            custom={0.08}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 18,
              color: 'rgba(255,255,255,0.6)',
              textAlign: 'center',
              maxWidth: 560,
              margin: '0 auto 60px',
            }}
          >
            These are the most common reasons OCI applications get rejected.
          </motion.p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
              maxWidth: 960,
              margin: '0 auto 60px',
            }}
          >
            {PAIN_POINTS.map((point, i) => (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, ease: EASE, delay: i * 0.08 }}
                onMouseEnter={() => setHoveredPainCard(i)}
                onMouseLeave={() => setHoveredPainCard(null)}
                style={{
                  background: hoveredPainCard === i ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  padding: 20,
                  transition: 'background 200ms ease',
                  cursor: 'default',
                }}
              >
                <X size={24} style={{ color: '#EF4444', marginBottom: 12 }} />
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    fontSize: 16,
                    color: 'white',
                    marginBottom: 4,
                    margin: '0 0 4px 0',
                  }}
                >
                  {point.title}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.6)',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {point.body}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            custom={0.3}
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: 18,
              color: 'var(--gold)',
              textAlign: 'center',
              marginBottom: 28,
            }}
          >
            AVA checks all of these before you submit.
          </motion.p>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            custom={0.4}
            style={{ textAlign: 'center' }}
          >
            <Link
              href="/auth?mode=signup"
              style={{
                display: 'inline-block',
                padding: '12px 28px',
                borderRadius: 100,
                border: '1.5px solid var(--gold)',
                color: 'var(--gold)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
                background: 'transparent',
              }}
            >
              Start your OCI application
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── TWO STEPS ────────────────────────────────────────────────────── */}
      <section
        style={{
          background: 'var(--navy)',
          padding: '100px 24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative large numbers */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            left: '5%',
            transform: 'translateY(-50%)',
            fontSize: 180,
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            color: 'var(--gold)',
            opacity: 0.06,
            lineHeight: 1,
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          01
        </div>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            right: '5%',
            transform: 'translateY(-50%)',
            fontSize: 180,
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            color: 'var(--gold)',
            opacity: 0.06,
            lineHeight: 1,
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          02
        </div>

        <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(28px, 4vw, 44px)',
              color: 'white',
              textAlign: 'center',
              marginBottom: 64,
              letterSpacing: '-0.02em',
            }}
          >
            Two things. That&apos;s all we ask.
          </motion.h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 32,
            }}
          >
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: EASE, delay: 0.1 }}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20,
                padding: 40,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--gold)',
                  letterSpacing: '0.1em',
                  marginBottom: 16,
                  textTransform: 'uppercase',
                }}
              >
                01
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 22,
                  color: 'white',
                  marginBottom: 12,
                  lineHeight: 1.3,
                }}
              >
                Pay the government fee
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 16,
                  color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                AVA opens the payment page pre-filled. One tap.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: EASE, delay: 0.2 }}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20,
                padding: 40,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--gold)',
                  letterSpacing: '0.1em',
                  marginBottom: 16,
                  textTransform: 'uppercase',
                }}
              >
                02
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 22,
                  color: 'white',
                  marginBottom: 12,
                  lineHeight: 1.3,
                }}
              >
                Drop an envelope at UPS
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 16,
                  color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Your package is printed, signed, addressed. Five minutes.
              </p>
            </motion.div>
          </div>

          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            custom={0.4}
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 18,
              color: 'rgba(255,255,255,0.5)',
              textAlign: 'center',
              marginTop: 48,
              marginBottom: 0,
            }}
          >
            Everything else? AVA.
          </motion.p>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        style={{ background: 'var(--off-white)', padding: '100px 24px', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            custom={0}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              textAlign: 'center',
              marginBottom: 16,
            }}
          >
            How it works
          </motion.p>

          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0.05}
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(26px, 4vw, 38px)',
              color: 'var(--navy)',
              textAlign: 'center',
              marginBottom: 72,
              lineHeight: 1.25,
              letterSpacing: '-0.01em',
            }}
          >
            Three steps. Nothing more.
          </motion.h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={item.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.2}
                style={{ display: 'flex', gap: 28, alignItems: 'flex-start', paddingBottom: i < HOW_IT_WORKS.length - 1 ? 0 : 0 }}
              >
                {/* Step number + connecting line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: 64,
                      color: 'var(--gold)',
                      opacity: 0.35,
                      lineHeight: 1,
                      width: 72,
                      textAlign: 'right',
                    }}
                  >
                    {item.step}
                  </div>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div
                      style={{
                        width: 2,
                        height: 48,
                        background: 'rgba(201,136,42,0.25)',
                        marginTop: 8,
                        marginBottom: 8,
                        alignSelf: 'center',
                      }}
                    />
                  )}
                </div>

                <div style={{ paddingTop: 8, paddingBottom: i < HOW_IT_WORKS.length - 1 ? 48 : 0 }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: 22,
                      color: 'var(--navy)',
                      marginBottom: 10,
                      lineHeight: 1.3,
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 16,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {item.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AVA FILLS THE PORTALS ─────────────────────────────────────────── */}
      <section
        id="ava-fills"
        style={{
          background: '#FAFAF8',
          padding: '100px 24px',
        }}
      >
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(24px, 3vw, 36px)',
              color: 'var(--navy)',
              textAlign: 'center',
              marginBottom: 16,
              letterSpacing: '-0.02em',
            }}
          >
            AVA fills the portals. You stay in control.
          </motion.h2>

          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            custom={0.08}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 18,
              color: 'var(--text-secondary)',
              textAlign: 'center',
              maxWidth: 520,
              margin: '0 auto 64px',
            }}
          >
            Your credentials never leave your hands. Your documents never leave your locker.
          </motion.p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 40,
              maxWidth: 860,
              margin: '0 auto',
            }}
          >
            {AVA_FILLS_COLUMNS.map((col, i) => (
              <motion.div
                key={col.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.1}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'var(--gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <col.icon size={22} style={{ color: 'white' }} />
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    fontSize: 18,
                    color: 'var(--navy)',
                    margin: 0,
                  }}
                >
                  {col.title}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 15,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {col.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST SECTION ────────────────────────────────────────────────── */}
      <section
        style={{
          background: 'white',
          padding: '100px 24px',
        }}
      >
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(24px, 3vw, 36px)',
              color: 'var(--navy)',
              textAlign: 'center',
              marginBottom: 16,
              letterSpacing: '-0.02em',
            }}
          >
            Built to be trusted with your most important documents.
          </motion.h2>

          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            custom={0.08}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 18,
              color: 'var(--text-secondary)',
              textAlign: 'center',
              maxWidth: 560,
              margin: '0 auto 64px',
            }}
          >
            We know what we&apos;re asking you to upload. Here&apos;s exactly how we protect it.
          </motion.p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 24,
              maxWidth: 760,
              margin: '0 auto',
            }}
          >
            {TRUST_CARDS.map((card, i) => (
              <motion.div
                key={card.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.1}
                onMouseEnter={() => setHoveredTrustCard(i)}
                onMouseLeave={() => setHoveredTrustCard(null)}
                style={{
                  background: 'white',
                  boxShadow: hoveredTrustCard === i ? 'var(--shadow-lg)' : 'var(--shadow-md)',
                  borderRadius: 16,
                  padding: 28,
                  cursor: 'default',
                  transform: hoveredTrustCard === i ? 'translateY(-4px)' : 'translateY(0)',
                  transition: 'transform 200ms ease, box-shadow 200ms ease',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'rgba(201,136,42,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <card.icon size={20} style={{ color: 'var(--gold)' }} />
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    fontSize: 17,
                    color: 'var(--navy)',
                    marginBottom: 8,
                    margin: '0 0 8px 0',
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {card.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GUARANTEE ────────────────────────────────────────────────────── */}
      <section
        style={{
          background: '#C9882A',
          padding: '100px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: EASE }}
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <ShieldCheck size={64} style={{ color: 'white' }} />
          </motion.div>

          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0.1}
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(28px, 4vw, 44px)',
              color: 'white',
              marginTop: 24,
              letterSpacing: '-0.02em',
            }}
          >
            The Avasafe Guarantee
          </motion.h2>

          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            custom={0.2}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 18,
              color: 'white',
              lineHeight: 1.7,
              marginTop: 16,
            }}
          >
            If your application is rejected due to an error in AVA&apos;s validation, we will prepare your resubmission at no cost.
          </motion.p>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            custom={0.3}
            style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 1.6 }}>
              <strong style={{ color: 'white' }}>Covered:</strong> field values AVA validated as correct, checks AVA marked as passed that were actually wrong.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
              <strong style={{ color: 'rgba(255,255,255,0.9)' }}>Not covered:</strong> missing documents you chose not to upload, information you entered incorrectly, government portal errors, or processing delays.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── BETA SECTION ─────────────────────────────────────────────────── */}
      <BetaSection />

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section
        id="pricing"
        style={{
          background: 'var(--off-white)',
          padding: '100px 24px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(26px, 4vw, 38px)',
              color: 'var(--navy)',
              textAlign: 'center',
              marginBottom: 12,
              letterSpacing: '-0.01em',
            }}
          >
            One locker. Every application.
          </motion.h2>

          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            custom={0.1}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 17,
              color: 'var(--text-secondary)',
              textAlign: 'center',
              marginBottom: 64,
            }}
          >
            Store your documents once. Use them forever.
          </motion.p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 20,
              alignItems: 'start',
            }}
          >
            {PRICING.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.08}
                whileHover={{
                  y: plan.highlighted ? -4 : -4,
                  boxShadow: plan.highlighted ? 'var(--shadow-gold)' : 'var(--shadow-md)',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                style={{
                  background: plan.highlighted ? 'var(--white)' : 'var(--surface)',
                  border: plan.highlighted
                    ? '2px solid var(--gold)'
                    : plan.name === 'Expert Session'
                    ? '1.5px solid var(--navy)'
                    : plan.name === 'Free'
                    ? '1.5px solid var(--border)'
                    : '1px solid var(--border)',
                  borderRadius: 16,
                  boxShadow: plan.highlighted ? 'var(--shadow-gold)' : 'var(--shadow-sm)',
                  padding: 28,
                  display: 'flex',
                  flexDirection: 'column',
                  transform: plan.highlighted ? 'scale(1.03)' : 'scale(1)',
                  position: 'relative',
                }}
              >
                {plan.badge && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -13,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: plan.highlighted ? 'var(--gold)' : 'var(--navy)',
                      color: 'white',
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: 'var(--font-body)',
                      padding: '4px 14px',
                      borderRadius: 100,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {plan.badge}
                  </div>
                )}

                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: 'var(--font-body)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: plan.highlighted ? 'var(--gold)' : 'var(--text-tertiary)',
                    marginBottom: 12,
                  }}
                >
                  {plan.name}
                </p>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: 40,
                      color: 'var(--navy)',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {plan.price}
                  </span>
                  <span style={{ fontSize: 14, color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
                    {plan.period}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: 14,
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-body)',
                    marginBottom: 24,
                    lineHeight: 1.5,
                  }}
                >
                  {plan.description}
                </p>

                <ul
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    marginBottom: 28,
                    flex: 1,
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 28px 0',
                  }}
                >
                  {plan.features.map((feature) => (
                    <li
                      key={feature.text}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        fontSize: 14,
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {feature.included ? (
                        <>
                          <span style={{ color: 'var(--success)', flexShrink: 0, marginTop: 1 }}>✓</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{feature.text}</span>
                        </>
                      ) : (
                        <>
                          <span style={{ color: 'var(--text-tertiary)', flexShrink: 0, marginTop: 1 }}>✗</span>
                          <span style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                            {feature.text}
                            <span
                              style={{
                                display: 'inline-flex',
                                marginLeft: 8,
                                padding: '2px 8px',
                                borderRadius: 8,
                                border: '1px solid var(--gold)',
                                color: 'var(--gold)',
                                fontSize: 11,
                                fontFamily: 'var(--font-body)',
                              }}
                            >
                              Upgrade
                            </span>
                          </span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    borderRadius: 100,
                    padding: '12px 20px',
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: 'var(--font-display)',
                    textDecoration: 'none',
                    background: plan.highlighted
                      ? 'var(--gold)'
                      : plan.name === 'Free'
                      ? 'white'
                      : 'var(--navy)',
                    color: plan.name === 'Free' ? 'var(--navy)' : 'white',
                    border: plan.name === 'Free' ? '1.5px solid var(--navy)' : 'none',
                    transition: 'background 200ms ease, transform 150ms ease',
                  }}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            custom={0.3}
            style={{
              textAlign: 'center',
              marginTop: 40,
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              color: 'var(--text-secondary)',
            }}
          >
            No subscriptions for applications. Pay only when you apply.{' '}
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Locker is the only recurring charge.</span>
          </motion.p>

          <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
            Most OCI applications take 5-8 weeks after VFS receives your documents. Apply early.
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: '100px 24px', background: 'var(--white)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(24px, 3vw, 32px)',
              color: 'var(--navy)',
              textAlign: 'center',
              marginBottom: 48,
              letterSpacing: '-0.01em',
            }}
          >
            Common questions
          </motion.h2>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0.1}
          >
            <FaqAccordion items={FAQ} />
          </motion.div>
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────────────────────── */}
      <section
        style={{
          background: 'var(--navy)',
          padding: '100px 24px',
          textAlign: 'center',
        }}
      >
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 'clamp(28px, 5vw, 52px)',
            color: 'white',
            marginBottom: 16,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}
        >
          Ready to never touch a government portal again?
        </motion.h2>

        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          custom={0.1}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 17,
            color: 'var(--gold)',
            marginBottom: 40,
          }}
        >
          Takes 2 minutes. No credit card needed.
        </motion.p>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0.2}
        >
          <Link href="/auth?mode=signup" className="btn-pill-white">
            Start your OCI application
          </Link>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer
        style={{
          background: 'var(--off-white)',
          borderTop: '1px solid var(--border)',
          padding: '32px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Logo size="sm" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <p
            style={{
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              color: 'var(--text-tertiary)',
              margin: 0,
            }}
          >
            &copy; 2026 Avasafe AI
          </p>
          <Link
            href="/privacy"
            style={{
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              color: 'var(--text-tertiary)',
              textDecoration: 'none',
            }}
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            style={{
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              color: 'var(--text-tertiary)',
              textDecoration: 'none',
            }}
          >
            Terms
          </Link>
        </div>
      </footer>
    </main>
  )
}
