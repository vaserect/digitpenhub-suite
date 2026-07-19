'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';

export default function TagManager({ assetId, onTagsUpdate }) {
  const [tags, setTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [assetTags, setAssetTags] = useState([]);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#2196f3');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTags();
    if (assetId) {
      loadAssetTags();
    }
  }, [assetId]);

  const loadTags = async () => {
    try {
      const data = await apiFetch('/api/v1/dam/tags');
      setAllTags(data);
    } catch (error) {
      toast.error('Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const loadAssetTags = async () => {
    try {
      const data = await apiFetch(`/api/v1/dam/${assetId}/tags`);
      setAssetTags(data.map(t => t.id));
    } catch (error) {
      console.error('Failed to load asset tags:', error);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.error('Tag name is required');
      return;
    }

    try {
      const newTag = await apiFetch('/api/v1/dam/tags', {
        method: 'POST',
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor
        })
      });
      
      setAllTags([...allTags, newTag]);
      setNewTagName('');
      setNewTagColor('#2196f3');
      setShowCreateTag(false);
      toast.success('Tag created');
    } catch (error) {
      toast.error('Failed to create tag');
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (!confirm('Delete this tag? It will be removed from all assets.')) return;

    try {
      await apiFetch(`/api/v1/dam/tags/${tagId}`, { method: 'DELETE' });
      setAllTags(allTags.filter(t => t.id !== tagId));
      setAssetTags(assetTags.filter(id => id !== tagId));
      toast.success('Tag deleted');
      if (onTagsUpdate) onTagsUpdate();
    } catch (error) {
      toast.error('Failed to delete tag');
    }
  };

  const handleToggleAssetTag = async (tagId) => {
    if (!assetId) return;

    const isAssigned = assetTags.includes(tagId);

    try {
      if (isAssigned) {
        await apiFetch(`/api/v1/dam/${assetId}/tags/${tagId}`, { method: 'DELETE' });
        setAssetTags(assetTags.filter(id => id !== tagId));
        toast.success('Tag removed');
      } else {
        await apiFetch(`/api/v1/dam/${assetId}/tags`, {
          method: 'POST',
          body: JSON.stringify({ tagId })
        });
        setAssetTags([...assetTags, tagId]);
        toast.success('Tag added');
      }
      if (onTagsUpdate) onTagsUpdate();
    } catch (error) {
      toast.error(`Failed to ${isAssigned ? 'remove' : 'add'} tag`);
    }
  };

  const colorPresets = [
    '#2196f3', '#4caf50', '#ff9800', '#f44336', 
    '#9c27b0', '#00bcd4', '#ffeb3b', '#795548'
  ];

  if (loading) {
    return <div style={{ padding: 20, textAlign: 'center' }}>Loading tags...</div>;
  }

  return (
    <div style={{ padding: '16px 0' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16 
      }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
          {assetId ? 'Asset Tags' : 'Manage Tags'}
        </h3>
        <button
          onClick={() => setShowCreateTag(!showCreateTag)}
          style={{
            padding: '6px 12px',
            background: '#f0f0f0',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600
          }}
        >
          {showCreateTag ? 'Cancel' : '+ New Tag'}
        </button>
      </div>

      {/* Create Tag Form */}
      {showCreateTag && (
        <div style={{
          padding: 16,
          background: '#f9f9f9',
          borderRadius: 8,
          marginBottom: 16
        }}>
          <input
            type="text"
            placeholder="Tag name..."
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 14,
              marginBottom: 12
            }}
          />
          
          <div style={{ marginBottom: 12 }}>
            <label style={{ 
              display: 'block', 
              fontSize: 12, 
              fontWeight: 600, 
              marginBottom: 8,
              color: '#666'
            }}>
              Color
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {colorPresets.map(color => (
                <button
                  key={color}
                  onClick={() => setNewTagColor(color)}
                  style={{
                    width: 32,
                    height: 32,
                    background: color,
                    border: newTagColor === color ? '3px solid #333' : '2px solid #ddd',
                    borderRadius: 4,
                    cursor: 'pointer',
                    padding: 0
                  }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleCreateTag}
            style={{
              width: '100%',
              padding: '8px',
              background: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600
            }}
          >
            Create Tag
          </button>
        </div>
      )}

      {/* Tags List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {allTags.length === 0 ? (
          <div style={{ 
            padding: 20, 
            textAlign: 'center', 
            color: '#999',
            fontSize: 14 
          }}>
            No tags yet. Create one to get started.
          </div>
        ) : (
          allTags.map(tag => {
            const isAssigned = assetTags.includes(tag.id);
            
            return (
              <div
                key={tag.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: isAssigned ? '#e3f2fd' : '#f9f9f9',
                  border: isAssigned ? '2px solid #2196f3' : '1px solid #e0e0e0',
                  borderRadius: 6,
                  cursor: assetId ? 'pointer' : 'default'
                }}
                onClick={() => assetId && handleToggleAssetTag(tag.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      background: tag.color,
                      borderRadius: 3
                    }}
                  />
                  <span style={{ fontSize: 14, fontWeight: isAssigned ? 600 : 400 }}>
                    {tag.name}
                  </span>
                  {isAssigned && (
                    <span style={{ fontSize: 12, color: '#2196f3' }}>✓</span>
                  )}
                </div>
                
                {!assetId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTag(tag.id);
                    }}
                    style={{
                      padding: '4px 8px',
                      background: 'transparent',
                      border: 'none',
                      color: '#f44336',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
