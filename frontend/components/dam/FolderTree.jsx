'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';

export default function FolderTree({ onFolderSelect, selectedFolderId }) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [creatingFolder, setCreatingFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const data = await apiFetch('/api/v1/dam/folders/list');
      setFolders(data);
    } catch (error) {
      toast.error('Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreateFolder = async (parentId = null) => {
    if (!newFolderName.trim()) {
      toast.error('Folder name is required');
      return;
    }

    try {
      await apiFetch('/api/v1/dam/folders', {
        method: 'POST',
        body: JSON.stringify({ name: newFolderName, parent_id: parentId })
      });
      toast.success('Folder created');
      setNewFolderName('');
      setCreatingFolder(null);
      loadFolders();
    } catch (error) {
      toast.error('Failed to create folder');
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!confirm('Delete this folder? Assets inside will not be deleted.')) return;

    try {
      await apiFetch(`/api/v1/dam/folders/${folderId}`, { method: 'DELETE' });
      toast.success('Folder deleted');
      loadFolders();
    } catch (error) {
      toast.error(error.message || 'Failed to delete folder');
    }
  };

  const renderFolder = (folder, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const children = folders.filter(f => f.parent_id === folder.id);

    return (
      <div key={folder.id} style={{ marginLeft: level * 16 }}>
        <div
          className={`folder-item ${isSelected ? 'selected' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            cursor: 'pointer',
            borderRadius: '4px',
            marginBottom: '2px',
            backgroundColor: isSelected ? '#e3f2fd' : 'transparent'
          }}
        >
          <span
            onClick={() => children.length > 0 && toggleFolder(folder.id)}
            style={{ marginRight: '8px', cursor: 'pointer', width: '16px' }}
          >
            {children.length > 0 ? (isExpanded ? '▼' : '▶') : ''}
          </span>
          <span
            onClick={() => onFolderSelect(folder.id)}
            style={{ flex: 1, fontWeight: isSelected ? 600 : 400 }}
          >
            📁 {folder.name}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCreatingFolder(folder.id);
            }}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              marginRight: '4px',
              border: 'none',
              background: '#f0f0f0',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
            title="Add subfolder"
          >
            +
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteFolder(folder.id);
            }}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              border: 'none',
              background: '#ffebee',
              color: '#c62828',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
            title="Delete folder"
          >
            ×
          </button>
        </div>

        {creatingFolder === folder.id && (
          <div style={{ marginLeft: 16, marginBottom: 8 }}>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              style={{
                padding: '6px 8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginRight: '8px',
                width: '150px'
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder(folder.id)}
            />
            <button
              onClick={() => handleCreateFolder(folder.id)}
              style={{
                padding: '6px 12px',
                background: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '4px'
              }}
            >
              Create
            </button>
            <button
              onClick={() => {
                setCreatingFolder(null);
                setNewFolderName('');
              }}
              style={{
                padding: '6px 12px',
                background: '#f0f0f0',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {isExpanded && children.map(child => renderFolder(child, level + 1))}
      </div>
    );
  };

  if (loading) {
    return <div style={{ padding: 16 }}>Loading folders...</div>;
  }

  const rootFolders = folders.filter(f => !f.parent_id);

  return (
    <div className="folder-tree" style={{ padding: '16px', background: '#fafafa', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Folders</h3>
        <button
          onClick={() => setCreatingFolder('root')}
          style={{
            padding: '6px 12px',
            background: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + New Folder
        </button>
      </div>

      <div
        className={`folder-item ${!selectedFolderId ? 'selected' : ''}`}
        onClick={() => onFolderSelect(null)}
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          borderRadius: '4px',
          marginBottom: '8px',
          backgroundColor: !selectedFolderId ? '#e3f2fd' : 'transparent',
          fontWeight: !selectedFolderId ? 600 : 400
        }}
      >
        📂 All Assets
      </div>

      {creatingFolder === 'root' && (
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            style={{
              padding: '6px 8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginRight: '8px',
              width: '150px'
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder(null)}
          />
          <button
            onClick={() => handleCreateFolder(null)}
            style={{
              padding: '6px 12px',
              background: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '4px'
            }}
          >
            Create
          </button>
          <button
            onClick={() => {
              setCreatingFolder(null);
              setNewFolderName('');
            }}
            style={{
              padding: '6px 12px',
              background: '#f0f0f0',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {rootFolders.map(folder => renderFolder(folder))}
    </div>
  );
}
