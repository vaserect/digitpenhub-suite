'use client';

import { useState } from 'react';
import Button from '../ui/Button';
import { X, Plus, GitBranch } from 'lucide-react';

const CONDITION_TYPES = {
  equals: 'Equals',
  not_equals: 'Not Equals',
  contains: 'Contains',
  not_contains: 'Does Not Contain',
  greater_than: 'Greater Than',
  less_than: 'Less Than',
  is_empty: 'Is Empty',
  is_not_empty: 'Is Not Empty',
  in_list: 'In List',
  not_in_list: 'Not In List',
};

const DEPENDENCY_ACTIONS = {
  show: 'Show Field',
  hide: 'Hide Field',
  require: 'Make Required',
  optional: 'Make Optional',
  enable: 'Enable Field',
  disable: 'Disable Field',
};

export default function FieldDependencyBuilder({ 
  dependencies = [], 
  onDependenciesChange,
  availableFields = [],
  currentFieldKey
}) {
  const [showAddDependency, setShowAddDependency] = useState(false);
  const [newDependency, setNewDependency] = useState({
    source_field: '',
    condition_type: 'equals',
    condition_value: '',
    action: 'show',
  });

  // Filter out current field from available fields
  const selectableFields = availableFields.filter(f => f.key !== currentFieldKey);

  const handleAddDependency = () => {
    if (!newDependency.source_field || !newDependency.action) return;

    const dependency = {
      id: `dep_${Date.now()}`,
      source_field: newDependency.source_field,
      condition_type: newDependency.condition_type,
      condition_value: newDependency.condition_value,
      action: newDependency.action,
      created_at: new Date().toISOString(),
    };

    onDependenciesChange([...dependencies, dependency]);
    
    // Reset form
    setNewDependency({
      source_field: '',
      condition_type: 'equals',
      condition_value: '',
      action: 'show',
    });
    setShowAddDependency(false);
  };

  const handleRemoveDependency = (depId) => {
    onDependenciesChange(dependencies.filter(d => d.id !== depId));
  };

  const getFieldLabel = (fieldKey) => {
    const field = availableFields.find(f => f.key === fieldKey);
    return field?.label || fieldKey;
  };

  const getDependencyDescription = (dep) => {
    const fieldLabel = getFieldLabel(dep.source_field);
    const conditionLabel = CONDITION_TYPES[dep.condition_type];
    const actionLabel = DEPENDENCY_ACTIONS[dep.action];
    
    let description = `${actionLabel} when "${fieldLabel}" ${conditionLabel.toLowerCase()}`;
    
    if (!['is_empty', 'is_not_empty'].includes(dep.condition_type)) {
      description += ` "${dep.condition_value}"`;
    }
    
    return description;
  };

  const needsValue = (conditionType) => {
    return !['is_empty', 'is_not_empty'].includes(conditionType);
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <GitBranch size={16} />
          Field Dependencies
        </h4>
        {!showAddDependency && selectableFields.length > 0 && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowAddDependency(true)}
          >
            <Plus size={14} /> Add Dependency
          </Button>
        )}
      </div>

      {/* Existing Dependencies */}
      {dependencies.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {dependencies.map(dep => (
            <div
              key={dep.id}
              style={{
                padding: 12,
                border: '1px solid var(--border)',
                borderRadius: 6,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <div style={{ fontSize: '0.875rem' }}>
                {getDependencyDescription(dep)}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveDependency(dep.id)}
                style={{
                  border: 0,
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: 4,
                }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Dependency Form */}
      {showAddDependency && (
        <div style={{ 
          padding: 16, 
          border: '1px solid var(--border)', 
          borderRadius: 6,
          backgroundColor: 'var(--bg-secondary)',
        }}>
          <div className="field">
            <label className="field-label">Source Field</label>
            <select
              className="field-input"
              value={newDependency.source_field}
              onChange={(e) => setNewDependency({ ...newDependency, source_field: e.target.value })}
            >
              <option value="">Select a field...</option>
              {selectableFields.map(field => (
                <option key={field.key} value={field.key}>
                  {field.label || field.key}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ marginTop: 12 }}>
            <label className="field-label">Condition</label>
            <select
              className="field-input"
              value={newDependency.condition_type}
              onChange={(e) => setNewDependency({ ...newDependency, condition_type: e.target.value })}
            >
              {Object.entries(CONDITION_TYPES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {needsValue(newDependency.condition_type) && (
            <div className="field" style={{ marginTop: 12 }}>
              <label className="field-label">Value</label>
              <input
                className="field-input"
                value={newDependency.condition_value}
                onChange={(e) => setNewDependency({ ...newDependency, condition_value: e.target.value })}
                placeholder="Enter comparison value..."
              />
            </div>
          )}

          <div className="field" style={{ marginTop: 12 }}>
            <label className="field-label">Action</label>
            <select
              className="field-input"
              value={newDependency.action}
              onChange={(e) => setNewDependency({ ...newDependency, action: e.target.value })}
            >
              {Object.entries(DEPENDENCY_ACTIONS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowAddDependency(false);
                setNewDependency({
                  source_field: '',
                  condition_type: 'equals',
                  condition_value: '',
                  action: 'show',
                });
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddDependency}
              disabled={!newDependency.source_field || !newDependency.action}
            >
              Add Dependency
            </Button>
          </div>
        </div>
      )}

      {dependencies.length === 0 && !showAddDependency && (
        <div style={{ 
          padding: 16, 
          textAlign: 'center', 
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
          border: '1px dashed var(--border)',
          borderRadius: 6,
        }}>
          {selectableFields.length === 0 
            ? 'No other fields available for dependencies. Create more fields first.'
            : 'No dependencies configured. Click "Add Dependency" to get started.'}
        </div>
      )}
    </div>
  );
}
