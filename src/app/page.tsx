'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, Shield, Star } from 'lucide-react'
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
    title: 'Upload your documents once',
    body: 'Take a photo of your passport. AVA reads every field in seconds. You confirm. Done. Every future application starts from here.',
  },
  {
    step: '02',
    title: 'Tell AVA what you need',
    body: 'Starting an OCI application? Renewing your passport? AVA already has what she needs. Review your pre-filled application in minutes, not hours.',
  },
  {
    step: '03',
    title: 'Two steps and you\'re done',
    body: 'Pay the government fee with one tap. Drop the envelope AVA prepared at any UPS location. AVA tracks everything and updates you at every step.',
  },
]

const PRICING = [
  {
    name: 'Locker',
    price: '$19',
    period: '/year',
    description: 'Secure document storage for life',
    features: [
      'Store all your identity documents',
      'AI extraction of every field',
      'Smart expiry alerts',
      '2 family profiles',
    ],
    cta: 'Start free',
    highlighted: false,
  },
  {
    name: 'Locker + Apply',
    price: '$49',
    period: '/year',
    description: 'Plus automated application prep',
    features: [
      'Everything in Locker',
      'Automated OCI + passport renewal',
      'Complete PDF mailing package',
      '$29 per application',
      '5 family profiles',
      'Rejection guarantee',
    ],
    cta: 'Start free',
    highlighted: true,
  },
  {
    name: 'Family',
    price: '$99',
    period: '/year',
    description: 'For the whole family',
    features: [
      'Everything in Locker + Apply',
      'Unlimited family profiles',
      'Shared family locker',
      '$29 per application',
      'Priority support',
    ],
    cta: 'Start free',
    highlighted: false,
  },
]

const TRUST_SIGNALS = [
  {
    icon: Shield,
    title: 'Your passport never leaves your locker',
    body: 'No human at Avasafe ever sees your documents. Ever.',
  },
  {
    icon: Star,
    title: 'If we make a mistake, we fix it free',
    body: 'Our validation catches rejections before they happen. If we miss one, your next application is on us.',
  },
  {
    icon: Lock,
    title: 'As secure as your bank',
    body: 'AES-256 encryption. The same standard used by financial institutions worldwide.',
  },
]

const FAQ = [
  {
    q: 'Is it safe to upload my passport?',
    a: 'Your documents are encrypted at rest and in transit using AES-256. No human ever sees them — AI processes everything automatically. Raw images are deleted immediately after extraction; only structured data is stored.',
  },
  {
    q: 'What exactly does AVA do for my OCI application?',
    a: 'AVA fills both the Indian government portal and the VFS Global portal automatically — every field, every document upload. She captures your ARN, generates a pre-addressed shipping label, and assembles a complete PDF package ready to mail.',
  },
  {
    q: 'What do I actually need to do myself?',
    a: 'Two things only. Pay the government fee directly (one tap — AVA opens the pre-filled payment page). Drop an envelope at UPS. That\'s it. About 10 minutes total.',
  },
  {
    q: 'How is this different from human-powered services?',
    a: 'Traditional services require you to send your passport details to a human via WhatsApp or email. Avasafe is fully automated — no human ever touches your documents. Your data never leaves our encrypted system.',
  },
  {
    q: 'What if my application gets rejected?',
    a: 'If the rejection is caused by an error in AVA\'s validation, we fix your application at no cost. Our validation checks every known rejection cause before you pay.',
  },
  {
    q: 'What about complex edge cases — name changes, previous rejections?',
    a: 'AVA handles most cases automatically. For genuine edge cases, human support is available for Locker + Apply and Family plan members.',
  },
]

// ─── Hero word-by-word animation ────────────────────────────────────────────
const HEADLINE = 'Government paperwork, handled.'

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

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE, delay: 1.0 }}
            style={{
              fontSize: 20,
              fontFamily: 'var(--font-body)',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              maxWidth: 600,
              marginBottom: 40,
            }}
          >
            Upload your passport once. AVA fills every application, validates every field, and
            prepares your complete mailing package. You drop an envelope at UPS. That&apos;s it.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 1.3 }}
            style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}
          >
            <Link href="/auth?mode=signup" className="btn-pill-navy">
              Get started free
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

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: EASE, delay: 1.5 }}
            style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 48, fontFamily: 'var(--font-body)' }}
          >
            No credit card needed. Cancel anytime.
          </motion.p>

          {/* Micro-trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 1.6 }}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              justifyContent: 'center',
              marginBottom: 80,
            }}
          >
            {[
              { icon: Lock, label: '256-bit encrypted' },
              { icon: Shield, label: 'No human access' },
              { icon: Star, label: 'Free fix guarantee' },
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
              fontSize: 20,
              color: 'var(--gold)',
              textAlign: 'center',
              marginTop: 56,
              marginBottom: 0,
            }}
          >
            Everything else? AVA.
          </motion.p>
        </div>
      </section>

      {/* ── TRUST SIGNALS ────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--off-white)', padding: '100px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
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
              marginBottom: 56,
            }}
          >
            Why teams trust Avasafe
          </motion.p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 24,
            }}
          >
            {TRUST_SIGNALS.map(({ icon: Icon, title, body }, i) => (
              <motion.div
                key={title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.08}
                whileHover={{ y: -6, boxShadow: 'var(--shadow-lg)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                style={{
                  background: 'var(--white)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  boxShadow: 'var(--shadow-md)',
                  padding: 32,
                  cursor: 'default',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'rgba(201,136,42,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                  }}
                >
                  <Icon size={22} style={{ color: 'var(--gold)' }} />
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: 18,
                    color: 'var(--navy)',
                    marginBottom: 10,
                    lineHeight: 1.35,
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 15,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        style={{ background: 'var(--navy)', padding: '100px 24px', position: 'relative', overflow: 'hidden' }}
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
              color: 'white',
              textAlign: 'center',
              marginBottom: 72,
              lineHeight: 1.25,
              letterSpacing: '-0.01em',
            }}
          >
            Here&apos;s what happens after you sign up
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
                      color: 'white',
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
                      color: 'rgba(255,255,255,0.65)',
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

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section
        id="pricing"
        style={{
          background: 'var(--off-white)',
          padding: '100px 24px',
          borderTop: '1px solid var(--border)',
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
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
                whileHover={{ y: -4, boxShadow: plan.highlighted ? 'var(--shadow-gold)' : 'var(--shadow-md)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                style={{
                  background: plan.highlighted ? 'var(--white)' : 'var(--surface)',
                  border: plan.highlighted ? '2px solid var(--gold)' : '1px solid var(--border)',
                  borderRadius: 16,
                  boxShadow: plan.highlighted ? 'var(--shadow-gold)' : 'var(--shadow-sm)',
                  padding: 28,
                  display: 'flex',
                  flexDirection: 'column',
                  transform: plan.highlighted ? 'scale(1.04)' : 'scale(1)',
                  position: 'relative',
                }}
              >
                {plan.highlighted && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -13,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'var(--gold)',
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
                    Most popular
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

                <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28, flex: 1, listStyle: 'none', padding: 0, margin: '0 0 28px 0' }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, fontFamily: 'var(--font-body)' }}>
                      <span style={{ color: 'var(--success)', flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth?mode=signup"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    borderRadius: 100,
                    padding: '12px 20px',
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: 'var(--font-display)',
                    textDecoration: 'none',
                    background: plan.highlighted ? 'var(--navy)' : 'transparent',
                    color: plan.highlighted ? 'white' : 'var(--navy)',
                    border: plan.highlighted ? 'none' : '1.5px solid var(--navy)',
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
              fontSize: 14,
              fontFamily: 'var(--font-body)',
              color: 'var(--text-secondary)',
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Rejection guarantee included</span>{' '}
            on all Locker + Apply and Family applications.
          </motion.p>
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
            Get started free
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
        <p
          style={{
            fontSize: 13,
            fontFamily: 'var(--font-body)',
            color: 'var(--text-tertiary)',
          }}
        >
          &copy; 2026 Avasafe AI
        </p>
      </footer>
    </main>
  )
}
