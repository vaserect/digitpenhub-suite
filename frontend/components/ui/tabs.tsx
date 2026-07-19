import * as React from "react"

const TabsContext = React.createContext<any>(null);

export function Tabs({ children, value, onValueChange, className = "" }: any) {
  return (
    <TabsContext.Provider value={{ activeValue: value, onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className = "" }: any) {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 ${className}`}>
      {children}
    </div>
  )
}

export function TabsTrigger({ children, value, className = "" }: any) {
  const { activeValue, onValueChange } = React.useContext(TabsContext);
  const isActive = activeValue === value;
  
  return (
    <button
      type="button"
      onClick={() => onValueChange?.(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive ? "bg-white text-gray-900 shadow-sm" : "hover:text-gray-950"
      } ${className}`}
    >
      {children}
    </button>
  )
}

export function TabsContent({ children, value, className = "" }: any) {
  const { activeValue } = React.useContext(TabsContext);
  if (activeValue !== value) return null;
  return <div className={`mt-2 focus-visible:outline-none ${className}`}>{children}</div>;
}
