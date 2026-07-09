'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';
import Pagination from '../ui/Pagination';
import Badge from '../ui/Badge';

export default function DamModule({ goHome }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mimeFilter, setMimeFilter] = useState('');
  const [folderId, setFolderId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [folders, setFolders] = useState([]);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [stats, setStats] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: '30' });
      if (search) params.set('q', search);
      if (mimeFilter) params.set('mime', mimeFilter);
      if (folderId) params.set('folderId', folderId);
      const [a, f, s] = await Promise.all([
        apiFetch(`/api/v1/dam/search?${params}`),
        apiFetch('/api/v1/dam/folders'),
        apiFetch('/api/v1/dam/stats'),
      ]);
      setAssets(a.assets || []);
      setTotalPages(Math.ceil((a.total || 0) / 30));
      setFolders(f.folders || []);
      setStats(s.stats || null);
    } catch { toast.error('Failed to load DAM'); }
    setLoading(false);
  }, [page, search, mimeFilter, folderId]);

  useEffect(() => { load(); }, [load]);

  async function createFolder(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/dam/folders', { method: 'POST', body: JSON.stringify({ name: folderName, parentId: editingFolder }) });
      toast.success('Folder created');
      setShowFolderForm(false); setFolderName(''); setEditingFolder(null);
      load();
    } catch (err) { toast.error(err.message); }
  }

  async function deleteFolder(id) {
    try {
      await apiFetch(`/api/v1/dam/folders/${id}`, { method: 'DELETE' });
      toast.success('Folder deleted');
      if (folderId === id) setFolderId(null);
      load();
    } catch { toast.error('Failed to delete folder'); }
  }

  async function handleUpload(e) {
    const files = e.target.files;
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        if (folderId) formData.append('folderId', folderId);
        await apiFetch('/api/v1/dam/upload', { method: 'POST', body: formData, headers: {} });
      }
      toast.success(`${files.length} file(s) uploaded`);
      e.target.value = '';
      load();
    } catch (err) { toast.error(err.message); }
    setUploading(false);
  }

  async function deleteAsset(id) {
    try {
      await apiFetch(`/api/v1/dam/assets/${id}`, { method: 'DELETE' });
      toast.success('Asset deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  }

  function getFileIcon(mime) {
    if (mime?.startsWith('image/')) return '🖼';
    if (mime?.startsWith('video/')) return '🎬';
    if (mime?.startsWith('audio/')) return '🎵';
    if (mime?.includes('pdf')) return '📄';
    return '📁';
  }

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <div>
          <h1>Digital Asset Management</h1>
          <p className="module-sub">Upload, organise, and manage your media assets.</p>
        </div>
      </div>

      {stats && (
        <div className="stats-row">
          <div className="stat-card"><div className="stat-value">{stats.totalAssets}</div><div className="stat-label">Total Assets</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color:'var(--primary)' }}>{stats.totalSize || '—'}</div><div className="stat-label">Storage Used</div></div>
          <div className="stat-card"><div className="stat-value">{stats.folders}</div><div className="stat-label">Folders</div></div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <input className="form-input" placeholder="Search assets…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1, maxWidth: 300 }} />
        <select className="form-input" value={mimeFilter} onChange={(e) => { setMimeFilter(e.target.value); setPage(1); }} style={{ width: 140 }}>
          <option value="">All types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="audio">Audio</option>
          <option value="pdf">PDFs</option>
        </select>
        <select className="form-input" value={folderId || ''} onChange={(e) => { setFolderId(e.target.value || null); setPage(1); }} style={{ width: 160 }}>
          <option value="">All folders</option>
          {folders.map((f) => <option key={f.id} value={f.id}>{'  '.repeat(f.depth || 0)}{f.name}</option>)}
        </select>
        <label className="btn-primary" style={{ cursor: 'pointer', padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem' }}>
          {uploading ? 'Uploading…' : '+ Upload'}
          <input type="file" multiple hidden onChange={handleUpload} disabled={uploading} />
        </label>
        <Button variant="secondary" size="sm" onClick={() => setShowFolderForm(true)}>+ Folder</Button>
      </div>

      <Modal isOpen={showFolderForm} title="Create Folder" onClose={() => setShowFolderForm(false)}>
        <form onSubmit={createFolder}>
          <div className="field">
            <label className="field-label">Folder name</label>
            <input className="field-input" value={folderName} onChange={(e) => setFolderName(e.target.value)} required />
          </div>
          <div className="field">
            <label className="field-label">Parent folder (optional)</label>
            <select className="field-input" value={editingFolder || ''} onChange={(e) => setEditingFolder(e.target.value || null)}>
              <option value="">— Root —</option>
              {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <Button type="submit">Create</Button>
        </form>
      </Modal>

      {loading ? <SkeletonRows rows={6} /> : assets.length === 0 ? (
        <EmptyState icon="📁" title="No assets yet" description="Upload images, videos, audio, or PDFs." action={
          <label className="btn-primary" style={{ cursor: 'pointer', padding: '8px 16px', borderRadius: 8 }}>
            Upload files
            <input type="file" multiple hidden onChange={handleUpload} />
          </label>
        } />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {assets.map((a) => (
              <div key={a.id} className="card" style={{ overflow: 'hidden', cursor: 'pointer' }} onClick={() => setPreview(a)}>
                {a.mime_type?.startsWith('image/') ? (
                  <img src={a.url} alt={a.original_name} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} />
                ) : (
                  <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', background: 'var(--surface-muted)', borderRadius: 8 }}>
                    {getFileIcon(a.mime_type)}
                  </div>
                )}
                <div style={{ padding: '8px 0' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.original_name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{(a.file_size / 1024 / 1024).toFixed(1)} MB</span>
                    <Button variant="ghost" size="sm" style={{ color: 'var(--danger)', fontSize: '0.7rem' }} onClick={(e) => { e.stopPropagation(); deleteAsset(a.id); }}>Delete</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
        </>
      )}

      <Modal isOpen={!!preview} title={preview?.original_name || 'Preview'} onClose={() => setPreview(null)} size="lg">
        {preview && (
          <div style={{ textAlign: 'center' }}>
            {preview.mime_type?.startsWith('image/') ? (
              <img src={preview.url} alt={preview.original_name} style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: 8 }} />
            ) : (
              <div style={{ padding: 40, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                {getFileIcon(preview.mime_type)} {preview.original_name}
              </div>
            )}
            <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>{(preview.file_size / 1024 / 1024).toFixed(1)} MB</span>
              <span>·</span>
              <span>{preview.mime_type}</span>
              {preview.width && <><span>·</span><span>{preview.width}×{preview.height}</span></>}
            </div>
            <div style={{ marginTop: 12 }}>
              <Button onClick={() => { window.open(preview.url, '_blank'); }}>Open original</Button>
              <Button variant="secondary" style={{ marginLeft: 8 }} onClick={() => deleteAsset(preview.id)}>Delete</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
