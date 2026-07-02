import React from 'react';

export function Card({ children, className = '', ...props }) {
  return (
    <section className={["card-shell", className].filter(Boolean).join(' ')} {...props}>
      {children}
    </section>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="card-header">
      <div>
        {title ? <h3 className="card-title">{title}</h3> : null}
        {subtitle ? <p className="card-subtitle">{subtitle}</p> : null}
      </div>
      {action ? <div className="card-action">{action}</div> : null}
    </div>
  );
}

export default Card;
