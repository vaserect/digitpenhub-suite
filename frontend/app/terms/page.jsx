'use client';

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>Terms of Service</h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32 }}>Last updated: July 22, 2026</p>

      <Section title="1. Acceptance of Terms">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>By accessing or using the Digitpen Hub Suite platform, you agree to be bound by these Terms. If you do not agree, do not use the Service.</p>
      </Section>

      <Section title="2. Description of Service">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>Digitpen Hub Suite is a business management platform providing CRM, invoicing, email marketing, HR, project management, AI tools, website building, and related modules accessible at suite.digitpenhub.com.</p>
      </Section>

      <Section title="3. Account Registration">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 8 }}>You must be at least 16 years old. You are responsible for all activity under your account. You must provide accurate information during registration.</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>If creating an account for an organization, you represent that you have authority to bind that organization.</p>
      </Section>

      <Section title="4. Subscriptions and Billing">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <strong>Plans:</strong> Free, Starter (₦9,900/mo), Growth (₦29,900/mo), Business (₦79,900/mo). All prices exclude applicable taxes.<br /><br />
          <strong>Payment:</strong> Processed through Flutterwave or Paystack. By subscribing, you authorize recurring charges.<br /><br />
          <strong>Refunds:</strong> See our Refund Policy.<br /><br />
          <strong>Plan Changes:</strong> Upgrades take effect immediately. Downgrades take effect at the end of the billing period.
        </p>
      </Section>

      <Section title="5. Acceptable Use">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          You agree not to: use the Service for unlawful purposes, attempt unauthorized access, interfere with operations, reverse engineer, send spam, or exceed your plan limits.
        </p>
      </Section>

      <Section title="6. Data Ownership">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          You retain all ownership rights to your data. We may use aggregated, anonymized data for analytics and product improvement.
        </p>
      </Section>

      <Section title="7. Limitation of Liability">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          To the maximum extent permitted by law, Digitpen Hub shall not be liable for indirect, incidental, or consequential damages. Our total liability shall not exceed the amount you have paid us in the preceding 12 months.
        </p>
      </Section>

      <Section title="8. Termination">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          You may cancel at any time from billing settings. Data is retained for 30 days after cancellation. We may suspend accounts for violations with notice.
        </p>
      </Section>

      <Section title="9. Governing Law">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          These terms are governed by the laws of the Federal Republic of Nigeria. Disputes shall be resolved in the courts of Lagos State.
        </p>
      </Section>

      <Section title="10. Contact">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Digitpen Hub, Lagos, Nigeria. Email: legal@digitpenhub.com
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>{title}</h2>
      {children}
    </div>
  );
}
