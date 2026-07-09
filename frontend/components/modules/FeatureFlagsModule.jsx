'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';
import Badge from '../ui/Badge';

export default function FeatureFlagsModule({ goHome }) {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ key: '', name: '', description: '', enabled: true, rolloutPct: 100 });
  const [editKey, setEditKey] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch('/api/v1/feature-flags');
      setFlags(d.flags || []);
    } catch { toast.error('Failed to load feature flags'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveFlag(e) {
    e.preventDefault();
    try {
      const key = editKey || draft.key;
      await apiFetch(`/api/v1/feature-flags/${key}`, {
        method: 'PUT',
        body: JSON.stringify(draft),
      });
      toast.success(editKey ? 'Flag updated' : 'Flag created');
      setShowForm(false);
      setDraft({ key: '', name: '', description: '', enabled: true, rolloutPct: 100 });
      setEditKey(null);
      load();
    } catch (err) { toast.error(err.message); }
  }

  async function deleteFlag(key) {
    try {
      await apiFetch(`/api/v1/feature-flags/${key}`, { method: 'DELETE' });
      toast.success('Flag deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  }

  async function toggleFlag(flag) {
    try {
      await apiFetch(`/api/v1/feature-flags/${flag.key}`, {
        method: 'PUT',
        body: JSON.stringify({ name: flag.name, enabled: !flag.enabled, rolloutPct: flag.rollout_pct }),
      });
      load();
    } catch { toast.error('Failed to toggle'); }
  }

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <div>
          <h1>Feature Flags &amp; Experiments</h1>
          <p className="module-sub">Manage feature toggles, rollouts, and A/B experiments.</p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Button onClick={() => { setShowForm(true); setEditKey(null); setDraft({ key: '', name: '', description: '', enabled: true, rolloutPct: 100 }); }}>+ New Flag</Button>
      </div>

      <Modal isOpen={showForm} title={editKey ? 'Edit Flag' : 'Create Flag'} onClose={() => setShowForm(false)}>
        <form onSubmit={saveFlag}>
          {!editKey && (
            <div className="field">
              <label className="field-label">Key *</label>
              <input className="field-input" value={draft.key} onChange={(e) => setDraft({ ...draft, key: e.target.value })} placeholder="e.g. new-checkout-flow" required pattern="[a-z0-9-]+" />
            </div>
          )}
          <div className="field">
            <label className="field-label">Name *</label>
            <input className="field-input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
          </div>
          <div className="field">
            <label className="field-label">Description</label>
            <textarea className="field-input" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} />
          </div>
          <div className="field">
            <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} />
              Enabled
            </label>
          </div>
          <div className="field">
            <label className="field-label">Rollout % ({draft.rolloutPct}%)</label>
            <input type="range" min={0} max={100} value={draft.rolloutPct} onChange={(e) => setDraft({ ...draft, rolloutPct: parseInt(e.target.value) })} style={{ width: '100%' }} />
          </div>
          <Button type="submit">{editKey ? 'Update' : 'Create'}</Button>
        </form>
      </Modal>

      {loading ? <SkeletonRows rows={5} /> : flags.length === 0 ? (
        <EmptyState icon="🚩" title="No feature flags yet" description="Create flags to control feature rollout." action={<Button onClick={() => setShowForm(true)}>+ New Flag</Button>} />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Key</th><th>Name</th><th>Status</th><th>Rollout</th><th>Effective</th><th>Actions</th></tr></thead>
            <tbody>
              {flags.map((f) => (
                <tr key={f.key}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{f.key}</td>
                  <td style={{ fontWeight: 600 }}>{f.name}</td>
                  <td>
                    <span className={`ctag`} style={{ background: f.enabled ? 'var(--success-bg)' : 'var(--surface-muted)', color: f.enabled ? 'var(--success)' : 'var(--text-muted)' }}>
                      {f.enabled ? 'ON' : 'OFF'}
                    </span>
                  </td>
                  <td>{f.rollout_pct}%</td>
                  <td>
                    <Badge variant={f.effective ? 'success' : 'neutral'}>{f.effective ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Button variant="ghost" size="sm" onClick={() => toggleFlag(f)}>{f.enabled ? 'Disable' : 'Enable'}</Button>
                      <Button variant="ghost" size="sm" onClick={() => { setEditKey(f.key); setDraft({ key: f.key, name: f.name, description: f.description || '', enabled: f.enabled, rolloutPct: f.rollout_pct }); setShowForm(true); }}>Edit</Button>
                      <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }} onClick={() => deleteFlag(f.key)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
