'use client';

const COOKIE_TABLE = [
  { name: 'dph_session', type: 'Essential', purpose: 'Authentication — keeps you signed in', duration: '7 days' },
  { name: 'dph-theme', type: 'Preference', purpose: 'Remembers light/dark mode choice', duration: 'Persistent (localStorage)' },
  { name: 'dph-sidebar-collapsed', type: 'Preference', purpose: 'Remembers sidebar state', duration: 'Persistent (localStorage)' },
  { name: 'dph-pinned-modules', type: 'Preference', purpose: 'Remembers pinned modules', duration: 'Persistent (localStorage)' },
  { name: 'dph-recent-modules', type: 'Preference', purpose: 'Remembers recently used modules', duration: 'Persistent (localStorage)' },
];

export default function CookiesPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>Cookie Policy</h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32 }}>Last updated: July 22, 2026</p>

      <Section title="1. What Are Cookies">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>Cookies are small text files stored on your device by your web browser. They help websites remember your preferences and improve your experience.</p>
      </Section>

      <Section title="2. How We Use Cookies">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>Cookie</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>Type</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>Purpose</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {COOKIE_TABLE.map(c => (
                <tr key={c.name} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600 }}><code>{c.name}</code></td>
                  <td style={{ padding: '8px 10px' }}>{c.type}</td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{c.purpose}</td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{c.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="3. Types of Cookies We Use">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <strong>Essential Cookies:</strong> Required for the platform to function. The dph_session cookie is essential for authentication.<br /><br />
          <strong>Preference Cookies:</strong> Store your settings in localStorage. Not shared with third parties.<br /><br />
          <strong>Analytics:</strong> We use Sentry for error tracking with minimal session identification. No personal data collected.
        </p>
      </Section>

      <Section title="4. Third-Party Cookies">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>We do not use advertising or tracking cookies. Payment processors (Flutterwave, Paystack) may set their own cookies during checkout, governed by their respective policies.</p>
      </Section>

      <Section title="5. Managing Cookies">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Most browsers allow you to block or delete cookies. Blocking dph_session will prevent sign-in. Preference cookies can be cleared through browser developer tools.
        </p>
      </Section>

      <Section title="6. Contact">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>Email: privacy@digitpenhub.com</p>
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
