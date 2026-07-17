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
      // Navigation bar
      return (
        <nav className={wrapperClass} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', backgroundColor: props.bgColor || '#ffffff',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{ fontWeight: 700, fontSize: '1.25rem', color: '#111827' }}>
            {props.logoText || 'Logo'}
          </div>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            {(props.links || []).slice(0, 5).map((link, i) => (
              <a key={i} href={link.url || '#'} style={{ color: '#4b5563', textDecoration: 'none', fontSize: '0.875rem' }}>
                {link.label || 'Link'}
              </a>
            ))}
            {props.ctaText && (
              <a href={props.ctaUrl || '#'} style={{
                padding: '8px 20px', backgroundColor: '#2563eb', color: 'white',
                borderRadius: '6px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600
              }}>{props.ctaText}</a>
            )}
          </div>
        </nav>
      );

    case 'footer':
      return (
        <footer className={wrapperClass} style={{
          backgroundColor: props.bgColor || '#111827', color: '#d1d5db',
          padding: '48px 24px 24px'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid',
            gridTemplateColumns: viewMode === 'mobile' ? '1fr' : 'repeat(4, 1fr)', gap: '32px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.125rem', color: 'white', marginBottom: '12px' }}>
                {props.logoText || 'Logo'}
              </div>
              <p style={{ fontSize: '0.875rem', lineHeight: '1.625' }}>{props.description || 'Your company description'}</p>
            </div>
            {(props.columns || [
              { heading: 'Product', links: [{ label: 'Features' }, { label: 'Pricing' }] },
              { heading: 'Company', links: [{ label: 'About' }, { label: 'Contact' }] },
              { heading: 'Legal', links: [{ label: 'Privacy' }, { label: 'Terms' }] }
            ]).slice(0, 3).map((col, i) => (
              <div key={i}>
                <div style={{ fontWeight: 600, color: 'white', marginBottom: '12px', fontSize: '0.875rem' }}>
                  {col.heading || 'Column'}
                </div>
                {(col.links || []).map((link, j) => (
                  <a key={j} href={link.url || '#'} style={{
                    display: 'block', color: '#9ca3af', textDecoration: 'none',
                    fontSize: '0.875rem', marginBottom: '8px'
                  }}>{link.label || 'Link'}</a>
                ))}
              </div>
            ))}
          </div>
          <div style={{ maxWidth: '1200px', margin: '32px auto 0', paddingTop: '24px',
            borderTop: '1px solid #374151', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
            {props.copyright || '© 2024 All rights reserved.'}
          </div>
        </footer>
      );

    case 'form':
      return (
        <div className={wrapperClass} style={{ padding: '60px 20px', backgroundColor: props.bgColor || '#f9fafb' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            {props.title && (
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, textAlign: 'center', marginBottom: '8px' }}>
                {props.title}
              </h2>
            )}
            {props.description && (
              <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '32px' }}>{props.description}</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {props.showName !== false && (
                <input type="text" placeholder="Your Name"
                  style={{ padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem' }}
                  readOnly />
              )}
              <input type="email" placeholder="Your Email"
                style={{ padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem' }}
                readOnly />
              {props.showMessage !== false && (
                <textarea placeholder="Your Message" rows={4}
                  style={{ padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', resize: 'vertical' }}
                  readOnly />
              )}
              <button style={{
                padding: '14px 24px', backgroundColor: '#2563eb', color: 'white',
                border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer'
              }}>
                {props.submitText || 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      );

    case 'pricing': {
      const plans = props.plans || [
        { name: 'Starter', price: '$29', period: '/month', description: 'Best for small teams',
          features: ['5 users', '10GB storage', 'Basic support'], highlighted: false, cta: 'Get Started' },
        { name: 'Professional', price: '$79', period: '/month', description: 'Best for growing teams',
          features: ['25 users', '100GB storage', 'Priority support'], highlighted: true, cta: 'Get Started' },
        { name: 'Enterprise', price: '$199', period: '/month', description: 'Best for large teams',
          features: ['Unlimited users', '1TB storage', '24/7 support'], highlighted: false, cta: 'Contact us' }
      ];
      return (
        <div className={wrapperClass} style={{ padding: '60px 20px', backgroundColor: props.bgColor || '#ffffff' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {props.heading && (
              <h2 style={{ fontSize: '2.25rem', fontWeight: 700, textAlign: 'center', marginBottom: '8px', color: '#111827' }}>
                {props.heading}
              </h2>
            )}
            {props.subheading && (
              <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '48px', fontSize: '1.125rem' }}>
                {props.subheading}
              </p>
            )}
            <div style={{
              display: 'grid', gridTemplateColumns: viewMode === 'mobile' ? '1fr' : 'repeat(3, 1fr)',
              gap: '24px', alignItems: 'start'
            }}>
              {plans.slice(0, 3).map((plan, i) => (
                <div key={i} style={{
                  backgroundColor: plan.highlighted ? '#2563eb' : 'white',
                  color: plan.highlighted ? 'white' : '#111827',
                  borderRadius: '12px', padding: '32px 24px',
                  border: plan.highlighted ? 'none' : '1px solid #e5e7eb',
                  transform: plan.highlighted ? 'scale(1.05)' : 'none',
                  position: 'relative', boxShadow: plan.highlighted ? '0 10px 30px rgba(37,99,235,0.2)' : '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  {plan.highlighted && (
                    <div style={{
                      position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                      backgroundColor: '#f59e0b', color: 'white', padding: '4px 16px',
                      borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600
                    }}>Popular</div>
                  )}
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                    marginBottom: '16px', opacity: plan.highlighted ? 0.9 : 0.6 }}>
                    {plan.name || 'Plan'}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>{plan.price || '$0'}</span>
                    <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>{plan.period || ''}</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', marginBottom: '24px', opacity: 0.8 }}>
                    {plan.description || ''}
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', fontSize: '0.875rem' }}>
                    {(plan.features || []).map((feat, j) => (
                      <li key={j} style={{ padding: '6px 0', borderBottom: '1px solid ' + (plan.highlighted ? 'rgba(255,255,255,0.2)' : '#f3f4f6') }}>
                        ✓ {feat}
                      </li>
                    ))}
                  </ul>
                  <a href="#" style={{
                    display: 'block', textAlign: 'center', padding: '12px',
                    backgroundColor: plan.highlighted ? 'white' : '#2563eb',
                    color: plan.highlighted ? '#2563eb' : 'white',
                    borderRadius: '8px', textDecoration: 'none', fontWeight: 600
                  }}>{plan.cta || 'Get Started'}</a>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'faq': {
      const faqItems = props.items || [
        { question: 'How does the pricing work?', answer: 'Choose a plan that fits your needs. You can upgrade or downgrade at any time.' },
        { question: 'Can I cancel anytime?', answer: 'Yes, you can cancel your subscription anytime. No questions asked.' },
        { question: 'Do you offer support?', answer: 'We offer 24/7 support via email and chat on all paid plans.' }
      ];
      return (
        <div className={wrapperClass} style={{ padding: '60px 20px', backgroundColor: props.bgColor || '#ffffff' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {props.heading && (
              <h2 style={{ fontSize: '2rem', fontWeight: 700, textAlign: 'center', marginBottom: '40px', color: '#111827' }}>
                {props.heading}
              </h2>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {faqItems.map((item, i) => (
                <details key={i} style={{
                  border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden'
                }}>
                  <summary style={{
                    padding: '16px 20px', fontWeight: 600, fontSize: '1rem',
                    cursor: 'pointer', backgroundColor: '#f9fafb',
                    listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    {item.question || 'Question?'}
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>▼</span>
                  </summary>
                  <div style={{ padding: '16px 20px', fontSize: '0.9375rem', color: '#4b5563', lineHeight: '1.625' }}>
                    {item.answer || 'Answer goes here.'}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      );
    }

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
