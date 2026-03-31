import Link from 'next/link'
import { Lock, Shield, Star, ChevronDown } from 'lucide-react'

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Upload your documents',
    body: 'AVA reads your passports and documents using AI — extracting every field instantly. You upload once and reuse forever.',
  },
  {
    step: '02',
    title: 'AVA prepares everything',
    body: 'AVA fills both the government portal and VFS portal automatically, validates against every known rejection cause, and generates your complete mailing package.',
  },
  {
    step: '03',
    title: 'Two steps. You\'re done.',
    body: 'Pay the government fee with one tap. Drop an envelope at UPS. AVA handles every other step — and tracks your application to approval.',
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

const FAQ = [
  {
    q: 'Is it safe to upload my passport?',
    a: 'Your documents are encrypted at rest and in transit using AES-256. No human ever sees them — AI processes everything automatically. Raw images are deleted after extraction, only structured data is stored.',
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
    q: 'What if my application gets rejected?',
    a: 'If the rejection is caused by an error in AVA\'s validation, we fix your application at no cost. Our validation checks every known rejection cause before you pay.',
  },
  {
    q: 'What about complex edge cases — name changes, previous rejections, etc.?',
    a: 'AVA handles most cases automatically. For genuine edge cases, human support is available for Locker + Apply and Family plan members.',
  },
]

export default function HomePage() {
  return (
    <main style={{ background: 'var(--color-background)' }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b"
        style={{ background: 'rgba(250,250,248,0.95)', backdropFilter: 'blur(8px)', borderColor: 'var(--color-border)' }}>
        <span className="font-display font-semibold text-lg tracking-tight" style={{ color: 'var(--color-navy)' }}>
          Avasafe AI
        </span>
        <div className="flex items-center gap-6">
          <Link href="#pricing" className="text-sm hidden sm:block" style={{ color: 'var(--color-text-secondary)' }}>
            Pricing
          </Link>
          <Link href="/auth" className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Sign in
          </Link>
          <Link href="/auth?mode=signup" className="btn-gold text-sm px-5 py-2.5 rounded-lg font-medium inline-block">
            Start free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6" style={{ background: 'var(--color-navy)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-medium tracking-wide uppercase"
            style={{ background: 'rgba(201,136,42,0.15)', color: 'var(--color-gold)', border: '1px solid rgba(201,136,42,0.3)' }}>
            OCI Card · Passport Renewal
          </div>

          <h1 className="font-display text-5xl sm:text-6xl leading-tight text-white mb-6 text-balance">
            Your OCI card.<br />
            Your passport renewal.<br />
            <em>Done in minutes, not weeks.</em>
          </h1>

          <p className="text-lg mb-10 text-balance max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.7)' }}>
            AVA securely stores your documents and automatically prepares every application
            — so you never have to navigate a government portal again.
          </p>

          <Link href="/auth?mode=signup"
            className="inline-flex items-center gap-2 btn-gold text-base px-8 py-4 rounded-xl">
            Start for free
            <span aria-hidden>→</span>
          </Link>
          <p className="mt-4 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            No credit card required · Cancel anytime
          </p>

          {/* Two-step promise */}
          <div className="mt-16 grid sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            <div className="rounded-xl p-5 text-left" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="font-mono text-xs mb-2" style={{ color: 'var(--color-gold)' }}>Step 1 of 2</div>
              <p className="text-white font-medium text-sm">Pay the government fee</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>AVA pre-fills it. One tap. 30 seconds.</p>
            </div>
            <div className="rounded-xl p-5 text-left" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="font-mono text-xs mb-2" style={{ color: 'var(--color-gold)' }}>Step 2 of 2</div>
              <p className="text-white font-medium text-sm">Drop envelope at UPS</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Label included. 5 minutes. Any location.</p>
            </div>
          </div>
          <p className="mt-4 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
            AVA handles every other step.
          </p>
        </div>
      </section>

      {/* Trust signals */}
      <section className="px-6 py-12" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(15,45,82,0.08)' }}>
              <Lock size={16} style={{ color: 'var(--color-navy)' }} />
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>Bank-level encryption</p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>AES-256, zero-knowledge storage</p>
            </div>
          </div>
          <div className="w-px h-8 hidden sm:block" style={{ background: 'var(--color-border)' }} />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(15,45,82,0.08)' }}>
              <Shield size={16} style={{ color: 'var(--color-navy)' }} />
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>No human sees your documents</p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>AI-only processing, technically enforced</p>
            </div>
          </div>
          <div className="w-px h-8 hidden sm:block" style={{ background: 'var(--color-border)' }} />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(15,45,82,0.08)' }}>
              <Star size={16} style={{ color: 'var(--color-navy)' }} />
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>Rejection guarantee</p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>We fix it free if our validation fails you</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-24">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-medium uppercase tracking-widest text-center mb-4" style={{ color: 'var(--color-gold)' }}>
            How it works
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-center mb-16 text-balance" style={{ color: 'var(--color-navy)' }}>
            Unlike Documitra, AVA doesn&apos;t guide you.<br />
            <em>She does it for you.</em>
          </h2>

          <div className="flex flex-col gap-12">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="flex gap-8 items-start">
                <div className="font-display text-4xl font-semibold flex-shrink-0 w-14 text-right leading-none pt-1"
                  style={{ color: 'rgba(15,45,82,0.15)' }}>
                  {item.step}
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--color-navy)' }}>
                    {item.title}
                  </h3>
                  <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Competitor callout */}
          <div className="mt-16 rounded-xl p-6" style={{ background: 'rgba(15,45,82,0.04)', border: '1px solid rgba(15,45,82,0.1)' }}>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>
              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Unlike services that send your passport details over WhatsApp</span>{' '}
              — Avasafe handles everything automatically. No humans. No risk. Just done.
            </p>
            <p className="text-xs mt-3 font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
              Documitra is the travel agent. Avasafe AI is Expedia.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24" style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-medium uppercase tracking-widest text-center mb-4" style={{ color: 'var(--color-gold)' }}>
            Pricing
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-center mb-4 text-balance" style={{ color: 'var(--color-navy)' }}>
            Simple, transparent pricing
          </h2>
          <p className="text-center mb-16" style={{ color: 'var(--color-text-secondary)' }}>
            + $29 per application on Locker + Apply and Family plans
          </p>

          <div className="grid sm:grid-cols-3 gap-6">
            {PRICING.map((plan) => (
              <div key={plan.name}
                className="rounded-xl p-6 flex flex-col"
                style={{
                  background: plan.highlighted ? 'var(--color-navy)' : 'var(--color-background)',
                  border: plan.highlighted ? 'none' : '1px solid var(--color-border)',
                  boxShadow: plan.highlighted ? '0 8px 32px rgba(15,45,82,0.25)' : '0 1px 3px rgba(0,0,0,0.06)',
                }}>
                <p className="text-xs font-medium uppercase tracking-wide mb-3"
                  style={{ color: plan.highlighted ? 'var(--color-gold)' : 'var(--color-text-tertiary)' }}>
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-display text-4xl font-semibold"
                    style={{ color: plan.highlighted ? 'white' : 'var(--color-navy)' }}>
                    {plan.price}
                  </span>
                  <span className="text-sm" style={{ color: plan.highlighted ? 'rgba(255,255,255,0.5)' : 'var(--color-text-tertiary)' }}>
                    {plan.period}
                  </span>
                </div>
                <p className="text-sm mb-6" style={{ color: plan.highlighted ? 'rgba(255,255,255,0.6)' : 'var(--color-text-secondary)' }}>
                  {plan.description}
                </p>
                <ul className="flex flex-col gap-2 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 flex-shrink-0" style={{ color: plan.highlighted ? 'var(--color-gold)' : 'var(--color-success)' }}>✓</span>
                      <span style={{ color: plan.highlighted ? 'rgba(255,255,255,0.8)' : 'var(--color-text-secondary)' }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/auth?mode=signup"
                  className="block text-center rounded-xl py-3 text-sm font-medium transition-colors"
                  style={{
                    background: plan.highlighted ? 'var(--color-gold)' : 'transparent',
                    color: plan.highlighted ? 'white' : 'var(--color-navy)',
                    border: plan.highlighted ? 'none' : '1px solid var(--color-navy)',
                  }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center mt-8 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Rejection guarantee included</span>{' '}
            on all Locker + Apply and Family applications.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-24">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl text-center mb-12" style={{ color: 'var(--color-navy)' }}>
            Common questions
          </h2>
          <div className="flex flex-col gap-0">
            {FAQ.map((item, i) => (
              <div key={i}
                className="py-6"
                style={{ borderBottom: i < FAQ.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.q}</h3>
                  <ChevronDown size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-text-tertiary)' }} />
                </div>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 py-24 text-center" style={{ background: 'var(--color-navy)' }}>
        <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--color-gold)' }}>
          Get started today
        </p>
        <h2 className="font-display text-4xl sm:text-5xl text-white mb-6 text-balance">
          Apply once.<br /><em>Reuse everywhere.</em>
        </h2>
        <p className="mb-10 text-balance" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Your documents, safe. Your applications, done.
        </p>
        <Link href="/auth?mode=signup" className="inline-flex items-center gap-2 btn-gold text-base px-8 py-4 rounded-xl">
          Start for free →
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-sm" style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-text-tertiary)' }}>
        © {new Date().getFullYear()} Avasafe AI · Your documents, safe. Your applications, done.
      </footer>
    </main>
  )
}
