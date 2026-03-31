import Link from 'next/link'

const TRUST_SIGNALS = [
  {
    icon: '🔒',
    title: 'Bank-level encryption',
    desc: 'Your data is encrypted in transit and at rest.',
  },
  {
    icon: '👁️',
    title: 'No human sees your documents',
    desc: 'AI-only processing — technically enforced, not just promised.',
  },
  {
    icon: '✅',
    title: '98% first-time approval rate',
    desc: 'AVA catches errors before you submit.',
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
        <span className="font-bold text-lg tracking-tight text-slate-900">Avasafe AI</span>
        <Link
          href="/auth"
          className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <span className="inline-block mb-4 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold tracking-wide uppercase">
          OCI Card Applications
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 max-w-2xl leading-tight text-balance">
          Apply for your OCI card without the headache.
        </h1>
        <p className="mt-4 text-lg text-slate-500 max-w-xl text-balance">
          AI-powered. Self-serve. No human ever sees your documents.
        </p>
        <Link
          href="/apply"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-white font-semibold text-base hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Start your application
          <span aria-hidden>→</span>
        </Link>
        <p className="mt-3 text-sm text-slate-400">$39 · No hidden fees · Refund if rejected</p>
      </section>

      {/* Trust signals */}
      <section className="border-t border-slate-100 bg-slate-50 px-6 py-16">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-8">
          {TRUST_SIGNALS.map((s) => (
            <div key={s.title} className="flex flex-col items-center text-center gap-3">
              <span className="text-3xl">{s.icon}</span>
              <h3 className="font-semibold text-slate-900">{s.title}</h3>
              <p className="text-sm text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-slate-100 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Avasafe AI · Apply once. Reuse everywhere.
      </footer>
    </main>
  )
}
