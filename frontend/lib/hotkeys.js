'use client';

import { useEffect } from 'react';

// Usage: useHotkey('n', () => handleNew(), { meta: true })
// Fires callback when ⌘N or Ctrl+N is pressed (not in inputs)
export function useHotkey(key, callback, { meta = true } = {}) {
  useEffect(() => {
    const handler = (e) => {
      if (meta && !(e.metaKey || e.ctrlKey)) return;
      if (!meta && (e.metaKey || e.ctrlKey)) return;
      if (e.key !== key) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      e.preventDefault();
      callback();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback, meta]);
}

// Focuses the first element with `data-hotkey-search="true"` on ⌘F
export function useSearchHotkey() {
  useEffect(() => {
    const handler = (e) => {
      if (!(e.metaKey || e.ctrlKey) || e.key !== 'f') return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      e.preventDefault();
      const el = document.querySelector('[data-hotkey-search]');
      if (el instanceof HTMLElement) { el.focus(); el.select(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
