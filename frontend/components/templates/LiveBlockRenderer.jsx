'use client';

// Shared block renderer for template preview pages.
// Renders blocks as they would appear on the live site.
// Compatible with both inline prop shapes and block.props pattern.

export default function LiveBlockRenderer({ block, simple = false }) {
  const p = (key, fallback) => block.props?.[key] ?? block[key] ?? fallback;
  const bodySize = 'clamp(0.875rem, 2vw, 1rem)';
  const h2Size = 'clamp(1.125rem, 3vw, 1.5rem)';

  if (simple) {
    // Simplified render for inline list-style previews
    const icons = {
      hero: '⚡', features: '⭐', cta: '🎯', text: '📝', pricing: '💰',
      faq: '❓', testimonials: '💬', stats: '📈', team: '👥', nav: '🧭',
      footer: '⬇️', form: '📋', portfolio: '🎨', gallery: '🖼️', blog: '📰',
      newsletter: '📧', timeline: '📅', tabs: '📑', accordion: '📂',
      countdown: '⏱️', map: '🗺️', social: '🔗', contact: '📞',
      'logo-cloud': '🏢', process: '🔄', comparison: '⚖️', embed: '🔌',
      image: '🖼️', video: '🎥', columns: '📐', spacer: '↕️', divider: '➖',
    };
    return (
      <div style={{ padding: '8px 12px', borderBottom: '1px dashed #e5e7eb', fontSize: '0.8125rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{icons[block.type] || '📦'}</span>
        <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{block.type}</span>
        {p('heading') && <span style={{ color: '#9ca3af' }}>— {p('heading')}</span>}
      </div>
    );
  }

  switch (block.type) {
    case 'hero': {
      const bg = p('bgColor') || '#2563eb';
      return (
        <div style={{ backgroundColor: bg, color: '#fff', padding: 'clamp(32px, 6vw, 60px) clamp(16px, 4vw, 24px)', textAlign: p('align') === 'left' ? 'left' : 'center' }}>
          <div style={{ maxWidth: '720px', margin: p('align') === 'left' ? '0' : '0 auto' }}>
            <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: '0.5rem', lineHeight: 1.2 }}>{p('heading') || 'Page Title'}</h1>
            {p('subheading') && <p style={{ fontSize: bodySize, opacity: 0.9, maxWidth: '500px', margin: '0 auto', lineHeight: 1.5 }}>{p('subheading')}</p>}
            {p('ctaText') && (
              <div style={{ marginTop: '1rem' }}>
                <span style={{ display: 'inline-block', padding: '8px 24px', backgroundColor: 'white', color: bg, borderRadius: '6px', fontWeight: 600, fontSize: bodySize }}>
                  {p('ctaText')}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }

    case 'features': {
      const items = p('items') || [];
      return (
        <div style={{ padding: 'clamp(32px, 5vw, 48px) clamp(16px, 4vw, 24px)' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            {p('heading') && <h2 style={{ fontSize: h2Size, fontWeight: 700, textAlign: 'center', marginBottom: 'clamp(1.5rem, 3vw, 2.5rem)' }}>{p('heading')}</h2>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              {items.map((item, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{item.icon || '✦'}</div>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: bodySize }}>{item.title || item.name || ''}</div>
                  <div style={{ color: '#6b7280', fontSize: bodySize, lineHeight: 1.4 }}>{item.desc || item.description || ''}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'cta': {
      const ctaBg = p('bgColor') || '#f8fafc';
      return (
        <div style={{ backgroundColor: ctaBg, padding: 'clamp(32px, 5vw, 48px) clamp(16px, 4vw, 24px)', textAlign: 'center' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <h2 style={{ fontSize: h2Size, fontWeight: 700, marginBottom: '0.5rem' }}>{p('heading') || 'Ready to get started?'}</h2>
            {p('subtext') && <p style={{ fontSize: bodySize, color: '#6b7280', marginBottom: '0.75rem' }}>{p('subtext')}</p>}
            {p('buttonText') && (
              <span style={{ display: 'inline-block', marginTop: '0.75rem', padding: '8px 24px', backgroundColor: '#2563eb', color: 'white', borderRadius: '6px', fontWeight: 600, fontSize: bodySize }}>
                {p('buttonText')}
              </span>
            )}
          </div>
        </div>
      );
    }

    case 'text':
      return (
        <div style={{ padding: 'clamp(24px, 4vw, 40px) clamp(16px, 4vw, 24px)' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            {p('heading') && <h2 style={{ fontSize: 'clamp(1rem, 2.5vw, 1.375rem)', fontWeight: 700, marginBottom: '0.75rem' }}>{p('heading')}</h2>}
            <div style={{ fontSize: bodySize, lineHeight: '1.625', color: '#374151', whiteSpace: 'pre-wrap' }}>{p('body') || p('content') || 'Content goes here...'}</div>
          </div>
        </div>
      );

    case 'pricing':
      return (
        <div style={{ padding: 'clamp(32px, 5vw, 48px) clamp(16px, 4vw, 24px)' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            {p('heading') && <h2 style={{ fontSize: h2Size, fontWeight: 700, textAlign: 'center', marginBottom: 'clamp(1.5rem, 3vw, 2rem)' }}>{p('heading')}</h2>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {(p('plans') || []).slice(0, 3).map((plan, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', textAlign: 'center', background: i === 1 ? '#f8fafc' : 'white' }}>
                  {i === 1 && <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#2563eb', marginBottom: '0.5rem' }}>Most popular</div>}
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: bodySize }}>{plan.name}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>{plan.price}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{plan.interval || '/mo'}</div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <span style={{ display: 'inline-block', padding: '6px 16px', border: '1px solid #2563eb', color: '#2563eb', borderRadius: '4px', fontSize: '0.8125rem', fontWeight: 500 }}>
                      Choose
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'faq': {
      const faqItems = p('items') || [];
      return (
        <div style={{ padding: 'clamp(32px, 5vw, 48px) clamp(16px, 4vw, 24px)' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            {p('heading') && <h2 style={{ fontSize: h2Size, fontWeight: 700, textAlign: 'center', marginBottom: '1.5rem' }}>{p('heading')}</h2>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {faqItems.map((item, i) => (
                <details key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                  <summary style={{ padding: '12px 16px', fontWeight: 600, fontSize: bodySize, cursor: 'pointer', backgroundColor: '#f9fafb' }}>
                    {item.question || item.q}
                  </summary>
                  <div style={{ padding: '12px 16px', fontSize: bodySize, color: '#4b5563', lineHeight: 1.5 }}>
                    {item.answer || item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'testimonials': {
      const items = p('items') || [];
      return (
        <div style={{ padding: 'clamp(32px, 5vw, 48px) clamp(16px, 4vw, 24px)', backgroundColor: '#f9fafb' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            {p('heading') && <h2 style={{ fontSize: h2Size, fontWeight: 700, textAlign: 'center', marginBottom: '1.5rem' }}>{p('heading')}</h2>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {items.map((item, i) => (
                <div key={i} style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <p style={{ fontSize: bodySize, fontStyle: 'italic', marginBottom: '0.75rem', color: '#374151' }}>"{item.quote || item.text || ''}"</p>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#111827' }}>{item.author || item.name || ''}</div>
                  {item.role && <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem' }}>{item.role}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'stats':
      return (
        <div style={{ padding: 'clamp(32px, 5vw, 48px) clamp(16px, 4vw, 24px)', backgroundColor: p('bgColor') || '#1e3a5f', color: 'white' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
            {(p('items') || []).map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 'clamp(1.25rem, 3vw, 2rem)', fontWeight: 700 }}>{s.value || s.stat || ''}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem' }}>{s.label || s.name || ''}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'team': {
      const members = p('members') || p('items') || [];
      return (
        <div style={{ padding: 'clamp(32px, 5vw, 48px) clamp(16px, 4vw, 24px)' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            {p('heading') && <h2 style={{ fontSize: h2Size, fontWeight: 700, textAlign: 'center', marginBottom: '1.5rem' }}>{p('heading')}</h2>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {members.map((m, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '1rem' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#e5e7eb', margin: '0 auto 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#9ca3af' }}>
                    {m.avatar ? <img src={m.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : <span>👤</span>}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: bodySize }}>{m.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#2563eb' }}>{m.role}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'gallery':
    case 'portfolio': {
      const items = p('items') || p('gallery') || [];
      return (
        <div style={{ padding: 'clamp(32px, 5vw, 48px) clamp(16px, 4vw, 24px)' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            {p('heading') && <h2 style={{ fontSize: h2Size, fontWeight: 700, textAlign: 'center', marginBottom: '1.5rem' }}>{p('heading')}</h2>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
              {(items.length ? items : [{}, {}, {}]).map((item, i) => (
                <div key={i} style={{ aspectRatio: '1', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: '2rem' }}>
                  {item.url || item.imageUrl ? <img src={item.url || item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} /> : <span>🖼️</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'contact':
      return (
        <div style={{ padding: 'clamp(32px, 5vw, 48px) clamp(16px, 4vw, 24px)' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            {p('heading') && <h2 style={{ fontSize: h2Size, fontWeight: 700, marginBottom: '0.75rem' }}>{p('heading')}</h2>}
            {p('body') && <p style={{ fontSize: bodySize, color: '#6b7280', marginBottom: '1rem' }}>{p('body')}</p>}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', textAlign: 'left' }}>
              <input type="text" placeholder="Your name" readOnly style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', marginBottom: '0.5rem', fontSize: '0.875rem' }} />
              <input type="email" placeholder="Your email" readOnly style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', marginBottom: '0.5rem', fontSize: '0.875rem' }} />
              <textarea placeholder="Your message" readOnly rows={3} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', marginBottom: '0.5rem', fontSize: '0.875rem', resize: 'none' }} />
              <div style={{ padding: '8px 0', color: '#2563eb', fontWeight: 600, fontSize: '0.875rem' }}>Send message →</div>
            </div>
          </div>
        </div>
      );

    case 'video': {
      const videoUrl = p('url') || '';
      return (
        <div style={{ padding: 'clamp(32px, 5vw, 48px) clamp(16px, 4vw, 24px)', textAlign: 'center' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            {p('heading') && <h2 style={{ fontSize: h2Size, fontWeight: 700, marginBottom: '1rem' }}>{p('heading')}</h2>}
            <div style={{ aspectRatio: '16/9', backgroundColor: '#111827', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
              {videoUrl ? (
                <div style={{ fontSize: '3rem' }}>▶</div>
              ) : (
                <span>Video placeholder</span>
              )}
            </div>
          </div>
        </div>
      );
    }

    case 'divider':
      return <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: 0 }} />;

    case 'spacer':
      return <div style={{ height: p('height') ? parseInt(p('height')) : 48 }} />;

    case 'image':
      return (
        <div style={{ padding: 'clamp(24px, 4vw, 40px) clamp(16px, 4vw, 24px)', textAlign: 'center' }}>
          <div style={{ maxWidth: p('width') || '800px', margin: '0 auto' }}>
            {p('url') ? (
              <img src={p('url')} alt={p('alt') || ''} style={{ width: '100%', borderRadius: '8px', maxHeight: '400px', objectFit: 'cover' }} />
            ) : (
              <div style={{ aspectRatio: '16/9', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db' }}>
                <span style={{ fontSize: '3rem' }}>🖼️</span>
              </div>
            )}
            {p('caption') && <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.5rem' }}>{p('caption')}</p>}
          </div>
        </div>
      );

    default:
      return (
        <div style={{ padding: '16px', backgroundColor: '#f9fafb', textAlign: 'center', borderBottom: '1px dashed #e5e7eb' }}>
          <span style={{ fontSize: bodySize, color: '#9ca3af' }}>
            {getBlockIcon(block.type)} {block.type} block
          </span>
        </div>
      );
  }
}

function getBlockIcon(type) {
  const icons = {
    nav: '🧭', footer: '⬇️', form: '📋', pricing: '💰', faq: '❓', team: '👥',
    portfolio: '🎨', gallery: '🖼️', blog: '📰', newsletter: '📧', stats: '📈',
    timeline: '📅', tabs: '📑', accordion: '📂', countdown: '⏱️', map: '🗺️',
    social: '🔗', contact: '📞', 'logo-cloud': '🏢', process: '🔄',
    comparison: '⚖️', embed: '🔌', hero: '⚡', cta: '🎯', features: '⭐',
    testimonials: '💬', columns: '📐', text: '📝', image: '🖼️', video: '🎥',
    spacer: '↕️', divider: '➖',
  };
  return icons[type] || '📦';
}
