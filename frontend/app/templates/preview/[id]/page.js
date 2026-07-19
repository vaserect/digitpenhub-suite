'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Inline minimal block renderer for preview - renders blocks as they'd appear
function LiveBlockRenderer({ block }) {
  const p = (key, fallback) => block.props?.[key] ?? block[key] ?? fallback;
  const bodySize = 'clamp(0.875rem, 2vw, 1rem)';
  const h2Size = 'clamp(1.125rem, 3vw, 1.5rem)';
  switch (block.type) {
    case 'hero': {
      const bg = p('bgColor') || '#2563eb';
      return (
        <div style={{ backgroundColor: bg, color: '#fff', padding: 'clamp(32px, 6vw, 60px) clamp(16px, 4vw, 24px)', textAlign: 'center' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: '0.5rem', lineHeight: 1.2 }}>{p('heading') || 'Page Title'}</h1>
            {p('subheading') && <p style={{ fontSize: bodySize, opacity: 0.9, maxWidth: '500px', margin: '0 auto', lineHeight: 1.5 }}>{p('subheading')}</p>}
            {p('ctaText') && <div style={{ marginTop: '1rem' }}><span style={{ display: 'inline-block', padding: '8px 24px', backgroundColor: 'white', color: bg, borderRadius: '6px', fontWeight: 600, fontSize: bodySize }}>{p('ctaText')}</span></div>}
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
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{item.icon || '✓'}</div>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: bodySize }}>{item.title || ''}</div>
                  <div style={{ color: '#6b7280', fontSize: bodySize, lineHeight: 1.4 }}>{item.desc || ''}</div>
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
            {p('buttonText') && <span style={{ display: 'inline-block', marginTop: '0.75rem', padding: '8px 24px', backgroundColor: '#2563eb', color: 'white', borderRadius: '6px', fontWeight: 600, fontSize: bodySize }}>{p('buttonText')}</span>}
          </div>
        </div>
      );
    }
    case 'text':
      return (
        <div style={{ padding: 'clamp(24px, 4vw, 40px) clamp(16px, 4vw, 24px)' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            {p('heading') && <h2 style={{ fontSize: 'clamp(1rem, 2.5vw, 1.375rem)', fontWeight: 700, marginBottom: '0.75rem' }}>{p('heading')}</h2>}
            <div style={{ fontSize: bodySize, lineHeight: '1.625', color: '#374151' }}>{p('body') || 'Content goes here...'}</div>
          </div>
        </div>
      );
    case 'pricing':
      return (
        <div style={{ padding: 'clamp(32px, 5vw, 48px) clamp(16px, 4vw, 24px)' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            {p('heading') && <h2 style={{ fontSize: h2Size, fontWeight: 700, textAlign: 'center', marginBottom: 'clamp(1.5rem, 3vw, 2rem)' }}>{p('heading')}</h2>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {(p('plans') || []).slice(0,3).map((plan, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: bodySize }}>{plan.name}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{plan.price}</div>
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
                <details key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                  <summary style={{ padding: '12px 16px', fontWeight: 600, fontSize: bodySize, cursor: 'pointer', backgroundColor: '#f9fafb' }}>{item.question}</summary>
                  <div style={{ padding: '12px 16px', fontSize: bodySize, color: '#4b5563' }}>{item.answer}</div>
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
                  <p style={{ fontSize: bodySize, fontStyle: 'italic', marginBottom: '0.75rem' }}>"{item.quote || ''}"</p>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{item.author || ''}</div>
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
              <div key={i}><div style={{ fontSize: 'clamp(1.25rem, 3vw, 2rem)', fontWeight: 700 }}>{s.value}</div><div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{s.label}</div></div>
            ))}
          </div>
        </div>
      );
    case 'team': {
      const members = p('members') || [];
      return (
        <div style={{ padding: 'clamp(32px, 5vw, 48px) clamp(16px, 4vw, 24px)' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            {p('heading') && <h2 style={{ fontSize: h2Size, fontWeight: 700, textAlign: 'center', marginBottom: '1.5rem' }}>{p('heading')}</h2>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {members.map((m, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '1rem' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#e5e7eb', margin: '0 auto 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>👤</div>
                  <div style={{ fontWeight: 600, fontSize: bodySize }}>{m.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#2563eb' }}>{m.role}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    default:
      return (
        <div style={{ padding: '24px 16px', backgroundColor: '#f9fafb', textAlign: 'center', borderBottom: '1px dashed #e5e7eb' }}>
          <span style={{ fontSize: bodySize, color: '#9ca3af' }}>{getBlockIcon(block.type)} {block.type} block</span>
        </div>
      );
  }
}
function getBlockIcon(type) {
  const icons = { nav: '🧭', footer: '⬇️', form: '📋', pricing: '💰', faq: '❓', team: '👥', portfolio: '🎨', gallery: '🖼️', blog: '📰', newsletter: '📧', stats: '📈', timeline: '📅', tabs: '📑', accordion: '📂', countdown: '⏱️', map: '🗺️', social: '🔗', contact: '📞', 'logo-cloud': '🏢', process: '🔄', comparison: '⚖️', embed: '🔌', hero: '⚡', cta: '🎯', features: '⭐', testimonials: '💬', columns: '📐', text: '📝', image: '🖼️', video: '🎥', spacer: '↕️', divider: '➖' };
  return icons[type] || '📦';
}

export default function TemplatePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPageIdx, setSelectedPageIdx] = useState(0);

  useEffect(() => {
    if (!params.id) return;
    async function load() {
      try {
        setLoading(true);
        const [tmplRes, pagesRes] = await Promise.all([
          fetch(`/api/v1/builder/templates/${params.id}`, { credentials: 'include' }),
          fetch(`/api/v1/builder/templates/${params.id}/pages`, { credentials: 'include' }),
        ]);
        if (!tmplRes.ok) throw new Error('Template not found');
        const tmplData = await tmplRes.json();
        setTemplate(tmplData.template);
        if (pagesRes.ok) {
          const pagesData = await pagesRes.json();
          setPages(pagesData.pages || []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  const handleUseTemplate = async () => {
    try {
      const res = await fetch(`/api/v1/builder/templates/${params.id}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: template.name }),
        credentials: 'include',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create site from template');
      }
      const data = await res.json();
      toast.success('Site created from template!');
      if (data.site?.id) {
        router.push('/builder');
      } else {
        router.push('/builder');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading template preview...</p>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Template Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'Template does not exist or is no longer available.'}</p>
          <button onClick={() => router.push('/templates')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Browse Templates</button>
        </div>
      </div>
    );
  }

  const currentPage = pages[selectedPageIdx];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900 font-medium">← Back</button>
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-lg font-semibold text-gray-900">{template.name}</h1>
                <p className="text-sm text-gray-500 capitalize">{template.industry || template.category}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {template.is_premium ? (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">👑 Premium</span>
              ) : (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">✓ Free</span>
              )}
              <button onClick={handleUseTemplate} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">Use This Template</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {pages.length > 0 && (
              <div className="bg-white rounded-t-lg border border-gray-200 border-b-0">
                <div className="flex overflow-x-auto">
                  {pages.map((page, idx) => (
                    <button key={page.id || idx} onClick={() => setSelectedPageIdx(idx)}
                      className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${selectedPageIdx === idx ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>{page.name}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-white rounded-b-lg border border-gray-200 overflow-hidden">
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 p-8">
                <div className="relative aspect-video bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="text-6xl mb-4">🎨</div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{template.name}</h3>
                      <p className="text-gray-600">{template.description}</p>
                    </div>
                  </div>
                </div>
              </div>
              {currentPage && currentPage.blocks && currentPage.blocks.length > 0 && (
                <div className="p-0">
                  {/* Render blocks visually in a simulated browser view */}
                  <div style={{ maxWidth: '100%', overflow: 'hidden', boxShadow: '0 0 0 1px #e5e7eb', borderRadius: '0 0 12px 12px' }}>
                    {/* Browser chrome bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                      <span style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af', backgroundColor: 'white', padding: '4px 12px', borderRadius: '4px', maxWidth: '300px', margin: '0 auto' }}>
                        https://example.com/{currentPage.slug}
                      </span>
                    </div>
                    {/* Actually render blocks */}
                    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                      {currentPage.blocks.map((block, idx) => (
                        <LiveBlockRenderer key={idx} block={block} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">About This Template</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{template.description}</p>
            </div>
            {template.tags && template.tags.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Statistics</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Pages</span><span className="font-medium text-gray-900">{pages.length}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Times Used</span><span className="font-medium text-gray-900">{template.usage_count || 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Rating</span><span className="font-medium text-gray-900">{template.rating > 0 ? `⭐ ${Number(template.rating).toFixed(1)}` : 'Not rated yet'}</span></div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Ready to get started?</h3>
              <p className="text-sm text-gray-600 mb-4">Use this template to create your website in minutes</p>
              <button onClick={handleUseTemplate} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">Use This Template</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
