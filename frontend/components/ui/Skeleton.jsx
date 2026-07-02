import React from 'react';

export function Skeleton({ className = '', style }) {
  return <span className={["skeleton", className].filter(Boolean).join(' ')} style={style} />;
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

export default Skeleton;
