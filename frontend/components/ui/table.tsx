import * as React from "react"

export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className = "", style: customStyle, ...props }, ref) => (
    <div style={{ width: '100%', overflow: 'auto' }}>
      <table ref={ref} style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse', ...customStyle }} {...props} />
    </div>
  )
)
Table.displayName = "Table"

export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = "", ...props }, ref) => (
    <thead ref={ref} style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-muted)' }} {...props} />
  )
)
TableHeader.displayName = "TableHeader"

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = "", ...props }, ref) => (
    <tbody ref={ref} {...props} />
  )
)
TableBody.displayName = "TableBody"

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className = "", ...props }, ref) => (
    <tr ref={ref} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.14s ease' }} {...props} />
  )
)
TableRow.displayName = "TableRow"

export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className = "", style: customStyle, ...props }, ref) => (
    <th ref={ref} style={{
      padding: '10px 16px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem',
      textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)',
      ...customStyle,
    }} {...props} />
  )
)
TableHead.displayName = "TableHead"

export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className = "", style: customStyle, ...props }, ref) => (
    <td ref={ref} style={{ padding: '10px 16px', color: 'var(--text)', ...customStyle }} {...props} />
  )
)
TableCell.displayName = "TableCell"
