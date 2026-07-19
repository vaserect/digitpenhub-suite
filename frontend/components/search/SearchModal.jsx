'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import SearchResults from './SearchResults';
import SearchSuggestions from './SearchSuggestions';

/**
 * SearchModal Component
 * 
 * Full-screen modal for global search functionality.
 * Opens when GlobalSearchBar is clicked or Cmd/Ctrl+K is pressed.
 * 
 * Features:
 * - Real-time search with debouncing (300ms)
 * - Autocomplete suggestions
 * - Recent searches
 * - Entity type filtering
 * - Keyboard navigation (Esc to close, arrow keys for results)
 * - Loading/error/empty states
 * - Click outside to close
 */
export default function SearchModal({ isOpen, onClose, theme = 'light' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEntityTypes, setSelectedEntityTypes] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const inputRef = useRef(null);
  const modalRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle Esc key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Load recent searches on mount
  useEffect(() => {
    if (isOpen) {
      loadRecentSearches();
    }
  }, [isOpen]);

  const loadRecentSearches = async () => {
    try {
      const response = await apiFetch('/api/v1/search/history?limit=5');
      if (response.success) {
        setRecentSearches(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load recent searches:', err);
    }
  };

  const loadSuggestions = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await apiFetch(`/api/v1/search/suggestions?q=${encodeURIComponent(searchQuery)}&limit=5`);
      if (response.success) {
        setSuggestions(response.data || []);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    }
  };

  const performSearch = async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setResults(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setShowSuggestions(false);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: 20,
        offset: 0
      });

      if (selectedEntityTypes.length > 0) {
        selectedEntityTypes.forEach(type => params.append('type', type));
      }

      const response = await apiFetch(`/api/v1/search?${params.toString()}`);
      
      if (response.success) {
        setResults(response.data);
      } else {
        setError(response.message || 'Search failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while searching');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Load suggestions immediately (no debounce for better UX)
    loadSuggestions(value);

    // Debounce actual search
    debounceTimerRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    performSearch(suggestion);
  };

  const handleRecentSearchClick = (search) => {
    setQuery(search.query);
    performSearch(search.query);
  };

  const handleResultClick = (result) => {
    // Navigate to the entity
    // This will be implemented based on entity type routing
    console.log('Navigate to:', result);
    onClose?.();
  };

  const handleClearSearch = () => {
    setQuery('');
    setResults(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  const showRecentSearches = !query && recentSearches.length > 0;
  const showResults = results && !showSuggestions;
  const showEmptyState = !isLoading && !error && query && results && results.total === 0;

  return (
    <div className="search-modal-overlay">
      <div ref={modalRef} className="search-modal">
        {/* Search Input */}
        <div className="search-modal-header">
          <Search size={20} className="search-modal-icon" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search across all modules..."
            className="search-modal-input"
            autoComplete="off"
            spellCheck="false"
          />
          {query && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="search-modal-clear"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="search-modal-close"
            aria-label="Close search"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Content */}
        <div className="search-modal-content">
          {/* Loading State */}
          {isLoading && (
            <div className="search-modal-loading">
              <Loader2 size={24} className="animate-spin" />
              <p>Searching...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="search-modal-error">
              <p>{error}</p>
              <button onClick={() => performSearch(query)} className="btn-primary">
                Try Again
              </button>
            </div>
          )}

          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <SearchSuggestions
              suggestions={suggestions}
              onSelect={handleSuggestionClick}
            />
          )}

          {/* Recent Searches */}
          {showRecentSearches && (
            <div className="search-recent">
              <h3 className="search-section-title">Recent Searches</h3>
              <div className="search-recent-list">
                {recentSearches.map((search) => (
                  <button
                    key={search.id}
                    onClick={() => handleRecentSearchClick(search)}
                    className="search-recent-item"
                  >
                    <Search size={14} />
                    <span>{search.query}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {showResults && (
            <SearchResults
              results={results}
              query={query}
              onResultClick={handleResultClick}
            />
          )}

          {/* Empty State */}
          {showEmptyState && (
            <div className="search-modal-empty">
              <Search size={48} className="search-empty-icon" />
              <h3>No results found</h3>
              <p>Try adjusting your search terms or filters</p>
            </div>
          )}

          {/* Initial State */}
          {!query && !showRecentSearches && (
            <div className="search-modal-initial">
              <Search size={48} className="search-empty-icon" />
              <h3>Search across all modules</h3>
              <p>Find contacts, tasks, invoices, projects, and more</p>
            </div>
          )}
        </div>

        {/* Footer with keyboard shortcuts */}
        <div className="search-modal-footer">
          <div className="search-modal-shortcuts">
            <kbd>↑↓</kbd> <span>Navigate</span>
            <kbd>↵</kbd> <span>Select</span>
            <kbd>Esc</kbd> <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
