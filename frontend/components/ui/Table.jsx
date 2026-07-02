import React from 'react';
import { SkeletonRows } from './Skeleton';
import EmptyState from './EmptyState';

export default function Table({
  columns,
  rows,
  getRowKey,
  loading = false,
  emptyState,
  selectable = false,
  selectedKeys = [],
  onSelectionChange,
  sortKey,
  sortDir,
  onSort,
  onRowClick,
}) {
  if (loading) return <SkeletonRows rows={5} />;
  if (!rows || rows.length === 0) return emptyState || <EmptyState title="Nothing here yet" />;

  const allSelected = selectable && rows.every((r) => selectedKeys.includes(getRowKey(r)));
  const toggleAll = () => onSelectionChange?.(allSelected ? [] : rows.map(getRowKey));
  const toggleRow = (key) =>
    onSelectionChange?.(selectedKeys.includes(key) ? selectedKeys.filter((k) => k !== key) : [...selectedKeys, key]);

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {selectable && (
              <th style={{ width: 32 }}>
                <input type="checkbox" className="row-checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all rows" />
              </th>
            )}
            {columns.map((col) => (
              <th key={col.key} style={{ width: col.width, textAlign: col.align || 'left' }}>
                {onSort && col.sortable !== false ? (
                  <span
                    className={['th-sort', sortKey === col.key ? 'active' : ''].filter(Boolean).join(' ')}
                    onClick={() => onSort(col.key)}
                  >
                    {col.header}
                    <span className="sort-caret">{sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</span>
                  </span>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const key = getRowKey(row);
            return (
              <tr key={key} onClick={onRowClick ? () => onRowClick(row) : undefined} style={onRowClick ? { cursor: 'pointer' } : undefined}>
                {selectable && (
                  <td onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="row-checkbox" checked={selectedKeys.includes(key)} onChange={() => toggleRow(key)} aria-label="Select row" />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
