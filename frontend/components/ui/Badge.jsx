import React from 'react';

export default function Badge({ children, variant = 'neutral', className = '' }) {
  const variantClass = {
    neutral: 'badge-neutral',
    active: 'badge-active',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
  }[variant] || 'badge-neutral';

  return <span className={["badge-pill", variantClass, className].filter(Boolean).join(' ')}>{children}</span>;
}
