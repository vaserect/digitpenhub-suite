'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/api';

const GLOBAL_COMMANDS = [
  { id: 'home', label: 'Go to workspace home', keywords: 'home dashboard workspace', icon: '⌂', action: 'router.push("/")' },
  { id: 'account', label: 'Open account settings', keywords: 'account settings profile password', icon: '⚙', action: 'router.push("/account")' },
  { id: 'billing', label: 'Open billing & plans', keywords: 'billing plans payment subscription', icon: '💳', action: 'router.push("/billing")' },
  { id: 'team', label: 'Open team management', keywords: 'team members invite', icon: '👥', action: 'router.push("/team")' },
  { id: 'admin', label: 'Open admin panel', keywords: 'admin super admin', icon: '🔐', action: 'router.push("/admin")' },
  { id: 'theme', label: 'Toggle dark mode', keywords: 'theme dark light mode', icon: '🌙', action: 'toggleTheme' },
  { id: 'help', label: 'Show keyboard shortcuts', keywords: 'help shortcuts keyboard ?', icon: '?', action: 'showHelp' },
  { id: 'signout', label: 'Sign out', keywords: 'logout sign out exit', icon: '🚪', action: 'signOut' },
];

const RECENT_STORAGE_KEY = 'dph-search-recent';

function loadRecentSearches() {
  try { return JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveRecentSearch(q) {
  const recent = loadRecentSearches().filter(s => s !== q);
  recent.unshift(q);
  localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recent.slice(0, 8)));
}

export default function CommandPalette({ categories, onNavigate, onToggleTheme, onShowHelp }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [apiResults, setApiResults] = useState([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const inputRef = useRef(null);
  const searchTimeout = useRef(null);
  const router = useRouter();

  const recentSearches = useMemo(() => loadRecentSearches(), [open]);

  // Build searchable index from module categories
  const searchIndex = useMemo(() => {
    const items = [];
    for (const cat of categories || []) {
      for (const mod of cat.modules || []) {
        if (mod.status === 'active' && !mod.locked) {
          items.push({ id: `mod-${mod.slug}`, label: `Open ${mod.name}`, keywords: `${mod.name} ${cat.name} ${mod.slug}`, icon: '▸', action: 'module', slug: mod.slug, category: cat.name });
        }
      }
    }
    return [...GLOBAL_COMMANDS, ...items];
  }, [categories]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
        setQuery('');
        setSelectedIndex(0);
        setApiResults([]);
        setShowRecent(true);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setShowRecent(true);
      setSearchResults(searchIndex.slice(0, 6));
      setApiResults([]);
      setSelectedIndex(0);
      return;
    }
    setShowRecent(false);

    const q = query.toLowerCase();
    // Score local results
    const scored = searchIndex
      .map((item) => {
        const kw = item.keywords.toLowerCase();
        let score = 0;
        if (kw.startsWith(q)) score += 3;
        if (kw.includes(q)) score += 1;
        if (item.label.toLowerCase().includes(q)) score += 2;
        const parts = q.split(/\s+/);
        const matchCount = parts.filter(p => kw.includes(p)).length;
        score += matchCount * 0.5;
        return { ...item, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    setSearchResults(scored);
    setSelectedIndex(0);

    // Debounced API search
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      if (q.length < 2) return;
      setApiLoading(true);
      try {
        const data = await apiFetch(`/api/v1/search?q=${encodeURIComponent(q)}`);
        setApiResults(data.results || []);
      } catch { /* silent */ }
      setApiLoading(false);
    }, 300);
  }, [query, searchIndex]);

  const allResults = [
    ...searchResults.map(r => ({ ...r, source: 'local' })),
    ...apiResults.flatMap(group => group.items.map(item => ({
      id: `api-${group.type}-${item.id}`, label: `Open ${item.title} (${group.label})`,
      keywords: `${item.title} ${item.subtitle} ${group.label}`,
      icon: group.icon || '🔍', action: 'apiResult', type: group.type,
      slug: item.id, subtitle: item.subtitle,
    }))),
  ];

  function execute(item) {
    setOpen(false);
    setQuery('');
    if (query.trim().length >= 2) saveRecentSearch(query.trim());

    if (item.action === 'toggleTheme') { onToggleTheme?.(); }
    else if (item.action === 'showHelp') { onShowHelp?.(); }
    else if (item.action === 'signOut') {
      apiFetch('/api/v1/auth/logout', { method: 'POST' }).finally(() => { window.location.href = '/login'; });
    } else if (item.action === 'module') {
      onNavigate?.(item.slug);
    } else if (item.action.startsWith('router.push')) {
      const path = item.action.match(/'([^']+)'/)?.[1];
      if (path) router.push(path);
    } else if (item.action === 'apiResult') {
      onNavigate?.(item.type);
    }
  }

  function handleKeyDown(e) {
    const combined = allResults;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, combined.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && combined[selectedIndex]) { execute(combined[selectedIndex]); }
  }

  if (!open) return null;

  return (
    <div className="cp-overlay"
      onClick={() => setOpen(false)}
      style={{ position:'fixed',inset:0,zIndex:100,background:'rgba(2,6,23,.5)',backdropFilter:'blur(6px)',display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:'12vh' }}
    >
      <div className="cp-modal" onClick={e => e.stopPropagation()}
        style={{ width:'min(90vw,580px)',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'16px',boxShadow:'0 24px 80px rgba(2,6,23,.35)',overflow:'hidden' }}
      >
        <div style={{ display:'flex',alignItems:'center',gap:10,padding:'14px 16px',borderBottom:'1px solid var(--border)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Search modules, actions, settings, contacts, invoices…"
            style={{ flex:1,border:'none',background:'transparent',outline:'none',color:'var(--text)',fontSize:'0.95rem',fontFamily:'inherit' }}
          />
          {apiLoading && <div className="btn-spinner" style={{width:14,height:14}} />}
          <kbd style={{fontSize:'0.65rem',color:'var(--text-muted)',background:'var(--surface-muted)',padding:'3px 6px',borderRadius:4}}>ESC</kbd>
        </div>

        <div style={{maxHeight:'min(55vh,400px)',overflowY:'auto',padding:'6px'}}>
          {showRecent && recentSearches.length > 0 && (
            <>
              <div style={{fontSize:'0.68rem',fontWeight:700,color:'var(--text-muted)',padding:'8px 14px 4px',textTransform:'uppercase',letterSpacing:'0.08em'}}>Recent searches</div>
              {recentSearches.slice(0, 3).map((s, i) => (
                <button key={s} className="cp-item" onClick={() => setQuery(s)}
                  style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'8px 14px',borderRadius:10,border:'none',background:'transparent',color:'var(--text-muted)',cursor:'pointer',fontSize:'0.82rem',textAlign:'left'}}
                >
                  <span style={{width:24,textAlign:'center'}}>🕐</span>
                  <span>{s}</span>
                  <span style={{marginLeft:'auto',fontSize:'0.7rem',color:'var(--border-strong)'}}>#{i + 1}</span>
                </button>
              ))}
            </>
          )}

          {allResults.slice(0, selectedIndex + 8).map((item, i) => (
            <button key={item.id}
              className="cp-item"
              onClick={() => execute(item)}
              style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'10px 14px',borderRadius:10,border:'none',background:i===selectedIndex?'var(--surface-muted)':'transparent',color:'var(--text)',cursor:'pointer',fontSize:'0.88rem',textAlign:'left'}}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span style={{width:24,textAlign:'center',flexShrink:0}}>{item.icon}</span>
              <span style={{flex:1,minWidth:0}}>
                <span style={{display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.label}</span>
                {'subtitle' in item && item.subtitle && <span style={{fontSize:'0.72rem',color:'var(--text-muted)'}}>{item.subtitle}</span>}
                {'category' in item && <span style={{fontSize:'0.72rem',color:'var(--text-muted)'}}>{item.category}</span>}
              </span>
              <kbd style={{fontSize:'0.65rem',color:'var(--text-muted)',background:'var(--surface-muted)',padding:'2px 5px',borderRadius:4}}>↩</kbd>
            </button>
          ))}

          {allResults.length === 0 && query.trim().length >= 2 && !apiLoading && (
            <div style={{padding:'24px 16px',textAlign:'center',color:'var(--text-muted)',fontSize:'0.85rem'}}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        <div style={{padding:'8px 14px',borderTop:'1px solid var(--border)',display:'flex',gap:16,fontSize:'0.72rem',color:'var(--text-muted)'}}>
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}
