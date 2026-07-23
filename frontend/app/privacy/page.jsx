'use client';

const SECTIONS = [
  { title: '1. Information We Collect', id: 'info-collect' },
  { title: '2. How We Use Your Information', id: 'info-use' },
  { title: '3. Data Storage and Security', id: 'data-security' },
  { title: '4. Data Retention', id: 'data-retention' },
  { title: '5. Data Sharing', id: 'data-sharing' },
  { title: '6. Your Rights', id: 'your-rights' },
  { title: '7. International Data Transfers', id: 'international' },
  { title: '8. Children\'s Privacy', id: 'children' },
  { title: '9. Changes to This Policy', id: 'changes' },
  { title: '10. Contact', id: 'contact' },
];

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>Privacy Policy</h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32 }}>Last updated: July 22, 2026</p>

      <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 24, color: 'var(--text-muted)' }}>
        Digitpen Hub (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) operates the Digitpen Hub Suite platform at suite.digitpenhub.com. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
      </p>

      <Section title="1. Information We Collect">
        <h4 style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Information You Provide</h4>
        <ul style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <li><strong>Account Information:</strong> Full name, email address, organization name, phone number, and password.</li>
          <li><strong>Profile Information:</strong> Avatar, job title, department, and preferences.</li>
          <li><strong>Payment Information:</strong> Processed securely by Flutterwave or Paystack. We do not store full credit card numbers.</li>
          <li><strong>Content:</strong> Contacts, invoices, CRM data, emails, campaigns, and other business data you create.</li>
          <li><strong>Communications:</strong> Information you provide when contacting support.</li>
        </ul>
        <h4 style={{ fontWeight: 700, fontSize: 14, margin: '12px 0 6px' }}>Information Collected Automatically</h4>
        <ul style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <li><strong>Usage Data:</strong> Pages visited, features used, time spent, and interactions.</li>
          <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers.</li>
          <li><strong>Cookies:</strong> Essential cookies for authentication and session management.</li>
        </ul>
      </Section>

      <Section title="2. How We Use Your Information">
        <ul style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <li>To provide, maintain, and improve the Digitpen Hub Suite platform</li>
          <li>To process your subscription and send billing information</li>
          <li>To send technical notices, updates, security alerts, and support messages</li>
          <li>To respond to your comments, questions, and requests</li>
          <li>To monitor and analyze usage trends for platform improvement</li>
          <li>To detect, prevent, and address technical issues or fraud</li>
        </ul>
      </Section>

      <Section title="3. Data Storage and Security">
        <ul style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <li>Your data is stored on secured servers in the United States and Europe</li>
          <li>Encrypted in transit using TLS 1.3 and at rest using AES-256</li>
          <li>Access controls, firewalls, and regular security audits</li>
          <li>Passwords hashed using bcrypt with 12 rounds of salting</li>
          <li>Session tokens are HttpOnly, Secure, and SameSite=Lax configured</li>
        </ul>
      </Section>

      <Section title="4. Data Retention">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          We retain your data for as long as your account is active. After account deletion, we delete or anonymize your data within 90 days, except where retention is required by law (e.g., invoicing records retained for 7 years as required by Nigerian tax law).
        </p>
      </Section>

      <Section title="5. Data Sharing">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          We do not sell your personal information. We may share data with:
        </p>
        <ul style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <li><strong>Payment processors</strong> (Flutterwave, Paystack) solely for payment processing</li>
          <li><strong>Service providers</strong> who assist in platform operations (hosting, analytics, email delivery)</li>
          <li><strong>Legal authorities</strong> when required by applicable law</li>
        </ul>
      </Section>

      <Section title="6. Your Rights">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Depending on your jurisdiction, you may have rights to access, correct, delete, or export your data. To exercise these rights, contact privacy@digitpenhub.com.
        </p>
      </Section>

      <Section title="7. International Data Transfers">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Digitpen Hub is headquartered in Lagos, Nigeria with operations in the United States. By using our service, you consent to the transfer of your data to servers in the US and EU.
        </p>
      </Section>

      <Section title="8. Children's Privacy">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Our service is not directed to individuals under 16. We do not knowingly collect personal information from children.
        </p>
      </Section>

      <Section title="9. Changes to This Policy">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          We may update this Privacy Policy. Material changes will be notified via email or through the platform.
        </p>
      </Section>

      <Section title="10. Contact">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Digitpen Hub<br />
          Lagos, Nigeria<br />
          4 Mowry Ave, Fremont, California 94536, US<br />
          Email: privacy@digitpenhub.com
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
