'use client';
import { useState } from 'react';
import Button from '../ui/Button';

const POPUP_TYPES = [
  { value: 'modal', label: 'Modal (Center)', icon: '⬜' },
  { value: 'slide-in', label: 'Slide-in (Corner)', icon: '↗️' },
  { value: 'bar', label: 'Bar (Top/Bottom)', icon: '▬' },
  { value: 'fullscreen', label: 'Fullscreen', icon: '⬛' }
];

const TRIGGER_TYPES = [
  { value: 'time', label: 'Time Delay', config: { delay: 3000 } },
  { value: 'scroll', label: 'Scroll %', config: { scrollPercent: 50 } },
  { value: 'exit-intent', label: 'Exit Intent', config: {} },
  { value: 'click', label: 'Click Element', config: { selector: '' } },
  { value: 'manual', label: 'Manual Trigger', config: {} }
];

export default function PopupBuilder({ popup, forms, onSave, onCancel }) {
  const [draft, setDraft] = useState(popup || {
    name: '',
    formId: '',
    popupType: 'modal',
    triggerType: 'time',
    triggerValue: { delay: 3000 },
    targetingRules: { urlPatterns: [], devices: ['desktop', 'mobile', 'tablet'] },
    designConfig: {
      position: 'center',
      backgroundColor: '#ffffff',
      overlayColor: 'rgba(0,0,0,0.5)',
      borderRadius: 8,
      padding: 24,
      maxWidth: 600,
      animation: 'fade'
    },
    isActive: true
  });

  const [error, setError] = useState('');

  const handleTriggerChange = (type) => {
    const trigger = TRIGGER_TYPES.find(t => t.value === type);
    setDraft({ ...draft, triggerType: type, triggerValue: trigger.config });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!draft.name.trim()) {
      setError('Popup name is required');
      return;
    }
    if (!draft.formId) {
      setError('Please select a form');
      return;
    }

    try {
      await onSave(draft);
    } catch (err) {
      setError(err.message || 'Failed to save popup');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.25rem' }}>
        {popup ? 'Edit Popup Campaign' : 'Create Popup Campaign'}
      </h2>

      {error && (
        <div style={{ padding: '10px 12px', background: 'rgba(220,38,38,0.1)', color: 'var(--danger)', borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr', marginBottom: 20 }}>
        <div className="field">
          <label>Campaign Name *</label>
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g., Homepage Exit Intent"
            required
          />
        </div>
        <div className="field">
          <label>Form to Display *</label>
          <select
            value={draft.formId}
            onChange={(e) => setDraft({ ...draft, formId: e.target.value })}
            required
          >
            <option value="">Select a form...</option>
            {forms.map(form => (
              <option key={form.id} value={form.id}>{form.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field" style={{ marginBottom: 20 }}>
        <label>Popup Type</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {POPUP_TYPES.map(type => (
            <button
              key={type.value}
              type="button"
              onClick={() => setDraft({ ...draft, popupType: type.value })}
              style={{
                padding: '12px',
                border: `2px solid ${draft.popupType === type.value ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 8,
                background: draft.popupType === type.value ? 'rgba(37,99,235,0.05)' : 'var(--surface)',
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

      <div className="field" style={{ marginBottom: 20 }}>
        <label>Trigger</label>
        <select
          value={draft.triggerType}
          onChange={(e) => handleTriggerChange(e.target.value)}
          style={{ marginBottom: 10 }}
        >
          {TRIGGER_TYPES.map(trigger => (
            <option key={trigger.value} value={trigger.value}>{trigger.label}</option>
          ))}
        </select>

        {draft.triggerType === 'time' && (
          <div className="field" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 12 }}>Delay (milliseconds)</label>
            <input
              type="number"
              value={draft.triggerValue.delay || 3000}
              onChange={(e) => setDraft({ ...draft, triggerValue: { delay: parseInt(e.target.value) } })}
              min="0"
              step="1000"
            />
          </div>
        )}

        {draft.triggerType === 'scroll' && (
          <div className="field" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 12 }}>Scroll Percentage</label>
            <input
              type="number"
              value={draft.triggerValue.scrollPercent || 50}
              onChange={(e) => setDraft({ ...draft, triggerValue: { scrollPercent: parseInt(e.target.value) } })}
              min="0"
              max="100"
            />
          </div>
        )}

        {draft.triggerType === 'click' && (
          <div className="field" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 12 }}>CSS Selector</label>
            <input
              value={draft.triggerValue.selector || ''}
              onChange={(e) => setDraft({ ...draft, triggerValue: { selector: e.target.value } })}
              placeholder=".cta-button, #signup"
            />
          </div>
        )}
      </div>

      <div className="field" style={{ marginBottom: 20 }}>
        <label>Targeting Rules</label>
        <div style={{ background: 'var(--surface-muted)', padding: 12, borderRadius: 8 }}>
          <div className="field" style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12 }}>URL Patterns (one per line)</label>
            <textarea
              value={(draft.targetingRules.urlPatterns || []).join('\n')}
              onChange={(e) => setDraft({
                ...draft,
                targetingRules: {
                  ...draft.targetingRules,
                  urlPatterns: e.target.value.split('\n').filter(Boolean)
                }
              })}
              rows={3}
              placeholder="https://example.com/*"
              style={{ fontFamily: 'monospace', fontSize: 12 }}
            />
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 12 }}>Devices</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['desktop', 'mobile', 'tablet'].map(device => (
                <label key={device} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={(draft.targetingRules.devices || []).includes(device)}
                    onChange={(e) => {
                      const devices = draft.targetingRules.devices || [];
                      setDraft({
                        ...draft,
                        targetingRules: {
                          ...draft.targetingRules,
                          devices: e.target.checked
                            ? [...devices, device]
                            : devices.filter(d => d !== device)
                        }
                      });
                    }}
                  />
                  {device.charAt(0).toUpperCase() + device.slice(1)}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={draft.isActive}
          onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
        />
        <span style={{ fontSize: 14 }}>Active (show to visitors)</span>
      </label>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" className="back-link" onClick={onCancel} style={{ margin: 0 }}>
          Cancel
        </button>
        <Button type="submit">
          {popup ? 'Save Changes' : 'Create Popup'}
        </Button>
      </div>
    </form>
  );
}
