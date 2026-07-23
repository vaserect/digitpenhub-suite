'use client';

const TABLE = [
  { scenario: 'First-time purchase within 14 days', policy: 'Full refund — no questions asked' },
  { scenario: 'After 14 days of current billing period', policy: 'No refund for the current period' },
  { scenario: 'Service outage exceeding 48 hours', policy: 'Prorated credit for the downtime' },
  { scenario: 'Accidental duplicate payment', policy: 'Full refund of the duplicate charge' },
];

export default function RefundPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>Refund Policy</h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32 }}>Last updated: July 22, 2026</p>

      <Section title="1. Subscription Refunds">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 12 }}>The Free plan has no cost. Paid plans (Starter, Growth, Business) follow this policy:</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>Scenario</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>Refund Policy</th>
              </tr>
            </thead>
            <tbody>
              {TABLE.map(r => (
                <tr key={r.scenario} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 500 }}>{r.scenario}</td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{r.policy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="2. How to Request a Refund">
        <ol style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, paddingLeft: 18 }}>
          <li>Email billing@digitpenhub.com from your registered account email</li>
          <li>Include your account email and the reason for your request</li>
          <li>Refunds are processed within 5-10 business days</li>
          <li>Refunds are issued to the original payment method</li>
        </ol>
      </Section>

      <Section title="3. Cancellation">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          You can cancel from Settings → Billing → Cancel Subscription. You retain access until the end of your paid period, then your account reverts to Free plan limitations. Data is retained for 30 days after cancellation.
        </p>
      </Section>

      <Section title="4. Contact">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Digitpen Hub &mdash; Email: billing@digitpenhub.com &mdash; Response within 24 hours on business days.
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
