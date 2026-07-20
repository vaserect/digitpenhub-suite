'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';

export default function InternalScriptsModule({ goHome, showToast }) {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', language: 'javascript', sourceCode: '' });
  const [runOutput, setRunOutput] = useState(null);

  async function load() {
    try {
      const res = await apiFetch('/api/v1/internal-scripts');
      setScripts(res.scripts || []);
    } catch (e) { showToast?.('Failed to load scripts', 'error'); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/internal-scripts', { method: 'POST', body: form });
      showToast?.('Script created', 'success');
      setShowForm(false);
      setForm({ name: '', description: '', language: 'javascript', sourceCode: '' });
      load();
    } catch (e) { showToast?.('Failed to create script', 'error'); }
  }

  async function handleRun(id) {
    setRunOutput('Running...');
    try {
      const res = await apiFetch(`/api/v1/internal-scripts/${id}/run`, { method: 'POST' });
      setRunOutput(JSON.stringify(res, null, 2));
      showToast?.('Script executed', 'success');
      load();
    } catch (e) { setRunOutput(`Error: ${e.message}`); }
  }

  async function handleDelete(id) {
    try {
      await apiFetch(`/api/v1/internal-scripts/${id}`, { method: 'DELETE' });
      showToast?.('Script deleted', 'success');
      load();
    } catch (e) { showToast?.('Failed to delete', 'error'); }
  }

  if (loading) return <div className="panel"><div className="loading">Loading...</div></div>;

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <h1>Internal Tooling & Script Library</h1>
        <p className="module-desc">Write and run custom JavaScript scripts for automation, data processing, and internal tooling.</p>
      </div>
      <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'New Script'}
      </button>
      {showForm && (
        <form onSubmit={handleCreate} className="card" style={{ padding: '1rem', margin: '1rem 0' }}>
          <div className="form-group">
            <label>Script Name</label>
            <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Language</label>
            <select className="select" value={form.language} onChange={e => setForm({...form, language: e.target.value})}>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="sql">SQL</option>
              <option value="bash">Bash</option>
            </select>
          </div>
          <div className="form-group">
            <label>Source Code</label>
            <textarea className="textarea" rows={8} value={form.sourceCode} onChange={e => setForm({...form, sourceCode: e.target.value})}
              placeholder="console.log('Hello from Digitpen!');" required />
          </div>
          <button type="submit" className="btn btn-primary">Create Script</button>
        </form>
      )}
      {runOutput && (
        <div className="card" style={{ padding: '1rem', margin: '1rem 0', background: '#1a1a2e', color: '#00ff00', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          <strong>Output:</strong>
          <pre>{runOutput}</pre>
          <button className="btn btn-sm" onClick={() => setRunOutput(null)}>Clear</button>
        </div>
      )}
      {scripts.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <h3>No scripts yet</h3>
          <p>Create custom scripts to automate internal workflows, transform data, or build quick internal tools using JavaScript, Python, SQL, or Bash.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>Create Your First Script</button>
        </div>
      ) : (
        <table className="table" style={{ marginTop: '1rem' }}>
          <thead><tr><th>Name</th><th>Language</th><th>Status</th><th>Last Run</th><th>Actions</th></tr></thead>
          <tbody>
            {scripts.map(s => (
              <tr key={s.id}>
                <td>{s.name}</td><td>{s.language}</td>
                <td><span className={`badge badge-${s.is_active ? 'success' : 'neutral'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>{s.last_run_at ? `${s.last_run_status} ${new Date(s.last_run_at).toLocaleDateString()}` : 'Never'}</td>
                <td>
                  <button className="btn btn-sm" onClick={() => handleRun(s.id)}>Run</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id)} style={{ marginLeft: '0.5rem' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
