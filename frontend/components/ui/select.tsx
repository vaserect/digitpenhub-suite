import * as React from "react"
import { ChevronDown } from "lucide-react"

const SelectContext = React.createContext<any>(null)

export function Select({ children, value, onValueChange }: any) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const handler = (e: any) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div ref={ref} style={{ position: 'relative', width: '100%' }}>{children}</div>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({ children, style: customStyle }: any) {
  const { open, setOpen } = React.useContext(SelectContext)
  return (
    <button type="button" onClick={() => setOpen(!open)}
      style={{
        display: 'flex', height: 36, width: '100%', alignItems: 'center', justifyContent: 'space-between',
        borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)',
        padding: '0 12px', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--text)',
        ...customStyle,
      }}>
      <span style={{ flex: 1, textAlign: 'left' }}>{children}</span>
      <ChevronDown size={16} style={{ opacity: 0.5, flexShrink: 0 }} />
    </button>
  )
}

export function SelectValue({ placeholder }: any) {
  const { value } = React.useContext(SelectContext)
  return <span>{value || placeholder || ""}</span>
}

export function SelectContent({ children }: any) {
  const { open } = React.useContext(SelectContext)
  if (!open) return null
  return (
    <div style={{
      position: 'absolute', zIndex: 50, marginTop: 4, maxHeight: 240, width: '100%',
      overflow: 'auto', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
      background: 'var(--surface)', padding: 4, boxShadow: 'var(--shadow-md)',
    }}>{children}</div>
  )
}

export function SelectItem({ children, value }: any) {
  const { value: selected, onValueChange, setOpen } = React.useContext(SelectContext)
  const isSelected = selected === value
  return (
    <div onClick={() => { onValueChange?.(value); setOpen(false) }}
      style={{
        cursor: 'default', padding: '6px 32px 6px 8px', borderRadius: 4, fontSize: '0.875rem',
        background: isSelected ? 'var(--accent-bg)' : 'transparent',
        fontWeight: isSelected ? 600 : 400, color: 'var(--text)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
      {children}
    </div>
  )
}
