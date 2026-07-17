'use client';

/**
 * BlockRenderer - Unified rendering engine for all block types
 * Renders 32+ different block types with consistent styling
 */
export default function BlockRenderer({ block, isSelected, viewMode, onUpdate }) {
  const props = block.props || {};

  // Common wrapper styles
  const wrapperClass = `block-wrapper ${isSelected ? 'selected' : ''} ${props.className || ''}`;

  switch (block.type) {
    case 'hero':
      return (
        <div 
          className={wrapperClass}
          style={{ 
            backgroundColor: props.bgColor || '#2563eb',
            color: props.textColor || '#ffffff',
            padding: '80px 20px',
            textAlign: props.align || 'center'
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              {props.heading || 'Welcome'}
            </h1>
            <p style={{ fontSize: '1.25rem', marginBottom: '2rem', opacity: 0.9 }}>
              {props.subheading || 'Your tagline goes here'}
            </p>
            {props.ctaText && (
              <a 
                href={props.ctaUrl || '#'}
                style={{
                  display: 'inline-block',
                  padding: '12px 32px',
                  backgroundColor: 'white',
                  color: props.bgColor || '#2563eb',
                  borderRadius: '8px',
                  fontWeight: '600',
                  textDecoration: 'none'
                }}
              >
                {props.ctaText}
              </a>
            )}
          </div>
        </div>
      );

    case 'text':
      return (
        <div className={wrapperClass} style={{ padding: '40px 20px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {props.heading && (
              <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                {props.heading}
              </h2>
            )}
            <div style={{ fontSize: '1rem', lineHeight: '1.75', color: '#374151' }}>
              {props.body || 'Add your content here...'}
            </div>
          </div>
        </div>
      );

    case 'image':
      return (
        <div className={wrapperClass} style={{ padding: '20px' }}>
          {props.url ? (
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <img 
                src={props.url} 
                alt={props.alt || ''} 
                style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
              />
              {props.caption && (
                <p style={{ marginTop: '8px', fontSize: '0.875rem', color: '#6b7280', textAlign: 'center' }}>
                  {props.caption}
                </p>
              )}
            </div>
          ) : (
            <div style={{ 
              padding: '60px 20px', 
              backgroundColor: '#f3f4f6', 
              textAlign: 'center',
              borderRadius: '8px'
            }}>
              <p style={{ color: '#9ca3af' }}>🖼️ Add an image URL</p>
            </div>
          )}
        </div>
      );

    case 'video':
      return (
        <div className={wrapperClass} style={{ padding: '40px 20px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {props.heading && (
              <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>
                {props.heading}
              </h2>
            )}
            {props.url ? (
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                <iframe
                  src={getEmbedUrl(props.url)}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div style={{ 
                padding: '60px 20px', 
                backgroundColor: '#f3f4f6', 
                textAlign: 'center',
                borderRadius: '8px'
              }}>
                <p style={{ color: '#9ca3af' }}>🎥 Add a YouTube or Vimeo URL</p>
              </div>
            )}
          </div>
        </div>
      );

    case 'spacer':
      return (
        <div 
          className={wrapperClass}
          style={{ 
            height: `${props.height || 40}px`,
            backgroundColor: isSelected ? '#f3f4f6' : 'transparent'
          }}
        >
          {isSelected && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              color: '#9ca3af',
              fontSize: '0.875rem'
            }}>
              ↕️ {props.height || 40}px spacer
            </div>
          )}
        </div>
      );

    case 'divider':
      return (
        <div className={wrapperClass} style={{ padding: '20px' }}>
          <hr style={{ 
            border: 'none', 
            borderTop: '1px solid #e5e7eb',
            maxWidth: '1200px',
            margin: '0 auto'
          }} />
        </div>
      );

    case 'cta':
      return (
        <div 
          className={wrapperClass}
          style={{ 
            backgroundColor: props.bgColor || '#f8fafc',
            padding: '60px 20px',
            textAlign: 'center'
          }}
        >
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              {props.heading || 'Ready to get started?'}
            </h2>
            {props.body && (
              <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '2rem' }}>
                {props.body}
              </p>
            )}
            {props.buttonText && (
              <a 
                href={props.buttonUrl || '#'}
                style={{
                  display: 'inline-block',
                  padding: '14px 36px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  borderRadius: '8px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  fontSize: '1.125rem'
                }}
              >
                {props.buttonText}
              </a>
            )}
          </div>
        </div>
      );

    case 'features':
      return (
        <div className={wrapperClass} style={{ padding: '60px 20px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {props.heading && (
              <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '3rem', textAlign: 'center' }}>
                {props.heading}
              </h2>
            )}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: viewMode === 'mobile' ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem'
            }}>
              {(props.items || [{ icon: '✓', title: 'Feature 1', desc: 'Description' }]).map((item, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{item.icon}</div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    {item.title}
                  </h3>
                  <p style={{ color: '#6b7280' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'testimonials':
      return (
        <div className={wrapperClass} style={{ padding: '60px 20px', backgroundColor: '#f9fafb' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {props.heading && (
              <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '3rem', textAlign: 'center' }}>
                {props.heading}
              </h2>
            )}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: viewMode === 'mobile' ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem'
            }}>
              {(props.items || [{ quote: 'Great service!', author: 'John Doe', role: 'CEO' }]).map((item, i) => (
                <div key={i} style={{ 
                  backgroundColor: 'white', 
                  padding: '2rem', 
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <p style={{ fontSize: '1.125rem', marginBottom: '1rem', fontStyle: 'italic' }}>
                    "{item.quote}"
                  </p>
                  <div>
                    <div style={{ fontWeight: '600' }}>{item.author}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{item.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'columns':
      return (
        <div className={wrapperClass} style={{ padding: '40px 20px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: viewMode === 'mobile' ? '1fr' : `repeat(${props.columns || 2}, 1fr)`,
              gap: '2rem'
            }}>
              {(props.items || [{}, {}]).map((item, i) => (
                <div key={i}>
                  {item.imageUrl && (
                    <img 
                      src={item.imageUrl} 
                      alt="" 
                      style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }}
                    />
                  )}
                  {item.heading && (
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      {item.heading}
                    </h3>
                  )}
                  {item.body && (
                    <p style={{ color: '#6b7280' }}>{item.body}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'nav':
    case 'footer':
    case 'form':
    case 'pricing':
    case 'faq':
    case 'team':
    case 'portfolio':
    case 'gallery':
    case 'blog':
    case 'newsletter':
    case 'stats':
    case 'timeline':
    case 'tabs':
    case 'accordion':
    case 'countdown':
    case 'map':
    case 'social':
    case 'contact':
    case 'logo-cloud':
    case 'process':
    case 'comparison':
    case 'embed':
      return (
        <div className={wrapperClass} style={{ padding: '40px 20px', backgroundColor: '#f9fafb' }}>
          <div style={{ 
            maxWidth: '800px', 
            margin: '0 auto',
            textAlign: 'center',
            padding: '40px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '2px dashed #e5e7eb'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {getBlockIcon(block.type)}
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'capitalize' }}>
              {block.type.replace('-', ' ')} Block
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Configure this block in the properties panel →
            </p>
          </div>
        </div>
      );

    default:
      return (
        <div className={wrapperClass} style={{ padding: '40px 20px' }}>
          <div style={{ 
            maxWidth: '800px', 
            margin: '0 auto',
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#fef2f2',
            borderRadius: '8px',
            border: '2px dashed #fca5a5'
          }}>
            <p style={{ color: '#991b1b', fontWeight: '600' }}>
              Unknown block type: {block.type}
            </p>
          </div>
        </div>
      );
  }
}

// Helper function to convert YouTube/Vimeo URLs to embed URLs
function getEmbedUrl(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = url.includes('youtu.be') 
      ? url.split('youtu.be/')[1]?.split('?')[0]
      : url.split('v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes('vimeo.com')) {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
    return `https://player.vimeo.com/video/${videoId}`;
  }
  return url;
}

// Helper function to get icon for block type
function getBlockIcon(type) {
  const icons = {
    nav: '🧭',
    footer: '⬇️',
    form: '📋',
    pricing: '💰',
    faq: '❓',
    team: '👥',
    portfolio: '🎨',
    gallery: '🖼️',
    blog: '📰',
    newsletter: '📧',
    stats: '📈',
    timeline: '📅',
    tabs: '📑',
    accordion: '📂',
    countdown: '⏱️',
    map: '🗺️',
    social: '🔗',
    contact: '📞',
    'logo-cloud': '🏢',
    process: '🔄',
    comparison: '⚖️',
    embed: '🔌'
  };
  return icons[type] || '📦';
}
