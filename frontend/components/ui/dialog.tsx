import * as React from "react"
import { X } from "lucide-react"

export function DialogTrigger({ children }: any) { return <>{children}</> }

export function Dialog({ children, open, onOpenChange }: any) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange?.(false)} />
      <div style={{
        zIndex: 50, background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
        maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto',
        position: 'relative', padding: 24,
      }}>
        <button onClick={() => onOpenChange?.(false)}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7, color: 'var(--text-muted)' }}
          aria-label="Close dialog"><X size={16} /></button>
        {children}
      </div>
    </div>
  )
}

export function DialogContent({ children }: any) { return <div style={{ marginTop: 16 }}>{children}</div> }
export function DialogHeader({ children }: any) { return <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div> }
export function DialogFooter({ children }: any) { return <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>{children}</div> }
export function DialogTitle({ children }: any) { return <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text)' }}>{children}</h2> }
export function DialogDescription({ children }: any) { return <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{children}</p> }
