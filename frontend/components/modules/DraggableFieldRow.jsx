'use client';

import { useState } from 'react';
import Button from '../ui/Button';
import { GripVertical } from 'lucide-react';

export default function DraggableFieldRow({ 
  field, 
  index,
  onEdit, 
  onClone, 
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
  dragOverIndex
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget);
    onDragStart(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
    onDragOver(index);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    onDrop(index);
  };

  const rowStyle = {
    opacity: isDragging ? 0.5 : 1,
    cursor: 'move',
    borderTop: dragOver && dragOverIndex === index ? '2px solid var(--primary)' : undefined,
    transition: 'opacity 0.2s, border 0.2s',
  };

  return (
    <tr
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={rowStyle}
    >
      <td style={{ width: 40, textAlign: 'center', cursor: 'grab' }}>
        <GripVertical size={16} style={{ color: 'var(--text-muted)' }} />
      </td>
      <td>
        <code style={{ fontSize: '0.85rem' }}>{field.key}</code>
      </td>
      <td>{field.label}</td>
      <td>
        <span className="badge">{field.field_type}</span>
      </td>
      <td>
        {field.required && (
          <span className="badge" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>
            Required
          </span>
        )}
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        <Button size="sm" variant="ghost" onClick={() => onEdit(field)}>
          Edit
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onClone(field)}>
          Clone
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(field)}>
          Delete
        </Button>
      </td>
    </tr>
  );
}
