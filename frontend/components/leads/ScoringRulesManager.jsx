'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
  { value: 'not_empty', label: 'Not empty' }
];

export default function ScoringRulesManager({ onClose }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({
    name: '',
    conditions: [{ field: '', operator: 'equals', value: '' }],
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
      console.error('Failed to load scoring rules:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/leads/scoring-rules', {
        method: 'POST',
        body: JSON.stringify(draft)
      });
      setShowCreate(false);
      setDraft({ name: '', conditions: [{ field: '', operator: 'equals', value: '' }], scoreChange: 10, isActive: true });
      await loadRules();
    } catch (err) {
      alert(err.message || 'Failed to create rule');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this scoring rule?')) return;
    try {
      await apiFetch(`/api/v1/leads/scoring-rules/${id}`, { method: 'DELETE' });
      await loadRules();
    } catch (err) {
      alert(err.message || 'Failed to delete rule');
    }
  }

  async function handleToggle(id, isActive) {
    try {
      await apiFetch(`/api/v1/leads/scoring-rules/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !isActive })
      });
      await loadRules();
    } catch (err) {
      alert(err.message || 'Failed to update rule');
    }
  }

  function addCondition() {
    setDraft({
      ...draft,
      conditions: [...draft.conditions, { field: '', operator: 'equals', value: '' }]
    });
  }

  function updateCondition(index, key, value) {
    const newConditions = [...draft.conditions];
    newConditions[index][key] = value;
    setDraft({ ...draft, conditions: newConditions });
  }

  function removeCondition(index) {
    setDraft({
      ...draft,
      conditions: draft.conditions.filter((_, i) => i !== index)
    });
  }

  if (loading) return <div className="empty-note">Loading scoring rules...</div>;

  return (
    <div className="card" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Lead Scoring Rules</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Automatically score leads based on their attributes
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? 'Cancel' : '+ New Rule'}
          </Button>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="card" style={{ background: 'var(--surface-muted)', marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem' }}>Create Scoring Rule</h3>
          
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '2fr 1fr', marginBottom: 14 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Rule Name</label>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g., Enterprise Company"
                required
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Score Change</label>
              <input
                type="number"
                value={draft.scoreChange}
                onChange={(e) => setDraft({ ...draft, scoreChange: parseInt(e.target.value) })}
                placeholder="+10"
                required
              />
            </div>
          </div>

          <div className="field" style={{ marginBottom: 14 }}>
            <label>Conditions (all must match)</label>
            {draft.conditions.map((condition, index) => (
              <div key={index} style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 1fr auto', marginBottom: 8 }}>
                <input
                  value={condition.field}
                  onChange={(e) => updateCondition(index, 'field', e.target.value)}
                  placeholder="Field name"
                  required
                />
                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                >
                  {OPERATORS.map(op => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
                <input
                  value={condition.value}
                  onChange={(e) => updateCondition(index, 'value', e.target.value)}
                  placeholder="Value"
                  disabled={condition.operator === 'not_empty'}
                />
                <button
                  type="button"
                  className="ctag"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => removeCondition(index)}
                  disabled={draft.conditions.length === 1}
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className="ctag" onClick={addCondition}>+ Add Condition</button>
          </div>

          <Button type="submit">Create Rule</Button>
        </form>
      )}

      {rules.length === 0 ? (
        <div className="empty-note">
          No scoring rules yet. Create rules to automatically score leads.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {rules.map(rule => (
            <div key={rule.id} className="card" style={{ background: 'var(--surface-muted)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <strong style={{ fontSize: 14 }}>{rule.name}</strong>
                    <span style={{
                      fontSize: 13,
                      fontWeight: 700,
                      padding: '2px 10px',
                      borderRadius: 999,
                      background: rule.score_change > 0 ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
                      color: rule.score_change > 0 ? 'var(--success)' : 'var(--danger)'
                    }}>
                      {rule.score_change > 0 ? '+' : ''}{rule.score_change}
                    </span>
                    <span style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: rule.is_active ? 'rgba(22,163,74,0.1)' : 'rgba(100,116,139,0.1)',
                      color: rule.is_active ? 'var(--success)' : 'var(--text-muted)',
                      fontWeight: 600
                    }}>
                      {rule.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="ctag" onClick={() => handleToggle(rule.id, rule.is_active)}>
                    {rule.is_active ? 'Pause' : 'Activate'}
                  </button>
                  <button className="ctag" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(rule.id)}>
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
