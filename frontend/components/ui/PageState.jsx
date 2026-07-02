import React from 'react';

export default function PageState({
  title,
  description,
  action,
  icon,
  tone = 'neutral',
  loading = false,
  compact = false,
  fullscreen = false,
}) {
  const panel = (
    <div className={["state-panel", `is-${tone}`, compact ? 'is-compact' : ''].filter(Boolean).join(' ')}>
      <div className="state-icon" aria-hidden="true">
        {loading ? <span className="state-spinner" /> : icon || '•'}
      </div>
      {title ? <div className="state-title">{title}</div> : null}
      {description ? <p className="state-description">{description}</p> : null}
      {action ? <div className="state-action">{action}</div> : null}
    </div>
  );

  if (fullscreen) {
    return <div className="state-viewport">{panel}</div>;
  }

  return panel;
}
