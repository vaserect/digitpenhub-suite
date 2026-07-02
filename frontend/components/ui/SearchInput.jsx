import React from 'react';

export default function SearchInput({ value, onChange, placeholder = 'Search…', ...props }) {
  return (
    <div className="toolbar-search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.6" y2="16.6" />
      </svg>
      <input value={value} onChange={onChange} placeholder={placeholder} {...props} />
    </div>
  );
}
