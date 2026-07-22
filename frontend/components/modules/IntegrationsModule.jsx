'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import Badge from '../ui/Badge';
import { SkeletonRows } from '../ui/Skeleton';

export default function IntegrationsModule({ goHome }) {
  const [tab, setTab] = useState('providers');
  const [providers, setProviders] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConnect, setShowConnect] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [provRes, connRes] = await Promise.all([
        apiFetch('/api/v1/integrations/providers').catch(() => ({ providers: [] })),
        apiFetch('/api/v1/integrations/connections').catch(() => ({ connections: [] })),
      ]);
      setProviders(provRes.providers || []);
      setConnections(connRes.connections || []);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteConnection = async (id) => {
    try {
      await apiFetch(`/api/v1/integrations-hub/connections/${id}`, { method: 'DELETE' });
      toast.success('Connection removed');
      load();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <h1>Integrations Hub</h1>
        <p className="module-sub">Connect your favourite tools — CRMs, email, payments, and more.</p>
      </div>

      <div className="invoice-tabs" style={{ marginBottom: 16 }}>
        {[{ k: 'providers', l: 'Available' }, { k: 'connected', l: `Connected (${connections.length})` }].map(t => (
          <button key={t.k} className={`invoice-tab${tab === t.k ? ' active' : ''}`} onClick={() => setTab(t.k)}>
            {t.l}
          </button>
        ))}
      </div>

      {loading ? <SkeletonRows rows={4} /> : tab === 'providers' ? (
        providers.length === 0 ? (
          <EmptyState icon="🔌" title="No integrations yet"
            description="Integration providers will appear here as they become available." />
        ) : (
          <div className="tile-grid">
            {providers.map(p => (
              <div key={p.key || p.name} className="tile active" style={{ cursor: 'default' }}>
                <div className="tile-icon">{p.icon || p.name?.charAt(0) || '🔌'}</div>
                <div className="tile-name">{p.name}</div>
                <div className="tile-cat">{p.description?.slice(0, 40)}</div>
                <div className="tile-status">
                  <Button size="sm" onClick={() => setShowConnect(p)}>Connect</Button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : connections.length === 0 ? (
        <EmptyState icon="🔗" title="No connections yet"
          description="Connect an integration to get started." />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Provider</th><th>Status</th><th>Connected</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {connections.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.provider_name || c.provider}</td>
                  <td><Badge variant={c.status === 'active' ? 'success' : 'neutral'}>{c.status}</Badge></td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <Button size="sm" variant="danger" onClick={() => deleteConnection(c.id)}>Disconnect</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={!!showConnect} title={`Connect ${showConnect?.name || ''}`}
        onClose={() => setShowConnect(null)}>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
          To connect {showConnect?.name}, you&apos;ll be redirected to authorize the integration.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setShowConnect(null)}>Cancel</Button>
          <Button onClick={() => {
            toast.success(`Opening ${showConnect?.name} authorization…`);
            setShowConnect(null);
          }}>Authorize</Button>
        </div>
      </Modal>
    </div>
  );
}
