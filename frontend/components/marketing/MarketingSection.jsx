'use client';

export default function MarketingSection({ eyebrow, title, subtitle, children, variant = 'default', id, className = '' }) {
  return (
    <section id={id} className={`mkt-section mkt-section-${variant} ${className}`}
      style={{
        padding: 'var(--space-8) 0',
        scrollMarginTop: 80,
      }}>
      <div className="mkt-container" style={{
        maxWidth: 1120,
        margin: '0 auto',
        padding: '0 var(--space-6)',
      }}>
        {(eyebrow || title || subtitle) && (
          <div className="mkt-header" style={{
            textAlign: 'center',
            marginBottom: 'var(--space-8)',
            maxWidth: 720,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            {eyebrow && (
              <span className="mkt-eyebrow" style={{
                display: 'inline-block',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--primary)',
                marginBottom: 'var(--space-3)',
                padding: '4px 12px',
                borderRadius: 20,
                background: 'var(--accent-bg)',
              }}>
                {eyebrow}
              </span>
            )}
            {title && (
              <h2 className="mkt-section-title" style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)',
                fontWeight: 700,
                lineHeight: 1.2,
                color: 'var(--text)',
                margin: '0 0 var(--space-3)',
              }}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mkt-section-sub" style={{
                fontSize: 'clamp(0.9rem, 1.2vw, 1.1rem)',
                lineHeight: 1.6,
                color: 'var(--text-muted)',
                margin: 0,
              }}>
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
