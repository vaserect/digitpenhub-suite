'use client';

import { useState } from 'react';

/**
 * PromptDialog - Replaces browser prompt() with a styled modal
 */
export default function PromptDialog({ isOpen, title, label, placeholder, initialValue, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  const [value, setValue] = useState(initialValue || '');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(value.trim());
      setValue('');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)'
    }} onClick={onCancel}>
      <div style={{
        backgroundColor: 'white', borderRadius: '12px', padding: '24px',
        maxWidth: '400px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px', color: '#111827' }}>{title || 'Enter a name'}</h3>
        {label && <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '8px' }}>{label}</p>}
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') onCancel(); }}
          placeholder={placeholder || ''}
          style={{
            width: '100%', padding: '12px 16px', border: '1px solid #d1d5db',
            borderRadius: '8px', fontSize: '1rem', marginBottom: '24px',
            outline: 'none', boxSizing: 'border-box'
          }}
        />
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#374151',
            border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer'
          }}>{cancelLabel || 'Cancel'}</button>
          <button onClick={handleConfirm} style={{
            padding: '10px 20px', backgroundColor: '#2563eb', color: 'white',
            border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer'
          }}>{confirmLabel || 'Create'}</button>
        </div>
      </div>
    </div>
  );
}
