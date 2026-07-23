'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/api';
import Button from '../../components/ui/Button';

const STAGE_LABELS = {
  eligibility: { label: 'Plan eligibility', icon: '💳' },
  domain: { label: 'Connect a custom domain', icon: '🌐' },
  branding: { label: 'Upload logo & set colors', icon: '🎨' },
  sender: { label: 'Set sender identity', icon: '📧' },
  preview: { label: 'Preview your branded app', icon: '👁️' },
  activate: { label: 'Activate white-label', icon: '🚀' },
};

function StageIcon({ status }) {
  if (status === 'done') return <span style={{ color: 'var(--success)', fontSize: 18 }}>✅</span>;
  if (status === 'pending') return <span style={{ color: 'var(--warning)', fontSize: 18 }}>⏳</span>;
  if (status === 'blocked' || status === 'locked') return <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>🔒</span>;
  return <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>○</span>;
}

export default function WhiteLabelPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/v1/white-label/status')
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading white-label settings…
      </div>
    );
  }

  const stages = data?.stages || [];

  return (
    <div className="panel" style={{ maxWidth: 720 }}>
      <button className="back-link" onClick={() => router.push('/')}>← Back to workspace</button>
      <div className="module-head" style={{ marginBottom: 24 }}>
        <h1>White Label</h1>
        <p className="module-sub">Brand the platform as your own — logo, colors, domain, and more. Requires the Business plan.</p>
      </div>

      {!data?.eligible ? (
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏷️</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>White-label requires the Business plan</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Upgrade to Business (₦799/mo) to white-label the entire platform — custom domain, your logo, your brand colors, and your sender identity.
          </p>
          <Button onClick={() => router.push('/billing')}>View pricing plans</Button>
        </div>
      ) : (
        <>
          {/* Stage checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {stages.map(s => (
              <div key={s.key} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <StageIcon status={s.status} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{STAGE_LABELS[s.key]?.label || s.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.detail || ''}</div>
                </div>
                {s.key === 'activate' && s.status === 'not_started' && (
                  <Button size="sm" onClick={async () => { await apiFetch('/api/v1/white-label/activate', { method: 'POST' }); window.location.reload(); }}>
                    Activate
                  </Button>
                )}
                {s.key === 'activate' && s.status === 'done' && (
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--success)' }}>Live</span>
                )}
              </div>
            ))}
          </div>

          {/* Current branding summary */}
          {data?.branding && (
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Current branding</div>
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-label">Display name</div>
                  <div className="stat-value">{data.branding.display_name || '—'}</div>
                </div>
                {data.branding.primary_color && (
                  <div className="stat-card">
                    <div className="stat-label">Primary color</div>
                    <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ display: 'inline-block', width: 20, height: 20, borderRadius: 4, background: data.branding.primary_color }} />
                      {data.branding.primary_color}
                    </div>
                  </div>
                )}
                {data.branding.custom_domain && (
                  <div className="stat-card">
                    <div className="stat-label">Custom domain</div>
                    <div className="stat-value" style={{ fontSize: 13 }}>
                      {data.branding.custom_domain}
                      {data.branding.custom_domain_verified ? ' ✅' : ' (pending DNS)'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {data?.domainAutomationAvailable === false && (
        <div style={{ marginTop: 16, padding: 12, background: 'var(--warning-bg)', borderRadius: 10, fontSize: 12, color: 'var(--warning-text)' }}>
          💡 Automatic DNS verification needs a Cloudflare API token. For now, add a CNAME record from your domain to <code>branded.digitpenhub.com</code> manually.
        </div>
      )}
    </div>
  );
}
