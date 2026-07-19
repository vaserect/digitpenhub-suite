import Badge from '../ui/Badge';
import Button from '../ui/Button';

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
  dragOverIndex,
}) {
  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver(index);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    onDrop(index);
  };

  const handleDragEnd = () => {
    onDragStart(null);
    onDragOver(null);
  };

  return (
    <tr
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        borderTop: dragOverIndex === index ? '2px solid var(--primary)' : undefined,
        transition: 'opacity 0.2s',
      }}
    >
      <td style={{ padding: '12px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ cursor: 'grab', color: 'var(--text-muted)' }}>⋮⋮</span>
          <code style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>{field.key}</code>
        </div>
      </td>
      <td style={{ padding: '12px 8px' }}>{field.label}</td>
      <td style={{ padding: '12px 8px' }}>
        <Badge variant="secondary">{field.field_type}</Badge>
      </td>
      <td style={{ padding: '12px 8px' }}>
        {field.required ? (
          <Badge variant="warning">Required</Badge>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>Optional</span>
        )}
      </td>
      <td style={{ padding: '12px 8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        {field.field_type === 'select' || field.field_type === 'multiselect'
          ? `${(field.options || []).length} options`
          : '—'}
      </td>
      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onEdit(field)}
            title="Edit field"
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onClone(field)}
            title="Clone field"
          >
            Clone
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => onDelete(field)}
            title="Delete field"
          >
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}
