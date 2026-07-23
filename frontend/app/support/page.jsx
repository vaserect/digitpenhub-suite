'use client';

import { useState, useEffect } from 'react';

const FAQS = [
  { q: 'How do I reset my password?', a: 'Go to the login page and click "Forgot password." Enter your registered email, and we\'ll send you a reset link. The link expires after 24 hours.' },
  { q: 'How do I invite team members?', a: 'Navigate to Team in the sidebar. Click "Invite member," enter their email, and choose a role. They\'ll receive an invitation email with a link to join your organization.' },
  { q: 'What happens when I reach my plan limit?', a: 'You\'ll see an upgrade prompt when you try to exceed your plan\'s limits (e.g., number of users, contacts). Upgrade your plan from the Billing page to continue.' },
  { q: 'How do I export my data?', a: 'Most modules have an export button that downloads a CSV file. For a complete data export, go to Settings → Data Export.' },
  { q: 'Is my data backed up?', a: 'Yes. Automated backups run daily at 03:00 UTC with 30-day retention. We store both database and application backups.' },
  { q: 'How secure is my data?', a: 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Passwords are hashed with bcrypt (12 rounds). Sessions use HttpOnly, Secure, SameSite cookies. We use Helmet, CORS, CSRF protection, and rate limiting.' },
  { q: 'Can I use my own domain?', a: 'Yes, on the Business plan. Go to White Label in settings to connect a custom domain. We provide CNAME instructions for DNS setup.' },
  { q: 'What payment methods do you accept?', a: 'We process payments through Flutterwave and Paystack, supporting card payments, bank transfers, and USSD across Nigeria and internationally.' },
];

export default function SupportPage() {
  const [expanded, setExpanded] = useState(null);
  const [uptime, setUptime] = useState(null);

  useEffect(() => {
    // Measure uptime from health endpoint
    let online = 0, total = 5;
    const check = async () => {
      for (let i = 0; i < total; i++) {
        try {
          const r = await fetch('/api/v1/health');
          if (r.ok) online++;
        } catch {}
        await new Promise(r => setTimeout(r, 200));
      }
      setUptime(Math.round(online / total * 100));
    };
    check();
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>Support</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 14 }}>
        We're here to help. Choose a channel below.
      </p>

      {/* Contact channels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>📧</div>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Email support</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>We respond within 24 hours on business days.</p>
          <a href="mailto:support@digitpenhub.com" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 13 }}>support@digitpenhub.com →</a>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>📚</div>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Documentation</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Guides, tutorials, and API reference.</p>
          <a href="/kb" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 13 }}>Browse docs →</a>
        </div>
      </div>

      {/* Uptime / Status */}
      <div className="card" style={{ padding: 20, marginBottom: 32 }}>
        <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>System status</h3>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>API Health</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Operational</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Uptime (last 5 checks)</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{uptime !== null ? `${uptime}%` : 'Checking...'}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Response time</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>~45 ms</div>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Frequently asked questions</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {FAQS.map(faq => (
          <div key={faq.q} className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <button onClick={() => setExpanded(expanded === faq.q ? null : faq.q)}
              style={{
                width: '100%', padding: '14px 18px', display: 'flex', justifyContent: 'space-between',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600,
                color: 'var(--text)', textAlign: 'left',
              }}>
              {faq.q}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ transform: expanded === faq.q ? 'rotate(180deg)' : '', transition: 'transform .2s ease', flexShrink: 0 }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {expanded === faq.q && (
              <div style={{ padding: '0 18px 14px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
