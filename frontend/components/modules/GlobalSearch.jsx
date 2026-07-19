'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';

const SEARCH_TYPES = [
  { value: 'contact', label: 'Contacts', icon: '👤', color: '#3b82f6' },
  { value: 'invoice', label: 'Invoices', icon: '🧾', color: '#10b981' },
  { value: 'project', label: 'Projects', icon: '📁', color: '#8b5cf6' },
  { value: 'task', label: 'Tasks', icon: '✓', color: '#f59e0b' },
  { value: 'page', label: 'Pages', icon: '📄', color: '#06b6d4' },
  { value: 'document', label: 'Documents', icon: '📎', color: '#ec4899' },
  { value: 'note', label: 'Notes', icon: '📝', color: '#14b8a6' },
  { value: 'ticket', label: 'Tickets', icon: '🎫', color: '#ef4444' },
  { value: 'article', label: 'Articles', icon: '📰', color: '#6366f1' },
  { value: 'lead_form', label: 'Lead Forms', icon: '📋', color: '#84cc16' },
  { value: 'employee', label: 'Employees', icon: '👥', color: '#f97316' },
  { value: 'contact_lead', label: 'Leads', icon: '🎯', color: '#a855f7' },
];

const ROUTE_MAP = {
  contact: '/modules/crm',
  invoice: '/modules/invoices',
  project: '/modules/project-management',
  task: '/modules/project-management',
  page: '/modules/pages',
  document: '/modules/documents',
  note: '/modules/notes',
  ticket: '/modules/helpdesk',
  article: '/modules/knowledge-base',
  lead_form: '/modules/lead-generation',
  employee: '/modules/hr',
  contact_lead: '/modules/lead-generation',
};

export default function GlobalSearch({ goHome }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const resultRefs = useRef([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent searches', e);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((searchQuery) => {
    if (!searchQuery.trim()) return;
    
    setRecentSearches((prev) => {
      const updated = [searchQuery, ...prev.filter(q => q !== searchQuery)].slice(0, 10);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Perform search
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults({});
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ q: searchQuery });
      if (selectedTypes.length > 0) {
        params.append('types', selectedTypes.join(','));
      }

      const data = await apiFetch(`/api/v1/search?${params.toString()}`);
      
      // Convert backend array format to object keyed by type
      const resultsObj = {};
      if (Array.isArray(data.results)) {
        data.results.forEach(group => {
          if (group && group.items && group.items.length > 0) {
            resultsObj[group.type] = group.items;
          }
        });
      }
      
      setResults(resultsObj);
      saveRecentSearch(searchQuery);
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Search failed. Please try again.');
      setResults({});
    } finally {
      setLoading(false);
    }
  }, [selectedTypes, saveRecentSearch]);

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, performSearch]);

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Flatten results into array for keyboard navigation
  const flatResults = useMemo(() => {
    const flat = [];
    Object.entries(results).forEach(([type, items]) => {
      items.forEach(item => {
        flat.push({ ...item, type });
      });
    });
    return flat;
  }, [results]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
    resultRefs.current = [];
  }, [results]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Tab key to cycle through type filters
      if (e.key === 'Tab' && !e.shiftKey) {
        const filterButtons = document.querySelectorAll('[data-filter-type]');
        if (filterButtons.length > 0) {
          e.preventDefault();
          const currentIndex = Array.from(filterButtons).findIndex(
            btn => btn === document.activeElement
          );
          const nextIndex = (currentIndex + 1) % filterButtons.length;
          filterButtons[nextIndex].focus();
          return;
        }
      }

      // Only handle arrow keys and Enter if we have results
      if (flatResults.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => {
          const next = prev < flatResults.length - 1 ? prev + 1 : 0;
          // Scroll into view
          setTimeout(() => {
            resultRefs.current[next]?.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'nearest' 
            });
          }, 0);
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => {
          const next = prev > 0 ? prev - 1 : flatResults.length - 1;
          // Scroll into view
          setTimeout(() => {
            resultRefs.current[next]?.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'nearest' 
            });
          }, 0);
          return next;
        });
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        const selected = flatResults[selectedIndex];
        if (selected) {
          navigateToResult(selected.type, selected);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (selectedIndex >= 0) {
          setSelectedIndex(-1);
        } else {
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flatResults, selectedIndex]);

  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
    toast.success('Recent searches cleared');
  };

  const handleRecentSearchClick = (searchQuery) => {
    setQuery(searchQuery);
    searchInputRef.current?.focus();
  };

  const getTypeConfig = (type) => {
    return SEARCH_TYPES.find((t) => t.value === type) || { icon: '📄', color: '#6b7280', label: type };
  };

  const getTotalResults = () => {
    return Object.values(results).reduce((sum, items) => sum + (items?.length || 0), 0);
  };

  const navigateToResult = (type, result) => {
    const route = ROUTE_MAP[type];
    if (route) {
      window.location.href = `${route}?id=${result.id}`;
    } else {
      toast.error('Navigation not configured for this type');
    }
  };

  const highlightMatch = (text, query) => {
    if (!text || !query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} style={{ background: '#fef08a', padding: '0 2px', borderRadius: 2 }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const totalResults = getTotalResults();

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Global Search</h1>
          {goHome && (
            <Button variant="secondary" onClick={goHome}>
              ← Back
            </Button>
          )}
        </div>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          Search across all your content, contacts, projects, and more
        </p>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: 24 }}>
        <input
          ref={searchInputRef}
          type="text"
          className="field-input"
          placeholder="Search everything... (Cmd+K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            fontSize: '1.125rem',
            padding: '16px',
            border: '2px solid var(--border)',
            borderRadius: 8,
          }}
        />
      </div>

      {/* Type Filters */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0, color: 'var(--text-muted)' }}>
            FILTER BY TYPE
          </h3>
          {selectedTypes.length > 0 && (
            <Button size="sm" variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SEARCH_TYPES.map((type) => (
            <button
              key={type.value}
              data-filter-type={type.value}
              tabIndex={0}
              onClick={() => toggleType(type.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleType(type.value);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                border: selectedTypes.includes(type.value)
                  ? `2px solid ${type.color}`
                  : '2px solid var(--border)',
                borderRadius: 6,
                background: selectedTypes.includes(type.value) ? `${type.color}15` : 'var(--bg-secondary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: selectedTypes.includes(type.value) ? 600 : 400,
                color: selectedTypes.includes(type.value) ? type.color : 'var(--text)',
                transition: 'all 0.2s',
              }}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Searches */}
      {!query && recentSearches.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0, color: 'var(--text-muted)' }}>
              RECENT SEARCHES
            </h3>
            <Button size="sm" variant="secondary" onClick={clearRecentSearches}>
              Clear
            </Button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {recentSearches.map((search, idx) => (
              <button
                key={idx}
                onClick={() => handleRecentSearchClick(search)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  background: 'var(--bg-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: 'var(--text)',
                  transition: 'all 0.2s',
                }}
              >
                🕐 {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ marginTop: 24 }}>
          <SkeletonRows count={5} />
        </div>
      )}

      {/* Results */}
      {!loading && query && (
        <>
          {totalResults === 0 ? (
            <EmptyState
              icon="🔍"
              title="No results found"
              description={`No results for "${query}". Try different keywords or check your filters.`}
            />
          ) : (
            <div>
              <div style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
              </div>

              {Object.entries(results).map(([type, items]) => {
                if (!items || items.length === 0) return null;
                const typeConfig = getTypeConfig(type);

                return (
                  <div key={type} style={{ marginBottom: 32 }}>
                    <h3
                      style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        marginBottom: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        color: typeConfig.color,
                      }}
                    >
                      <span>{typeConfig.icon}</span>
                      <span>{typeConfig.label}</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                        ({items.length})
                      </span>
                    </h3>

                    <div style={{ display: 'grid', gap: 12 }}>
                      {items.map((result) => {
                        const flatIndex = flatResults.findIndex(
                          r => r.id === result.id && r.type === type
                        );
                        const isSelected = flatIndex === selectedIndex;
                        
                        return (
                        <div
                          key={result.id}
                          ref={el => resultRefs.current[flatIndex] = el}
                          onClick={() => navigateToResult(type, result)}
                          onMouseEnter={() => setSelectedIndex(flatIndex)}
                          style={{
                            padding: 16,
                            border: isSelected ? `2px solid ${typeConfig.color}` : '1px solid var(--border)',
                            borderRadius: 8,
                            background: isSelected ? `${typeConfig.color}10` : 'var(--bg-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: isSelected ? `0 0 0 1px ${typeConfig.color}` : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div
                              style={{
                                fontSize: '1.5rem',
                                width: 40,
                                height: 40,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: `${typeConfig.color}15`,
                                borderRadius: 8,
                                flexShrink: 0,
                              }}
                            >
                              {typeConfig.icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, marginBottom: 4, fontSize: '0.95rem' }}>
                                {highlightMatch(result.title || result.name || result.full_name || 'Untitled', query)}
                              </div>
                              {result.subtitle && (
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 4 }}>
                                  {highlightMatch(result.subtitle, query)}
                                </div>
                              )}
                              {result.description && (
                                <div
                                  style={{
                                    color: 'var(--text-muted)',
                                    fontSize: '0.875rem',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                  }}
                                >
                                  {highlightMatch(result.description, query)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Empty State (No Query) */}
      {!loading && !query && recentSearches.length === 0 && (
        <EmptyState
          icon="🔍"
          title="Start searching"
          description="Type in the search box above to find contacts, projects, documents, and more across your workspace."
        />
      )}
    </div>
  );
}
