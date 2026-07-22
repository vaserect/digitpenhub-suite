'use client';

export default function MarketingImage({ src, alt, aspectRatio = '16/9', priority = false, className = '' }) {
  return (
    <div className={`mkt-image-wrap ${className}`} style={{
      position: 'relative',
      width: '100%',
      aspectRatio,
      borderRadius: 16,
      overflow: 'hidden',
      background: 'var(--surface-muted)',
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'opacity .3s ease',
        }}
        onLoad={e => { e.currentTarget.style.opacity = '1'; }}
        onError={e => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.parentElement.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:13px;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            </div>`;
        }}
      />
    </div>
  );
}
