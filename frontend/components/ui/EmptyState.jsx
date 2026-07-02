import React from 'react';

export default function EmptyState({ icon = '◇', title, description, action }) {
  return (
    <div className="empty-state-pro">
      <div className="es-icon">{icon}</div>
      {title ? <div className="es-title">{title}</div> : null}
      {description ? <p className="es-desc">{description}</p> : null}
      {action ? <div className="es-action">{action}</div> : null}
    </div>
  );
}
