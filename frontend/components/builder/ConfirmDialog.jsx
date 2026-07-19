'use client';

/**
 * ConfirmDialog - Replaces browser confirm() with a styled modal
 */
export default function ConfirmDialog({ isOpen, title, message, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  if (!isOpen) return null;

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
        {title && <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '8px', color: '#111827' }}>{title}</h3>}
        <p style={{ fontSize: '0.9375rem', color: '#6b7280', marginBottom: '24px', lineHeight: '1.5' }}>{message}</p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#374151',
            border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer'
          }}>{cancelLabel || 'Cancel'}</button>
          <button onClick={onConfirm} style={{
            padding: '10px 20px', backgroundColor: '#dc2626', color: 'white',
            border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer'
          }}>{confirmLabel || 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
}
