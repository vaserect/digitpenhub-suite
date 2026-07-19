import * as React from "react"
import { ChevronDown } from "lucide-react"

const SelectContext = React.createContext<any>(null);

export function Select({ children, value, onValueChange }: any) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: any) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div ref={containerRef} className="relative w-full">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({ children, className = "" }: any) {
  const { open, setOpen } = React.useContext(SelectContext);
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={`flex h-9 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-50 focus:outline-none ${className}`}
    >
      <div className="flex items-center gap-2 truncate pr-2">
        {children}
      </div>
      <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
    </button>
  )
}

export function SelectValue({ placeholder }: any) {
  const { value } = React.useContext(SelectContext);
  // Just show value as text (will be replaced by item text when selected, or shown as placeholder)
  return <span className="block truncate">{value || placeholder || ""}</span>;
}

export function SelectContent({ children, className = "" }: any) {
  const { open } = React.useContext(SelectContext);
  if (!open) return null;
  return (
    <div className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white p-1 text-sm shadow-md focus:outline-none ${className}`}>
      {children}
    </div>
  )
}

export function SelectItem({ children, value, className = "" }: any) {
  const { value: selectedValue, onValueChange, setOpen } = React.useContext(SelectContext);
  const isSelected = selectedValue === value;
  
  return (
    <div
      onClick={() => {
        onValueChange?.(value);
        setOpen(false);
      }}
      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-8 text-sm outline-none hover:bg-gray-100 ${
        isSelected ? "bg-gray-50 font-semibold" : ""
      } ${className}`}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          ✓
        </span>
      )}
      {children}
    </div>
  )
}
