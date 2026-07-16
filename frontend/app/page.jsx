'use client';

import { useWorkspace } from '../components/ui/WorkspaceLayout';
import WorkspaceHome from '../components/home/WorkspaceHome';
import MarketingHome from '../components/marketing/MarketingHome';
import { useState, useMemo } from 'react';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { toast } from 'sonner';

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function HomePage() {
  const workspace = useWorkspace();
  const [query, setQuery] = useState('');
  const [view, setView] = useState('home'); // home | category | search
  const [activeCategoryKey, setActiveCategoryKey] = useState(null);

  const moduleCategories = useMemo(() => {
    if (!workspace) return [];
    return workspace.categories.filter((c) => c.tier === 1);
  }, [workspace]);

  const activeCategory = useMemo(() => {
    if (!workspace || !activeCategoryKey) return null;
    return workspace.categories.find((c) => c.key === activeCategoryKey);
  }, [workspace, activeCategoryKey]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !workspace) return [];
    return moduleCategories.flatMap((c) =>
      (c.modules || [])
        .filter((m) => m.status === 'active' && m.name.toLowerCase().includes(q))
        .map((m) => ({ ...m, categoryName: c.name }))
    );
  }, [query, workspace, moduleCategories]);

  if (!workspace) {
    return <MarketingHome />;
  }

  function handleSearch(val) {
    setQuery(val);
    setView(val.trim() ? 'search' : 'home');
  }

  function openCategory(key) {
    setActiveCategoryKey(key);
    setView('category');
  }

  function goHome() {
    setView('home');
    setActiveCategoryKey(null);
    setQuery('');
  }

  function initials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  function Tile({ name, status, slug, categoryName, locked }) {
    const active = status === 'active';
    return (
      <button
        className={`tile ${active ? 'active' : 'soon'}${locked ? ' locked' : ''}`}
        onClick={() => (active ? workspace.openModule(slug) : toast.error(`${name} is coming soon!`))}
      >
        <div className="tile-icon">{initials(name)}</div>
        <div className="tile-name">{name}{locked && <span className="tile-lock" title="Requires a paid plan">🔒</span>}</div>
        {categoryName && <div className="tile-cat">{categoryName}</div>}
        <div className="tile-status">
          <span className="pip" />
          {locked ? 'Upgrade to unlock' : active ? 'Live' : 'Coming soon'}
        </div>
      </button>
    );
  }

  return (
    <>
      {view === 'home' && (
        <WorkspaceHome
          query={query}
          handleSearch={handleSearch}
          totalModules={workspace.totalModules}
          activeModules={workspace.activeModules}
          moduleCategories={moduleCategories}
          pinnedModules={workspace.pinnedModules}
          recentModules={workspace.recentModules}
          openModule={workspace.openModule}
          openCategory={openCategory}
          liveCount={workspace.liveCount}
        />
      )}

      {view === 'category' && activeCategory && (
        <div className="panel">
          <div className="breadcrumb"><button onClick={goHome}>Workspace</button> / {activeCategory.name}</div>
          <div className="panel-head">
            <h1>{activeCategory.name}</h1>
            <span className="live-counter">{workspace.liveCount(activeCategory)} of {activeCategory.modules.length} live</span>
          </div>
          <p className="panel-sub">Every {activeCategory.name.toLowerCase()} tool planned for the Suite.</p>
          <div className="tile-grid">
            {activeCategory.modules.filter(m => (activeCategory.tier || 1) !== 3).map((m) => (
              <Tile key={m.slug} {...m} />
            ))}
          </div>
        </div>
      )}

      {view === 'search' && (
        <div className="panel">
          <div className="search-wrap" style={{ marginBottom: 28 }}>
            <SearchIcon />
            <input
              placeholder={`Search all ${workspace.totalModules} modules…`}
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
            />
          </div>
          <p className="panel-sub">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &quot;{query}&quot;</p>
          {searchResults.length ? (
            <div className="tile-grid">
              {searchResults.map((m) => (
                <Tile key={m.slug} {...m} />
              ))}
            </div>
          ) : (
            <EmptyState icon="🔍" title="No modules match" description={`We couldn't find anything for "${query}". Try a different keyword or browse by category.`} />
          )}
        </div>
      )}
    </>
  );
}
