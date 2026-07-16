'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../../lib/api';
import Button from '../../../components/ui/Button';
import { SkeletonRows } from '../../../components/ui/Skeleton';
import EmptyState from '../../../components/ui/EmptyState';
import SearchInput from '../../../components/ui/SearchInput';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Modal from '../../../components/ui/Modal';
import Pagination from '../../../components/ui/Pagination';
import {
  PhotoIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const PAGE_SIZE = 24;

export default function AssetsPage() {
  const router = useRouter();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [typeFilter, setTypeFilter] = useState('');
  const [folderPath, setFolderPath] = useState('/');
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPexelsModal, setShowPexelsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedAssets, setSelectedAssets] = useState(new Set());
  
  // Upload states
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  // Pexels states
  const [pexelsQuery, setPexelsQuery] = useState('');
  const [pexelsResults, setPexelsResults] = useState([]);
  const [pexelsLoading, setPexelsLoading] = useState(false);
  
  // Edit form
  const [editForm, setEditForm] = useState({
    name: '',
    altText: '',
    caption: '',
    tags: ''
  });

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (typeFilter) params.append('type', typeFilter);
      if (folderPath !== '/') params.append('folder', folderPath);
      params.append('limit', PAGE_SIZE);
      params.append('offset', (page - 1) * PAGE_SIZE);

      const data = await apiFetch(`/api/v1/builder/assets?${params}`);
      setAssets(data.assets || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error('Failed to load assets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, folderPath, page]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setUploadFiles(files);
    if (files.length > 0) {
      setShowUploadModal(true);
    }
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      uploadFiles.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('folderPath', folderPath);

      const response = await fetch('/api/v1/builder/assets/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      toast.success(`${data.assets.length} file(s) uploaded successfully!`);
      setShowUploadModal(false);
      setUploadFiles([]);
      await loadAssets();
    } catch (err) {
      toast.error(err.message || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const searchPexels = async () => {
    if (!pexelsQuery.trim()) return;

    setPexelsLoading(true);
    try {
      const data = await apiFetch(
        `/api/v1/images/search?q=${encodeURIComponent(pexelsQuery.trim())}&per_page=30`
      );
      setPexelsResults(data.images || []);
    } catch (err) {
      toast.error('Pexels search failed');
    } finally {
      setPexelsLoading(false);
    }
  };

  const handleImportFromPexels = async (image) => {
    try {
      const data = await apiFetch('/api/v1/builder/assets/import-pexels', {
        method: 'POST',
        body: JSON.stringify({
          url: image.url,
          thumbnailUrl: image.thumbnail,
          altText: image.alt || '',
          sourceId: image.id.toString(),
          sourceUrl: image.photographer_url,
          folderPath
        })
      });

      toast.success('Image imported from Pexels!');
      await loadAssets();
    } catch (err) {
      toast.error(err.message || 'Failed to import image');
    }
  };

  const handleUpdateAsset = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;

    try {
      await apiFetch(`/api/v1/builder/assets/${selectedAsset.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editForm.name.trim(),
          altText: editForm.altText.trim(),
          caption: editForm.caption.trim(),
          tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean)
        })
      });

      toast.success('Asset updated!');
      setShowEditModal(false);
      setSelectedAsset(null);
      await loadAssets();
    } catch (err) {
      toast.error(err.message || 'Failed to update asset');
    }
  };

  const handleDeleteAsset = async (assetId) => {
    try {
      await apiFetch(`/api/v1/builder/assets/${assetId}`, {
        method: 'DELETE'
      });
      toast.success('Asset deleted');
      setConfirmDelete(null);
      await loadAssets();
    } catch (err) {
      toast.error(err.message || 'Failed to delete asset');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAssets.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedAssets).map(id =>
          apiFetch(`/api/v1/builder/assets/${id}`, { method: 'DELETE' })
        )
      );
      toast.success(`${selectedAssets.size} asset(s) deleted`);
      setSelectedAssets(new Set());
      await loadAssets();
    } catch (err) {
      toast.error('Failed to delete some assets');
    }
  };

  const toggleAssetSelection = (assetId) => {
    const newSelection = new Set(selectedAssets);
    if (newSelection.has(assetId)) {
      newSelection.delete(assetId);
    } else {
      newSelection.add(assetId);
    }
    setSelectedAssets(newSelection);
  };

  const openEditModal = (asset) => {
    setSelectedAsset(asset);
    setEditForm({
      name: asset.name,
      altText: asset.alt_text || '',
      caption: asset.caption || '',
      tags: (asset.tags || []).join(', ')
    });
    setShowEditModal(true);
  };

  const copyAssetUrl = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard!');
  };

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="panel">
      <button className="back-link" onClick={() => router.push('/builder')}>
        ← Back to Builder
      </button>

      <div className="module-head">
        <div>
          <h1>Asset Manager</h1>
          <p className="module-sub">
            Manage your media library and import images from Pexels
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={() => setShowPexelsModal(true)} variant="secondary">
            <PhotoIcon style={{ width: 18, height: 18 }} />
            Search Pexels
          </Button>
          <label>
            <Button as="span">
              <CloudArrowUpIcon style={{ width: 18, height: 18 }} />
              Upload Files
            </Button>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {/* Stats */}
      {total > 0 && (
        <div className="stats-row" style={{ marginBottom: 20 }}>
          <span className="stat-pill">
            Total: <strong>{total}</strong>
          </span>
          <span className="stat-pill">
            Images: <strong>{assets.filter(a => a.asset_type === 'image').length}</strong>
          </span>
          <span className="stat-pill">
            Videos: <strong>{assets.filter(a => a.asset_type === 'video').length}</strong>
          </span>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedAssets.size > 0 && (
        <div style={{
          padding: '12px 16px',
          background: 'var(--primary-bg)',
          border: '1px solid var(--primary)',
          borderRadius: 8,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            {selectedAssets.size} asset(s) selected
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="sm" variant="ghost" onClick={() => setSelectedAssets(new Set())}>
              Clear Selection
            </Button>
            <Button size="sm" variant="danger" onClick={handleBulkDelete}>
              <TrashIcon style={{ width: 16, height: 16 }} />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px' }}>
          <SearchInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search assets..."
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '8px 12px',
            border: '1px solid var(--border)',
            borderRadius: 8,
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: 14
          }}
        >
          <option value="">All Types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="document">Documents</option>
        </select>
        <div style={{ display: 'flex', gap: 4, border: '1px solid var(--border)', borderRadius: 8, padding: 4 }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              background: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'grid' ? 'white' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <Squares2X2Icon style={{ width: 18, height: 18 }} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              background: viewMode === 'list' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'list' ? 'white' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <ListBulletIcon style={{ width: 18, height: 18 }} />
          </button>
        </div>
      </div>

      {/* Assets Grid/List */}
      {loading ? (
        <SkeletonRows rows={4} />
      ) : assets.length === 0 ? (
        <EmptyState
          icon={<PhotoIcon style={{ width: 64, height: 64 }} />}
          title="No assets yet"
          description="Upload files or import images from Pexels to get started"
          action={
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <label>
                <Button as="span">
                  <CloudArrowUpIcon style={{ width: 18, height: 18 }} />
                  Upload Files
                </Button>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </label>
              <Button onClick={() => setShowPexelsModal(true)} variant="secondary">
                <PhotoIcon style={{ width: 18, height: 18 }} />
                Search Pexels
              </Button>
            </div>
          }
        />
      ) : viewMode === 'grid' ? (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 20
          }}>
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: 'pointer',
                  border: selectedAssets.has(asset.id) ? '2px solid var(--primary)' : undefined
                }}
                onClick={() => toggleAssetSelection(asset.id)}
              >
                {/* Thumbnail */}
                <div style={{
                  height: 160,
                  background: 'var(--hover-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {asset.asset_type === 'image' ? (
                    <img
                      src={asset.thumbnail_url || asset.file_url}
                      alt={asset.alt_text || asset.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : asset.asset_type === 'video' ? (
                    <video
                      src={asset.file_url}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <PhotoIcon style={{ width: 48, height: 48, color: 'var(--text-muted)' }} />
                  )}
                </div>

                {/* Selection Checkbox */}
                <div style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  background: selectedAssets.has(asset.id) ? 'var(--primary)' : 'white',
                  border: '2px solid',
                  borderColor: selectedAssets.has(asset.id) ? 'var(--primary)' : 'var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}>
                  {selectedAssets.has(asset.id) && (
                    <CheckIcon style={{ width: 16, height: 16, color: 'white' }} />
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: 12 }}>
                  <div style={{
                    fontWeight: 500,
                    fontSize: 13,
                    marginBottom: 4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {asset.name}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span>{asset.asset_type}</span>
                    <span>{formatFileSize(asset.file_size)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{
                  padding: '8px 12px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  gap: 8,
                  fontSize: 12
                }}>
                  <button
                    className="ctag"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyAssetUrl(asset.file_url);
                    }}
                  >
                    Copy URL
                  </button>
                  <button
                    className="ctag"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(asset);
                    }}
                  >
                    <PencilIcon style={{ width: 12, height: 12 }} />
                  </button>
                  <button
                    className="ctag"
                    style={{ color: 'var(--danger)', marginLeft: 'auto' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(asset);
                    }}
                  >
                    <TrashIcon style={{ width: 12, height: 12 }} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            pageCount={pageCount}
            total={total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      ) : (
        <div className="card-shell" style={{ overflow: 'hidden' }}>
          <table className="dft">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Preview</th>
                <th>Name</th>
                <th>Type</th>
                <th>Size</th>
                <th>Uploaded</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedAssets.has(asset.id)}
                      onChange={() => toggleAssetSelection(asset.id)}
                    />
                  </td>
                  <td>
                    <div style={{ width: 60, height: 60, borderRadius: 4, overflow: 'hidden' }}>
                      {asset.asset_type === 'image' && (
                        <img
                          src={asset.thumbnail_url || asset.file_url}
                          alt={asset.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                    </div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{asset.name}</td>
                  <td style={{ textTransform: 'capitalize' }}>{asset.asset_type}</td>
                  <td>{formatFileSize(asset.file_size)}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(asset.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Button size="sm" onClick={() => copyAssetUrl(asset.file_url)}>
                        Copy URL
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEditModal(asset)}>
                        <PencilIcon style={{ width: 16, height: 16 }} />
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setConfirmDelete(asset)}>
                        <TrashIcon style={{ width: 16, height: 16 }} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <Modal
          isOpen
          title="Upload Files"
          description={`Uploading ${uploadFiles.length} file(s)`}
          onClose={() => {
            setShowUploadModal(false);
            setUploadFiles([]);
          }}
        >
          <div style={{ marginBottom: 16 }}>
            {uploadFiles.map((file, i) => (
              <div
                key={i}
                style={{
                  padding: '8px 12px',
                  background: 'var(--hover-bg)',
                  borderRadius: 6,
                  marginBottom: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: 13 }}>{file.name}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {formatFileSize(file.size)}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button
              onClick={() => {
                setShowUploadModal(false);
                setUploadFiles([]);
              }}
              variant="ghost"
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} loading={uploading}>
              Upload
            </Button>
          </div>
        </Modal>
      )}

      {/* Pexels Search Modal */}
      {showPexelsModal && (
        <Modal
          isOpen
          title="Search Pexels"
          description="Find and import free stock photos"
          onClose={() => {
            setShowPexelsModal(false);
            setPexelsQuery('');
            setPexelsResults([]);
          }}
        >
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <SearchInput
              value={pexelsQuery}
              onChange={(e) => setPexelsQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') searchPexels();
              }}
              placeholder="e.g. business, nature, technology..."
              autoFocus
              style={{ flex: 1 }}
            />
            <Button onClick={searchPexels} loading={pexelsLoading}>
              Search
            </Button>
          </div>

          {pexelsResults.length === 0 ? (
            <EmptyState
              icon={<PhotoIcon style={{ width: 48, height: 48 }} />}
              title={pexelsLoading ? 'Searching...' : 'Search for images'}
              description={pexelsLoading ? '' : 'Try searching for a category or subject'}
            />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 10,
              maxHeight: '50vh',
              overflowY: 'auto'
            }}>
              {pexelsResults.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => handleImportFromPexels(img)}
                  style={{
                    padding: 0,
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    background: 'none',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <img
                    src={img.thumbnail}
                    alt={img.alt}
                    style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
                  />
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* Edit Asset Modal */}
      {showEditModal && selectedAsset && (
        <Modal
          isOpen
          title="Edit Asset"
          description="Update asset information"
          onClose={() => {
            setShowEditModal(false);
            setSelectedAsset(null);
          }}
        >
          <form onSubmit={handleUpdateAsset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field">
              <label className="field-label">Name</label>
              <input
                className="field-input"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="field-label">Alt Text (for images)</label>
              <input
                className="field-input"
                value={editForm.altText}
                onChange={(e) => setEditForm({ ...editForm, altText: e.target.value })}
                placeholder="Describe the image for accessibility"
              />
            </div>

            <div className="field">
              <label className="field-label">Caption</label>
              <textarea
                className="field-input"
                value={editForm.caption}
                onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })}
                rows={2}
              />
            </div>

            <div className="field">
              <label className="field-label">Tags (comma-separated)</label>
              <input
                className="field-input"
                value={editForm.tags}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                placeholder="business, office, team"
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedAsset(null);
                }}
                variant="ghost"
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDeleteAsset(confirmDelete.id)}
        title="Delete Asset?"
        description={`This will permanently delete "${confirmDelete?.name}". This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
      />
    </div>
  );
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
