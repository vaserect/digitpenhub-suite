'use client';

import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, description, children, wide = false }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card" style={wide ? { width: 'min(100%, 900px)' } : undefined}>
        <div className="modal-header">
          <div>
            {title ? <h3 className="modal-title">{title}</h3> : null}
            {description ? <p className="modal-description">{description}</p> : null}
          </div>
          <button className="modal-close" onClick={onClose} type="button" aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
