'use client';

import { useState } from 'react';
import Button from '../ui/Button';
import { Plus, X, ChevronDown, ChevronRight, Folder } from 'lucide-react';

export default function FieldGroupManager({ 
  groups = [], 
  onGroupsChange,
  fields = []
}) {
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;

    const newGroup = {
      id: `group_${Date.now()}`,
      name: newGroupName.trim(),
      description: '',
      collapsed: false,
      field_keys: [],
      created_at: new Date().toISOString(),
    };

    onGroupsChange([...groups, newGroup]);
    setNewGroupName('');
    setShowAddGroup(false);
  };

  const handleRemoveGroup = (groupId) => {
    onGroupsChange(groups.filter(g => g.id !== groupId));
  };

  const handleToggleGroup = (groupId) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleAddFieldToGroup = (groupId, fieldKey) => {
    onGroupsChange(groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          field_keys: [...(g.field_keys || []), fieldKey],
        };
      }
      return g;
    }));
  };

  const handleRemoveFieldFromGroup = (groupId, fieldKey) => {
    onGroupsChange(groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          field_keys: (g.field_keys || []).filter(k => k !== fieldKey),
        };
      }
      return g;
    }));
  };

  const getUngroupedFields = () => {
    const groupedKeys = new Set();
    groups.forEach(g => {
      (g.field_keys || []).forEach(k => groupedKeys.add(k));
    });
    return fields.filter(f => !groupedKeys.has(f.key));
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Folder size={16} />
          Field Groups
        </h4>
        {!showAddGroup && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowAddGroup(true)}
          >
            <Plus size={14} /> Add Group
          </Button>
        )}
      </div>

      {/* Existing Groups */}
      {groups.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {groups.map(group => (
            <div
              key={group.id}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 6,
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <div
                style={{
                  padding: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => handleToggleGroup(group.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {expandedGroups.has(group.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <strong>{group.name}</strong>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    ({(group.field_keys || []).length} fields)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveGroup(group.id);
                  }}
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

              {expandedGroups.has(group.id) && (
                <div style={{ padding: '0 12px 12px 12px' }}>
                  {(group.field_keys || []).length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {group.field_keys.map(fieldKey => {
                        const field = fields.find(f => f.key === fieldKey);
                        return (
                          <div
                            key={fieldKey}
                            style={{
                              padding: '4px 8px',
                              background: 'var(--bg)',
                              border: '1px solid var(--border)',
                              borderRadius: 4,
                              fontSize: '0.875rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            {field?.label || fieldKey}
                            <button
                              type="button"
                              onClick={() => handleRemoveFieldFromGroup(group.id, fieldKey)}
                              style={{
                                border: 0,
                                background: 'transparent',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'flex',
                              }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No fields in this group
                    </div>
                  )}

                  {/* Add field to group */}
                  <select
                    className="field-input"
                    style={{ marginTop: 8, fontSize: '0.875rem' }}
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddFieldToGroup(group.id, e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">Add field to group...</option>
                    {getUngroupedFields().map(field => (
                      <option key={field.key} value={field.key}>
                        {field.label || field.key}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Group Form */}
      {showAddGroup && (
        <div style={{ 
          padding: 16, 
          border: '1px solid var(--border)', 
          borderRadius: 6,
          backgroundColor: 'var(--bg-secondary)',
        }}>
          <div className="field">
            <label className="field-label">Group Name</label>
            <input
              className="field-input"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g., Contact Information, Address Details..."
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowAddGroup(false);
                setNewGroupName('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddGroup}
              disabled={!newGroupName.trim()}
            >
              Add Group
            </Button>
          </div>
        </div>
      )}

      {groups.length === 0 && !showAddGroup && (
        <div style={{ 
          padding: 16, 
          textAlign: 'center', 
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
          border: '1px dashed var(--border)',
          borderRadius: 6,
        }}>
          No groups configured. Click "Add Group" to organize fields into sections.
        </div>
      )}
    </div>
  );
}
