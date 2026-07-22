import * as React from "react"

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className = "", ...props }, ref) => (
    <label ref={ref} style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)' }} {...props} />
  )
)
Label.displayName = "Label"
