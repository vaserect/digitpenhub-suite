'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import Button from './Button';
import ConfirmDialog from './ConfirmDialog';
import Tooltip from './Tooltip';

const STAGES = ['new', 'contacted', 'proposal_sent', 'won', 'lost'];

export default function KanbanBoard({ contacts, onRefresh, showToast }) {
  const [localContacts, setLocalContacts] = useState([]);
  const [stages, setStages] = useState(STAGES);
  const [editingStage, setEditingStage] = useState(null);
  const [newStageName, setNewStageName] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);
  const dragRef = useRef(null);

  useEffect(() => {
    setLocalContacts(contacts);
  }, [contacts]);

  // Group contacts by stage
  const columns = stages.map(stage => ({
    stage,
    label: stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    contacts: localContacts.filter(c => c.stage === stage),
  }));

  const handleDragStart = (e, contactId, sourceStage) => {
    setDraggedItem({ contactId, sourceStage });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', contactId);
  };

  const handleDragOver = (e, targetStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    if (!draggedItem) return;
    const { contactId, sourceStage } = draggedItem;
    if (sourceStage === targetStage) {
      setDraggedItem(null);
      return;
    }
    try {
      await apiFetch(`/api/v1/crm/contacts/${contactId}`, {
        method: 'PATCH',
        body: JSON.stringify({ stage: targetStage }),
      });
      showToast(`Moved contact to ${targetStage.replace(/_/g, ' ')}`);
      onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to move contact');
    }
    setDraggedItem(null);
  };

  const handleAddStage = () => {
    if (!newStageName.trim()) return;
    const slug = newStageName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    if (stages.includes(slug)) {
      showToast('Stage already exists');
      return;
    }
    setStages(prev => [...prev, slug]);
    setNewStageName('');
  };

  const handleRemoveStage = (slug) => {
    if (stages.length <= 2) return;
    setStages(prev => prev.filter(s => s !== slug));
  };

  const countByStage = (stage) => {
    return localContacts.filter(c => c.stage === stage).length;
  };

  const totalValueByStage = (stage) => {
    return localContacts
      .filter(c => c.stage === stage)
      .reduce((sum, c) => sum + (Number(c.value_ngn) || 0), 0);
  };

  return (
    <div>
      {/* Stage Management */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="field-input"
            placeholder="New stage name…"
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddStage()}
          />
          <Button size="sm" onClick={handleAddStage}>Add Stage</Button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          Drag contacts between stages to update. Add/remove stages to customize your pipeline.
       AssemblyVersion
      </div>
      </div>

      {/* Kanban Columns */}
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16, minHeight: '60vh' }}>
        {columns.map(({ stage, label, contacts: columnContacts }) => (
          <div
            key={stage}
            onDragOver={(e) => handleDragOver(e, stage)}
            onDrop={(e) => handleDrop(e, stage)}
            style={{
              flex: '1 1 220px',
              minWidth: 220,
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                {label}
                <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>
                  ({countByStage(stage)})
                </span>
              </h3>
              <div style={{ display: 'flex', gap: 4 }}>
                {stages.length > 2 && (
                  <Tooltip label="Remove this stage">
                    <button className="ctag danger" onClick={() => handleRemoveStage(stage)} aria-label="Remove stage">×</button>
                  </Tooltip>
                )}
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
              Total: ₦{totalValueByStage(stage).toLocaleString()}
            </div>
            {columnContacts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
                No contacts here
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {columnContacts.map(contact => (
                  <div
                    key={contact.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, contact.id, stage)}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: 12,
                      cursor: 'grab',
                      opacity: draggedItem?.contactId === contact.id ? 0.5 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{contact.full_name}</div>
                    {contact.company && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{contact.company}</div>}
                    {contact.email && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{contact.email}</div>}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      ₦{Number(contact.value_ngn).toLocaleString()} · {new Date(contact.last_touch_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions Bar */}
      <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'center', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <Button variant="secondary" size="sm" onClick={() => setStages([...STAGES])}>Reset to Default Stages</Button>
        <Button variant="secondary" size="sm" onClick={() => setStages(prev => [...prev, `stage_${prev.length + 1}`])}>Add Another Stage</Button>
      </div>
    </div>
  );
}
