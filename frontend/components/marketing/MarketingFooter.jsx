'use client';

export default function MarketingFooter() {
  const year = new Date().getFullYear();

  const columns = [
    { title: 'Product', links: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Templates', href: '/templates' },
      { label: 'API', href: '#' },
    ]},
    { title: 'Company', links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Blog', href: '#' },
      { label: 'Careers', href: '#' },
    ]},
    { title: 'Resources', links: [
      { label: 'Help Center', href: '#' },
      { label: 'Documentation', href: '#' },
      { label: 'Community', href: '#' },
      { label: 'Status', href: '#' },
    ]},
    { title: 'Legal', links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Cookie Policy', href: '#' },
      { label: 'GDPR', href: '#' },
    ]},
  ];

  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--surface)',
      padding: 'var(--space-8) var(--space-6) var(--space-6)',
    }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div className="footer-grid" style={{
          display: 'grid', gridTemplateColumns: '1.5fr repeat(4, 1fr)',
          gap: 'var(--space-6)', marginBottom: 'var(--space-8)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="10" fill="url(#f-logo)" />
                <path d="M16 17h9.5c3 0 6 2.5 6 7s-3 7-6 7H16V17z" fill="white" />
                <defs>
                  <linearGradient id="f-logo" x1="0" y1="0" x2="48" y2="48"><stop stopColor="var(--primary)" /><stop offset="1" stopColor="var(--accent)" /></linearGradient>
                </defs>
              </svg>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
                Digitpen<span style={{ color: 'var(--primary)' }}> Hub</span>
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 var(--space-4)', maxWidth: 260 }}>
              The unified business platform — 300+ tools, one login, one dataset.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { label: 'X', d: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                { label: 'LinkedIn', d: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
              ].map((s, i) => (
                <a key={i} href="#" aria-label={s.label}
                  style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-muted)', color: 'var(--text-muted)', transition: 'background .14s ease, color .14s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-bg)'; e.currentTarget.style.color = 'var(--primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d={s.d} /></svg>
                </a>
              ))}
            </div>
          </div>
          {columns.map(col => (
            <div key={col.title}>
              <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', margin: '0 0 var(--space-3)' }}>
                {col.title}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {col.links.map(link => (
                  <a key={link.label} href={link.href}
                    style={{ fontSize: 13, color: 'var(--text)', textDecoration: 'none', padding: '3px 0', transition: 'color .14s ease' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                    onMouseLeave={e => e.currentTarget.style.color = ''}>
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          borderTop: '1px solid var(--border)', paddingTop: 'var(--space-4)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
          fontSize: 12.5, color: 'var(--text-muted)',
        }}>
          <span>&copy; {year} Digitpen Hub. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Cookies</a>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .footer-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 480px) { .footer-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </footer>
  );
}
