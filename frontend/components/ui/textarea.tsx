import * as React from "react"

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = "", style: customStyle, ...props }, ref) => (
    <textarea ref={ref} style={{
      display: 'flex', minHeight: 60, width: '100%', borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border)', background: 'var(--surface)', padding: '8px 12px',
      fontSize: '0.875rem', color: 'var(--text)', outline: 'none', resize: 'vertical',
      transition: 'border-color 0.14s ease',
      ...customStyle,
    }} {...props} />
  )
)
Textarea.displayName = "Textarea"
