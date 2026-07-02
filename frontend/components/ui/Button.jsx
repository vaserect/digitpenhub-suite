import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  ...props
}) {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
  }[variant] || 'btn-primary';

  const sizeClass = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  }[size] || 'btn-md';

  return (
    <button className={["btn", variantClass, sizeClass, className].filter(Boolean).join(' ')} disabled={loading || props.disabled} {...props}>
      {loading ? <span className="btn-loading">Loading…</span> : children}
    </button>
  );
}
