import React from 'react';

export function Skeleton({ className = '', style }) {
  return <span className={['skeleton', className].filter(Boolean).join(' ')} style={style} />;
}

export function SkeletonRows({ rows = 4 }) {
  return (
    <div className="skeleton-stack">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="skeleton-row" />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card" style={{ padding: 16, borderRadius: 12 }}>
      <Skeleton className="skeleton-text" style={{ width: '40%', height: 14, marginBottom: 12 }} />
      <Skeleton className="skeleton-text" style={{ width: '80%', height: 12, marginBottom: 8 }} />
      <Skeleton className="skeleton-text" style={{ width: '60%', height: 12 }} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="skeleton-stack" style={{ gap: 2 }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: 12, padding: '10px 0' }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className="skeleton-text"
              style={{ flex: 1, height: 12, width: `${60 + Math.random() * 30}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
