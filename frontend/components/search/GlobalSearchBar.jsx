'use client';

import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

/**
 * GlobalSearchBar Component
 * 
 * A search input that opens a full search modal when clicked or when Cmd/Ctrl+K is pressed.
 * Integrated into the Topbar for global access across the workspace.
 * 
 * Features:
 * - Keyboard shortcut: Cmd/Ctrl+K
 * - Click to open full search modal
 * - Visual indicator for keyboard shortcut
 * - Responsive design
 * - Theme-aware styling
 */
export default function GlobalSearchBar({ onOpenSearch, theme = 'light' }) {
  const [isMac, setIsMac] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // Detect if user is on Mac for keyboard shortcut display
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);

    // Global keyboard shortcut listener
    const handleKeyDown = (e) => {
      // Cmd+K on Mac, Ctrl+K on Windows/Linux
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenSearch?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch]);

  const handleClick = () => {
    onOpenSearch?.();
  };

  const shortcutKey = isMac ? '⌘' : 'Ctrl';

  return (
    <button
      ref={inputRef}
      type="button"
      onClick={handleClick}
      className="global-search-trigger"
      aria-label="Open global search"
      title={`Search (${shortcutKey}+K)`}
    >
      <Search size={16} className="search-icon" />
      <span className="search-placeholder">Search...</span>
      <kbd className="search-kbd">
        <span>{shortcutKey}</span>
        <span>K</span>
      </kbd>
    </button>
  );
}
