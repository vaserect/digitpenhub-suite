'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';

export default function FunnelEditor({ funnelId, onBack, onSaveSuccess }) {
  const [loading, setLoading] = useState(true);
  const [funnel, setFunnel] = useState(null);
  const [funnelSteps, setFunnelSteps] = useState([]);
  const [funnelDraft, setFunnelDraft] = useState({ name: '', description: '', status: 'draft' });
  const [funnelSaving, setFunnelSaving] = useState(false);

  // Pages options
  const [pages, setPages] = useState([]);
  const [pagesLoading, setPagesLoading] = useState(false);

  // Add step states
  const [addingStepPageId, setAddingStepPageId] = useState('');
  const [addingStepType, setAddingStepType] = useState('page');

  const loadFunnel = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/v1/funnels/${funnelId}`);
      setFunnel(data.funnel);
      setFunnelSteps(data.steps || []);
      setFunnelDraft({
        name: data.funnel.name,
        description: data.funnel.description || '',
        status: data.funnel.status
      });
    } catch {
      toast.error('Failed to load funnel details');
    } finally {
      setLoading(false);
    }
  }, [funnelId]);

  const loadPages = useCallback(async () => {
    setPagesLoading(true);
    try {
      const data = await apiFetch('/api/v1/pages?type=page');
      setPages(data.pages || []);
    } catch {
      setPages([]);
    } finally {
      setPagesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFunnel();
    loadPages();
  }, [loadFunnel, loadPages]);

  async function handleSaveFunnel() {
    setFunnelSaving(true);
    try {
      const data = await apiFetch(`/api/v1/funnels/${funnelId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: funnelDraft.name,
          description: funnelDraft.description,
          status: funnelDraft.status
        }),
      });
      setFunnel(data.funnel);
      toast.success('Funnel saved.');
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      toast.error(err.message || 'Failed to save funnel');
    } finally {
      setFunnelSaving(false);
    }
  }

  async function handleAddFunnelStep() {
    if (!addingStepPageId) return;
    try {
      const data = await apiFetch(`/api/v1/funnels/${funnelId}/steps`, {
        method: 'POST',
        body: JSON.stringify({ pageId: addingStepPageId, stepType: addingStepType }),
      });
      
      const fresh = await apiFetch(`/api/v1/funnels/${funnelId}`);
      setFunnelSteps(fresh.steps || []);
      setAddingStepPageId('');
      toast.success('Step added.');
    } catch (err) {
      toast.error(err.message || 'Failed to add step');
    }
  }

  async function handleRemoveFunnelStep(stepId) {
    try {
      await apiFetch(`/api/v1/funnels/${funnelId}/steps/${stepId}`, { method: 'DELETE' });
      const fresh = await apiFetch(`/api/v1/funnels/${funnelId}`);
      setFunnelSteps(fresh.steps || []);
      toast.success('Step removed.');
    } catch (err) {
      toast.error('Failed to remove step');
    }
  }

  async function moveFunnelStep(idx, dir) {
    const arr = [...funnelSteps];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    
    // Swap
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setFunnelSteps(arr);

    try {
      await apiFetch(`/api/v1/funnels/${funnelId}/steps/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ orderedIds: arr.map((s) => s.id) }),
      });
    } catch {
      toast.error('Failed to reorder steps');
      // Revert local state
      const fresh = await apiFetch(`/api/v1/funnels/${funnelId}`);
      setFunnelSteps(fresh.steps || []);
    }
  }

  if (loading) {
    return <div className="empty-note">Loading funnel editor…</div>;
  }

  return (
    <div>
      <button className="back-link" onClick={onBack}>← Funnels</button>
      <div className="module-head">
        <div>
          <h1 style={{ fontSize: '1.1rem' }}>{funnelDraft.name || 'Untitled funnel'}</h1>
          <p className="module-sub">{funnelSteps.length} step{funnelSteps.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={funnelDraft.status} onChange={(e) => setFunnelDraft((d) => ({ ...d, status: e.target.value }))}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', color: 'var(--text)', fontSize: 13 }}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <button className="primary-btn" onClick={handleSaveFunnel} disabled={funnelSaving}>
            {funnelSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Funnel meta */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="field-label">Funnel name</label>
            <input className="field-input" value={funnelDraft.name} onChange={(e) => setFunnelDraft((d) => ({ ...d, name: e.target.value }))} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="field-label">Description (optional)</label>
            <input className="field-input" value={funnelDraft.description} onChange={(e) => setFunnelDraft((d) => ({ ...d, description: e.target.value }))} placeholder="What's this funnel for?" />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Steps</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
        {funnelSteps.length === 0 && <div className="empty-note">No steps yet. Add a page below.</div>}
        {funnelSteps.map((step, idx) => (
          <div key={step.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{idx + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{step.page_title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>/p/{step.page_slug}</div>
            </div>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--surface-muted)', color: 'var(--text-muted)', fontWeight: 600 }}>{step.step_type}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <button className="ctag" style={{ fontSize: 11, padding: '2px 6px', opacity: idx === 0 ? 0.3 : 1 }} disabled={idx === 0} onClick={() => moveFunnelStep(idx, -1)}>▲</button>
              <button className="ctag" style={{ fontSize: 11, padding: '2px 6px', opacity: idx === funnelSteps.length - 1 ? 0.3 : 1 }} disabled={idx === funnelSteps.length - 1} onClick={() => moveFunnelStep(idx, 1)}>▼</button>
            </div>
            {step.page_status === 'published' && (
              <a href={`/p/${step.page_slug}`} target="_blank" rel="noopener" className="ctag">View ↗</a>
            )}
            <button className="ctag" style={{ color: 'var(--danger)' }} onClick={() => handleRemoveFunnelStep(step.id)}>Remove</button>
          </div>
        ))}
      </div>

      {/* Add step */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Add step</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="field" style={{ marginBottom: 0, flex: '2 1 200px' }}>
            <label className="field-label">Page</label>
            {pagesLoading ? (
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading pages…</p>
            ) : (
              <select className="field-input" value={addingStepPageId} onChange={(e) => setAddingStepPageId(e.target.value)}>
                <option value="">Select a page…</option>
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>{p.title} ({p.status})</option>
                ))}
              </select>
            )}
          </div>
          <div className="field" style={{ marginBottom: 0, flex: '1 1 140px' }}>
            <label className="field-label">Step type</label>
            <select className="field-input" value={addingStepType} onChange={(e) => setAddingStepType(e.target.value)}>
              <option value="page">Page</option>
              <option value="optin">Opt-in</option>
              <option value="upsell">Upsell</option>
              <option value="downsell">Downsell</option>
              <option value="thankyou">Thank you</option>
            </select>
          </div>
          <Button onClick={handleAddFunnelStep} disabled={!addingStepPageId} style={{ marginBottom: 16 }}>Add step</Button>
        </div>
      </div>
    </div>
  );
}
