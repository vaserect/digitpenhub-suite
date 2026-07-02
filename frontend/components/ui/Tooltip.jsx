import React from 'react';

export default function Tooltip({ label, children }) {
  if (!label) return children;
  return (
    <span className="tooltip-wrap" tabIndex={-1}>
      {children}
      <span className="tooltip-bubble" role="tooltip">{label}</span>
    </span>
  );
}
