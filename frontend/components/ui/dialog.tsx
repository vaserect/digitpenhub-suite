import * as React from "react"
import { X } from "lucide-react"

export function DialogTrigger({ children }: any) {
  return <>{children}</>;
}

export function Dialog({ children, open, onOpenChange }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange?.(false)} />
      {/* Dialog container */}
      <div className="z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto relative p-6">
        <button 
          onClick={() => onOpenChange?.(false)}
          className="absolute top-4 right-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  )
}

export function DialogContent({ children }: any) {
  return <div className="mt-4">{children}</div>
}

export function DialogHeader({ children }: any) {
  return <div className="flex flex-col space-y-1.5 text-center sm:text-left">{children}</div>
}

export function DialogFooter({ children }: any) {
  return <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4">{children}</div>
}

export function DialogTitle({ children }: any) {
  return <h2 className="text-lg font-semibold leading-none tracking-tight">{children}</h2>
}

export function DialogDescription({ children }: any) {
  return <p className="text-sm text-gray-500">{children}</p>
}
