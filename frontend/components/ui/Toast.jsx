'use client';

import { useEffect, useState } from 'react';

export default function Toast({ message, type = 'info', open, onClose, duration = 2600 }) {
  const [visible, setVisible] = useState(Boolean(open));

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);
    return () => window.clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!visible) return null;

  return (
    <div className={["toast-root", `toast-${type}`].filter(Boolean).join(' ')} role="status">
      <span>{message}</span>
    </div>
  );
}
