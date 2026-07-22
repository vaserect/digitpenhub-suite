'use client';

export default function Logo({ size = 'md', showText = true, className = '' }) {
  const sizes = { sm: 24, md: 32, lg: 48, xl: 64 };
  const px = sizes[size] || 32;
  const textSize = Math.round(px * 0.75);

  return (
    <div className={`logo ${className}`} style={{ display: 'flex', alignItems: 'center', gap: Math.round(px * 0.3) }}>
      <svg width={px} height={px} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"
        role="img" aria-label="Digitpen Hub">
        <rect width="48" height="48" rx="10" fill="url(#logo-grad)" />
        <path d="M13 14h12.5c4.5 0 8.5 3.5 8.5 10s-4 10-8.5 10H13V14z" fill="white" fillOpacity="0.15" />
        <path d="M16 17h9.5c3 0 6 2.5 6 7s-3 7-6 7H16V17z" fill="white" />
        <path d="M32 28l6 6-4 2-2-4 4-4z" fill="white" fillOpacity="0.3" />
        <path d="M32 28l6 6-2 1-1.5-3 3-3z" fill="var(--accent)" />
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--primary)" />
            <stop offset="1" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <span className="logo-text" style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: textSize,
          lineHeight: 1,
          color: 'var(--text)',
          letterSpacing: '-0.02em',
        }}>
          Digitpen<span style={{ color: 'var(--primary)' }}> Hub</span>
        </span>
      )}
    </div>
  );
}
