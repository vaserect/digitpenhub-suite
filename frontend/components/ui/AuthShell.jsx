import React from 'react';

export default function AuthShell({ title, description, children, footer }) {
  return (
    <div className="auth-view">
      <div className="auth-shell">
        <div className="auth-intro">
          <div className="auth-brandmark">
            <img src="/logo.png" alt="" />
            <span>Digitpen Hub</span>
          </div>
          <div className="auth-kicker">Business Suite</div>
          <h1 className="auth-intro-title">One secure workspace for your whole operating stack.</h1>
          <p className="auth-intro-copy">
            Move from CRM to billing, forms, reports, and marketing without a second login or a stitched-together admin experience.
          </p>
          <div className="auth-intro-points">
            <div className="auth-point">
              <strong>Consistent by default</strong>
              <span>Shared controls, cleaner states, and the same workflow language across every module.</span>
            </div>
            <div className="auth-point">
              <strong>Built for operators</strong>
              <span>Dashboards, documents, forms, and campaigns live under one account and one navigation model.</span>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <h2>{title}</h2>
            {description ? <p className="auth-card-subtitle">{description}</p> : null}
          </div>
          <div className="auth-card-body">{children}</div>
          {footer ? <div className="auth-card-footer">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
