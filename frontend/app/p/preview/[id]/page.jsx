'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

// ── Block renderers (same as /p/[slug]) ──────────────────────────────────────

function HeroBlock({ block }) {
  const bg = block.bgColor || '#2563eb';
  const textColor = block.textColor || '#ffffff';
  const align = block.align || 'center';
  return (
    <section style={{ background: bg, color: textColor, padding: '80px 24px', textAlign: align }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {block.heading && <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, lineHeight: 1.15, margin: '0 0 16px', fontFamily: "'Sora', sans-serif" }}>{block.heading}</h1>}
        {block.subheading && <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', opacity: 0.88, margin: '0 0 32px', lineHeight: 1.6 }}>{block.subheading}</p>}
        {block.ctaText && (
          <a href={block.ctaUrl || '#'} style={{ display: 'inline-block', background: 'rgba(255,255,255,0.18)', color: textColor, border: '2px solid rgba(255,255,255,0.5)', borderRadius: 50, padding: '14px 36px', fontWeight: 700, fontSize: '1.05rem', textDecoration: 'none', backdropFilter: 'blur(8px)' }}>
            {block.ctaText}
          </a>
        )}
      </div>
    </section>
  );
}

function TextBlock({ block }) {
  return (
    <section style={{ padding: '56px 24px', background: '#fff' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {block.heading && <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, margin: '0 0 20px', fontFamily: "'Sora', sans-serif", color: '#0f172a' }}>{block.heading}</h2>}
        {block.body && <div style={{ fontSize: '1.05rem', lineHeight: 1.75, color: '#334155', whiteSpace: 'pre-wrap' }}>{block.body}</div>}
      </div>
    </section>
  );
}

function FeaturesBlock({ block }) {
  const items = Array.isArray(block.items) ? block.items : [];
  return (
    <section style={{ padding: '64px 24px', background: '#f8fafc' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {block.heading && <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, margin: '0 0 48px', fontFamily: "'Sora', sans-serif", color: '#0f172a' }}>{block.heading}</h2>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 28 }}>
          {items.map((item, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', boxShadow: '0 4px 20px rgba(15,23,42,.06)', border: '1px solid #e2e8f0' }}>
              {item.icon && <div style={{ fontSize: '2rem', marginBottom: 14 }}>{item.icon}</div>}
              {item.title && <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', marginBottom: 8, fontFamily: "'Sora', sans-serif" }}>{item.title}</div>}
              {item.desc && <div style={{ fontSize: '0.92rem', color: '#64748b', lineHeight: 1.65 }}>{item.desc}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBlock({ block }) {
  const bg = block.bgColor || '#f8fafc';
  return (
    <section style={{ background: bg, padding: '64px 24px', textAlign: 'center' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {block.heading && <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, margin: '0 0 12px', fontFamily: "'Sora', sans-serif", color: '#0f172a' }}>{block.heading}</h2>}
        {block.body && <p style={{ fontSize: '1.05rem', color: '#64748b', margin: '0 0 28px', lineHeight: 1.65 }}>{block.body}</p>}
        {block.buttonText && (
          <a href={block.buttonUrl || '#'} style={{ display: 'inline-block', background: 'linear-gradient(135deg, #2563eb, #38bdf8)', color: '#fff', borderRadius: 50, padding: '14px 40px', fontWeight: 700, fontSize: '1.05rem', textDecoration: 'none', boxShadow: '0 12px 32px rgba(37,99,235,0.22)' }}>
            {block.buttonText}
          </a>
        )}
      </div>
    </section>
  );
}

function TestimonialsBlock({ block }) {
  const items = Array.isArray(block.items) ? block.items : [];
  return (
    <section style={{ padding: '64px 24px', background: '#fff' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {block.heading && <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, margin: '0 0 48px', fontFamily: "'Sora', sans-serif", color: '#0f172a' }}>{block.heading}</h2>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {items.map((item, i) => (
            <div key={i} style={{ background: '#f8fafc', borderRadius: 16, padding: '28px 24px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '2.5rem', color: '#2563eb', lineHeight: 1, marginBottom: 12 }}>"</div>
              {item.quote && <p style={{ margin: '0 0 20px', color: '#334155', lineHeight: 1.7, fontStyle: 'italic' }}>{item.quote}</p>}
              {item.author && <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>{item.author}</div>}
              {item.role && <div style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: 2 }}>{item.role}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ImageBlock({ block }) {
  if (!block.url) return null;
  return (
    <section style={{ padding: '40px 24px', background: '#fff', textAlign: 'center' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <img src={block.url} alt={block.alt || ''} style={{ maxWidth: '100%', borderRadius: 12, boxShadow: '0 8px 32px rgba(15,23,42,.1)' }} />
        {block.caption && <p style={{ marginTop: 12, fontSize: '0.875rem', color: '#94a3b8' }}>{block.caption}</p>}
      </div>
    </section>
  );
}

function VideoBlock({ block }) {
  if (!block.url) return null;
  let embedUrl = block.url;
  const ytMatch = block.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vmMatch = block.url.match(/vimeo\.com\/(\d+)/);
  if (vmMatch) embedUrl = `https://player.vimeo.com/video/${vmMatch[1]}`;
  return (
    <section style={{ padding: '48px 24px', background: '#0f172a' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {block.heading && <h2 style={{ textAlign: 'center', color: '#f8fafc', fontSize: '1.5rem', fontWeight: 700, margin: '0 0 28px', fontFamily: "'Sora', sans-serif" }}>{block.heading}</h2>}
        <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.4)' }}>
          <iframe src={embedUrl} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen />
        </div>
      </div>
    </section>
  );
}

function ColumnsBlock({ block }) {
  const items = Array.isArray(block.items) ? block.items : [];
  const count = block.columns === 3 ? 3 : 2;
  return (
    <section style={{ padding: '56px 24px', background: '#fff' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))`, gap: 32 }}>
        {Array.from({ length: count }).map((_, i) => {
          const col = items[i] || {};
          return (
            <div key={i}>
              {col.imageUrl && <img src={col.imageUrl} alt={col.heading || ''} style={{ width: '100%', borderRadius: 12, marginBottom: 16, objectFit: 'cover', maxHeight: 200 }} />}
              {col.heading && <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 8px', fontFamily: "'Sora', sans-serif", color: '#0f172a' }}>{col.heading}</h3>}
              {col.body && <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: '#334155', whiteSpace: 'pre-wrap', margin: 0 }}>{col.body}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Block({ block }) {
  switch (block.type) {
    case 'hero':         return <HeroBlock block={block} />;
    case 'text':         return <TextBlock block={block} />;
    case 'features':     return <FeaturesBlock block={block} />;
    case 'cta':          return <CtaBlock block={block} />;
    case 'testimonials': return <TestimonialsBlock block={block} />;
    case 'image':        return <ImageBlock block={block} />;
    case 'video':        return <VideoBlock block={block} />;
    case 'columns':      return <ColumnsBlock block={block} />;
    case 'spacer':       return <div style={{ height: `${block.height || 40}px` }} />;
    case 'divider':      return <div style={{ padding: '0 24px' }}><div style={{ maxWidth: 960, margin: '0 auto', borderTop: '1px solid #e2e8f0' }} /></div>;
    default:             return null;
  }
}

// ── Preview page ──────────────────────────────────────────────────────────────

export default function PreviewPage() {
  const { id } = useParams();
  const [page, setPage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/v1/pages/preview/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setPage(data.page);
      })
      .catch(() => setError('Failed to load page.'));
  }, [id]);

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', color: '#64748b' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚠️</div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Preview unavailable</div>
        <div style={{ fontSize: '0.875rem' }}>{error}</div>
      </div>
    </div>
  );

  if (!page) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', color: '#94a3b8' }}>
      Loading preview…
    </div>
  );

  const blocks = Array.isArray(page.blocks) ? page.blocks : [];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", minHeight: '100vh', background: '#fff', color: '#0f172a' }}>
      {/* Preview banner */}
      <div style={{ background: '#1e293b', color: '#f1f5f9', padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 999 }}>
        <span>🔍 Preview — <strong>{page.title}</strong> <span style={{ opacity: 0.6 }}>({page.status})</span></span>
        <button onClick={() => window.close()} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#f1f5f9', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: '0.75rem' }}>Close</button>
      </div>
      {blocks.length === 0 ? (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📄</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>{page.title}</div>
            <div style={{ fontSize: '0.9rem' }}>Add blocks in the website builder to see them here.</div>
          </div>
        </div>
      ) : (
        blocks.map((block, i) => <Block key={block.id || i} block={block} />)
      )}
    </div>
  );
}
