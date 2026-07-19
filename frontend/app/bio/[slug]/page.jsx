'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '../../../lib/api';

export default function PublicBioPage() {
  const params = useParams();
  const slug = params?.slug;
  const [page, setPage] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;

    async function loadBioPage() {
      try {
        // Fetch page by slug (public endpoint)
        const pageRes = await fetch(`/api/v1/link-in-bio/public/${slug}`);
        if (!pageRes.ok) {
          setError('Page not found');
          setLoading(false);
          return;
        }
        const pageData = await pageRes.json();
        setPage(pageData.page);
        setLinks(pageData.links || []);
        
        // Track page view
        await fetch(`/api/v1/link-in-bio/track/page/${pageData.page.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }).catch(() => {});
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to load bio page:', err);
        setError('Failed to load page');
        setLoading(false);
      }
    }

    loadBioPage();
  }, [slug]);

  async function handleLinkClick(linkId) {
    // Track link click
    await fetch(`/api/v1/link-in-bio/track/link/${linkId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }).catch(() => {});
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: '#6b7280' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>Page Not Found</h1>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>The link-in-bio page you're looking for doesn't exist or has been removed.</p>
          <a href="/" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', background: '#2563eb', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
            Go Home
          </a>
        </div>
      </div>
    );
  }

  const bgColor = page.bg_color || '#ffffff';
  const accentColor = page.accent_color || '#2563eb';
  const fontFamily = page.font_family || 'Inter, sans-serif';
  const layoutStyle = page.layout_style || 'centered';
  const textColor = bgColor === '#ffffff' || bgColor.toLowerCase() === '#fff' ? '#000000' : '#ffffff';
  const mutedTextColor = bgColor === '#ffffff' || bgColor.toLowerCase() === '#fff' ? '#6b7280' : 'rgba(255,255,255,0.7)';

  // Filter active links (check schedule if set)
  const now = new Date();
  const activeLinks = links.filter(link => {
    if (link.schedule_start && new Date(link.schedule_start) > now) return false;
    if (link.schedule_end && new Date(link.schedule_end) < now) return false;
    return true;
  }).sort((a, b) => {
    // Priority links first
    if (a.is_priority && !b.is_priority) return -1;
    if (!a.is_priority && b.is_priority) return 1;
    return a.sort_order - b.sort_order;
  });

  const containerStyle = {
    minHeight: '100vh',
    background: bgColor,
    fontFamily: fontFamily,
    padding: '2rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: layoutStyle === 'left' ? 'flex-start' : 'center',
    justifyContent: 'flex-start'
  };

  const contentStyle = {
    width: '100%',
    maxWidth: layoutStyle === 'grid' ? '800px' : '600px',
    textAlign: layoutStyle === 'left' ? 'left' : 'center'
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <head>
        <title>{page.meta_title || page.title}</title>
        {page.meta_description && <meta name="description" content={page.meta_description} />}
        {page.og_image && <meta property="og:image" content={page.og_image} />}
        {page.favicon_url && <link rel="icon" href={page.favicon_url} />}
        <meta property="og:title" content={page.meta_title || page.title} />
        <meta property="og:description" content={page.meta_description || page.bio || ''} />
        <meta property="og:type" content="profile" />
        <meta name="twitter:card" content="summary_large_image" />
      </head>

      <div style={containerStyle}>
        {/* Custom CSS */}
        {page.custom_css && <style dangerouslySetInnerHTML={{ __html: page.custom_css }} />}

        <div style={contentStyle}>
          {/* Avatar */}
          {page.avatar_url && (
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: layoutStyle === 'left' ? 'flex-start' : 'center' }}>
              <img 
                src={page.avatar_url} 
                alt={page.title}
                style={{ 
                  width: 96, 
                  height: 96, 
                  borderRadius: '50%', 
                  objectFit: 'cover',
                  border: `4px solid ${accentColor}`,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }} 
              />
            </div>
          )}

          {/* Title */}
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 700, 
            marginBottom: '0.5rem', 
            color: textColor,
            lineHeight: 1.2
          }}>
            {page.title}
          </h1>

          {/* Bio */}
          {page.bio && (
            <p style={{ 
              fontSize: '1rem', 
              color: mutedTextColor, 
              marginBottom: '2rem',
              lineHeight: 1.6,
              maxWidth: 500,
              margin: layoutStyle === 'left' ? '0 0 2rem 0' : '0 auto 2rem auto'
            }}>
              {page.bio}
            </p>
          )}

          {/* Links */}
          <div style={{ 
            display: layoutStyle === 'grid' ? 'grid' : 'flex',
            flexDirection: 'column',
            gridTemplateColumns: layoutStyle === 'grid' ? 'repeat(auto-fill, minmax(250px, 1fr))' : undefined,
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            {activeLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleLinkClick(link.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  padding: link.thumbnail_url ? '0' : '1rem 1.5rem',
                  background: accentColor,
                  color: '#ffffff',
                  borderRadius: 12,
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: link.thumbnail_url ? 120 : 56
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                {link.thumbnail_url && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `url(${link.thumbnail_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.3
                  }} />
                )}
                <div style={{ 
                  position: 'relative', 
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: link.thumbnail_url ? '1rem 1.5rem' : 0
                }}>
                  {link.icon && <span style={{ fontSize: '1.5rem' }}>{link.icon}</span>}
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600 }}>{link.title}</div>
                    {link.description && (
                      <div style={{ 
                        fontSize: '0.875rem', 
                        opacity: 0.9,
                        marginTop: '0.25rem'
                      }}>
                        {link.description}
                      </div>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Branding */}
          {page.show_branding && (
            <div style={{ 
              textAlign: 'center', 
              marginTop: '3rem',
              paddingTop: '2rem',
              borderTop: `1px solid ${textColor}20`
            }}>
              <a 
                href="https://suite.digitpenhub.com" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: mutedTextColor, 
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <span>⚡</span>
                <span>Powered by Digitpen Hub</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
