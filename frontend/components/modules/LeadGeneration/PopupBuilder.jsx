'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';
import Button from '../../ui/Button';
import EmptyState from '../../ui/EmptyState';
import ConfirmDialog from '../../ui/ConfirmDialog';

const POPUP_TYPES = [
  { value: 'modal', label: 'Modal (Center)', icon: '⬜' },
  { value: 'slide-in', label: 'Slide-in (Corner)', icon: '↗️' },
  { value: 'bar', label: 'Bar (Top/Bottom)', icon: '▬' },
  { value: 'fullscreen', label: 'Fullscreen', icon: '⬛' }
];

const TRIGGER_TYPES = [
  { value: 'time', label: 'Time Delay', icon: '⏱️' },
  { value: 'scroll', label: 'Scroll Percentage', icon: '📜' },
  { value: 'exit-intent', label: 'Exit Intent', icon: '🚪' },
  { value: 'click', label: 'Click Element', icon: '👆' },
  { value: 'manual', label: 'Manual (API)', icon: '🔧' }
];

export default function PopupBuilder({ forms, onClose, showToast }) {
  const [popups, setPopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [draft, setDraft] = useState({
    name: '',
    formId: '',
    popupType: 'modal',
    triggerType: 'time',
    triggerValue: { delay: 3000 },
    targetingRules: { urlPatterns: [], devices: ['desktop', 'mobile', 'tablet'] },
    designConfig: {
      position: 'center',
      animation: 'fade',
      overlay: true,
      overlayColor: 'rgba(0,0,0,0.5)',
      backgroundColor: '#ffffff',
      borderRadius: 12,
      padding: 24,
      maxWidth: 600
    },
    isActive: true
  });

  useEffect(() => {
    loadPopups();
  }, []);

  async function loadPopups() {
    try {
      const res = await apiFetch('/api/v1/leads/popups');
      setPopups(res.popups || []);
    } catch (err) {
      showToast('Failed to load popups');
    } finally {
      setLoading(false);
    }
  }

  function startNew() {
    setEditingId(null);
    setDraft({
      name: '',
      formId: '',
      popupType: 'modal',
      triggerType: 'time',
      triggerValue: { delay: 3000 },
      targetingRules: { urlPatterns: [], devices: ['desktop', 'mobile', 'tablet'] },
      designConfig: {
        position: 'center',
        animation: 'fade',
        overlay: true,
        overlayColor: 'rgba(0,0,0,0.5)',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 24,
        maxWidth: 600
      },
      isActive: true
    });
    setShowBuilder(true);
  }

  async function startEdit(popup) {
    setEditingId(popup.id);
    setDraft({
      name: popup.name,
      formId: popup.form_id,
      popupType: popup.popup_type,
      triggerType: popup.trigger_type,
      triggerValue: popup.trigger_value || {},
      targetingRules: popup.targeting_rules || { urlPatterns: [], devices: ['desktop', 'mobile', 'tablet'] },
      designConfig: popup.design_config || {},
      isActive: popup.is_active
    });
    setShowBuilder(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!draft.name.trim()) {
      showToast('Popup name is required');
      return;
    }
    if (!draft.formId) {
      showToast('Please select a form');
      return;
    }

    try {
      if (editingId) {
        await apiFetch(`/api/v1/leads/popups/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(draft)
        });
        showToast('Popup updated');
      } else {
        await apiFetch('/api/v1/leads/popups', {
          method: 'POST',
          body: JSON.stringify(draft)
        });
        showToast('Popup created');
      }
      setShowBuilder(false);
      await loadPopups();
    } catch (err) {
      showToast(err.message || 'Failed to save popup');
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/v1/leads/popups/${confirmDelete}`, { method: 'DELETE' });
      showToast('Popup deleted');
      await loadPopups();
    } catch (err) {
      showToast('Failed to delete popup');
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  }

  function updateTriggerValue(key, value) {
    setDraft(prev => ({
      ...prev,
      triggerValue: { ...prev.triggerValue, [key]: value }
    }));
  }

  function updateDesignConfig(key, value) {
    setDraft(prev => ({
      ...prev,
      designConfig: { ...prev.designConfig, [key]: value }
    }));
  }

  function addUrlPattern() {
    setDraft(prev => ({
      ...prev,
      targetingRules: {
        ...prev.targetingRules,
        urlPatterns: [...(prev.targetingRules.urlPatterns || []), '']
      }
    }));
  }

  function updateUrlPattern(index, value) {
    setDraft(prev => ({
      ...prev,
      targetingRules: {
        ...prev.targetingRules,
        urlPatterns: prev.targetingRules.urlPatterns.map((p, i) => i === index ? value : p)
      }
    }));
  }

  function removeUrlPattern(index) {
    setDraft(prev => ({
      ...prev,
      targetingRules: {
        ...prev.targetingRules,
        urlPatterns: prev.targetingRules.urlPatterns.filter((_, i) => i !== index)
      }
    }));
  }

  function toggleDevice(device) {
    setDraft(prev => {
      const devices = prev.targetingRules.devices || [];
      const newDevices = devices.includes(device)
        ? devices.filter(d => d !== device)
        : [...devices, device];
      return {
        ...prev,
        targetingRules: { ...prev.targetingRules, devices: newDevices }
      };
    });
  }

  if (loading) {
    return <div className="empty-note">Loading popups...</div>;
  }

  if (showBuilder) {
    return (
      <div className="panel">
        <button className="back-link" onClick={() => setShowBuilder(false)}>← Back to popups</button>
        <h2 style={{ marginBottom: 20 }}>{editingId ? 'Edit Popup' : 'New Popup'}</h2>

        <form onSubmit={handleSave}>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Basic Settings</h3>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
              <div className="field">
                <label>Popup Name</label>
                <input
                  value={draft.name}
                  onChange={e => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g., Exit Intent Offer"
                  required
                />
              </div>
              <div className="field">
                <label>Form to Display</label>
                <select
                  value={draft.formId}
                  onChange={e => setDraft({ ...draft, formId: e.target.value })}
                  required
                >
                  <option value="">Select a form...</option>
                  {forms.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Popup Type</h3>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
              {POPUP_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setDraft({ ...draft, popupType: type.value })}
                  style={{
                    padding: '12px',
                    border: `2px solid ${draft.popupType === type.value ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 8,
                    background: draft.popupType === type.value ? 'rgba(37,99,235,0.05)' : 'transparent',
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
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Trigger</h3>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', marginBottom: 12 }}>
              {TRIGGER_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setDraft({ ...draft, triggerType: type.value })}
                  style={{
                    padding: '10px',
                    border: `2px solid ${draft.triggerType === type.value ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 8,
                    background: draft.triggerType === type.value ? 'rgba(37,99,235,0.05)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontSize: 12
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 2 }}>{type.icon}</div>
                  <div style={{ fontWeight: 600 }}>{type.label}</div>
                </button>
              ))}
            </div>

            {draft.triggerType === 'time' && (
              <div className="field">
                <label>Delay (milliseconds)</label>
                <input
                  type="number"
                  value={draft.triggerValue.delay || 3000}
                  onChange={e => updateTriggerValue('delay', parseInt(e.target.value))}
                  min="0"
                  step="1000"
                />
                <small style={{ color: 'var(--text-muted)' }}>
                  {((draft.triggerValue.delay || 3000) / 1000).toFixed(1)} seconds after page load
                </small>
              </div>
            )}

            {draft.triggerType === 'scroll' && (
              <div className="field">
                <label>Scroll Percentage</label>
                <input
                  type="number"
                  value={draft.triggerValue.scrollPercent || 50}
                  onChange={e => updateTriggerValue('scrollPercent', parseInt(e.target.value))}
                  min="0"
                  max="100"
                />
                <small style={{ color: 'var(--text-muted)' }}>
                  Show when user scrolls {draft.triggerValue.scrollPercent || 50}% down the page
                </small>
              </div>
            )}

            {draft.triggerType === 'click' && (
              <div className="field">
                <label>CSS Selector</label>
                <input
                  value={draft.triggerValue.selector || ''}
                  onChange={e => updateTriggerValue('selector', e.target.value)}
                  placeholder="e.g., .cta-button, #signup"
                />
                <small style={{ color: 'var(--text-muted)' }}>
                  Show when user clicks this element
                </small>
              </div>
            )}
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Targeting Rules</h3>
            
            <div className="field" style={{ marginBottom: 12 }}>
              <label>URL Patterns (optional)</label>
              <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
                Show popup only on specific pages. Use * as wildcard. Leave empty to show on all pages.
              </small>
              {(draft.targetingRules.urlPatterns || []).map((pattern, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <input
                    value={pattern}
                    onChange={e => updateUrlPattern(idx, e.target.value)}
                    placeholder="/blog/*, /products/*"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="ctag"
                    onClick={() => removeUrlPattern(idx)}
                    style={{ color: 'var(--danger)' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" className="ctag" onClick={addUrlPattern}>
                + Add URL Pattern
              </button>
            </div>

            <div className="field">
              <label>Target Devices</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['desktop', 'mobile', 'tablet'].map(device => (
                  <label key={device} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={(draft.targetingRules.devices || []).includes(device)}
                      onChange={() => toggleDevice(device)}
                    />
                    <span style={{ textTransform: 'capitalize' }}>{device}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Design</h3>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
              <div className="field">
                <label>Background Color</label>
                <input
                  type="color"
                  value={draft.designConfig.backgroundColor || '#ffffff'}
                  onChange={e => updateDesignConfig('backgroundColor', e.target.value)}
                />
              </div>
              <div className="field">
                <label>Border Radius (px)</label>
                <input
                  type="number"
                  value={draft.designConfig.borderRadius || 12}
                  onChange={e => updateDesignConfig('borderRadius', parseInt(e.target.value))}
                  min="0"
                />
              </div>
              <div className="field">
                <label>Max Width (px)</label>
                <input
                  type="number"
                  value={draft.designConfig.maxWidth || 600}
                  onChange={e => updateDesignConfig('maxWidth', parseInt(e.target.value))}
                  min="200"
                />
              </div>
              <div className="field">
                <label>Padding (px)</label>
                <input
                  type="number"
                  value={draft.designConfig.padding || 24}
                  onChange={e => updateDesignConfig('padding', parseInt(e.target.value))}
                  min="0"
                />
              </div>
            </div>
            <div className="field">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={draft.designConfig.overlay !== false}
                  onChange={e => updateDesignConfig('overlay', e.target.checked)}
                />
                Show overlay background
              </label>
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
              Inactive popups won't be shown to visitors
            </small>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="submit">{editingId ? 'Save Changes' : 'Create Popup'}</Button>
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
          <h2 style={{ margin: 0, fontSize: 18 }}>Popup Campaigns</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Capture leads with targeted popups, slide-ins, and bars
          </p>
        </div>
        <Button onClick={startNew}>Create Popup</Button>
      </div>

      {popups.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="No popup campaigns yet"
          description="Create your first popup to capture more leads with exit-intent, scroll triggers, and more."
          action={<Button onClick={startNew}>Create Your First Popup</Button>}
        />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {popups.map(popup => (
            <div key={popup.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{popup.name}</span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: popup.is_active ? 'rgba(22,163,74,0.1)' : 'rgba(148,163,184,0.1)',
                      color: popup.is_active ? 'var(--success)' : 'var(--text-muted)'
                    }}>
                      {popup.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    <span style={{ textTransform: 'capitalize' }}>{popup.popup_type.replace('-', ' ')}</span>
                    {' · '}
                    <span style={{ textTransform: 'capitalize' }}>{popup.trigger_type.replace('-', ' ')}</span>
                    {' · '}
                    Form: <strong>{popup.form_name || 'Unknown'}</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="ctag" onClick={() => startEdit(popup)}>Edit</button>
                  <button
                    className="ctag"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => setConfirmDelete(popup.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete this popup campaign?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
}
