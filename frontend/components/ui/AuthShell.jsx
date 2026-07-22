import React from 'react';

export default function AuthShell({ title, description, children, footer }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `
        radial-gradient(circle at 12% 16%, rgba(37,99,235,.1), transparent 38%),
        radial-gradient(circle at 88% 82%, rgba(56,189,248,.08), transparent 42%),
        linear-gradient(180deg, rgba(255,255,255,.56), rgba(255,255,255,0)),
        var(--bg)
      `,
      padding: 'var(--space-6)',
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1.05fr minmax(360px, 460px)',
        maxWidth: 960, width: '100%', gap: 'var(--space-6)', alignItems: 'center',
      }} className="auth-shell">
        {/* Left — Brand intro */}
        <div className="auth-intro" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <svg width="34" height="34" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="10" fill="url(#a-logo)" />
              <path d="M16 17h9.5c3 0 6 2.5 6 7s-3 7-6 7H16V17z" fill="white" />
              <defs>
                <linearGradient id="a-logo" x1="0" y1="0" x2="48" y2="48"><stop stopColor="var(--primary)" /><stop offset="1" stopColor="var(--accent)" /></linearGradient>
              </defs>
            </svg>
            <div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                Digitpen<span style={{ color: 'var(--primary)' }}> Hub</span>
              </span>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)', marginTop: -2 }}>
                Business Suite
              </div>
            </div>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1.25, margin: 0 }}>
            One secure workspace for your whole operating stack.
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            Move from CRM to billing, forms, reports, and marketing without a second login or a stitched-together admin experience.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon: 'M20 6L9 17l-5-5', title: 'Consistent by default', desc: 'Shared controls, cleaner states, and the same workflow language across every module.' },
              { icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', title: 'Built for operators', desc: 'Dashboards, documents, forms, and campaigns live under one account and one navigation.' },
            ].map(p => (
              <div key={p.title} style={{
                background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)',
                borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={p.icon}/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{p.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{p.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Form card */}
        <div style={{
          background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)',
          borderRadius: 22, border: '1px solid var(--border)', padding: 'var(--space-6)',
          boxShadow: '0 20px 56px rgba(15,23,42,0.1)',
        }}>
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              {title}
            </h2>
            {description && <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>{description}</p>}
          </div>
          <div>{children}</div>
          {footer && (
            <div style={{ borderTop: '1px solid var(--border)', marginTop: 'var(--space-5)', paddingTop: 'var(--space-4)', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
              {footer}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .auth-shell { grid-template-columns: 1fr !important; }
          .auth-intro { display: none !important; }
        }
      `}</style>
    </div>
  );
}
