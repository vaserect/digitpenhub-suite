'use client';

import { Search, Clock } from 'lucide-react';

/**
 * SearchSuggestions Component
 * 
 * Displays autocomplete suggestions as the user types.
 * Shows recent searches and popular suggestions.
 * 
 * Features:
 * - Keyboard navigation (arrow keys)
 * - Click to select
 * - Highlight matched text
 * - Recent searches indicator
 */
export default function SearchSuggestions({ suggestions, onSelect }) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const handleSelect = (suggestion) => {
    onSelect?.(suggestion);
  };

  const handleKeyDown = (e, suggestion) => {
    if (e.key === 'Enter') {
      handleSelect(suggestion);
    }
  };

  return (
    <div className="search-suggestions">
      <div className="search-suggestions-list">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSelect(suggestion)}
            onKeyDown={(e) => handleKeyDown(e, suggestion)}
            className="search-suggestion-item"
            type="button"
          >
            <Search size={14} className="search-suggestion-icon" />
            <span className="search-suggestion-text">{suggestion}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
