'use client';

import { use } from 'react';

export default function ModuleComingSoon({ goHome, moduleName, moduleCategory }) {
  return (
    <div className="panel" style={{ textAlign: 'center', paddingTop: '10vh' }}>
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div style={{ fontSize: '3.5rem', marginBottom: '1rem', lineHeight: 1 }}>🧩</div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{moduleName}</h1>
      {moduleCategory && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{moduleCategory}</p>}
      <p style={{ color: 'var(--text-muted)', maxWidth: 420, margin: '0 auto 2rem', lineHeight: 1.7 }}>
        This module isn't built yet — it's listed here so you can see the full scope of the platform.
        It will be activated in a future update.
      </p>
      <div style={{ display: 'inline-flex', gap: 8, padding: '0.5rem 1rem', borderRadius: 999, background: 'var(--surface-muted)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
        <span>🔨 Planned</span>
        <span>·</span>
        <span>Coming in a future release</span>
      </div>
    </div>
  );
}
