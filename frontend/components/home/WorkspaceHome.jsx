'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

const CATEGORY_ICONS = {
  'platform-core': '🔗', 'integrations': '🔌', 'marketing': '📣', 'ai': '🤖',
  'seo': '🔍', 'creative': '🎨', 'business': '💼', 'education': '🎓',
  'commerce': '🛒', 'productivity': '⚡', 'analytics': '📊', 'utilities': '🔧',
  'trust-compliance': '🛡️', 'finance-advanced': '💰', 'support-success': '💬',
  'gamification': '🎮', 'mobile-access': '📱', 'media-production': '🎬',
  'nonprofit-civic': '❤️', 'extended-vertical': '🏪',
};

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
  'start-project': '/modules/pm',
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
      <div className="search-wrap" style={{ marginBottom: 28 }}>
        <SearchIcon />
        <input
          placeholder={`Search all ${totalModules} modules…`}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* ── Welcome row ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Workspace</h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {activeModules.length} of {totalModules} modules ready
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="hero-metrics" style={{ display: 'flex', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, lineHeight: 1.2 }}>{activeModules.length}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, lineHeight: 1.2 }}>{moduleCategories.length}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categories</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, lineHeight: 1.2 }}>{totalModules}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Planned</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Continue where you left off ── */}
      {recentItems.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h2 className="section-title" style={{ marginBottom: 12, fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
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
          <h2 className="section-title" style={{ marginBottom: 12, fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
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
          <h2 className="section-title" style={{ marginBottom: 12, fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
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
        <h2 className="section-title" style={{ marginBottom: 16, fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
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
                style={{ transition: 'all 0.15s ease' }}
              >
                <div className="cat-top">
                  <div className={`cat-badge ${live > 0 ? 'live' : ''}`}>{c.badge}</div>
                  <div>
                    <div className="cat-name">{c.name}</div>
                    <div className="cat-count" style={{ fontSize: '0.75rem' }}>
                      {live === c.modules.length ? `${live} ready` : `${live} of ${c.modules.length} live`}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>
                      {CATEGORY_DESCRIPTIONS[c.key] || ''}
                    </div>
                  </div>
                </div>
                <div className="cat-bar-track"><div className="cat-bar-fill" style={{ width: `${pct}%` }} /></div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
