'use client';

import { useState, useEffect } from 'react';

export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const links = [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Templates', href: '/templates' },
  ];

  return (
    <>
      <nav className={`mkt-nav ${scrolled ? 'is-scrolled' : ''}`} style={{
        position: 'sticky', top: 0, zIndex: 100,
        padding: '0 var(--space-6)', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(255,255,255,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(18px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition: 'background .2s ease, backdrop-filter .2s ease, border-color .2s ease',
      }}>
        <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="10" fill="url(#nav-logo)" />
            <path d="M16 17h9.5c3 0 6 2.5 6 7s-3 7-6 7H16V17z" fill="white" />
            <path d="M32 28l6 6-2 1-1.5-3 3-3z" fill="var(--accent)" />
            <defs>
              <linearGradient id="nav-logo" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--primary)" /><stop offset="1" stopColor="var(--accent)" />
              </linearGradient>
            </defs>
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginLeft: 8, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Digitpen<span style={{ color: 'var(--primary)' }}> Hub</span>
          </span>
        </a>

        <div className="mkt-nav-links-d" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {links.map(link => (
            <a key={link.href} href={link.href}
              style={{
                padding: '8px 14px', fontSize: 13.5, fontWeight: 500, color: 'var(--text)',
                textDecoration: 'none', borderRadius: 8, transition: 'background .14s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-muted)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
              {link.label}
            </a>
          ))}
        </div>

        <div className="mkt-nav-ctas-d" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a href="/login" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', textDecoration: 'none', padding: '8px 16px', borderRadius: 8, transition: 'background .14s ease' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-muted)'}
            onMouseLeave={e => e.currentTarget.style.background = ''}>
            Sign in
          </a>
          <a href="/signup" className="btn btn-primary" style={{
            fontSize: 13, fontWeight: 600, padding: '8px 20px',
            background: 'var(--primary)', color: 'white', borderRadius: 8, textDecoration: 'none',
            transition: 'transform .14s ease, box-shadow .2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
            Get started
          </a>
        </div>

        <button onClick={() => setMobileOpen(true)}
          style={{ display: 'none', background: 'none', border: 'none', padding: 8, cursor: 'pointer', color: 'var(--text)' }}
          className="mkt-mobile-btn" aria-label="Open menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </nav>

      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(320px, 80vw)',
            background: 'var(--surface)', padding: 'var(--space-6)',
            display: 'flex', flexDirection: 'column', gap: 8,
            boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
            animation: 'slideInRight .2s ease',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="10" fill="url(#mob-logo)" />
                <path d="M16 17h9.5c3 0 6 2.5 6 7s-3 7-6 7H16V17z" fill="white" />
                <defs>
                  <linearGradient id="mob-logo" x1="0" y1="0" x2="48" y2="48"><stop stopColor="var(--primary)" /><stop offset="1" stopColor="var(--accent)" /></linearGradient>
                </defs>
              </svg>
              <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text)' }} aria-label="Close menu">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {links.map(link => (
              <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                style={{ padding: '12px 14px', fontSize: 15, fontWeight: 500, color: 'var(--text)', textDecoration: 'none', borderRadius: 10 }}>
                {link.label}
              </a>
            ))}
            <div style={{ flex: 1 }} />
            <a href="/login" onClick={() => setMobileOpen(false)}
              style={{ padding: '12px 14px', fontSize: 15, fontWeight: 500, color: 'var(--text)', textDecoration: 'none', borderRadius: 10, textAlign: 'center', border: '1px solid var(--border)' }}>
              Sign in
            </a>
            <a href="/signup" onClick={() => setMobileOpen(false)}
              style={{ padding: '12px 14px', fontSize: 15, fontWeight: 600, color: 'white', textDecoration: 'none', borderRadius: 10, textAlign: 'center', background: 'var(--primary)' }}>
              Get started
            </a>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .mkt-nav-links-d, .mkt-nav-ctas-d { display: none !important; }
          .mkt-mobile-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
