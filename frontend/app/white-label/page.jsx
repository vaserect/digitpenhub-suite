'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/api';

export default function WhiteLabelPage() {
  const router = useRouter();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/v1/white-label')
      .then(d => setSettings(d))
      .catch(() => setSettings(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="panel">
        <button className="back-link" onClick={() => router.push('/')}>← Back to workspace</button>
        <div className="empty-note" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading white label settings…
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <button className="back-link" onClick={() => router.push('/')}>← Back to workspace</button>
      <div className="module-head">
        <h1>White Label</h1>
        <p className="module-sub">Brand the platform as your own — logo, colors, domain, and more.</p>
      </div>
      {settings && settings.branding ? (
        <div style={{ maxWidth: 600 }}>
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">Brand name</div>
              <div className="stat-value">{settings.branding.name || '—'}</div>
            </div>
            {settings.branding.primary_color && (
              <div className="stat-card">
                <div className="stat-label">Primary color</div>
                <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-block', width: 20, height: 20, borderRadius: 4, background: settings.branding.primary_color }} />
                  {settings.branding.primary_color}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="state-viewport">
          <div className="state-panel">
            <div className="state-icon">🏷️</div>
            <h2 className="state-title">White label is not available yet</h2>
            <p className="state-description">This feature will be available on premium plans. Check back later.</p>
          </div>
        </div>
      )}
    </div>
  );
}
