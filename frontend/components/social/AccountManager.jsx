'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';

const PLATFORM_CONFIG = {
  facebook:    { name: 'Facebook',    color: '#1877F2', icon: 'f', authUrl: 'https://www.facebook.com/v18.0/dialog/oauth' },
  instagram:   { name: 'Instagram',   color: '#E4405F', icon: 'ig', authUrl: 'https://www.instagram.com/oauth/authorize' },
  twitter:     { name: 'X (Twitter)', color: '#000000', icon: 'x', authUrl: 'https://twitter.com/i/oauth2/authorize' },
  linkedin:    { name: 'LinkedIn',    color: '#0A66C2', icon: 'in', authUrl: 'https://www.linkedin.com/oauth/v2/authorization' },
  tiktok:      { name: 'TikTok',      color: '#000000', icon: 'tk', authUrl: 'https://www.tiktok.com/v2/auth/authorize' },
  youtube:     { name: 'YouTube',     color: '#FF0000', icon: 'yt', authUrl: 'https://accounts.google.com/o/oauth2/v2/auth' },
  pinterest:   { name: 'Pinterest',   color: '#BD081C', icon: 'pt', authUrl: 'https://www.pinterest.com/oauth/' },
  'google-business': { name: 'Google Business', color: '#4285F4', icon: 'gb', authUrl: '#' },
  telegram:    { name: 'Telegram',    color: '#0088CC', icon: 'tg', authUrl: '#' },
  'whatsapp-business': { name: 'WhatsApp Business', color: '#25D366', icon: 'wa', authUrl: '#' },
};

export default function AccountManager({ onRefresh }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConnect, setShowConnect] = useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await apiFetch('/api/v1/social-media/accounts');
      setAccounts(res.accounts || []);
    } catch (err) {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleDisconnect = async (id, name) => {
    if (!confirm(`Disconnect ${name}?`)) return;
    try {
      await apiFetch(`/api/v1/social-media/accounts/${id}`, { method: 'DELETE' });
      toast.success('Account disconnected');
      fetchAccounts();
    } catch (err) {
      toast.error('Failed to disconnect');
    }
  };

  const startOAuth = (platform) => {
    const config = PLATFORM_CONFIG[platform];
    if (!config || config.authUrl === '#') {
      toast.info(`${config?.name || platform} setup requires manual API configuration.`);
      return;
    }
    toast.info(`OAuth window would open for ${config.name}. Connect flow ready when credentials are configured.`);
  };

  const platformStats = {};
  accounts.forEach(a => {
    if (!platformStats[a.platform_slug]) platformStats[a.platform_slug] = { total: 0, connected: 0, error: 0 };
    platformStats[a.platform_slug].total++;
    if (a.health_status === 'connected') platformStats[a.platform_slug].connected++;
    if (a.health_status === 'error' || a.health_status === 'expired') platformStats[a.platform_slug].error++;
  });

  if (loading) return <SkeletonRows rows={5} />;

  return (
    <div>
      <div className="module-head" style={{ marginBottom: 24 }}>
        <div>
          <h2>Connected Accounts</h2>
          <p className="module-sub">{accounts.length} account(s) connected</p>
        </div>
        <Button className="primary-btn" onClick={() => setShowConnect(true)}>+ Connect Account</Button>
      </div>

      {Object.keys(platformStats).length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          {Object.entries(platformStats).map(([slug, stats]) => {
            const cfg = PLATFORM_CONFIG[slug];
            return (
              <div key={slug} className="card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
                <span style={{ fontWeight: 700, color: cfg?.color || '#666' }}>{cfg?.name || slug}</span>
                <span style={{ fontSize: 13, color: stats.connected > 0 ? '#16a34a' : '#94a3b8' }}>
                  {stats.connected}/{stats.total}
                </span>
                {stats.error > 0 && <span style={{ fontSize: 13, color: '#dc2626' }}>({stats.error} err)</span>}
              </div>
            );
          })}
        </div>
      )}

      {accounts.length === 0 ? (
        <EmptyState icon="🔌" title="No accounts connected" description="Connect your social media accounts to start scheduling posts." />
      ) : (
        <div className="card-shell">
          {accounts.map(account => (
            <div key={account.id} className="card" style={{ padding: '12px 16px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: (PLATFORM_CONFIG[account.platform_slug]?.color || '#666') + '20',
                color: PLATFORM_CONFIG[account.platform_slug]?.color || '#666', fontWeight: 700, fontSize: 13,
              }}>
                {PLATFORM_CONFIG[account.platform_slug]?.icon || account.platform_slug[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{account.account_name}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {account.platform_name} · {account.account_type}
                  {account.workspace_name && ` · ${account.workspace_name}`}
                </div>
              </div>
              <span className={`status-badge status-${account.health_status}`}>{account.health_status}</span>
              <button className="ctag" style={{ color: '#dc2626' }}
                onClick={() => handleDisconnect(account.id, account.account_name)}>Disconnect</button>
            </div>
          ))}
        </div>
      )}

      {showConnect && (
        <Modal title="Connect Social Account" onClose={() => setShowConnect(false)}>
          <div style={{ padding: 16 }}>
            <p style={{ marginBottom: 16, color: '#64748b' }}>Select a platform to connect:</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {Object.entries(PLATFORM_CONFIG).map(([slug, cfg]) => (
                <button key={slug} className="ctag"
                  style={{
                    padding: '12px 16px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
                    border: `1px solid ${accounts.some(a => a.platform_slug === slug) ? '#22c55e' : '#e2e8f0'}`,
                    opacity: accounts.some(a => a.platform_slug === slug) ? 0.6 : 1,
                  }}
                  onClick={() => startOAuth(slug)}
                  disabled={accounts.some(a => a.platform_slug === slug)}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: cfg.color + '20', color: cfg.color, fontWeight: 700, fontSize: 11,
                  }}>{cfg.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{cfg.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      {accounts.filter(a => a.platform_slug === slug).length} connected
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
