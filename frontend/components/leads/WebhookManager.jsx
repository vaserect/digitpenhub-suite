'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';

const WEBHOOK_EVENTS = [
  { value: 'form_submitted', label: 'Form Submitted' },
  { value: 'lead_converted', label: 'Lead Converted' },
  { value: 'lead_assigned', label: 'Lead Assigned' },
  { value: 'lead_status_changed', label: 'Lead Status Changed' }
];

export default function WebhookManager({ onClose }) {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({
    name: '',
    url: '',
    events: ['form_submitted'],
    headers: {},
    isActive: true
  });
  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');

  useEffect(() => {
    loadWebhooks();
  }, []);

  async function loadWebhooks() {
    try {
      const res = await apiFetch('/api/v1/leads/webhooks');
      setWebhooks(res.webhooks || []);
    } catch (err) {
      console.error('Failed to load webhooks:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/leads/webhooks', {
        method: 'POST',
        body: JSON.stringify(draft)
      });
      setShowCreate(false);
      setDraft({ name: '', url: '', events: ['form_submitted'], headers: {}, isActive: true });
      await loadWebhooks();
    } catch (err) {
      alert(err.message || 'Failed to create webhook');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this webhook?')) return;
    try {
      await apiFetch(`/api/v1/leads/webhooks/${id}`, { method: 'DELETE' });
      await loadWebhooks();
    } catch (err) {
      alert(err.message || 'Failed to delete webhook');
    }
  }

  async function handleToggle(id, isActive) {
    try {
      await apiFetch(`/api/v1/leads/webhooks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !isActive })
      });
      await loadWebhooks();
    } catch (err) {
      alert(err.message || 'Failed to update webhook');
    }
  }

  function addHeader() {
    if (!headerKey.trim() || !headerValue.trim()) return;
    setDraft({
      ...draft,
      headers: { ...draft.headers, [headerKey]: headerValue }
    });
    setHeaderKey('');
    setHeaderValue('');
  }

  function removeHeader(key) {
    const { [key]: removed, ...rest } = draft.headers;
    setDraft({ ...draft, headers: rest });
  }

  if (loading) return <div className="empty-note">Loading webhooks...</div>;

  return (
    <div className="card" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Webhooks</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Send lead data to external services
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? 'Cancel' : '+ New Webhook'}
          </Button>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="card" style={{ background: 'var(--surface-muted)', marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem' }}>Create Webhook</h3>
          
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Name</label>
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="e.g., Zapier Integration"
              required
            />
          </div>

          <div className="field" style={{ marginBottom: 14 }}>
            <label>Webhook URL</label>
            <input
              type="url"
              value={draft.url}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
              placeholder="https://hooks.zapier.com/..."
              required
            />
          </div>

          <div className="field" style={{ marginBottom: 14 }}>
            <label>Events to Trigger</label>
            <div style={{ display: 'grid', gap: 8 }}>
              {WEBHOOK_EVENTS.map(event => (
                <label key={event.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={draft.events.includes(event.value)}
                    onChange={(e) => {
                      setDraft({
                        ...draft,
                        events: e.target.checked
                          ? [...draft.events, event.value]
                          : draft.events.filter(ev => ev !== event.value)
                      });
                    }}
                  />
                  <span style={{ fontSize: 13 }}>{event.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="field" style={{ marginBottom: 14 }}>
            <label>Custom Headers (optional)</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                value={headerKey}
                onChange={(e) => setHeaderKey(e.target.value)}
                placeholder="Header name"
                style={{ flex: 1 }}
              />
              <input
                value={headerValue}
                onChange={(e) => setHeaderValue(e.target.value)}
                placeholder="Header value"
                style={{ flex: 1 }}
              />
              <button type="button" className="ctag" onClick={addHeader}>Add</button>
            </div>
            {Object.entries(draft.headers).map(([key, value]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--surface)', borderRadius: 6, marginBottom: 4, fontSize: 12 }}>
                <span><strong>{key}:</strong> {value}</span>
                <button type="button" className="ctag" style={{ color: 'var(--danger)' }} onClick={() => removeHeader(key)}>✕</button>
              </div>
            ))}
          </div>

          <Button type="submit">Create Webhook</Button>
        </form>
      )}

      {webhooks.length === 0 ? (
        <div className="empty-note">
          No webhooks configured. Create one to send lead data to external services.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {webhooks.map(webhook => (
            <div key={webhook.id} className="card" style={{ background: 'var(--surface-muted)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <strong style={{ fontSize: 14 }}>{webhook.name}</strong>
                    <span style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: webhook.is_active ? 'rgba(22,163,74,0.1)' : 'rgba(100,116,139,0.1)',
                      color: webhook.is_active ? 'var(--success)' : 'var(--text-muted)',
                      fontWeight: 600
                    }}>
                      {webhook.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, wordBreak: 'break-all' }}>
                    {webhook.url}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Events: {webhook.events.join(', ')}
                  </div>
                  {webhook.last_triggered && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      Last triggered: {new Date(webhook.last_triggered).toLocaleString()}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="ctag" onClick={() => handleToggle(webhook.id, webhook.is_active)}>
                    {webhook.is_active ? 'Pause' : 'Activate'}
                  </button>
                  <button className="ctag" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(webhook.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
