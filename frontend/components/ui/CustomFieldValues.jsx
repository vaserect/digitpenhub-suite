'use client';

import { useState } from 'react';
import { apiFetch } from '../../lib/api';
import Button from './Button';
import Tooltip from './Tooltip';

const FIELD_TYPES = ['text', 'number', 'date', 'select', 'multiselect', 'checkbox', 'file', 'relation'];

export default function CustomFieldValues({ recordType, orgId, contactId, fieldDefs, values, onValuesChange, readOnly }) {
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  if (!fieldDefs || fieldDefs.length === 0) {
    return null;
  }

  async function handleSaveField(key) {
    const updates = { [key]: editValue };
    try {
      const data = await apiFetch(`/api/v1/crm/contacts/${contactId}`, {
        method: 'PATCH',
        body: JSON.stringify({ customFields: updates }),
      });
      if (data.contact) {
        onValuesChange({ ...values, ...data.contact.customFields });
      }
      setEditingField(null);
    } catch (err) {
      console.error('Failed to save custom field:', err);
    }
  }

  function renderField(def) {
    const currentValue = values?.[def.key] ?? '';
    const isEditing = editingField === def.key;

    if (isEditing) {
      return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="field-input"
            type={def.field_type === 'number' ? 'number' : 'text'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            autoFocus
            style={{ flex: 1, fontSize: 13, padding: '6px 8px' }}
          />
          <Button size="sm" onClick={() => handleSaveField(def.key)}>Save</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>Cancel</Button>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{def.label}</div>
          <div style={{ fontSize: 14, color: 'var(--text)' }}>
            {currentValue !== null && currentValue !== undefined && currentValue !== ''
              ? (Array.isArray(currentValue) ? currentValue.join(', ') : String(currentValue))
              : '—'}
          </div>
        </div>
        {!readOnly && (
          <Tooltip label="Edit field value">
            <button className="ctag" onClick={() => { setEditValue(currentValue); setEditingField(def.key); }} aria-label={`Edit ${def.label}`}>Edit</button>
          </Tooltip>
        )}
      </div>
    );
  }

  return (
    <div>
      <h4 style={{ marginBottom: 8 }}>Custom Fields</h4>
      {fieldDefs.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No custom fields configured for contacts.</p>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
          {fieldDefs.map((def) => (
            <div key={def.key}>
              {renderField(def)}
              {fieldDefs.indexOf(def) < fieldDefs.length - 1 && <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
