'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Card from '../ui/Card';
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

function prettyTimestamp(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function WorkspaceHome({
  query, handleSearch,
  totalModules, activeModules, moduleCategories,
  pinnedModules, pinnedSlugs, togglePin,
  recentModules, openModule, openCategory, liveCount,
}) {
  const [onboarding, setOnboarding] = useState(null);
  const [onboardingLoading, setOnboardingLoading] = useState(true);

  // Load onboarding status from API
  useEffect(() => {
    let mounted = true;
    apiFetch('/api/v1/workspace/onboarding')
      .then(d => { if (mounted) setOnboarding(d); })
      .catch(() => {})
      .finally(() => { if (mounted) setOnboardingLoading(false); });
    return () => { mounted = false; };
  }, []);

  // Resolve recent slugs to module objects with fallback timestamps
  const recentItems = recentModules.slice(0, 5).map(slug => {
    const m = moduleCategories.flatMap(c => c.modules || []).find(mod => mod.slug === slug);
    const cat = moduleCategories.find(c => c.modules?.some(mod => mod.slug === slug));
    if (!m) return null;
    return { slug, name: m.name, category: cat?.name || '', status: m.status, locked: m.locked };
  }).filter(Boolean);

  const steps = onboarding?.steps || [];
  const hasData = onboarding?.hasContacts || onboarding?.hasInvoices || onboarding?.hasLeads || onboarding?.hasProjects;

  return (
    <div className="panel">
      {/* ── Search ── */}
      <div className="search-wrap" style={{ marginBottom: 28 }}>
        <SearchIcon />
        <input
          placeholder={`Search all ${totalModules} modules…`}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* ── Continue where you left off ── */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 className="section-title" style={{ margin: 0 }}>
            {recentItems.length > 0 ? 'Continue where you left off' : 'Welcome to Digitpen Hub'}
          </h2>
          {activeModules.length > 0 && (
            <span className="live-counter" style={{ fontSize: '0.75rem', opacity: 0.7 }}>
              {activeModules.length} of {totalModules} modules live
            </span>
          )}
        </div>

        {recentItems.length > 0 ? (
          <div className="pinned-row">
            {recentItems.map((item) => (
              <button
                key={item.slug}
                className="pinned-card"
                onClick={() => openModule(item.slug)}
                style={{ flex: '1 1 160px', maxWidth: 220 }}
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
        ) : (
          <div className="hero-grid" style={{ background: 'var(--surface)', borderRadius: 12, padding: '28px 24px', border: '1px solid var(--border)' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: '0 0 6px' }}>Your workspace is ready</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 14px', maxWidth: 440 }}>
                Open any module from the sidebar to get started. Your most recent modules will appear here so you can jump back in.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {moduleCategories.slice(0, 5).map(c => (
                  <button key={c.key} className="ctag" style={{ cursor: 'pointer' }}
                    onClick={() => openCategory(c.key)}>
                    {CATEGORY_ICONS[c.key] || '📦'} {c.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="hero-metrics">
              <div><strong>{activeModules.length}</strong><span>Live modules</span></div>
              <div><strong>{moduleCategories.length}</strong><span>Categories</span></div>
              <div><strong>{totalModules}</strong><span>Total planned</span></div>
            </div>
          </div>
        )}
      </section>

      {/* ── Recommended next steps ── */}
      {!onboardingLoading && steps.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 className="section-title" style={{ marginBottom: 14 }}>Recommended next steps</h2>
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {steps.slice(0, 4).map((step) => (
              <button
                key={step.key}
                className="card"
                style={{
                  padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  border: '1px solid var(--border)',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onClick={() => {
                  const route = RECOMMENDATION_ROUTES[step.key];
                  if (route?.startsWith('/modules/')) {
                    openModule(route.replace('/modules/', ''));
                  } else if (route === '/team') {
                    window.location.href = route;
                  } else {
                    openModule(step.slug);
                  }
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'var(--surface-muted)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0,
                }}>
                  {RECOMMENDATION_ICONS[step.key] || '📌'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 2 }}>{step.label}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{step.description}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2, color: 'var(--text-muted)' }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Pinned modules ── */}
      <section style={{ marginBottom: 32 }}>
        <h2 className="section-title" style={{ marginBottom: 14 }}>Pinned modules</h2>
        {pinnedModules.length > 0 ? (
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
        ) : recentItems.length === 0 ? null : (
          <div style={{ padding: '16px 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Pin modules from the sidebar (hover and click the star) for one-click access here.
          </div>
        )}
      </section>

      {/* ── Category grid ── */}
      <section>
        <h2 className="section-title" style={{ marginBottom: 14 }}>All categories</h2>
        <div className="cat-grid">
          {moduleCategories.map((c) => {
            const live = liveCount(c);
            const pct = Math.max((live / c.modules.length) * 100, live > 0 ? 6 : 0);
            return (
              <button key={c.key} className="cat-card" onClick={() => openCategory(c.key)}>
                <div className="cat-top">
                  <div className={`cat-badge ${live > 0 ? 'live' : ''}`}>{c.badge}</div>
                  <div>
                    <div className="cat-name">{c.name}</div>
                    <div className="cat-count">{live} of {c.modules.length} live</div>
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
