'use client';

import React from 'react';
import Link from 'next/link';

function StarIcon({ filled }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .14s ease', flexShrink: 0 }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function NavItemLabel({ name, meta, locked = false }) {
  return (
    <span className="nav-item-body">
      <span className="nav-item-topline">
        <span className="nav-item-text">{name}</span>
        {locked ? <span className="nav-lock">Locked</span> : null}
      </span>
      {meta ? <span className="nav-item-meta">{meta}</span> : null}
    </span>
  );
}

const CATEGORY_ICONS = {
  'platform-admin': '🛡️',
  'platform-core': '🔗',
  'integrations': '🔌',
  'settings': '⚙️',
  'marketing': '📣',
  'ai': '🤖',
  'seo': '🔍',
  'creative': '🎨',
  'hr': '👥',
  'business': '💼',
  'education': '🎓',
  'commerce': '🛒',
  'productivity': '⚡',
  'analytics': '📊',
  'utilities': '🔧',
  'trust-compliance': '🛡️',
  'finance-advanced': '💰',
  'support-success': '💬',
  'gamification': '🎮',
  'mobile-access': '📱',
  'media-production': '🎬',
  'nonprofit-civic': '❤️',
  'extended-vertical': '🏪',
};

export default function Sidebar({
  categories = [], view, activeCategoryKey, activeModuleSlug, collapsed, onToggleCollapse, onHome, onCategory, onModule, liveCount,
  onBilling, onAccount, onWhiteLabel, pinnedSlugs = [], onTogglePin,
  sidebarSearch, onSidebarSearchChange, expandedCats, onToggleCategory,
}) {
  const q = (sidebarSearch || '').trim().toLowerCase();

  const searchResults = q
    ? categories.flatMap((c) =>
        c.modules
          .filter((m) => m.status === 'active' && m.name.toLowerCase().includes(q))
          .map((m) => ({ ...m, categoryName: c.name }))
      )
    : [];

  return (
    <nav className={["sidebar", collapsed ? 'is-collapsed' : ''].filter(Boolean).join(' ')} style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">D</div>
        {!collapsed && (
          <div>
            <div className="sidebar-brand-title">Digitpen Hub</div>
            <div className="sidebar-brand-subtitle">Business Suite</div>
          </div>
        )}
        {!collapsed && (
          <button onClick={onToggleCollapse} className="nav-pin" style={{ marginLeft: 'auto' }} aria-label="Collapse sidebar" title="Collapse sidebar">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
      </div>
      {collapsed && (
        <button onClick={onToggleCollapse} className="sidebar-collapse-btn" style={{ padding: '8px 14px', display: 'flex', justifyContent: 'center', transition: 'none' }} aria-label="Expand sidebar" title="Expand sidebar">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: 'rotate(180deg)' }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      <div style={{ padding: '0 14px 10px' }}>
        <div className="sidebar-search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.6" y2="16.6" />
          </svg>
          <input
            value={sidebarSearch}
            onChange={(e) => onSidebarSearchChange(e.target.value)}
            placeholder="Search modules…"
          />
        </div>
      </div>

      <div className="sidebar-scroll">
        {q ? (
          <>
            <div className="nav-section-label">Search results</div>
            {searchResults.map((m) => (
              <button
                key={m.slug}
                className={`nav-item nav-item-sub ${activeModuleSlug === m.slug ? 'is-active' : ''} ${m.locked ? 'is-locked' : ''}`}
                onClick={() => onModule(m.slug)}
              >
                <NavItemLabel name={m.name} meta={m.categoryName} locked={m.locked} />
                <span
                  role="button"
                  tabIndex={0}
                  className={`nav-pin ${pinnedSlugs.includes(m.slug) ? 'is-pinned' : ''}`}
                  onClick={(e) => { e.stopPropagation(); onTogglePin(m.slug); }}
                  aria-label={pinnedSlugs.includes(m.slug) ? 'Unpin' : 'Pin'}
                >
                  <StarIcon filled={pinnedSlugs.includes(m.slug)} />
                </span>
              </button>
            ))}
            {searchResults.length === 0 && <div className="nav-empty-note">No modules match &quot;{sidebarSearch}&quot;.</div>}
          </>
        ) : (
          <>
            <button className={`nav-item ${view === 'home' ? 'is-active' : ''}`} onClick={onHome}>
              <span><span className="dot" />Workspace</span>
            </button>

            {pinnedSlugs.length > 0 && (
              <>
                <div className="nav-section-label">Pinned</div>
                {pinnedSlugs.map((slug) => {
                  const mod = categories.flatMap((c) => c.modules.map((m) => ({ ...m, categoryName: c.name }))).find((m) => m.slug === slug);
                  if (!mod) return null;
                  return (
                    <button key={slug} className={`nav-item nav-item-sub ${activeModuleSlug === slug ? 'is-active' : ''}`} onClick={() => onModule(slug)}>
                      <NavItemLabel name={mod.name} meta={mod.categoryName} />
                      <span role="button" tabIndex={0} className="nav-pin is-pinned" onClick={(e) => { e.stopPropagation(); onTogglePin(slug); }} aria-label="Unpin">
                        <StarIcon filled />
                      </span>
                    </button>
                  );
                })}
              </>
            )}

            <div className="nav-section-label">Categories</div>
            {categories.map((c) => {
              const live = liveCount ? liveCount(c) : 0;
              const isOpen = !!expandedCats[c.key];
              return (
                <div key={c.key}>
                  <button
                    className={`nav-item ${live > 0 ? 'has-live' : ''} ${view === 'category' && activeCategoryKey === c.key ? 'is-active' : ''}`}
                    onClick={() => onToggleCategory(c.key)}
                  >
                    <span>{CATEGORY_ICONS[c.key] || '📦'} <ChevronIcon open={isOpen} /><span className="dot" />{c.name}</span>
                    <span className="nav-frac">{live}/{c.modules.length}</span>
                  </button>
                  {isOpen && (
                    <div>
                      {c.modules.filter((m) => m.status === 'active').map((m) => (
                        <button key={m.slug} className={`nav-item nav-item-sub ${activeModuleSlug === m.slug ? 'is-active' : ''} ${m.locked ? 'is-locked' : ''}`} onClick={() => onModule(m.slug)}>
                          <NavItemLabel name={m.name} locked={m.locked} />
                          <span
                            role="button"
                            tabIndex={0}
                            className={`nav-pin ${pinnedSlugs.includes(m.slug) ? 'is-pinned' : ''}`}
                            onClick={(e) => { e.stopPropagation(); onTogglePin(m.slug); }}
                            aria-label={pinnedSlugs.includes(m.slug) ? 'Unpin' : 'Pin'}
                          >
                            <StarIcon filled={pinnedSlugs.includes(m.slug)} />
                          </span>
                        </button>
                      ))}
                      <button className="nav-item nav-item-sub nav-item-viewall" onClick={() => onCategory(c.key)}>
                        View all in {c.name} →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className="sidebar-footer">
        <div className="nav-section-label">Workspace</div>
        <Link href="/account" className={`nav-item ${view === 'account' ? 'is-active' : ''}`} onClick={onAccount}>
          <span><span className="dot" />Account &amp; Security</span>
        </Link>
        <Link href="/billing" className={`nav-item ${view === 'billing' ? 'is-active' : ''}`} onClick={onBilling}>
          <span><span className="dot" />Billing &amp; Plans</span>
        </Link>
        {onWhiteLabel && (
          <button className={`nav-item ${view === 'white-label' ? 'is-active' : ''}`} onClick={onWhiteLabel}>
            <span><span className="dot" />White Label</span>
          </button>
        )}
      </div>
    </nav>
  );
}
