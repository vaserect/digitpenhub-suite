'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';
import Button from '../../ui/Button';
import EmptyState from '../../ui/EmptyState';
import ConfirmDialog from '../../ui/ConfirmDialog';

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'not_empty', label: 'Not Empty' }
];

export default function ScoringRulesManager({ showToast }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [draft, setDraft] = useState({
    name: '',
    conditions: [],
    scoreChange: 10,
    isActive: true
  });

  useEffect(() => {
    loadRules();
  }, []);

  async function loadRules() {
    try {
      const res = await apiFetch('/api/v1/leads/scoring-rules');
      setRules(res.rules || []);
    } catch (err) {
      showToast('Failed to load scoring rules');
    } finally {
      setLoading(false);
    }
  }

  function startNew() {
    setEditingId(null);
    setDraft({
      name: '',
      conditions: [],
      scoreChange: 10,
      isActive: true
    });
    setShowBuilder(true);
  }

  async function startEdit(rule) {
    setEditingId(rule.id);
    setDraft({
      name: rule.name,
      conditions: rule.conditions || [],
      scoreChange: rule.score_change,
      isActive: rule.is_active
    });
    setShowBuilder(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!draft.name.trim()) {
      showToast('Rule name is required');
      return;
    }
    if (draft.conditions.length === 0) {
      showToast('Add at least one condition');
      return;
    }

    try {
      if (editingId) {
        await apiFetch(`/api/v1/leads/scoring-rules/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(draft)
        });
        showToast('Scoring rule updated');
      } else {
        await apiFetch('/api/v1/leads/scoring-rules', {
          method: 'POST',
          body: JSON.stringify(draft)
        });
        showToast('Scoring rule created');
      }
      setShowBuilder(false);
      await loadRules();
    } catch (err) {
      showToast(err.message || 'Failed to save scoring rule');
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/v1/leads/scoring-rules/${confirmDelete}`, { method: 'DELETE' });
      showToast('Scoring rule deleted');
      await loadRules();
    } catch (err) {
      showToast('Failed to delete scoring rule');
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  }

  function addCondition() {
    setDraft(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: '', operator: 'equals', value: '' }]
    }));
  }

  function updateCondition(index, key, value) {
    setDraft(prev => ({
      ...prev,
      conditions: prev.conditions.map((c, i) => i === index ? { ...c, [key]: value } : c)
    }));
  }

  function removeCondition(index) {
    setDraft(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  }

  if (loading) {
    return <div className="empty-note">Loading scoring rules...</div>;
  }

  if (showBuilder) {
    return (
      <div className="panel">
        <button className="back-link" onClick={() => setShowBuilder(false)}>← Back to scoring rules</button>
        <h2 style={{ marginBottom: 20 }}>{editingId ? 'Edit Scoring Rule' : 'New Scoring Rule'}</h2>

        <form onSubmit={handleSave}>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Rule Settings</h3>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '2fr 1fr' }}>
              <div className="field">
                <label>Rule Name</label>
                <input
                  value={draft.name}
                  onChange={e => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g., Enterprise Company Bonus"
                  required
                />
              </div>
              <div className="field">
                <label>Score Change</label>
                <input
                  type="number"
                  value={draft.scoreChange}
                  onChange={e => setDraft({ ...draft, scoreChange: parseInt(e.target.value) })}
                  placeholder="10"
                  required
                />
                <small style={{ color: 'var(--text-muted)' }}>
                  Points to add (positive) or subtract (negative)
                </small>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 15, margin: 0 }}>Conditions</h3>
              <button type="button" className="ctag" onClick={addCondition}>
                + Add Condition
              </button>
            </div>
            <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 12 }}>
              All conditions must be met for this rule to apply
            </small>

            {draft.conditions.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Add at least one condition to define when this rule applies
              </p>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {draft.conditions.map((condition, idx) => (
                  <div
                    key={idx}
                    className="card"
                    style={{ background: 'var(--surface-muted)', padding: 12 }}
                  >
                    <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 1fr auto', alignItems: 'end' }}>
                      <div className="field" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: 11 }}>Field Name</label>
                        <input
                          value={condition.field}
                          onChange={e => updateCondition(idx, 'field', e.target.value)}
                          placeholder="e.g., company, email, phone"
                          style={{ fontSize: 12, padding: '6px 8px' }}
                        />
                      </div>
                      <div className="field" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: 11 }}>Operator</label>
                        <select
                          value={condition.operator}
                          onChange={e => updateCondition(idx, 'operator', e.target.value)}
                          style={{ fontSize: 12, padding: '6px 8px' }}
                        >
                          {OPERATORS.map(op => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="field" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: 11 }}>Value</label>
                        <input
                          value={condition.value}
                          onChange={e => updateCondition(idx, 'value', e.target.value)}
                          placeholder={condition.operator === 'not_empty' ? 'N/A' : 'Value to compare'}
                          disabled={condition.operator === 'not_empty'}
                          style={{ fontSize: 12, padding: '6px 8px' }}
                        />
                      </div>
                      <button
                        type="button"
                        className="ctag"
                        onClick={() => removeCondition(idx)}
                        style={{ color: 'var(--danger)' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              Inactive rules won't be applied to new leads
            </small>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="submit">{editingId ? 'Save Changes' : 'Create Rule'}</Button>
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
          <h2 style={{ margin: 0, fontSize: 18 }}>Lead Scoring Rules</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Automatically score leads based on their attributes and behavior
          </p>
        </div>
        <Button onClick={startNew}>Create Rule</Button>
      </div>

      {rules.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="No scoring rules yet"
          description="Create rules to automatically score leads based on company size, industry, engagement, and more."
          action={<Button onClick={startNew}>Create Your First Rule</Button>}
        />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {rules.map(rule => (
            <div key={rule.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{rule.name}</span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: rule.is_active ? 'rgba(22,163,74,0.1)' : 'rgba(148,163,184,0.1)',
                      color: rule.is_active ? 'var(--success)' : 'var(--text-muted)'
                    }}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span style={{
                      fontSize: 13,
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 999,
                      background: rule.score_change > 0 ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
                      color: rule.score_change > 0 ? 'var(--success)' : 'var(--danger)'
                    }}>
                      {rule.score_change > 0 ? '+' : ''}{rule.score_change} points
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                    <strong>{(rule.conditions || []).length}</strong> condition{(rule.conditions || []).length !== 1 ? 's' : ''}
                    {(rule.conditions || []).length > 0 && (
                      <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {(rule.conditions || []).map((cond, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: 11,
                              padding: '3px 8px',
                              borderRadius: 4,
                              background: 'var(--surface-muted)',
                              color: 'var(--text)',
                              fontFamily: 'monospace'
                            }}
                          >
                            {cond.field} {cond.operator.replace(/_/g, ' ')} {cond.value || ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="ctag" onClick={() => startEdit(rule)}>Edit</button>
                  <button
                    className="ctag"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => setConfirmDelete(rule.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: 20, background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.2)' }}>
        <h4 style={{ fontSize: 14, marginBottom: 8 }}>💡 Scoring Tips</h4>
        <ul style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, paddingLeft: 20 }}>
          <li>Award higher scores for enterprise indicators (company size, budget, industry)</li>
          <li>Add points for engagement signals (multiple form submissions, specific pages visited)</li>
          <li>Subtract points for red flags (personal email domains, incomplete information)</li>
          <li>Use scoring to prioritize follow-ups and route leads to the right team members</li>
        </ul>
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete this scoring rule?"
        description="This action cannot be undone. Existing lead scores won't be recalculated."
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
}
