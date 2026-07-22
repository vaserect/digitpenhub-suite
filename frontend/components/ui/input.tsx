import * as React from "react"

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", style: customStyle, ...props }, ref) => (
    <input ref={ref} style={{
      display: 'flex', height: 36, width: '100%', borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border)', background: 'var(--surface)', padding: '0 12px',
      fontSize: '0.875rem', color: 'var(--text)', outline: 'none',
      transition: 'border-color 0.14s ease',
      ...customStyle,
    }} {...props} />
  )
)
Input.displayName = "Input"
