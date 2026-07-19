'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';
import Button from '../../ui/Button';
import EmptyState from '../../ui/EmptyState';
import ConfirmDialog from '../../ui/ConfirmDialog';

const RULE_TYPES = [
  { value: 'show_field', label: 'Show Field', icon: '👁️' },
  { value: 'hide_field', label: 'Hide Field', icon: '🙈' },
  { value: 'skip_to', label: 'Skip To Page', icon: '⏭️' },
  { value: 'redirect', label: 'Redirect', icon: '🔀' }
];

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' }
];

export default function ConditionalLogicBuilder({ formId, formName, fields, showToast }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [draft, setDraft] = useState({
    ruleType: 'show_field',
    conditions: [],
    actions: [],
    priority: 0
  });

  useEffect(() => {
    loadRules();
  }, [formId]);

  async function loadRules() {
    try {
      const res = await apiFetch(`/api/v1/leads/forms/${formId}/logic`);
      setRules(res.rules || []);
    } catch (err) {
      showToast('Failed to load conditional logic rules');
    } finally {
      setLoading(false);
    }
  }

  function startNew() {
    setEditingId(null);
    setDraft({
      ruleType: 'show_field',
      conditions: [],
      actions: [],
      priority: 0
    });
    setShowBuilder(true);
  }

  async function startEdit(rule) {
    setEditingId(rule.id);
    setDraft({
      ruleType: rule.rule_type,
      conditions: rule.conditions || [],
      actions: rule.actions || [],
      priority: rule.priority
    });
    setShowBuilder(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (draft.conditions.length === 0) {
      showToast('Add at least one condition');
      return;
    }
    if (draft.actions.length === 0) {
      showToast('Add at least one action');
      return;
    }

    try {
      if (editingId) {
        await apiFetch(`/api/v1/leads/logic/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(draft)
        });
        showToast('Logic rule updated');
      } else {
        await apiFetch(`/api/v1/leads/forms/${formId}/logic`, {
          method: 'POST',
          body: JSON.stringify(draft)
        });
        showToast('Logic rule created');
      }
      setShowBuilder(false);
      await loadRules();
    } catch (err) {
      showToast(err.message || 'Failed to save logic rule');
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/v1/leads/logic/${confirmDelete}`, { method: 'DELETE' });
      showToast('Logic rule deleted');
      await loadRules();
    } catch (err) {
      showToast('Failed to delete logic rule');
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

  function addAction() {
    const defaultAction = draft.ruleType === 'show_field' || draft.ruleType === 'hide_field'
      ? { action: draft.ruleType, target: '' }
      : draft.ruleType === 'skip_to'
      ? { action: 'skip_to', target: '' }
      : { action: 'redirect', target: '' };
    
    setDraft(prev => ({
      ...prev,
      actions: [...prev.actions, defaultAction]
    }));
  }

  function updateAction(index, key, value) {
    setDraft(prev => ({
      ...prev,
      actions: prev.actions.map((a, i) => i === index ? { ...a, [key]: value } : a)
    }));
  }

  function removeAction(index) {
    setDraft(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  }

  if (loading) {
    return <div className="empty-note">Loading conditional logic...</div>;
  }

  if (showBuilder) {
    return (
      <div className="panel">
        <button className="back-link" onClick={() => setShowBuilder(false)}>← Back to logic rules</button>
        <h2 style={{ marginBottom: 20 }}>{editingId ? 'Edit Logic Rule' : 'New Logic Rule'}</h2>

        <form onSubmit={handleSave}>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Rule Type</h3>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
              {RULE_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setDraft({ ...draft, ruleType: type.value, actions: [] })}
                  style={{
                    padding: '12px',
                    border: `2px solid ${draft.ruleType === type.value ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 8,
                    background: draft.ruleType === type.value ? 'rgba(37,99,235,0.05)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontSize: 13
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{type.icon}</div>
                  <div style={{ fontWeight: 600 }}>{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 15, margin: 0 }}>Conditions (When)</h3>
              <button type="button" className="ctag" onClick={addCondition}>
                + Add Condition
              </button>
            </div>
            <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 12 }}>
              All conditions must be met for this rule to trigger
            </small>

            {draft.conditions.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Add conditions to define when this rule should apply
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
                        <label style={{ fontSize: 11 }}>Field</label>
                        <select
                          value={condition.field}
                          onChange={e => updateCondition(idx, 'field', e.target.value)}
                          style={{ fontSize: 12, padding: '6px 8px' }}
                        >
                          <option value="">Select field...</option>
                          {fields.map(f => (
                            <option key={f.id} value={f.id}>{f.label}</option>
                          ))}
                        </select>
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
                          placeholder={['is_empty', 'is_not_empty'].includes(condition.operator) ? 'N/A' : 'Value'}
                          disabled={['is_empty', 'is_not_empty'].includes(condition.operator)}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 15, margin: 0 }}>Actions (Then)</h3>
              <button type="button" className="ctag" onClick={addAction}>
                + Add Action
              </button>
            </div>
            <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 12 }}>
              Define what happens when conditions are met
            </small>

            {draft.actions.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Add actions to define what should happen
              </p>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {draft.actions.map((action, idx) => (
                  <div
                    key={idx}
                    className="card"
                    style={{ background: 'var(--surface-muted)', padding: 12 }}
                  >
                    <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr auto', alignItems: 'end' }}>
                      <div className="field" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: 11 }}>
                          {draft.ruleType === 'show_field' || draft.ruleType === 'hide_field' ? 'Target Field' :
                           draft.ruleType === 'skip_to' ? 'Skip to Page Number' :
                           'Redirect URL'}
                        </label>
                        {(draft.ruleType === 'show_field' || draft.ruleType === 'hide_field') ? (
                          <select
                            value={action.target}
                            onChange={e => updateAction(idx, 'target', e.target.value)}
                            style={{ fontSize: 12, padding: '6px 8px' }}
                          >
                            <option value="">Select field...</option>
                            {fields.map(f => (
                              <option key={f.id} value={f.id}>{f.label}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            value={action.target}
                            onChange={e => updateAction(idx, 'target', e.target.value)}
                            placeholder={draft.ruleType === 'skip_to' ? 'Page number (e.g., 2)' : 'https://example.com/thank-you'}
                            style={{ fontSize: 12, padding: '6px 8px' }}
                          />
                        )}
                      </div>
                      <button
                        type="button"
                        className="ctag"
                        onClick={() => removeAction(idx)}
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
            <div className="field">
              <label>Priority</label>
              <input
                type="number"
                value={draft.priority}
                onChange={e => setDraft({ ...draft, priority: parseInt(e.target.value) })}
                min="0"
              />
              <small style={{ color: 'var(--text-muted)' }}>
                Higher priority rules are evaluated first (0 = lowest)
              </small>
            </div>
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
          <h2 style={{ margin: 0, fontSize: 18 }}>Conditional Logic: {formName}</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Show/hide fields, skip pages, or redirect based on user responses
          </p>
        </div>
        <Button onClick={startNew}>Create Rule</Button>
      </div>

      {rules.length === 0 ? (
        <EmptyState
          icon="🔀"
          title="No conditional logic rules yet"
          description="Create dynamic forms that adapt based on user responses. Show relevant fields, skip unnecessary pages, or redirect to custom thank-you pages."
          action={<Button onClick={startNew}>Create Your First Rule</Button>}
        />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {rules.map(rule => (
            <div key={rule.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{
                      fontSize: 20
                    }}>
                      {RULE_TYPES.find(t => t.value === rule.rule_type)?.icon || '🔀'}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 14, textTransform: 'capitalize' }}>
                      {rule.rule_type.replace(/_/g, ' ')}
                    </span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: 'var(--surface-muted)',
                      color: 'var(--text-muted)'
                    }}>
                      Priority: {rule.priority}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    <strong>{(rule.conditions || []).length}</strong> condition{(rule.conditions || []).length !== 1 ? 's' : ''}
                    {' → '}
                    <strong>{(rule.actions || []).length}</strong> action{(rule.actions || []).length !== 1 ? 's' : ''}
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
        <h4 style={{ fontSize: 14, marginBottom: 8 }}>💡 Conditional Logic Examples</h4>
        <ul style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, paddingLeft: 20 }}>
          <li>Show "Company Size" field only if user selects "Business" as customer type</li>
          <li>Skip to final page if user answers "No" to "Are you interested in a demo?"</li>
          <li>Redirect to pricing page if user selects "Enterprise" plan</li>
          <li>Hide payment fields if user chooses "Free Trial"</li>
        </ul>
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete this logic rule?"
        description="This action cannot be undone. The form will no longer use this conditional logic."
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
}
