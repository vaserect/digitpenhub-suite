'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import Badge from '../ui/Badge';
import { SkeletonRows } from '../ui/Skeleton';

export default function ApiKeysModule({ goHome }) {
  const [keys, setKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('keys');
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState(['read']);
  const [createdKey, setCreatedKey] = useState(null);
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [whDraft, setWhDraft] = useState({ name: '', url: '', events: [] });
  const [whSecret, setWhSecret] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [viewDeliveriesFor, setViewDeliveriesFor] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [k, w] = await Promise.all([
        apiFetch('/api/v1/api-keys'),
        apiFetch('/api/v1/api-keys/webhooks'),
      ]);
      setKeys(k.keys || []);
      setWebhooks(w.webhooks || []);
    } catch { toast.error('Failed to load API keys'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createKey(e) {
    e.preventDefault();
    try {
      const d = await apiFetch('/api/v1/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: newKeyName, scopes: newKeyScopes }),
      });
      setCreatedKey(d.rawKey);
      setShowKeyForm(false);
      load();
    } catch (err) { toast.error(err.message); }
  }

  async function revokeKey(id) {
    try {
      await apiFetch(`/api/v1/api-keys/${id}`, { method: 'DELETE' });
      toast.success('Key revoked');
      load();
    } catch { toast.error('Failed to revoke'); }
  }

  async function createWebhook(e) {
    e.preventDefault();
    try {
      const d = await apiFetch('/api/v1/api-keys/webhooks', {
        method: 'POST',
        body: JSON.stringify(whDraft),
      });
      setWhSecret(d.secret);
      setShowWebhookForm(false);
      load();
    } catch (err) { toast.error(err.message); }
  }

  async function deleteWebhook(id) {
    try {
      await apiFetch(`/api/v1/api-keys/webhooks/${id}`, { method: 'DELETE' });
      toast.success('Webhook deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  }

  async function loadDeliveries(id) {
    try {
      const d = await apiFetch(`/api/v1/api-keys/webhooks/${id}/deliveries`);
      setDeliveries(d.deliveries || []);
      setViewDeliveriesFor(id);
    } catch { toast.error('Failed to load deliveries'); }
  }

  const scopeOptions = ['read', 'write', 'admin'];

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <div>
          <h1>API Keys &amp; Webhooks</h1>
          <p className="module-sub">Manage API access and configure outgoing webhook endpoints.</p>
        </div>
      </div>

      <div className="invoice-tabs" style={{ marginBottom: 20 }}>
        {['keys', 'webhooks'].map((t) => (
          <button key={t} className={`invoice-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t === 'keys' ? 'API Keys' : 'Webhooks'}
          </button>
        ))}
      </div>

      {tab === 'keys' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button onClick={() => { setShowKeyForm(true); setNewKeyName(''); setNewKeyScopes(['read']); setCreatedKey(null); }}>+ New API Key</Button>
          </div>

          <Modal isOpen={showKeyForm} title="Create API Key" onClose={() => setShowKeyForm(false)}>
            <form onSubmit={createKey}>
              <div className="field">
                <label className="field-label">Key name</label>
                <input className="field-input" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g. Production Integration" required />
              </div>
              <div className="field">
                <label className="field-label">Scopes</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {scopeOptions.map((s) => (
                    <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                      <input type="checkbox" checked={newKeyScopes.includes(s)} onChange={(e) => {
                        setNewKeyScopes(e.target.checked ? [...newKeyScopes, s] : newKeyScopes.filter(x => x !== s));
                      }} />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit">Create Key</Button>
            </form>
          </Modal>

          {createdKey && (
            <div style={{ background: 'var(--surface-muted)', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--primary)' }}>🔑 Key created — copy it now</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', background: 'var(--surface)', padding: '10px 12px', borderRadius: 8, wordBreak: 'break-all', marginBottom: 8 }}>{createdKey}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600 }}>This key won't be shown again.</div>
              <Button size="sm" variant="secondary" style={{ marginTop: 8 }} onClick={() => { navigator.clipboard.writeText(createdKey); toast.success('Copied!'); }}>Copy</Button>
            </div>
          )}

          {loading ? <SkeletonRows rows={4} /> : keys.length === 0 ? (
            <EmptyState icon="🔑" title="No API keys yet" description="Create a key for external integrations." action={<Button onClick={() => setShowKeyForm(true)}>+ New API Key</Button>} />
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {keys.map((k) => (
                <div key={k.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{k.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{k.key_prefix}</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      {(k.scopes || []).map((s) => <Badge key={s} variant="neutral">{s}</Badge>)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{k.last_used_at ? `Last used ${new Date(k.last_used_at).toLocaleDateString()}` : 'Never used'}</span>
                    <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }} onClick={() => revokeKey(k.id)}>Revoke</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'webhooks' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button onClick={() => { setShowWebhookForm(true); setWhDraft({ name: '', url: '', events: [] }); setWhSecret(null); }}>+ New Webhook</Button>
          </div>

          <Modal isOpen={showWebhookForm} title="Create Webhook Endpoint" onClose={() => setShowWebhookForm(false)}>
            <form onSubmit={createWebhook}>
              <div className="field">
                <label className="field-label">Name</label>
                <input className="field-input" value={whDraft.name} onChange={(e) => setWhDraft({ ...whDraft, name: e.target.value })} required />
              </div>
              <div className="field">
                <label className="field-label">Endpoint URL</label>
                <input className="field-input" value={whDraft.url} onChange={(e) => setWhDraft({ ...whDraft, url: e.target.value })} placeholder="https://..." required />
              </div>
              <div className="field">
                <label className="field-label">Events</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['invoice.created','invoice.paid','contact.created','lead.submitted','subscription.updated'].map((ev) => (
                    <label key={ev} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: '0.82rem' }}>
                      <input type="checkbox" checked={whDraft.events.includes(ev)} onChange={(e) => {
                        setWhDraft({ ...whDraft, events: e.target.checked ? [...whDraft.events, ev] : whDraft.events.filter(x => x !== ev) });
                      }} />
                      {ev}
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit">Create Webhook</Button>
            </form>
          </Modal>

          {whSecret && (
            <div style={{ background: 'var(--surface-muted)', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--primary)' }}>🔐 Webhook signing secret</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', background: 'var(--surface)', padding: '10px 12px', borderRadius: 8, wordBreak: 'break-all', marginBottom: 8 }}>{whSecret}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Use this secret to verify webhook payloads.</div>
              <Button size="sm" variant="secondary" style={{ marginTop: 8 }} onClick={() => { navigator.clipboard.writeText(whSecret); toast.success('Copied!'); }}>Copy</Button>
            </div>
          )}

          {loading ? <SkeletonRows rows={4} /> : webhooks.length === 0 ? (
            <EmptyState icon="🔗" title="No webhooks yet" description="Configure webhooks to receive real-time events." action={<Button onClick={() => setShowWebhookForm(true)}>+ New Webhook</Button>} />
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {webhooks.map((w) => (
                <div key={w.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{w.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{w.url}</div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                        {(w.events || []).map((ev) => <Badge key={ev} variant="info">{ev}</Badge>)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Button variant="ghost" size="sm" onClick={() => loadDeliveries(w.id)}>Delivery log</Button>
                      <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }} onClick={() => deleteWebhook(w.id)}>Delete</Button>
                    </div>
                  </div>
                  {viewDeliveriesFor === w.id && (
                    <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 8 }}>Delivery log</div>
                      {deliveries.length === 0 ? <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No deliveries yet.</div> : (
                        <div style={{ display: 'grid', gap: 6 }}>
                          {deliveries.map((d) => (
                            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '6px 10px', background: 'var(--surface-muted)', borderRadius: 6 }}>
                              <span>{d.event_type} · Attempt {d.attempt}</span>
                              <span style={{ color: d.status === 'delivered' ? 'var(--success)' : d.status === 'failed' ? 'var(--danger)' : 'var(--warning)' }}>{d.status}{d.status_code ? ` (${d.status_code})` : ''}</span>
                              <span style={{ color: 'var(--text-muted)' }}>{new Date(d.created_at).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
