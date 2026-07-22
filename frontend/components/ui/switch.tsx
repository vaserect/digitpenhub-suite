import * as React from "react"

export function Switch({ className = "", checked, onCheckedChange, style: customStyle, ...props }: any) {
  return (
    <button type="button" role="switch" aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      style={{
        display: 'inline-flex', height: 20, width: 36, flexShrink: 0, cursor: 'pointer',
        alignItems: 'center', borderRadius: 9999, border: '2px solid transparent',
        transition: 'background 0.14s ease', padding: 0,
        background: checked ? 'var(--primary)' : 'var(--border)',
        ...customStyle,
      }}>
      <span style={{
        display: 'block', height: 16, width: 16, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        transition: 'transform 0.14s ease',
        transform: checked ? 'translateX(16px)' : 'translateX(0)',
      }} />
    </button>
  )
}
