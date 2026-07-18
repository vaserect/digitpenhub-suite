'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';
import Button from '../../ui/Button';
import EmptyState from '../../ui/EmptyState';
import ConfirmDialog from '../../ui/ConfirmDialog';

export default function ABTestingManager({ formId, formName, showToast }) {
  const [variants, setVariants] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [draft, setDraft] = useState({
    variantName: '',
    fields: [],
    thankYouMessage: '',
    trafficSplit: 50,
    isActive: true
  });

  useEffect(() => {
    loadVariants();
    loadPerformance();
  }, [formId]);

  async function loadVariants() {
    try {
      const res = await apiFetch(`/api/v1/leads/forms/${formId}/variants`);
      setVariants(res.variants || []);
    } catch (err) {
      showToast('Failed to load variants');
    } finally {
      setLoading(false);
    }
  }

  async function loadPerformance() {
    try {
      const res = await apiFetch(`/api/v1/leads/forms/${formId}/analytics/variants`);
      setPerformance(res.performance || []);
    } catch (err) {
      console.error('Failed to load performance data:', err);
    }
  }

  function startNew() {
    setEditingId(null);
    setDraft({
      variantName: `Variant ${String.fromCharCode(65 + variants.length)}`,
      fields: [],
      thankYouMessage: '',
      trafficSplit: 50,
      isActive: true
    });
    setShowBuilder(true);
  }

  async function startEdit(variant) {
    setEditingId(variant.id);
    setDraft({
      variantName: variant.variant_name,
      fields: variant.fields_json || [],
      thankYouMessage: variant.thank_you_message || '',
      trafficSplit: variant.traffic_split,
      isActive: variant.is_active
    });
    setShowBuilder(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!draft.variantName.trim()) {
      showToast('Variant name is required');
      return;
    }

    try {
      if (editingId) {
        await apiFetch(`/api/v1/leads/variants/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(draft)
        });
        showToast('Variant updated');
      } else {
        await apiFetch(`/api/v1/leads/forms/${formId}/variants`, {
          method: 'POST',
          body: JSON.stringify(draft)
        });
        showToast('Variant created');
      }
      setShowBuilder(false);
      await loadVariants();
      await loadPerformance();
    } catch (err) {
      showToast(err.message || 'Failed to save variant');
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/v1/leads/variants/${confirmDelete}`, { method: 'DELETE' });
      showToast('Variant deleted');
      await loadVariants();
      await loadPerformance();
    } catch (err) {
      showToast('Failed to delete variant');
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  }

  function addField(type) {
    const id = `field_${Date.now()}`;
    const defaults = {
      text: { label: 'Text field', placeholder: '' },
      email: { label: 'Email address', placeholder: 'your@email.com' },
      phone: { label: 'Phone number', placeholder: '+234...' },
      textarea: { label: 'Message', placeholder: 'Your message...' },
      select: { label: 'Select option', placeholder: '', options: ['Option 1', 'Option 2'] },
      checkbox: { label: 'Agreement', placeholder: 'I agree to be contacted' },
    };
    const d = defaults[type] || defaults.text;
    setDraft(prev => ({
      ...prev,
      fields: [...prev.fields, { id, type, label: d.label, placeholder: d.placeholder, required: true, options: d.options || [] }]
    }));
  }

  function updateField(id, key, value) {
    setDraft(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === id ? { ...f, [key]: value } : f)
    }));
  }

  function removeField(id) {
    setDraft(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== id)
    }));
  }

  function moveField(id, dir) {
    setDraft(prev => {
      const idx = prev.fields.findIndex(f => f.id === id);
      if (idx < 0) return prev;
      const next = [...prev.fields];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return { ...prev, fields: next };
    });
  }

  function getPerformanceForVariant(variantId) {
    return performance.find(p => p.id === variantId) || {
      views: 0,
      submits: 0,
      uniqueVisitors: 0,
      conversionRate: 0
    };
  }

  function getWinner() {
    if (performance.length < 2) return null;
    return performance.reduce((best, current) => {
      const bestRate = parseFloat(best.conversionRate) || 0;
      const currentRate = parseFloat(current.conversionRate) || 0;
      return currentRate > bestRate ? current : best;
    });
  }

  const winner = getWinner();

  if (loading) {
    return <div className="empty-note">Loading A/B tests...</div>;
  }

  if (showBuilder) {
    return (
      <div className="panel">
        <button className="back-link" onClick={() => setShowBuilder(false)}>← Back to variants</button>
        <h2 style={{ marginBottom: 20 }}>{editingId ? 'Edit Variant' : 'New Variant'}</h2>

        <form onSubmit={handleSave}>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Variant Settings</h3>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
              <div className="field">
                <label>Variant Name</label>
                <input
                  value={draft.variantName}
                  onChange={e => setDraft({ ...draft, variantName: e.target.value })}
                  placeholder="e.g., Variant A, Short Form"
                  required
                />
              </div>
              <div className="field">
                <label>Traffic Split (%)</label>
                <input
                  type="number"
                  value={draft.trafficSplit}
                  onChange={e => setDraft({ ...draft, trafficSplit: parseInt(e.target.value) })}
                  min="0"
                  max="100"
                  required
                />
                <small style={{ color: 'var(--text-muted)' }}>
                  Percentage of visitors who see this variant
                </small>
              </div>
            </div>
            <div className="field">
              <label>Thank You Message</label>
              <input
                value={draft.thankYouMessage}
                onChange={e => setDraft({ ...draft, thankYouMessage: e.target.value })}
                placeholder="Thank you! We'll be in touch soon."
              />
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <strong style={{ fontSize: 13 }}>Form Fields ({draft.fields.length})</strong>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['text', 'email', 'phone', 'textarea', 'select', 'checkbox'].map(type => (
                  <button key={type} type="button" className="ctag" onClick={() => addField(type)}>
                    + {type}
                  </button>
                ))}
              </div>
            </div>

            {draft.fields.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Add fields to customize this variant's form
              </p>
            )}

            <div style={{ display: 'grid', gap: 8 }}>
              {draft.fields.map((field, idx) => (
                <div key={field.id} className="card" style={{ background: 'var(--surface-muted)', padding: 12 }}>
                  <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr auto auto', alignItems: 'center' }}>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: 10 }}>Label</label>
                      <input
                        value={field.label}
                        onChange={e => updateField(field.id, 'label', e.target.value)}
                        style={{ fontSize: 12, padding: '5px 8px' }}
                      />
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: 10 }}>Placeholder</label>
                      <input
                        value={field.placeholder}
                        onChange={e => updateField(field.id, 'placeholder', e.target.value)}
                        style={{ fontSize: 12, padding: '5px 8px' }}
                      />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={e => updateField(field.id, 'required', e.target.checked)}
                      />
                      Required
                    </label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {idx > 0 && (
                        <button type="button" className="ctag" onClick={() => moveField(field.id, -1)}>↑</button>
                      )}
                      {idx < draft.fields.length - 1 && (
                        <button type="button" className="ctag" onClick={() => moveField(field.id, 1)}>↓</button>
                      )}
                      <button
                        type="button"
                        className="ctag"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => removeField(field.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
              Inactive variants won't be shown to visitors
            </small>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="submit">{editingId ? 'Save Changes' : 'Create Variant'}</Button>
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
          <h2 style={{ margin: 0, fontSize: 18 }}>A/B Testing: {formName}</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Test different versions of your form to optimize conversions
          </p>
        </div>
        <Button onClick={startNew}>Create Variant</Button>
      </div>

      {winner && (
        <div className="card" style={{ marginBottom: 16, background: 'rgba(22,163,74,0.05)', border: '2px solid rgba(22,163,74,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>🏆</span>
            <strong style={{ fontSize: 14 }}>Winner: {winner.variant_name}</strong>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Conversion rate: <strong style={{ color: 'var(--success)', fontSize: 16 }}>{winner.conversionRate}%</strong>
            {' · '}
            {winner.submits} conversions from {winner.views} views
          </div>
        </div>
      )}

      {variants.length === 0 ? (
        <EmptyState
          icon="🧪"
          title="No A/B test variants yet"
          description="Create variants of your form to test different headlines, fields, or layouts and find what converts best."
          action={<Button onClick={startNew}>Create Your First Variant</Button>}
        />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {variants.map(variant => {
            const perf = getPerformanceForVariant(variant.id);
            const isWinner = winner && winner.id === variant.id;
            return (
              <div
                key={variant.id}
                className="card"
                style={isWinner ? { border: '2px solid rgba(22,163,74,0.3)' } : {}}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      {isWinner && <span style={{ fontSize: 16 }}>🏆</span>}
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{variant.variant_name}</span>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: variant.is_active ? 'rgba(22,163,74,0.1)' : 'rgba(148,163,184,0.1)',
                        color: variant.is_active ? 'var(--success)' : 'var(--text-muted)'
                      }}>
                        {variant.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                      Traffic split: <strong>{variant.traffic_split}%</strong>
                      {' · '}
                      {(variant.fields_json || []).length} fields
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, fontSize: 12 }}>
                      <div>
                        <div style={{ color: 'var(--text-muted)' }}>Views</div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{perf.views}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)' }}>Conversions</div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{perf.submits}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)' }}>Conversion Rate</div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>
                          {perf.conversionRate}%
                        </div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)' }}>Unique Visitors</div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{perf.uniqueVisitors}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="ctag" onClick={() => startEdit(variant)}>Edit</button>
                    <button
                      className="ctag"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => setConfirmDelete(variant.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete this variant?"
        description="All performance data for this variant will be lost. This action cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
}
