'use client';

import { useEffect, useRef } from 'react';

export default function Modal({ isOpen, onClose, title, description, children, wide = false }) {
  const modalRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement;

    if (modalRef.current) modalRef.current.focus();
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current?.();

      // Simple focus trap: Tab cycles within the modal
      if (event.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      if (previouslyFocused && previouslyFocused !== document.body) previouslyFocused.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" ref={modalRef} tabIndex={-1} onClick={(e) => e.stopPropagation()} style={wide ? { width: 'min(100%, 900px)' } : undefined}>
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
