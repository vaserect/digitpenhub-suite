'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';

export default function ZapierConnectorModule({ goHome, showToast }) {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ platform: 'zapier', webhookUrl: '', label: '' });

  async function load() {
    try {
      const res = await apiFetch('/api/v1/zapier-connector');
      setConnections(res.connections || []);
    } catch (e) { showToast?.('Failed to load connections', 'error'); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/v1/zapier-connector', { method: 'POST', body: form });
      if (res.apiKey) showToast?.(`API Key: ${res.apiKey} — save this securely!`, 'success');
      setShowForm(false);
      setForm({ platform: 'zapier', webhookUrl: '', label: '' });
      load();
    } catch (e) { showToast?.('Failed to create connection', 'error'); }
  }

  async function handleDelete(id) {
    try {
      await apiFetch(`/api/v1/zapier-connector/${id}`, { method: 'DELETE' });
      showToast?.('Connection removed', 'success');
      load();
    } catch (e) { showToast?.('Failed to remove connection', 'error'); }
  }

  if (loading) return <div className="panel"><div className="loading">Loading...</div></div>;

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <h1>Zapier / Make Native Connector</h1>
        <p className="module-desc">Connect Digitpen Hub to 5,000+ apps via Zapier, Make, n8n, or custom webhooks.</p>
      </div>
      <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'Add Connection'}
      </button>
      {showForm && (
        <form onSubmit={handleCreate} className="card" style={{ padding: '1rem', margin: '1rem 0' }}>
          <div className="form-group">
            <label>Platform</label>
            <select className="select" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}>
              <option value="zapier">Zapier</option>
              <option value="make">Make (Integromat)</option>
              <option value="n8n">n8n</option>
              <option value="custom">Custom Webhook</option>
            </select>
          </div>
          <div className="form-group">
            <label>Webhook URL</label>
            <input className="input" value={form.webhookUrl} onChange={e => setForm({...form, webhookUrl: e.target.value})} placeholder="https://hooks.zapier.com/..." required />
          </div>
          <div className="form-group">
            <label>Label</label>
            <input className="input" value={form.label} onChange={e => setForm({...form, label: e.target.value})} placeholder="My Zapier Connection" />
          </div>
          <button type="submit" className="btn btn-primary">Connect</button>
        </form>
      )}
      {connections.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <h3>No integrations connected</h3>
          <p>Connect Digitpen Hub to Zapier, Make.com, n8n, or any custom webhook endpoint. Trigger automations on contacts, invoices, projects, and more.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>Connect Your First Integration</button>
        </div>
      ) : (
        <table className="table" style={{ marginTop: '1rem' }}>
          <thead><tr><th>Platform</th><th>Label</th><th>Status</th><th>Last Triggered</th><th>Actions</th></tr></thead>
          <tbody>
            {connections.map(c => (
              <tr key={c.id}>
                <td>{c.platform}</td><td>{c.label || '-'}</td>
                <td><span className={`badge badge-${c.is_active ? 'success' : 'neutral'}`}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>{c.last_triggered_at ? new Date(c.last_triggered_at).toLocaleDateString() : 'Never'}</td>
                <td><button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
