'use client';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const FILE_ICONS = {
  image: '🖼️',
  video: '🎬',
  gif:   '💫',
  audio: '🎵',
  document: '📄',
};

export default function MediaPicker({ selected = [], onSelect, onClose, multi = true }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [folderId, setFolderId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const [previewItem, setPreviewItem] = useState(null);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (folderId) params.set('folderId', folderId);
      const res = await apiFetch(`/api/v1/social-media/media?${params}`);
      setItems(res.media || []);
    } catch (err) {
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMedia(); }, [folderId]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const form = new FormData();
    form.append('file', file);
    form.append('name', file.name);

    try {
      await apiFetch('/api/v1/social-media/media/upload', {
        method: 'POST',
        body: form,
        headers: {}, // Let browser set content-type for FormData
      });
      toast.success('Upload complete');
      fetchMedia();
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const toggleItem = (id) => {
    if (multi) {
      onSelect(
        selected.includes(id)
          ? selected.filter(s => s !== id)
          : [...selected, id]
      );
    } else {
      onSelect([id]);
      onClose?.();
    }
  };

  const getUrl = (item) => {
    if (item.url.startsWith('http')) return item.url;
    return item.url;
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Media Library</span>
        <div style={{ flex: 1 }} />
        <input type="file" ref={fileRef} onChange={handleUpload} accept="image/*,video/*,.gif"
          style={{ display: 'none' }} />
        <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? 'Uploading...' : '📤 Upload'}
        </Button>
      </div>

      {/* Media grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ aspectRatio: '1', backgroundColor: '#f1f5f9', borderRadius: 8 }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
          <div style={{ fontWeight: 600 }}>No media yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Upload images or videos to use in your posts.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {items.map(item => {
            const isSelected = selected.includes(item.id);
            return (
              <div key={item.id} onClick={() => toggleItem(item.id)}
                style={{
                  position: 'relative', cursor: 'pointer', borderRadius: 8, overflow: 'hidden',
                  border: isSelected ? '2px solid #2563eb' : '2px solid transparent',
                  aspectRatio: item.type === 'video' ? '16/9' : '1',
                  backgroundColor: '#f8fafc',
                }}
                onMouseEnter={() => setPreviewItem(item)}
                onMouseLeave={() => setPreviewItem(null)}
              >
                {item.type === 'image' || item.type === 'gif' ? (
                  <img src={getUrl(item)} alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy" />
                ) : item.type === 'video' ? (
                  <video src={getUrl(item)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, backgroundColor: '#f1f5f9',
                  }}>
                    {FILE_ICONS[item.type] || '📄'}
                  </div>
                )}

                {/* Selected overlay */}
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10,
                    backgroundColor: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                  }}>✓</div>
                )}

                {/* Hover overlay */}
                {previewItem?.id === item.id && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4px 6px',
                    backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 11,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {item.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Selected count */}
      <div style={{
        marginTop: 12, padding: '4px 0', fontSize: 13, color: '#64748b',
        borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between',
      }}>
        <span>{selected.length} selected</span>
        {selected.length > 0 && multi && (
          <button className="ctag" style={{ color: '#2563eb' }} onClick={onClose}>Done</button>
        )}
      </div>
    </div>
  );
}
