import * as React from "react"

export function Badge({ className = "", variant = "default", style: customStyle, ...props }: any) {
  const variants: Record<string, React.CSSProperties> = {
    default: { background: 'var(--primary)', color: '#fff' },
    destructive: { background: 'var(--danger)', color: '#fff' },
    outline: { background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' },
    secondary: { background: 'var(--surface-muted)', color: 'var(--text)' },
    success: { background: 'var(--success-bg)', color: 'var(--success)' },
    warning: { background: 'var(--warning-bg)', color: 'var(--warning)' },
  }
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', borderRadius: 9999, padding: '2px 10px',
      fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.4,
      ...(variants[variant] || variants.default), ...customStyle,
    }} {...props} />
  )
}
