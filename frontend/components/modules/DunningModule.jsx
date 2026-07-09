'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';
import Badge from '../ui/Badge';

export default function DunningModule({ goHome }) {
  const [templates, setTemplates] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('templates');
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ name: '', schedule: [3, 7, 14], maxRetries: 3 });
  const [editId, setEditId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, c] = await Promise.all([
        apiFetch('/api/v1/dunning/templates'),
        apiFetch('/api/v1/dunning/cycles'),
      ]);
      setTemplates(t.templates || []);
      setCycles(c.cycles || []);
    } catch { toast.error('Failed to load dunning data'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveTemplate(e) {
    e.preventDefault();
    try {
      const method = editId ? 'PUT' : 'POST';
      const url = editId ? `/api/v1/dunning/templates/${editId}` : '/api/v1/dunning/templates';
      await apiFetch(url, { method, body: JSON.stringify(draft) });
      toast.success(editId ? 'Template updated' : 'Template created');
      setShowForm(false);
      setDraft({ name: '', schedule: [3, 7, 14], maxRetries: 3 });
      setEditId(null);
      load();
    } catch (err) { toast.error(err.message); }
  }

  async function deleteTemplate(id) {
    try {
      await apiFetch(`/api/v1/dunning/templates/${id}`, { method: 'DELETE' });
      toast.success('Template deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  }

  const statusColor = (s) => {
    if (s === 'active') return 'var(--success)';
    if (s === 'paused') return 'var(--warning)';
    if (s === 'completed') return 'var(--primary)';
    if (s === 'failed') return 'var(--danger)';
    return 'var(--text-muted)';
  };

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <div>
          <h1>Dunning Management</h1>
          <p className="module-sub">Automate payment recovery with configurable dunning templates and cycles.</p>
        </div>
      </div>

      <div className="invoice-tabs" style={{ marginBottom: 16 }}>
        <button className={`invoice-tab${tab === 'templates' ? ' active' : ''}`} onClick={() => setTab('templates')}>Templates</button>
        <button className={`invoice-tab${tab === 'cycles' ? ' active' : ''}`} onClick={() => setTab('cycles')}>Active Cycles</button>
      </div>

      {tab === 'templates' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button onClick={() => { setShowForm(true); setEditId(null); setDraft({ name: '', schedule: [3, 7, 14], maxRetries: 3 }); }}>+ New Template</Button>
          </div>

          <Modal isOpen={showForm} title={editId ? 'Edit Template' : 'Create Template'} onClose={() => setShowForm(false)}>
            <form onSubmit={saveTemplate}>
              <div className="field">
                <label className="field-label">Template name *</label>
                <input className="field-input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
              </div>
              <div className="field">
                <label className="field-label">Schedule (days after due date)</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(draft.schedule || []).map((d, i) => (
                    <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <input className="form-input" type="number" min={1} value={d} onChange={(e) => {
                        const s = [...draft.schedule];
                        s[i] = parseInt(e.target.value) || 1;
                        setDraft({ ...draft, schedule: s });
                      }} style={{ width: 60 }} />
                      <span style={{ cursor: 'pointer', color: 'var(--danger)', fontSize: '0.8rem' }} onClick={() => {
                        setDraft({ ...draft, schedule: draft.schedule.filter((_, j) => j !== i) });
                      }}>✕</span>
                    </div>
                  ))}
                </div>
                <Button variant="secondary" size="sm" style={{ marginTop: 6 }} onClick={() => setDraft({ ...draft, schedule: [...(draft.schedule || []), 7] })}>+ Add step</Button>
              </div>
              <div className="field">
                <label className="field-label">Max retries</label>
                <input className="field-input" type="number" min={1} max={20} value={draft.maxRetries} onChange={(e) => setDraft({ ...draft, maxRetries: parseInt(e.target.value) })} style={{ width: 80 }} />
              </div>
              <Button type="submit">{editId ? 'Update' : 'Create'}</Button>
            </form>
          </Modal>

          {loading ? <SkeletonRows rows={4} /> : templates.length === 0 ? (
            <EmptyState icon="📋" title="No dunning templates yet" description="Create templates to automate payment reminders." action={<Button onClick={() => setShowForm(true)}>+ New Template</Button>} />
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {templates.map((t) => (
                <div key={t.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{t.name}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        {(t.schedule || []).map((d, i) => <Badge key={i} variant="neutral">Day {d}</Badge>)}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Max retries: {t.max_retries}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Button variant="ghost" size="sm" disabled={t.org_id === null}>Edit</Button>
                      <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }} disabled={t.org_id === null} onClick={() => deleteTemplate(t.id)}>Delete</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'cycles' && (
        <>
          {loading ? <SkeletonRows rows={4} /> : cycles.length === 0 ? (
            <EmptyState icon="🔄" title="No active dunning cycles" description="Dunning cycles start automatically when a payment fails and a template is assigned." />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Subscription</th><th>Template</th><th>Status</th><th>Attempts</th><th>Started</th><th>Actions</th></tr></thead>
                <tbody>
                  {cycles.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{c.subscription_id || '—'}</td>
                      <td>{c.template_name || '—'}</td>
                      <td><span style={{ color: statusColor(c.status), fontWeight: 600 }}>{c.status}</span></td>
                      <td>{c.attempts} / {c.max_retries}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(c.started_at).toLocaleDateString()}</td>
                      <td>
                        {c.status === 'active' && (
                          <Button variant="ghost" size="sm" onClick={async () => {
                            try {
                              await apiFetch(`/api/v1/dunning/cycles/${c.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'paused' }) });
                              toast.success('Cycle paused');
                              load();
                            } catch { toast.error('Failed to pause'); }
                          }}>Pause</Button>
                        )}
                        {c.status === 'paused' && (
                          <Button variant="ghost" size="sm" onClick={async () => {
                            try {
                              await apiFetch(`/api/v1/dunning/cycles/${c.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'active' }) });
                              toast.success('Cycle resumed');
                              load();
                            } catch { toast.error('Failed to resume'); }
                          }}>Resume</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
