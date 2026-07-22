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
  const [activeTab, setActiveTab] = useState('preview');
  const [transformParams, setTransformParams] = useState({ width: '', height: '', format: 'jpeg', quality: '80', fit: 'cover' });
  const [usageData, setUsageData] = useState(null);
  const [shareLink, setShareLink] = useState(null);
  const [sharePermissions, setSharePermissions] = useState('view');
  const [shareExpiry, setShareExpiry] = useState('7');

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

  async function loadUsageData(assetId) {
    try {
      const data = await apiFetch(`/api/v1/dam/${assetId}/usage`);
      setUsageData(data);
    } catch (err) {
      toast.error('Failed to load usage data');
      setUsageData(null);
    }
  }

  async function generateShare() {
    if (!preview) return;
    try {
      const expiryDays = parseInt(shareExpiry);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);
      
      const result = await apiFetch(`/api/v1/dam/${preview.id}/share`, {
        method: 'POST',
        body: JSON.stringify({
          permissions: sharePermissions,
          expiresAt: expiresAt.toISOString()
        })
      });
      setShareLink(result.shareUrl);
      toast.success('Share link generated');
    } catch (err) {
      toast.error('Failed to generate share link');
    }
  }

  async function revokeShare() {
    if (!preview) return;
    try {
      await apiFetch(`/api/v1/dam/${preview.id}/share`, { method: 'DELETE' });
      setShareLink(null);
      toast.success('Share link revoked');
    } catch (err) {
      toast.error('Failed to revoke share link');
    }
  }

  function getTransformUrl() {
    if (!preview) return '';
    const params = new URLSearchParams();
    if (transformParams.width) params.set('width', transformParams.width);
    if (transformParams.height) params.set('height', transformParams.height);
    if (transformParams.format) params.set('format', transformParams.format);
    if (transformParams.quality) params.set('quality', transformParams.quality);
    if (transformParams.fit) params.set('fit', transformParams.fit);
    return `/api/v1/dam/${preview.id}/transform?${params.toString()}`;
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }

  function getFileIcon(mime) {
    if (mime?.startsWith('image/')) return '🖼';
    if (mime?.startsWith('video/')) return '🎬';
    if (mime?.startsWith('audio/')) return '🎵';
    if (mime?.includes('pdf')) return '📄';
    return '📁';
  }

  function openPreview(asset) {
    setPreview(asset);
    setActiveTab('preview');
    setTransformParams({ width: '', height: '', format: 'jpeg', quality: '80', fit: 'cover' });
    setUsageData(null);
    setShareLink(null);
    if (asset.share_token) {
      setShareLink(`${window.location.origin}/api/v1/dam/share/${asset.share_token}`);
    }
  }

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <div>
          <h1>Digital Asset Management</h1>
          <p className="module-sub">Upload, organise, and manage your media assets with advanced transformation, usage tracking, and sharing capabilities.</p>
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
        <EmptyState icon="📁" title="No assets yet" description="Upload images, videos, audio, or PDFs to get started." action={
          <label className="btn-primary" style={{ cursor: 'pointer', padding: '8px 16px', borderRadius: 8 }}>
            Upload files
            <input type="file" multiple hidden onChange={handleUpload} />
          </label>
        } />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {assets.map((a) => (
              <div key={a.id} className="card" style={{ overflow: 'hidden', cursor: 'pointer' }} onClick={() => openPreview(a)}>
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

      <Modal isOpen={!!preview} title={preview?.original_name || 'Asset Details'} onClose={() => setPreview(null)} size="lg">
        {preview && (
          <div>
            <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
              <button onClick={() => setActiveTab('preview')} style={{ padding: '8px 16px', border: 'none', background: 'transparent', borderBottom: activeTab === 'preview' ? '2px solid var(--primary)' : 'none', color: activeTab === 'preview' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: activeTab === 'preview' ? 600 : 400 }}>Preview</button>
              {preview.mime_type?.startsWith('image/') && (
                <button onClick={() => setActiveTab('transform')} style={{ padding: '8px 16px', border: 'none', background: 'transparent', borderBottom: activeTab === 'transform' ? '2px solid var(--primary)' : 'none', color: activeTab === 'transform' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: activeTab === 'transform' ? 600 : 400 }}>Transform</button>
              )}
              <button onClick={() => { setActiveTab('usage'); loadUsageData(preview.id); }} style={{ padding: '8px 16px', border: 'none', background: 'transparent', borderBottom: activeTab === 'usage' ? '2px solid var(--primary)' : 'none', color: activeTab === 'usage' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: activeTab === 'usage' ? 600 : 400 }}>Usage</button>
              <button onClick={() => setActiveTab('share')} style={{ padding: '8px 16px', border: 'none', background: 'transparent', borderBottom: activeTab === 'share' ? '2px solid var(--primary)' : 'none', color: activeTab === 'share' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: activeTab === 'share' ? 600 : 400 }}>Share</button>
            </div>

            {activeTab === 'preview' && (
              <div style={{ textAlign: 'center' }}>
                {preview.mime_type?.startsWith('image/') ? (
                  <img src={preview.url} alt={preview.original_name} style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: 8 }} />
                ) : (
                  <div style={{ padding: 40, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{getFileIcon(preview.mime_type)} {preview.original_name}</div>
                )}
                <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>{(preview.file_size / 1024 / 1024).toFixed(1)} MB</span><span>·</span><span>{preview.mime_type}</span>
                  {preview.width && <><span>·</span><span>{preview.width}×{preview.height}</span></>}
                </div>
                <div style={{ marginTop: 12 }}>
                  <Button onClick={() => { window.open(preview.url, '_blank'); }}>Open original</Button>
                  <Button variant="secondary" style={{ marginLeft: 8 }} onClick={() => deleteAsset(preview.id)}>Delete</Button>
                </div>
              </div>
            )}

            {activeTab === 'transform' && preview.mime_type?.startsWith('image/') && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div className="field"><label className="field-label">Width (px)</label><input type="number" className="field-input" value={transformParams.width} onChange={(e) => setTransformParams({...transformParams, width: e.target.value})} placeholder="Auto" /></div>
                  <div className="field"><label className="field-label">Height (px)</label><input type="number" className="field-input" value={transformParams.height} onChange={(e) => setTransformParams({...transformParams, height: e.target.value})} placeholder="Auto" /></div>
                  <div className="field"><label className="field-label">Format</label><select className="field-input" value={transformParams.format} onChange={(e) => setTransformParams({...transformParams, format: e.target.value})}><option value="jpeg">JPEG</option><option value="png">PNG</option><option value="webp">WebP</option><option value="avif">AVIF</option></select></div>
                  <div className="field"><label className="field-label">Quality (1-100)</label><input type="number" className="field-input" value={transformParams.quality} onChange={(e) => setTransformParams({...transformParams, quality: e.target.value})} min="1" max="100" /></div>
                  <div className="field" style={{ gridColumn: '1 / -1' }}><label className="field-label">Fit Mode</label><select className="field-input" value={transformParams.fit} onChange={(e) => setTransformParams({...transformParams, fit: e.target.value})}><option value="cover">Cover (crop to fill)</option><option value="contain">Contain (fit within)</option><option value="fill">Fill (stretch)</option><option value="inside">Inside (shrink only)</option><option value="outside">Outside (enlarge only)</option></select></div>
                </div>
                <div style={{ textAlign: 'center', marginTop: 16 }}><img src={getTransformUrl()} alt="Transformed preview" style={{ maxWidth: '100%', maxHeight: '50vh', borderRadius: 8, border: '1px solid var(--border)' }} onError={(e) => { e.target.style.display = 'none'; }} /></div>
                <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <Button onClick={() => copyToClipboard(getTransformUrl())}>Copy Transform URL</Button>
                  <Button variant="secondary" onClick={() => window.open(getTransformUrl(), '_blank')}>Download</Button>
                </div>
              </div>
            )}

            {activeTab === 'usage' && (
              <div>
                {usageData ? (
                  <div>
                    <div className="stats-row" style={{ marginBottom: 16 }}>
                      <div className="stat-card"><div className="stat-value">{usageData.totalViews || 0}</div><div className="stat-label">Total Views</div></div>
                      <div className="stat-card"><div className="stat-value">{usageData.totalDownloads || 0}</div><div className="stat-label">Downloads</div></div>
                      <div className="stat-card"><div className="stat-value">{usageData.usedInModules || 0}</div><div className="stat-label">Used In Modules</div></div>
                    </div>
                    {usageData.recentUsage && usageData.recentUsage.length > 0 && (
                      <div>
                        <h4 style={{ marginBottom: 8, fontSize: '0.9rem', fontWeight: 600 }}>Recent Usage</h4>
                        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                          {usageData.recentUsage.map((usage, idx) => (
                            <div key={idx} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                              <div style={{ fontWeight: 500 }}>{usage.module_name}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{usage.action} • {new Date(usage.created_at).toLocaleDateString()}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading usage data...</div>
                )}
              </div>
            )}

            {activeTab === 'share' && (
              <div>
                {shareLink ? (
                  <div>
                    <div className="field"><label className="field-label">Share Link</label><div style={{ display: 'flex', gap: 8 }}><input type="text" className="field-input" value={shareLink} readOnly style={{ flex: 1 }} /><Button onClick={() => copyToClipboard(shareLink)}>Copy</Button></div></div>
                    <div style={{ marginTop: 16, padding: 12, background: 'var(--surface-muted)', borderRadius: 8, fontSize: '0.85rem' }}>
                      <div style={{ marginBottom: 8 }}><strong>Permissions:</strong> {preview.share_permissions || 'view'}</div>
                      {preview.share_expires_at && (<div><strong>Expires:</strong> {new Date(preview.share_expires_at).toLocaleDateString()}</div>)}
                    </div>
                    <div style={{ marginTop: 16 }}><Button variant="danger" onClick={revokeShare}>Revoke Share Link</Button></div>
                  </div>
                ) : (
                  <div>
                    <div className="field"><label className="field-label">Permissions</label><select className="field-input" value={sharePermissions} onChange={(e) => setSharePermissions(e.target.value)}><option value="view">View only</option><option value="download">View & Download</option></select></div>
                    <div className="field"><label className="field-label">Expires in</label><select className="field-input" value={shareExpiry} onChange={(e) => setShareExpiry(e.target.value)}><option value="1">1 day</option><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option><option value="365">1 year</option></select></div>
                    <div style={{ marginTop: 16 }}><Button onClick={generateShare}>Generate Share Link</Button></div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
