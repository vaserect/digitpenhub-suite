'use client';
import React from 'react';

export default function BlockRenderer({ block, isSelected, viewMode, onUpdate }) {
  const props = block.props || {};
  const wrapperClass = `block-wrapper ${isSelected ? 'selected' : ''} ${props.className || ''}`;

  switch (block.type) {
    case 'hero':
      return (
        <div className={wrapperClass} style={{ backgroundColor: props.bgColor || '#2563eb', color: props.textColor || '#ffffff', padding: '80px 20px', textAlign: props.align || 'center' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>{props.heading || 'Welcome'}</h1>
            <p style={{ fontSize: '1.25rem', marginBottom: '2rem', opacity: 0.9 }}>{props.subheading || 'Your tagline goes here'}</p>
            {props.ctaText && <a href={props.ctaUrl || '#'} style={{ display: 'inline-block', padding: '12px 32px', backgroundColor: 'white', color: props.bgColor || '#2563eb', borderRadius: '8px', fontWeight: '600', textDecoration: 'none' }}>{props.ctaText}</a>}
          </div>
        </div>
      );

    case 'text':
      return (
        <div className={wrapperClass} style={{ padding: '40px 20px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {props.heading && <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>{props.heading}</h2>}
            <div style={{ fontSize: '1rem', lineHeight: '1.75', color: '#374151' }}>{props.body || 'Add your content here...'}</div>
          </div>
        </div>
      );

    case 'image':
      return (
        <div className={wrapperClass} style={{ padding: '20px' }}>
          {props.url ? (
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <img src={props.url} alt={props.alt || ''} style={{ width: '100%', height: 'auto', borderRadius: '8px' }} />
              {props.caption && <p style={{ marginTop: '8px', fontSize: '0.875rem', color: '#6b7280', textAlign: 'center' }}>{props.caption}</p>}
            </div>
          ) : (
            <div style={{ padding: '60px 20px', backgroundColor: '#f3f4f6', textAlign: 'center', borderRadius: '8px' }}>
              <p style={{ color: '#9ca3af' }}>🖼️ Add an image URL</p>
            </div>
          )}
        </div>
      );

    case 'video':
      return (
        <div className={wrapperClass} style={{ padding: '40px 20px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {props.heading && <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>{props.heading}</h2>}
            {props.url ? (
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                <iframe src={getEmbedUrl(props.url)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            ) : (
              <div style={{ padding: '60px 20px', backgroundColor: '#f3f4f6', textAlign: 'center', borderRadius: '8px' }}>
                <p style={{ color: '#9ca3af' }}>🎥 Add a YouTube or Vimeo URL</p>
              </div>
            )}
          </div>
        </div>
      );

    case 'spacer':
      return (
        <div className={wrapperClass} style={{ height: `${props.height || 40}px`, backgroundColor: isSelected ? '#f3f4f6' : 'transparent' }}>
          {isSelected && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', fontSize: '0.875rem' }}>↕️ {props.height || 40}px spacer</div>}
        </div>
      );

    case 'divider':
      return (
        <div className={wrapperClass} style={{ padding: '20px' }}>
          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', maxWidth: '1200px', margin: '0 auto' }} />
        </div>
      );

    case 'cta':
      return (
        <div className={wrapperClass} style={{ backgroundColor: props.bgColor || '#f8fafc', padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>{props.heading || 'Ready to get started?'}</h2>
            {props.body && <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '2rem' }}>{props.body}</p>}
            {props.buttonText && <a href={props.buttonUrl || '#'} style={{ display: 'inline-block', padding: '14px 36px', backgroundColor: '#2563eb', color: 'white', borderRadius: '8px', fontWeight: '600', textDecoration: 'none', fontSize: '1.125rem' }}>{props.buttonText}</a>}
          </div>
        </div>
      );

    case 'features':
      return (
        <div className={wrapperClass} style={{ padding: '60px 20px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {props.heading && <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '3rem', textAlign: 'center' }}>{props.heading}</h2>}
            <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'mobile' ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              {(props.items || [{ icon: '✓', title: 'Feature 1', desc: 'Description' }]).map((item, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{item.icon}</div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>{item.title}</h3>
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
            {props.heading && <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '3rem', textAlign: 'center' }}>{props.heading}</h2>}
            <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'mobile' ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              {(props.items || [{ quote: 'Great service!', author: 'John Doe', role: 'CEO' }]).map((item, i) => (
                <div key={i} style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <p style={{ fontSize: '1.125rem', marginBottom: '1rem', fontStyle: 'italic' }}>"{item.quote}"</p>
                  <div><div style={{ fontWeight: '600' }}>{item.author}</div><div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{item.role}</div></div>
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
            <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'mobile' ? '1fr' : `repeat(${props.columns || 2}, 1fr)`, gap: '2rem' }}>
              {(props.items || [{}, {}]).map((item, i) => (
                <div key={i}>
                  {item.imageUrl && <img src={item.imageUrl} alt="" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }} />}
                  {item.heading && <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>{item.heading}</h3>}
                  {item.body && <p style={{ color: '#6b7280' }}>{item.body}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'nav':
      return (
        <nav className={wrapperClass} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', backgroundColor: props.bgColor || '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ fontWeight: 700, fontSize: '1.25rem', color: '#111827' }}>{props.logoText || 'Logo'}</div>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            {(props.links || []).slice(0, 5).map((link, i) => (
              <a key={i} href={link.url || '#'} style={{ color: '#4b5563', textDecoration: 'none', fontSize: '0.875rem' }}>{link.label || 'Link'}</a>
            ))}
            {props.ctaText && <a href={props.ctaUrl || '#'} style={{ padding: '8px 20px', backgroundColor: '#2563eb', color: 'white', borderRadius: '6px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>{props.ctaText}</a>}
          </div>
        </nav>
      );

    case 'footer':
      return (
        <footer className={wrapperClass} style={{ backgroundColor: props.bgColor || '#111827', color: '#d1d5db', padding: '48px 24px 24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: viewMode === 'mobile' ? '1fr' : 'repeat(4, 1fr)', gap: '32px' }}>
            <div><div style={{ fontWeight: 700, fontSize: '1.125rem', color: 'white', marginBottom: '12px' }}>{props.logoText || 'Logo'}</div><p style={{ fontSize: '0.875rem', lineHeight: '1.625' }}>{props.description || 'Your company description'}</p></div>
            {(props.columns || [{ heading: 'Product', links: [{ label: 'Features' }, { label: 'Pricing' }] }, { heading: 'Company', links: [{ label: 'About' }, { label: 'Contact' }] }, { heading: 'Legal', links: [{ label: 'Privacy' }, { label: 'Terms' }] }]).slice(0, 3).map((col, i) => (
              <div key={i}><div style={{ fontWeight: 600, color: 'white', marginBottom: '12px', fontSize: '0.875rem' }}>{col.heading || 'Column'}</div>{(col.links || []).map((link, j) => (
                <a key={j} href={link.url || '#'} style={{ display: 'block', color: '#9ca3af', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '8px' }}>{link.label || 'Link'}</a>
              ))}</div>
            ))}
          </div>
          <div style={{ maxWidth: '1200px', margin: '32px auto 0', paddingTop: '24px', borderTop: '1px solid #374151', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>{props.copyright || '© 2024 All rights reserved.'}</div>
        </footer>
      );

    case 'form':
      return (
        <div className={wrapperClass} style={{ padding: '60px 20px', backgroundColor: props.bgColor || '#f9fafb' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            {props.title && <h2 style={{ fontSize: '1.5rem', fontWeight: 600, textAlign: 'center', marginBottom: '8px' }}>{props.title}</h2>}
            {props.description && <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '32px' }}>{props.description}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {props.showName !== false && <input type="text" placeholder="Your Name" readOnly style={{ padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem' }} />}
              <input type="email" placeholder="Your Email" readOnly style={{ padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem' }} />
              {props.showMessage !== false && <textarea placeholder="Your Message" rows={4} readOnly style={{ padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', resize: 'vertical' }} />}
              <button style={{ padding: '14px 24px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>{props.submitText || 'Send Message'}</button>
            </div>
          </div>
        </div>
      );

    case 'pricing': {
      const plans = props.plans || [
        { name: 'Starter', price: '$29', period: '/month', description: 'Best for small teams', features: ['5 users', '10GB storage', 'Basic support'], highlighted: false, cta: 'Get Started' },
        { name: 'Professional', price: '$79', period: '/month', description: 'Best for growing teams', features: ['25 users', '100GB storage', 'Priority support'], highlighted: true, cta: 'Get Started' },
        { name: 'Enterprise', price: '$199', period: '/month', description: 'Best for large teams', features: ['Unlimited users', '1TB storage', '24/7 support'], highlighted: false, cta: 'Contact us' }
      ];
      return (
        <div className={wrapperClass} style={{ padding: '60px 20px', backgroundColor: props.bgColor || '#ffffff' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {props.heading && <h2 style={{ fontSize: '2.25rem', fontWeight: 700, textAlign: 'center', marginBottom: '8px', color: '#111827' }}>{props.heading}</h2>}
            {props.subheading && <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '48px', fontSize: '1.125rem' }}>{props.subheading}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'mobile' ? '1fr' : 'repeat(3, 1fr)', gap: '24px', alignItems: 'start' }}>
              {plans.slice(0, 3).map((plan, i) => (
                <div key={i} style={{ backgroundColor: plan.highlighted ? '#2563eb' : 'white', color: plan.highlighted ? 'white' : '#111827', borderRadius: '12px', padding: '32px 24px', border: plan.highlighted ? 'none' : '1px solid #e5e7eb', transform: plan.highlighted ? 'scale(1.05)' : 'none', position: 'relative', boxShadow: plan.highlighted ? '0 10px 30px rgba(37,99,235,0.2)' : '0 1px 3px rgba(0,0,0,0.1)' }}>
                  {plan.highlighted && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#f59e0b', color: 'white', padding: '4px 16px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>Popular</div>}
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', opacity: plan.highlighted ? 0.9 : 0.6 }}>{plan.name || 'Plan'}</div>
                  <div style={{ marginBottom: '8px' }}><span style={{ fontSize: '2.5rem', fontWeight: 700 }}>{plan.price || '$0'}</span><span style={{ fontSize: '0.875rem', opacity: 0.7 }}>{plan.period || ''}</span></div>
                  <div style={{ fontSize: '0.875rem', marginBottom: '24px', opacity: 0.8 }}>{plan.description || ''}</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', fontSize: '0.875rem' }}>
                    {(plan.features || []).map((feat, j) => <li key={j} style={{ padding: '6px 0', borderBottom: '1px solid ' + (plan.highlighted ? 'rgba(255,255,255,0.2)' : '#f3f4f6') }}>✓ {feat}</li>)}
                  </ul>
                  <a href="#" style={{ display: 'block', textAlign: 'center', padding: '12px', backgroundColor: plan.highlighted ? 'white' : '#2563eb', color: plan.highlighted ? '#2563eb' : 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>{plan.cta || 'Get Started'}</a>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'faq': {
      const faqItems = props.items || [
        { question: 'How does the pricing work?', answer: 'Choose a plan that fits your needs.' },
        { question: 'Can I cancel anytime?', answer: 'Yes, you can cancel anytime.' },
        { question: 'Do you offer support?', answer: 'We offer 24/7 support on all paid plans.' }
      ];
      return (
        <div className={wrapperClass} style={{ padding: '60px 20px', backgroundColor: props.bgColor || '#ffffff' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {props.heading && <h2 style={{ fontSize: '2rem', fontWeight: 700, textAlign: 'center', marginBottom: '40px', color: '#111827' }}>{props.heading}</h2>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {faqItems.map((item, i) => (
                <details key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                  <summary style={{ padding: '16px 20px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', backgroundColor: '#f9fafb', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {item.question || 'Question?'}
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>▼</span>
                  </summary>
                  <div style={{ padding: '16px 20px', fontSize: '0.9375rem', color: '#4b5563', lineHeight: '1.625' }}>{item.answer || 'Answer goes here.'}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'team': {
      const members = props.members || [{ name: 'John Doe', role: 'CEO & Founder', bio: 'Passionate about building great products' }];
      return (
        <div className={wrapperClass} style={{ padding: '60px 20px', backgroundColor: props.bgColor || '#ffffff' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {props.heading && <h2 style={{ fontSize: '2rem', fontWeight: 700, textAlign: 'center', marginBottom: '8px', color: '#111827' }}>{props.heading}</h2>}
            {props.subheading && <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '48px', fontSize: '1.125rem' }}>{props.subheading}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'mobile' ? '1fr' : viewMode === 'tablet' ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', justifyContent: 'center' }}>
              {members.map((m, i) => (
                <div key={i} style={{ textAlign: 'center', backgroundColor: 'white', borderRadius: '12px', padding: '32px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6' }}>
                  <div style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: '#e5e7eb', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', overflow: 'hidden' }}>
                    {m.imageUrl ? <img src={m.imageUrl} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '<span>👤</span>'}
                  </div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>{m.name}</h3>
                  <p style={{ fontSize: '0.875rem', color: '#2563eb', fontWeight: 500, marginBottom: '8px' }}>{m.role}</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.5' }}>{m.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'portfolio': {
      const portfolioItems = props.items || [{ title: 'Project', category: 'Design', description: 'Description' }];
      return (
        <div className={wrapperClass} style={{ padding: '60px 20px', backgroundColor: props.bgColor || '#f9fafb' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {props.heading && <h2 style={{ fontSize: '2rem', fontWeight: 700, textAlign: 'center', marginBottom: '8px', color: '#111827' }}>{props.heading}</h2>}
            {props.subheading && <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '48px', fontSize: '1.125rem' }}>{props.subheading}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'mobile' ? '1fr' : viewMode === 'tablet' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '24px' }}>
              {portfolioItems.map((item, i) => (
                <div key={i} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ height: '200px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🖼️'}
                  </div>
                  <div style={{ padding: '20px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>{item.category}</div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>{item.title}</h3>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.5' }}>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'gallery': {
      const images = props.images || [{ url: '', alt: 'Gallery image' }];
      return (
        <div className={wrapperClass} style={{ padding: '60px 20px', backgroundColor: props.bgColor || '#ffffff' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {props.heading && <h2 style={{ fontSize: '2rem', fontWeight: 700, textAlign: 'center', marginBottom: '48px', color: '#111827' }}>{props.heading}</h2>}
            <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'mobile' ? '1fr' : viewMode === 'tablet' ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '16px' }}>
              {images.map((img, i) => (
                <div key={i} style={{ aspectRatio: '1', backgroundColor: '#f3f4f6', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', border: '1px solid #e5e7eb' }}>
                  {img.url ? <img src={img.url} alt={img.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ opacity: 0.4 }}>🖼️</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'blog': {
      const posts = props.posts || [{ title: 'Article', excerpt: 'Summary', author: 'Author', date: '2026-01-01', category: 'News' }];
      return (
        <div className={wrapperClass} style={{ padding: '60px 20px', backgroundColor: props.bgColor || '#f9fafb' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {props.heading && <h2 style={{ fontSize: '2rem', fontWeight: 700, textAlign: 'center', marginBottom: '8px', color: '#111827' }}>{props.heading}</h2>}
            {props.subheading && <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '48px', fontSize: '1.125rem' }}>{props.subheading}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'mobile' ? '1fr' : viewMode === 'tablet' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '24px' }}>
              {posts.map((post, i) => (
                <article key={i} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ height: '180px', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                    {post.imageUrl ? <img src={post.imageUrl} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📰'}
                  </div>
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px', fontSize: '0.75rem', color: '#6b7280' }}>
                      <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>{post.category}</span>
                      <span>{post.readTime || '5 min read'}</span>
                    </div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '8px', lineHeight: '1.4' }}>{post.title}</h3>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '16px', lineHeight: '1.5' }}>{post.excerpt}</p>
                    <div style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>By {post.author} • {post.date ? new Date(post.date).toLocaleDateString() : ''}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'newsletter':
      return (
        <div className={wrapperClass} style={{ padding: '60px 20px', backgroundColor: props.bgColor || '#f8fafc' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            {props.heading && <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>{props.heading}</h2>}
            {props.subheading && <p style={{ color: '#6b7280', marginBottom: '32px', fontSize: '1rem' }}>{props.subheading}</p>}
            <div style={{ display: 'flex', gap: '8px', maxWidth: '480px', margin: '0 auto' }}>
              <input type="email" placeholder={props.placeholder || 'Your email address'} readOnly style={{ flex: 1, padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem' }} />
              <button style={{ padding: '12px 24px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>{props.buttonText || 'Subscribe'}</button>
            </div>
            {props.showPrivacyNote !== false && <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '12px' }}>{props.privacyNote || 'We respect your privacy.'}</p>}
          </div>
        </div>
      );

    case 'stats': {
      const statItems = props.items || [{ value: '99%', label: 'Satisfaction' }];
      return (
        <div className={wrapperClass} style={{ padding: '60px 20px', backgroundColor: props.bgColor || '#1e3a5f' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {props.heading && <h2 style={{ fontSize: '2rem', fontWeight: 700, textAlign: 'center', marginBottom: '48px', color: 'white' }}>{props.heading}</h2>}
            <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'mobile' ? '1fr' : viewMode === 'tablet' ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', textAlign: 'center' }}>
              {statItems.map((s, i) => (
                <div key={i}><div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'white', marginBottom: '4px' }}>{s.value}</div><div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{s.label}</div></div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'timeline': {
      const timelineItems = props.items || [{ year: '2026', title: 'Milestone', description: 'Description' }];
      return (
        <div className={wrapperClass} style={{ padding: '60px 20px', backgroundColor: props.bgColor || '#ffffff' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {props.heading && <h2 style={{ fontSize: '2rem', fontWeight: 700, textAlign: 'center', marginBottom: '8px', color: '#111827' }}>{props.heading}</h2>}
            {props.subheading && <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '48px', fontSize: '1.125rem' }}>{props.subheading}</p>}
            <div style={{ position: 'relative', paddingLeft: '32px' }}>
              <div style={{ position: 'absolute', left: '8px', top: 0, bottom: 0, width: '2px', backgroundColor: '#e5e7eb' }} />
              {timelineItems.map((item, i) => (
                <div key={i} style={{ position: 'relative', marginBottom: '32px', paddingLeft: '24px' }}>
                  <div style={{ position: 'absolute', left: '-28px', top: '4px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#2563eb', border: '3px solid white', boxShadow: '0 0 0 2px #2563eb' }} />
                  <div style={{ fontSize: '0.8125rem', color: '#2563eb', fontWeight: 600, marginBottom: '4px' }}>{item.year}</div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>{item.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.625' }}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'tabs': {
      const tabList = props.tabs || [{ label: 'Tab 1', content: 'Content' }];
      return (
        <div className={wrapperClass} style={{ padding: '60px 20px', backgroundColor: props.bgColor || '#ffffff' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {props.heading && <h2 style={{ fontSize: '2rem', fontWeight: 700, textAlign: 'center', marginBottom: '32px', color: '#111827' }}>{props.heading}</h2>}
            <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: '24px' }}>
              {tabList.map((tab, i) => (
                <div key={i} style={{ padding: '12px 24px', borderBottom: i === 0 ? '2px solid #2563eb' : '2px solid transparent', color: i === 0 ? '#2563eb' : '#6b7280', fontWeight: i === 0 ? 600 : 400, fontSize: '0.9375rem', marginBottom: '-2px', cursor: 'default' }}>{tab.label}</div>
              ))}
            </div>
            <div style={{ fontSize: '1rem', color: '#374151', lineHeight: '1.75' }}>{tabList[0]?.content}</div>
          </div>
        </div>
      );
    }

    case 'accordion': {
      const accordionItems = props.items || [{ title: 'Section', content: 'Content' }];
      return (
        <div className={wrapperClass} style={{ padding: '60px 20px', backgroundColor: props.bgColor || '#ffffff' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {props.heading && <h2 style={{ fontSize: '2rem', fontWeight: 700, textAlign: 'center', marginBottom: '40px', color: '#111827' }}>{props.heading}</h2>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {accordionItems.map((item, i) => (
                <details key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                  <summary style={{ padding: '16px 20px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', backgroundColor: '#f9fafb', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {item.title}<span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>▼</span>
                  </summary>
                  <div style={{ padding: '16px 20px', fontSize: '0.9375rem', color: '#4b5563', lineHeight: '1.625', borderTop: '1px solid #e5e7eb' }}>{item.content}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'countdown':
      return (
        <div className={wrapperClass} style={{ padding: '60px 20px', backgroundColor: props.bgColor || '#1e3a5f' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            {props.heading && <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white', marginBottom: '8px' }}>{props.heading}</h2>}
            {props.subheading && <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '32px', fontSize: '1rem' }}>{props.subheading}</p>}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              {[{ val: '07', label: 'Days' }, { val: '12', label: 'Hours' }, { val: '45', label: 'Minutes' }, { val: '30', label: 'Seconds' }].map((unit, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ width: '72px', padding: '16px 0', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white', fontSize: '1.75rem', fontWeight: 700 }}>{unit.val}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '8px', textTransform: 'uppercase' }}>{unit.label}</div>
                </div>
              ))}
            </div>
            {props.ctaText && <a href={props.ctaUrl || '#'} style={{ display: 'inline-block', marginTop: '32px', padding: '14px 36px', backgroundColor: '#f59e0b', color: 'white', borderRadius: '8px', fontWeight: 600, textDecoration: 'none', fontSize: '1.125rem' }}>{props.ctaText}</a>}
          </div>
        </div>
      );

    case 'map': {
      const embedUrl = props.embedUrl || `https://www.openstreetmap.org/export/embed.html?bbox=${(props.longitude || -74.006)-0.01}%2C${(props.latitude || 40.7128)-0.01}%2C${(props.longitude || -74.006)+0.01}%2C${(props.latitude || 40.7128)+0.01}&layer=mapnik`;
      return (
        <div className={wrapperClass} style={{ padding: '40px 20px', backgroundColor: props.bgColor || '#ffffff' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {props.heading && <h2 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', marginBottom: '24px', color: '#111827' }}>{props.heading}</h2>}
            <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <iframe src={embedUrl} width="100%" height="400" style={{ border: 'none', display: 'block' }} loading="lazy" />
            </div>
            {props.address && <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '12px', fontSize: '0.875rem' }}>📍 {props.address}</p>}
          </div>
        </div>
      );
    }

    case 'social': {
      const socialLinks = props.links || [{ platform: 'facebook', icon: '📘' }, { platform: 'twitter', icon: '🐦' }];
      return (
        <div className={wrapperClass} style={{ padding: '40px 20px', backgroundColor: props.bgColor || '#ffffff' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            {props.heading && <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', color: '#111827' }}>{props.heading}</h2>}
            {props.subheading && <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '0.9375rem' }}>{props.subheading}</p>}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {socialLinks.map((link, i) => (
                <a key={i} href={link.url || '#'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f3f4f6', textDecoration: 'none', fontSize: '1.5rem', cursor: 'pointer' }} title={link.platform}>{link.icon || '🔗'}</a>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'contact': {
      const contactInfo = props.contactInfo || [{ type: 'email', value: 'hello@example.com', icon: '📧' }];
      return (
        <div className={wrapperClass} style={{ padding: '60px 20px', backgroundColor: props.bgColor || '#ffffff' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {props.heading && <h2 style={{ fontSize: '2rem', fontWeight: 700, textAlign: 'center', marginBottom: '8px', color: '#111827' }}>{props.heading}</h2>}
            {props.subheading && <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '48px', fontSize: '1.125rem' }}>{props.subheading}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'mobile' ? '1fr' : '1fr 1fr', gap: '48px', alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {contactInfo.map((info, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>{info.icon || '📧'}</div>
                    <div><div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>{info.type}</div><div style={{ fontSize: '0.9375rem', color: '#374151' }}>{info.value}</div></div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input type="text" placeholder="Your Name" readOnly style={{ padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.9375rem' }} />
                <input type="email" placeholder="Your Email" readOnly style={{ padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.9375rem' }} />
                <textarea placeholder="Your Message" rows={4} readOnly style={{ padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.9375rem', resize: 'vertical' }} />
                <button style={{ padding: '12px 24px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>Send Message</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    case 'logo-cloud': {
      const logos = props.logos || [{ name: 'Logo 1' }, { name: 'Logo 2' }, { name: 'Logo 3' }];
      return (
        <div className={wrapperClass} style={{ padding: '40px 20px', backgroundColor: props.bgColor || '#f9fafb' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {props.heading && <h2 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', marginBottom: '32px', color: '#111827' }}>{props.heading}</h2>}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', flexWrap: 'wrap', opacity: 0.6 }}>
              {logos.map((logo, i) => (
                <div key={i} style={{ fontSize: '1.125rem', fontWeight: 600, color: '#6b7280', padding: '8px 16px' }}>
                  {logo.imageUrl ? <img src={logo.imageUrl} alt={logo.name} style={{ height: '32px', opacity: 0.6 }} /> : logo.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'process': {
      const steps = props.steps || props.items || [{ title: 'Step 1', description: 'Description' }, { title: 'Step 2', description: 'Description' }, { title: 'Step 3', description: 'Description' }];
      return (
        <div className={wrapperClass} style={{ padding: '60px 20px', backgroundColor: props.bgColor || '#ffffff' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {props.heading && <h2 style={{ fontSize: '2rem', fontWeight: 700, textAlign: 'center', marginBottom: '8px', color: '#111827' }}>{props.heading}</h2>}
            {props.subheading && <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '48px', fontSize: '1.125rem' }}>{props.subheading}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'mobile' ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
              {steps.map((step, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.5rem', fontWeight: 700, color: '#2563eb' }}>{i + 1}</div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>{step.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.5' }}>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'comparison': {
      const cPlans = props.plans || [{ name: 'Basic', included: [true, false] }, { name: 'Pro', included: [true, true] }];
      const features = props.features || ['Feature 1', 'Feature 2'];
      return (
        <div className={wrapperClass} style={{ padding: '60px 20px', backgroundColor: props.bgColor || '#ffffff' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {props.heading && <h2 style={{ fontSize: '2rem', fontWeight: 700, textAlign: 'center', marginBottom: '8px', color: '#111827' }}>{props.heading}</h2>}
            {props.subheading && <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '48px', fontSize: '1.125rem' }}>{props.subheading}</p>}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '16px', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: 600 }}>Features</th>
                    {cPlans.map((p, i) => <th key={i} style={{ textAlign: 'center', padding: '16px', borderBottom: '2px solid #e5e7eb', color: '#111827', fontWeight: 700, fontSize: '1.125rem' }}>{p.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {features.map((feat, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '14px 16px', color: '#374151', fontSize: '0.9375rem' }}>{feat}</td>
                      {cPlans.map((p, j) => <td key={j} style={{ textAlign: 'center', padding: '14px 16px', fontSize: '1.25rem' }}>{p.included?.[i] ? <span style={{ color: '#10b981' }}>✓</span> : <span style={{ color: '#d1d5db' }}>—</span>}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    case 'embed':
      return (
        <div className={wrapperClass} style={{ padding: '20px', backgroundColor: props.bgColor || '#ffffff' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {props.code ? (
              <div dangerouslySetInnerHTML={{ __html: props.code }} style={{ lineHeight: 0 }} />
            ) : (
              <div style={{ padding: '60px 20px', backgroundColor: '#f3f4f6', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔌</div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Add embed code in the properties panel →</p>
              </div>
            )}
          </div>
        </div>
      );

    default:
      return (
        <div className={wrapperClass} style={{ padding: '40px 20px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '40px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '2px dashed #fca5a5' }}>
            <p style={{ color: '#991b1b', fontWeight: '600' }}>Unknown block type: {block.type}</p>
          </div>
        </div>
      );
  }
}

function getEmbedUrl(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = url.includes('youtu.be') ? url.split('youtu.be/')[1]?.split('?')[0] : url.split('v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes('vimeo.com')) {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
    return `https://player.vimeo.com/video/${videoId}`;
  }
  return url;
}
