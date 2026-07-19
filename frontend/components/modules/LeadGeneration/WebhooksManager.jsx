'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';
import Button from '../../ui/Button';
import EmptyState from '../../ui/EmptyState';
import ConfirmDialog from '../../ui/ConfirmDialog';

const WEBHOOK_EVENTS = [
  { value: 'form_submitted', label: 'Form Submitted', description: 'Triggered when a lead submits a form' },
  { value: 'lead_converted', label: 'Lead Converted', description: 'Triggered when a lead status changes to converted' },
  { value: 'lead_assigned', label: 'Lead Assigned', description: 'Triggered when a lead is assigned to a team member' },
  { value: 'lead_scored', label: 'Lead Scored', description: 'Triggered when a lead score is calculated' }
];

export default function WebhooksManager({ showToast }) {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(null);

  const [draft, setDraft] = useState({
    name: '',
    url: '',
    events: [],
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
      showToast('Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  }

  function startNew() {
    setEditingId(null);
    setDraft({
      name: '',
      url: '',
      events: [],
      headers: {},
      isActive: true
    });
    setHeaderKey('');
    setHeaderValue('');
    setShowBuilder(true);
  }

  async function startEdit(webhook) {
    setEditingId(webhook.id);
    setDraft({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events || [],
      headers: webhook.headers || {},
      isActive: webhook.is_active
    });
    setHeaderKey('');
    setHeaderValue('');
    setShowBuilder(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!draft.name.trim()) {
      showToast('Webhook name is required');
      return;
    }
    if (!draft.url.trim()) {
      showToast('Webhook URL is required');
      return;
    }
    if (draft.events.length === 0) {
      showToast('Select at least one event');
      return;
    }

    try {
      if (editingId) {
        await apiFetch(`/api/v1/leads/webhooks/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(draft)
        });
        showToast('Webhook updated');
      } else {
        await apiFetch('/api/v1/leads/webhooks', {
          method: 'POST',
          body: JSON.stringify(draft)
        });
        showToast('Webhook created');
      }
      setShowBuilder(false);
      await loadWebhooks();
    } catch (err) {
      showToast(err.message || 'Failed to save webhook');
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/v1/leads/webhooks/${confirmDelete}`, { method: 'DELETE' });
      showToast('Webhook deleted');
      await loadWebhooks();
    } catch (err) {
      showToast('Failed to delete webhook');
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  }

  async function testWebhook(webhookId) {
    setTestingWebhook(webhookId);
    try {
      // Send a test payload
      await apiFetch(`/api/v1/leads/webhooks/${webhookId}/test`, {
        method: 'POST',
        body: JSON.stringify({
          event: 'test',
          data: { message: 'This is a test webhook from Digitpen Hub' }
        })
      });
      showToast('Test webhook sent successfully');
    } catch (err) {
      showToast(err.message || 'Failed to send test webhook');
    } finally {
      setTestingWebhook(null);
    }
  }

  function toggleEvent(event) {
    setDraft(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  }

  function addHeader() {
    if (!headerKey.trim() || !headerValue.trim()) {
      showToast('Both header key and value are required');
      return;
    }
    setDraft(prev => ({
      ...prev,
      headers: { ...prev.headers, [headerKey]: headerValue }
    }));
    setHeaderKey('');
    setHeaderValue('');
  }

  function removeHeader(key) {
    setDraft(prev => {
      const newHeaders = { ...prev.headers };
      delete newHeaders[key];
      return { ...prev, headers: newHeaders };
    });
  }

  if (loading) {
    return <div className="empty-note">Loading webhooks...</div>;
  }

  if (showBuilder) {
    return (
      <div className="panel">
        <button className="back-link" onClick={() => setShowBuilder(false)}>← Back to webhooks</button>
        <h2 style={{ marginBottom: 20 }}>{editingId ? 'Edit Webhook' : 'New Webhook'}</h2>

        <form onSubmit={handleSave}>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Basic Settings</h3>
            <div className="field">
              <label>Webhook Name</label>
              <input
                value={draft.name}
                onChange={e => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g., Slack Notification, CRM Sync"
                required
              />
            </div>
            <div className="field">
              <label>Webhook URL</label>
              <input
                type="url"
                value={draft.url}
                onChange={e => setDraft({ ...draft, url: e.target.value })}
                placeholder="https://your-server.com/webhook"
                required
              />
              <small style={{ color: 'var(--text-muted)' }}>
                POST requests will be sent to this URL when events occur
              </small>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Events to Subscribe</h3>
            <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 12 }}>
              Select which events should trigger this webhook
            </small>
            <div style={{ display: 'grid', gap: 10 }}>
              {WEBHOOK_EVENTS.map(event => (
                <label
                  key={event.value}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: 12,
                    border: `2px solid ${draft.events.includes(event.value) ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 8,
                    background: draft.events.includes(event.value) ? 'rgba(37,99,235,0.05)' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={draft.events.includes(event.value)}
                    onChange={() => toggleEvent(event.value)}
                    style={{ marginTop: 2 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{event.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{event.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Custom Headers (Optional)</h3>
            <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 12 }}>
              Add custom HTTP headers for authentication or other purposes
            </small>
            
            {Object.keys(draft.headers).length > 0 && (
              <div style={{ marginBottom: 12, display: 'grid', gap: 6 }}>
                {Object.entries(draft.headers).map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'var(--surface-muted)',
                      borderRadius: 6,
                      fontSize: 13
                    }}
                  >
                    <div>
                      <strong>{key}:</strong> {value.length > 40 ? value.substring(0, 40) + '...' : value}
                    </div>
                    <button
                      type="button"
                      className="ctag"
                      onClick={() => removeHeader(key)}
                      style={{ color: 'var(--danger)' }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr auto' }}>
              <input
                value={headerKey}
                onChange={e => setHeaderKey(e.target.value)}
                placeholder="Header name (e.g., Authorization)"
              />
              <input
                value={headerValue}
                onChange={e => setHeaderValue(e.target.value)}
                placeholder="Header value"
              />
              <button type="button" className="ctag" onClick={addHeader}>
                Add Header
              </button>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={e => setDraft({ ...draft, isActive: e.target.checked })}
              />
              <span style={{ fontWeight: 600 }}>Active</span>
            </label>
            <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
              Inactive webhooks won't receive events
            </small>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="submit">{editingId ? 'Save Changes' : 'Create Webhook'}</Button>
            <Button variant="secondary" onClick={() => setShowBuilder(false)}>Cancel</Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>Webhooks</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Send real-time lead data to external services
          </p>
        </div>
        <Button onClick={startNew}>Create Webhook</Button>
      </div>

      {webhooks.length === 0 ? (
        <EmptyState
          icon="🔗"
          title="No webhooks configured"
          description="Connect your lead generation to external tools like Slack, Zapier, or your own custom endpoints."
          action={<Button onClick={startNew}>Create Your First Webhook</Button>}
        />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {webhooks.map(webhook => (
            <div key={webhook.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{webhook.name}</span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: webhook.is_active ? 'rgba(22,163,74,0.1)' : 'rgba(148,163,184,0.1)',
                      color: webhook.is_active ? 'var(--success)' : 'var(--text-muted)'
                    }}>
                      {webhook.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, wordBreak: 'break-all' }}>
                    {webhook.url}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(webhook.events || []).map(event => (
                      <span
                        key={event}
                        style={{
                          fontSize: 11,
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: 'var(--surface-muted)',
                          color: 'var(--text)'
                        }}
                      >
                        {event.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                  {webhook.last_triggered && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                      Last triggered: {new Date(webhook.last_triggered).toLocaleString()}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="ctag"
                    onClick={() => testWebhook(webhook.id)}
                    disabled={testingWebhook === webhook.id}
                  >
                    {testingWebhook === webhook.id ? 'Testing...' : 'Test'}
                  </button>
                  <button className="ctag" onClick={() => startEdit(webhook)}>Edit</button>
                  <button
                    className="ctag"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => setConfirmDelete(webhook.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete this webhook?"
        description="This action cannot be undone. The webhook will stop receiving events immediately."
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
}
