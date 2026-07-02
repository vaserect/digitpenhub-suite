import React from 'react';

export default function Pagination({ page, pageCount, total, pageSize, onPageChange }) {
  if (pageCount <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pages = [];
  const span = 1;
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || (p >= page - span && p <= page + span)) pages.push(p);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }

  return (
    <div className="pagination">
      <span className="pagination-info">{start}–{end} of {total}</span>
      <div className="pagination-controls">
        <button className="pagination-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">‹</button>
        {pages.map((p, i) => p === '…' ? (
          <span key={`e${i}`} className="pagination-info">…</span>
        ) : (
          <button key={p} className={["pagination-btn", p === page ? 'active' : ''].join(' ')} onClick={() => onPageChange(p)}>{p}</button>
        ))}
        <button className="pagination-btn" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)} aria-label="Next page">›</button>
      </div>
    </div>
  );
}
