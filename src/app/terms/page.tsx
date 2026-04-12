import Link from 'next/link'
import Logo from '@/components/Logo'
import CopyEmailButton from '@/components/CopyEmailButton'

export const metadata = { title: 'Terms of Service | Avasafe AI' }

export default function TermsPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--off-white)' }}>
      <header style={{ background: 'white', borderBottom: '1px solid var(--border)', height: 64, display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <Logo size="sm" href="/dashboard" />
      </header>

      <article style={{ maxWidth: 680, margin: '0 auto', padding: '56px 24px 100px' }}>
        <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', letterSpacing: '0.06em', marginBottom: 12 }}>LAST UPDATED: APRIL 2026</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36, color: 'var(--navy)', marginBottom: 8, lineHeight: 1.2 }}>Terms of Service</h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 40 }}>
          These Terms of Service govern your use of Avasafe AI. By creating an account, you agree to these terms. Please read them.
        </p>

        <Section title="The service">
          <p>Avasafe AI provides document storage, AI-powered data extraction, and application preparation assistance for Indian government applications including OCI cards and Indian passport renewals. We are a technology service. We are not a law firm, immigration advisor, or government-authorized agent.</p>
          <p style={{ marginTop: 12 }}>The information and outputs AVA generates are based on publicly available government requirements and our best understanding of current requirements. Requirements can change. You are responsible for verifying that your application meets current requirements before submission.</p>
        </Section>

        <Section title="Your account">
          <p>You must be 18 or older to create an account. You are responsible for keeping your login credentials secure. You are responsible for all activity that occurs under your account. If you suspect unauthorized access, contact us immediately at <CopyEmailButton email="support@avasafe.ai" />.</p>
        </Section>

        <Section title="Payments and refunds">
          <p>Locker subscriptions ($19/year) are billed annually. Guided ($29) and Expert Session ($79) are one-time payments per application. All payments are processed by Stripe.</p>
          <p style={{ marginTop: 12 }}>We offer a rejection guarantee: if your application is rejected and the rejection is caused by an error in AVA&apos;s validation output, we will correct the application at no additional charge. The guarantee does not apply to rejections caused by government policy changes after your application was prepared, information you entered incorrectly, missing documents, or factors outside our validation scope.</p>
          <p style={{ marginTop: 12 }}>Outside of the rejection guarantee, payments are non-refundable once the application package has been generated. If you have not yet generated a package, contact us within 7 days for a full refund.</p>
        </Section>

        <Section title="Document upload and AI processing">
          <p>By uploading a document, you confirm that you have the legal right to upload and process that document. You agree that we may use AI to extract structured data from your documents as described in our Privacy Policy. The raw image is deleted after extraction.</p>
          <p style={{ marginTop: 12 }}>AVA&apos;s extraction and validation are automated and may contain errors. You are responsible for reviewing all extracted data before submitting any application. Do not submit an application without reviewing every field.</p>
        </Section>

        <Section title="Acceptable use">
          <p>You may not use Avasafe AI to process documents belonging to someone else without their explicit consent. You may not attempt to reverse-engineer, scrape, or abuse our service. You may not upload documents you know to be fraudulent or falsified. Violation of these rules will result in immediate account termination and may be reported to relevant authorities.</p>
        </Section>

        <Section title="Expert Sessions">
          <p>Expert Sessions are 45-minute Zoom calls with an Avasafe team member. The session must be booked and conducted before submission. If you miss your scheduled session without 24 hours notice, we may charge for rescheduling. Our expert guides your submission but does not enter your login credentials on your behalf. You maintain full control of your government accounts at all times.</p>
        </Section>

        <Section title="Limitation of liability">
          <p>Avasafe AI is provided as-is. We are not liable for application rejections, delays, government fees, or losses caused by errors in government portals, policy changes, or factors outside our control. Our total liability to you for any claim arising from your use of Avasafe AI is limited to the amount you paid us in the 12 months preceding the claim.</p>
        </Section>

        <Section title="Changes to these terms">
          <p>We may update these terms from time to time. We will notify you by email at least 14 days before any material change takes effect. Continued use of the service after that date constitutes acceptance of the new terms.</p>
        </Section>

        <Section title="Contact">
          <p>Questions about these terms? Email us at <CopyEmailButton email="legal@avasafe.ai" />.</p>
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
