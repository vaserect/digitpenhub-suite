'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';

export default function DataMigrationModule({ goHome, showToast }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', sourceType: 'csv', targetType: 'contacts' });

  async function load() {
    try {
      const res = await apiFetch('/api/v1/data-migration');
      setTasks(res.tasks || []);
    } catch (e) { showToast?.('Failed to load tasks', 'error'); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/data-migration', { method: 'POST', body: form });
      showToast?.('Migration task created', 'success');
      setShowForm(false);
      setForm({ name: '', sourceType: 'csv', targetType: 'contacts' });
      load();
    } catch (e) { showToast?.('Failed to create task', 'error'); }
  }

  async function handleRun(id) {
    try {
      await apiFetch(`/api/v1/data-migration/${id}/run`, { method: 'POST' });
      showToast?.('Migration started', 'success');
      load();
    } catch (e) { showToast?.('Failed to start migration', 'error'); }
  }

  if (loading) return <div className="panel"><div className="loading">Loading...</div></div>;

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <h1>Guided Data Migration</h1>
        <p className="module-desc">Import data from CSV, Google Sheets, or external APIs with field mapping and validation.</p>
      </div>
      <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'New Migration'}
      </button>
      {showForm && (
        <form onSubmit={handleCreate} className="card" style={{ padding: '1rem', margin: '1rem 0' }}>
          <div className="form-group">
            <label>Task Name</label>
            <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Source</label>
              <select className="select" value={form.sourceType} onChange={e => setForm({...form, sourceType: e.target.value})}>
                <option value="csv">CSV File</option>
                <option value="google_sheets">Google Sheets</option>
                <option value="api">External API</option>
                <option value="manual">Manual Entry</option>
              </select>
            </div>
            <div className="form-group">
              <label>Target</label>
              <select className="select" value={form.targetType} onChange={e => setForm({...form, targetType: e.target.value})}>
                <option value="contacts">Contacts</option>
                <option value="leads">Leads</option>
                <option value="invoices">Invoices</option>
                <option value="products">Products</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Create Task</button>
        </form>
      )}
      {tasks.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <h3>No migration tasks yet</h3>
          <p>Create a migration task to import data from CSV, Google Sheets, or external APIs. You can map source fields to targets, validate before importing, and roll back if needed.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>Start Your First Migration</button>
        </div>
      ) : (
        <table className="table" style={{ marginTop: '1rem' }}>
          <thead><tr><th>Name</th><th>Source</th><th>Target</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id}>
                <td>{t.name}</td><td>{t.source_type}</td><td>{t.target_type}</td>
                <td><span className={`badge badge-${t.status === 'completed' ? 'success' : t.status === 'running' ? 'warning' : 'neutral'}`}>{t.status}</span></td>
                <td>{t.status === 'draft' && <button className="btn btn-sm" onClick={() => handleRun(t.id)}>Run</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
