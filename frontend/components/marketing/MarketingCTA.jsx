'use client';

import Link from 'next/link';

export default function MarketingCTA({ heading, subtext, primaryLabel, primaryHref, secondaryLabel, secondaryHref, className = '' }) {
  return (
    <section className={`mkt-cta ${className}`} style={{
      background: 'linear-gradient(135deg, var(--primary), #1d4ed8)',
      borderRadius: 24,
      margin: 'var(--space-8) auto',
      maxWidth: 1120,
      padding: 'var(--space-8) var(--space-6)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none',
        backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }} />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
        {heading && (
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', fontWeight: 700, color: 'white',
            margin: '0 0 var(--space-2)', lineHeight: 1.3,
          }}>
            {heading}
          </h3>
        )}
        {subtext && (
          <p style={{
            fontSize: 'clamp(0.85rem, 1.1vw, 1rem)', color: 'rgba(255,255,255,0.8)',
            margin: '0 0 var(--space-5)', lineHeight: 1.5,
          }}>
            {subtext}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {primaryLabel && primaryHref && (
            <Link href={primaryHref} className="btn btn-primary" style={{
              background: 'white', color: 'var(--primary)', fontWeight: 600,
              fontSize: 14, padding: '12px 28px', borderRadius: 10,
              textDecoration: 'none', transition: 'transform .14s ease, box-shadow .2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
              {primaryLabel} →
            </Link>
          )}
          {secondaryLabel && secondaryHref && (
            <Link href={secondaryHref} style={{
              color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 500,
              padding: '12px 24px', borderRadius: 10, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.25)',
              transition: 'background .14s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
