'use client';

import { useEffect } from 'react';
import Button from './Button';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
}) {
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
      <div className={["modal-card", danger ? 'danger' : ''].filter(Boolean).join(' ')} style={{ width: 'min(100%, 420px)' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{title}</h3>
            {description ? <p className="modal-description">{description}</p> : null}
          </div>
          <button className="modal-close" onClick={onClose} type="button" aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          <div className="modal-actions">
            <Button variant="secondary" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
            <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
