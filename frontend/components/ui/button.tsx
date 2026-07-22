import * as React from "react"

const variants: Record<string, React.CSSProperties> = {
  default: { background: 'var(--primary)', color: '#fff', boxShadow: 'var(--shadow-sm)' },
  destructive: { background: 'var(--danger)', color: '#fff', boxShadow: 'var(--shadow-sm)' },
  outline: { background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' },
  secondary: { background: 'var(--surface-muted)', color: 'var(--text)' },
  ghost: { background: 'transparent', color: 'var(--text)' },
  link: { background: 'transparent', color: 'var(--primary)', padding: 0, textDecoration: 'underline' },
}

const sizes: Record<string, React.CSSProperties> = {
  default: { height: 36, padding: '0 16px' },
  sm: { height: 32, padding: '0 12px', fontSize: '0.8125rem' },
  lg: { height: 40, padding: '0 24px', fontSize: '0.9375rem' },
  icon: { height: 36, width: 36, padding: 0 },
}

const base: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  whiteSpace: 'nowrap', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem',
  fontWeight: 500, lineHeight: 1, transition: 'all 0.14s ease',
  border: 'none', cursor: 'pointer', outline: 'none',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", style: customStyle, ...props }, ref) => (
    <button ref={ref} style={{ ...base, ...variants[variant], ...sizes[size], ...customStyle }} {...props} />
  )
)
Button.displayName = "Button"
