'use client';

export default function TemplateCard({ template, onUse, onPreview, compact = false }) {
  const t = template;
  const isFree = !t.is_premium;
  const hasThumb = t.thumbnail_url && !t.thumbnail_url.startsWith('/templates/');
  const tags = t.tags || [];
  const categories = {
    'retail-ecommerce': 'E-Commerce', 'technology-innovation': 'Technology', 'healthcare-wellness': 'Healthcare',
    'education-training': 'Education', 'services': 'Services', 'creative-media': 'Creative',
    'hospitality-food': 'Food & Beverage', 'nonprofit-community': 'Non-Profit',
  };

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)',
      overflow: 'hidden', boxShadow: 'var(--shadow-sm)', transition: 'transform .14s ease, box-shadow .2s ease',
      cursor: 'pointer', display: 'flex', flexDirection: 'column',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    onClick={() => onPreview?.(t.id)}>
      {/* Thumbnail */}
      <div style={{
        aspectRatio: '16/10', background: 'linear-gradient(135deg, var(--surface-muted), var(--surface-elevated))',
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottom: '1px solid var(--border)',
      }}>
        {hasThumb ? (
          <img src={t.thumbnail_url} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
            </svg>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{t.name}</div>
          </div>
        )}
        {/* Badges */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 4 }}>
          {t.is_featured && <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: 6, background: 'var(--primary)', color: 'white' }}>Featured</span>}
          {isFree && <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: 6, background: 'var(--success-bg)', color: 'var(--success)' }}>Free</span>}
          {t.is_premium && <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: 6, background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}>Premium</span>}
        </div>
        {/* Hover overlay */}
        <div className="template-card-overlay" style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: 0, transition: 'opacity .2s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
          <span onClick={e => { e.stopPropagation(); onPreview?.(t.id); }}
            style={{ padding: '8px 16px', borderRadius: 8, background: 'white', color: '#111', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Preview
          </span>
          <span onClick={e => { e.stopPropagation(); onUse?.(t.id); }}
            style={{ padding: '8px 16px', borderRadius: 8, background: '#2563eb', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Use Template
          </span>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{
            fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
            color: 'var(--primary)', background: 'var(--accent-bg)', padding: '2px 8px', borderRadius: 4,
          }}>
            {categories[t.category] || t.category || t.industry || 'General'}
          </span>
          {t.rating > 0 && (
            <span style={{ fontSize: 10.5, color: 'var(--text-muted)', marginLeft: 'auto' }}>
              ⭐ {Number(t.rating).toFixed(1)}
            </span>
          )}
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' }}>
          {t.name}
        </h3>
        {!compact && t.description && (
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4, margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {t.description}
          </p>
        )}
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 'auto', paddingTop: 6 }}>
            {tags.slice(0, 3).map(tag => (
              <span key={tag} style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 4, background: 'var(--surface-muted)', color: 'var(--text-muted)' }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
