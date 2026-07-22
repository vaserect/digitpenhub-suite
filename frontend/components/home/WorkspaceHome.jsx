'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function getCategoryIcon(key) {
  const styles = { color: 'var(--primary)' };
  const icons = {
    'platform-core': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles}>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    'integrations': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
    'marketing': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles}>
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
    'ai': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles}>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    ),
    'seo': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles}>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    'creative': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles}>
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
        <path d="M12 6V12L16 14" />
      </svg>
    ),
    'business': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles}>
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    'education': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles}>
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
      </svg>
    ),
    'commerce': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles}>
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
    'productivity': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    'analytics': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles}>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    'utilities': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles}>
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    'trust-compliance': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    'finance-advanced': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles}>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    'support-success': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    'gamification': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles}>
        <line x1="6" y1="12" x2="10" y2="12" />
        <line x1="8" y1="10" x2="8" y2="14" />
        <line x1="15" y1="13" x2="15.01" y2="13" />
        <line x1="18" y1="11" x2="18.01" y2="11" />
        <rect x="2" y="6" width="20" height="12" rx="2" />
      </svg>
    ),
    'mobile-access': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles}>
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
    'media-production': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles}>
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
    'nonprofit-civic': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    'extended-vertical': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  };
  return icons[key] || (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    </svg>
  );
}

const CATEGORY_DESCRIPTIONS = {
  'platform-core': 'Cross-module infrastructure', 'integrations': 'Connect external tools',
  'marketing': 'Attract and convert customers', 'ai': 'Intelligent automation',
  'seo': 'Search visibility and ranking', 'creative': 'Design and branding',
  'business': 'Core business operations', 'education': 'Learning and training',
  'commerce': 'Sell products and services', 'productivity': 'Work smarter',
  'analytics': 'Data and insights', 'utilities': 'Everyday tools',
  'trust-compliance': 'Security and compliance', 'finance-advanced': 'Financial operations',
  'support-success': 'Customer success', 'gamification': 'Engagement mechanics',
  'mobile-access': 'Mobile workspace', 'media-production': 'Content creation',
  'nonprofit-civic': 'Non-profit tools', 'extended-vertical': 'Industry-specific',
};

const RECOMMENDATION_ICONS = {
  'invite-team': '👥', 'add-contact': '👤', 'create-form': '📋',
  'start-project': '📊', 'connect-integration': '🔌', 'create-list': '📧',
  'create-invoice': '📄',
};

const RECOMMENDATION_ROUTES = {
  'invite-team': '/team',
  'add-contact': '/modules/crm',
  'create-form': '/modules/lead-generation',
  'start-project': '/modules/project-management',
  'connect-integration': '/modules/integrations',
  'create-list': '/modules/email-marketing',
  'create-invoice': '/modules/invoices',
};

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function WorkspaceHome({
  query, handleSearch,
  totalModules, activeModules, moduleCategories,
  pinnedModules, recentModules, openModule, openCategory, liveCount,
}) {
  const [onboarding, setOnboarding] = useState(null);
  const [onboardingLoading, setOnboardingLoading] = useState(true);

  useEffect(() => {
    let m = true;
    apiFetch('/api/v1/workspace/onboarding')
      .then(d => { if (m) setOnboarding(d); })
      .catch(() => console.error('Failed to load onboarding'))
      .finally(() => { if (m) setOnboardingLoading(false); });
    return () => { m = false; };
  }, []);

  const recentItems = recentModules.slice(0, 5).map(slug => {
    const m = moduleCategories.flatMap(c => c.modules || []).find(mod => mod.slug === slug);
    const cat = moduleCategories.find(c => c.modules?.some(mod => mod.slug === slug));
    if (!m) return null;
    return { slug, name: m.name, category: cat?.name || '' };
  }).filter(Boolean);

  const steps = onboarding?.steps || [];

  return (
    <div className="panel">
      {/* ── Global search bar ── */}
      <div className="search-wrap" style={{ marginBottom: 24 }}>
        <SearchIcon />
        <input
          placeholder={`Search all ${totalModules} modules…`}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* ── Premium Welcome Hero ── */}
      <div className="workspace-welcome-banner" style={{
        background: 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(124,58,237,0.04) 100%)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '24px 28px',
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 640 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>Welcome to Digitpen Hub Suite</h1>
          <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Your complete connected workspace. We've assembled {totalModules} operational modules grouped into {moduleCategories?.length || 21} categories — sharing a single unified database. Pick a tool below to begin.
          </p>
        </div>
        <div style={{
          position: 'absolute', right: 28, bottom: 20, display: 'flex', gap: 20,
          background: 'var(--surface)', padding: '10px 16px', borderRadius: 12, border: '1px solid var(--border)',
          backdropFilter: 'blur(8px)', zIndex: 1
        }} className="welcome-stats-badge">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>{activeModules}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Live Modules</div>
          </div>
          <div style={{ width: 1, backgroundColor: 'var(--border)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)' }}>{totalModules}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Total Planned</div>
          </div>
        </div>
      </div>

      {/* ── Continue where you left off ── */}
      {recentItems.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h2 className="section-title" style={{ marginBottom: 12, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
            Continue where you left off
          </h2>
          <div className="pinned-row">
            {recentItems.map((item) => (
              <button
                key={item.slug}
                className="pinned-card"
                onClick={() => openModule(item.slug)}
                style={{ flex: '1 1 140px', maxWidth: 200 }}
              >
                <div className="pinned-icon">{initials(item.name)}</div>
                <div className="pinned-info">
                  <div className="ptitle">{item.name}</div>
                  <div className="ptag">{item.category}</div>
                  <div className="pstatus"><span className="pip" />Open</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Pinned modules ── */}
      {pinnedModules.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h2 className="section-title" style={{ marginBottom: 12, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
            Pinned modules
          </h2>
          <div className="pinned-row">
            {pinnedModules.map((m) => (
              <button key={m.slug} className="pinned-card" onClick={() => openModule(m.slug)}>
                <div className="pinned-icon">{initials(m.name)}</div>
                <div className="pinned-info">
                  <div className="ptitle">{m.name}</div>
                  <div className="ptag">{m.categoryName}</div>
                  <div className="pstatus"><span className="pip" />Live now</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Recommended next steps ── */}
      {!onboardingLoading && steps.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h2 className="section-title" style={{ marginBottom: 12, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
            Recommended next steps
          </h2>
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {steps.slice(0, 4).map((step) => (
              <button
                key={step.key}
                className="card"
                style={{
                  padding: '16px 18px', textAlign: 'left', cursor: 'pointer',
                  display: 'flex', gap: 14, alignItems: 'center',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                onClick={() => {
                  const route = RECOMMENDATION_ROUTES[step.key];
                  if (route?.startsWith('/modules/')) openModule(route.replace('/modules/', ''));
                  else if (route === '/team') window.location.href = route;
                  else openModule(step.slug);
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'var(--surface-muted)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0,
                }}>
                  {RECOMMENDATION_ICONS[step.key] || '📌'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 2 }}>{step.label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{step.description}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── All categories grid ── */}
      <section>
        <h2 className="section-title" style={{ marginBottom: 16, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
          All categories
        </h2>
        <div className="cat-grid">
          {moduleCategories.map((c) => {
            const live = liveCount(c);
            const pct = Math.max((live / c.modules.length) * 100, live > 0 ? 6 : 0);
            return (
              <button
                key={c.key}
                className="cat-card"
                onClick={() => openCategory(c.key)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                style={{ transition: 'all 0.15s ease', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 110, padding: 18 }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', textAlign: 'left' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'var(--surface-muted)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {getCategoryIcon(c.key)}
                  </div>
                  <div>
                    <div className="cat-name" style={{ fontSize: '0.9rem', fontWeight: 700 }}>{c.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.3 }}>
                      {CATEGORY_DESCRIPTIONS[c.key] || ''}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>
                    <span>Progress</span>
                    <span>{live}/{c.modules.length} ready</span>
                  </div>
                  <div className="cat-bar-track"><div className="cat-bar-fill" style={{ width: `${pct}%` }} /></div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
