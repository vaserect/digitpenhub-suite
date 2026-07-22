import * as React from "react"

const TabsContext = React.createContext<any>(null)

export function Tabs({ children, value, onValueChange, className = "" }: any) {
  return (
    <TabsContext.Provider value={{ activeValue: value, onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className = "" }: any) {
  return (
    <div style={{
      display: 'inline-flex', height: 40, alignItems: 'center', borderRadius: 'var(--radius-sm)',
      background: 'var(--surface-muted)', padding: 4, gap: 2,
    }} className={className}>
      {children}
    </div>
  )
}

export function TabsTrigger({ children, value, className = "" }: any) {
  const { activeValue, onValueChange } = React.useContext(TabsContext)
  const isActive = activeValue === value
  return (
    <button type="button" onClick={() => onValueChange?.(value)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: '6px 14px', borderRadius: 6, fontSize: '0.8125rem', fontWeight: 500,
        border: 'none', cursor: 'pointer',
        background: isActive ? 'var(--surface)' : 'transparent',
        color: isActive ? 'var(--text)' : 'var(--text-muted)',
        boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
        transition: 'all 0.14s ease',
      }} className={className}>
      {children}
    </button>
  )
}

export function TabsContent({ children, value, className = "" }: any) {
  const { activeValue } = React.useContext(TabsContext)
  if (activeValue !== value) return null
  return <div className={className}>{children}</div>
}
