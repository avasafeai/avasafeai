import Link from 'next/link'
import Logo from '@/components/Logo'
import CopyEmailButton from '@/components/CopyEmailButton'

export const metadata = { title: 'Privacy Policy | Avasafe AI' }

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--off-white)' }}>
      <header style={{ background: 'white', borderBottom: '1px solid var(--border)', height: 64, display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <Logo size="sm" href="/dashboard" />
      </header>

      <article style={{ maxWidth: 680, margin: '0 auto', padding: '56px 24px 100px' }}>
        <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', letterSpacing: '0.06em', marginBottom: 12 }}>LAST UPDATED: APRIL 2026</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36, color: 'var(--navy)', marginBottom: 8, lineHeight: 1.2 }}>Privacy Policy</h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 40 }}>
          Avasafe AI (&quot;we&quot;, &quot;our&quot;, or &quot;AVA&quot;) is built on a simple principle: your documents are yours. This policy explains exactly what we collect, how we use it, and what we never do.
        </p>

        <Section title="What we collect">
          <p>When you create an account, we collect your email address and the name you provide. When you upload a document, we use AI to extract structured data fields (such as your name, date of birth, and passport number) from the image. We store those extracted fields in your encrypted locker. The raw document image is deleted after extraction is complete.</p>
          <p style={{ marginTop: 12 }}>When you fill out an application, we store the form data you enter in association with your account. When you pay, Stripe processes your payment. We receive a confirmation and the amount. We never receive or store your full card number.</p>
          <p style={{ marginTop: 12 }}>We collect basic usage logs (page views, errors) to help us fix bugs and improve the product. These logs do not contain the content of your documents.</p>
        </Section>

        <Section title="What we never do">
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              'We never sell your data to any third party.',
              'We never share your documents or extracted data with any third party except as required to deliver the service (for example, sending your name to Stripe for a payment).',
              'No human employee at Avasafe can view the contents of your documents. AI processes them. Humans do not.',
              'We do not use your documents to train AI models.',
            ].map(item => (
              <li key={item} style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item}</li>
            ))}
          </ul>
        </Section>

        <Section title="How we protect your data">
          <p>Your documents and extracted data are encrypted at rest using AES-256. All data is transmitted over HTTPS. Encryption keys are managed via Google Cloud KMS and are not directly accessible to Avasafe employees. Your files are stored in a private Supabase Storage bucket scoped to your user ID only. Row-level security policies on our database ensure you can only read and write your own data.</p>
        </Section>

        <Section title="Data retention and deletion">
          <p>You can delete any document or your entire account at any time from your account settings. When you delete a document, the extracted data and any stored file are permanently removed within 24 hours. When you delete your account, all data associated with your account is permanently deleted within 24 hours. We do not retain backups of deleted user data beyond 30 days.</p>
        </Section>

        <Section title="Cookies and tracking">
          <p>We use a session cookie to keep you logged in. We do not use advertising cookies, tracking pixels, or third-party analytics services that share your data. We use basic first-party analytics (page views, feature usage) to improve the product.</p>
        </Section>

        <Section title="Third-party services">
          <p>We use the following services to deliver Avasafe:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              'Supabase: database and file storage, hosted on AWS',
              'Stripe: payment processing',
              'Resend: transactional email delivery',
              'Twilio: SMS and WhatsApp notifications',
              'Anthropic: AI document extraction and validation (no training use)',
              'Vercel: application hosting',
            ].map(item => (
              <li key={item} style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item}</li>
            ))}
          </ul>
          <p style={{ marginTop: 12, fontSize: 14, color: 'var(--text-secondary)' }}>Each service is bound by its own privacy policy and data processing agreements.</p>
        </Section>

        <Section title="Your rights">
          <p>You have the right to access, correct, export, or delete any data we hold about you. You can exercise these rights from your account settings, or by emailing us at <CopyEmailButton email="privacy@avasafe.ai" />. We will respond within 30 days.</p>
        </Section>

        <Section title="Contact">
          <p>For any privacy questions, contact us at <CopyEmailButton email="privacy@avasafe.ai" />.</p>
        </Section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <Link href="/" style={{ fontSize: 14, color: 'var(--text-tertiary)', textDecoration: 'none' }}>← Back to Avasafe</Link>
        </div>
      </article>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, color: 'var(--navy)', marginBottom: 12 }}>{title}</h2>
      <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{children}</div>
    </section>
  )
}
