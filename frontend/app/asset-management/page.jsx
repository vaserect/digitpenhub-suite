'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';
import FolderTree from '../../components/dam/FolderTree';
import AssetGrid from '../../components/dam/AssetGrid';
import FileUpload from '../../components/dam/FileUpload';
import AssetPreviewModal from '../../components/dam/AssetPreviewModal';

export default function AssetManagementPage() {
  const router = useRouter();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [previewAsset, setPreviewAsset] = useState(null);

  useEffect(() => {
    loadAssets();
  }, [selectedFolderId, filterType]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      let url = '/api/v1/dam';
      const params = new URLSearchParams();
      
      if (selectedFolderId) {
        params.append('folder_id', selectedFolderId);
      }
      if (filterType !== 'all') {
        params.append('type', filterType);
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const data = await apiFetch(url);
      setAssets(data);
    } catch (error) {
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const handleAssetClick = (asset) => {
    setPreviewAsset(asset);
  };

  const handleAssetSelect = (assetId) => {
    setSelectedAssets(prev => {
      if (prev.includes(assetId)) {
        return prev.filter(id => id !== assetId);
      } else {
        return [...prev, assetId];
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedAssets.length === 0) return;
    
    if (!confirm(`Delete ${selectedAssets.length} asset(s)?`)) return;

    try {
      await apiFetch('/api/v1/dam/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: selectedAssets })
      });
      toast.success(`Deleted ${selectedAssets.length} asset(s)`);
      setSelectedAssets([]);
      loadAssets();
    } catch (error) {
      toast.error('Failed to delete assets');
    }
  };

  const handleUploadComplete = (uploadedAssets) => {
    setShowUpload(false);
    loadAssets();
  };

  const filteredAssets = assets.filter(asset => {
    if (!searchQuery) return true;
    return asset.filename.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="panel" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <button 
        className="back-link" 
        onClick={() => router.push('/')}
        style={{ marginBottom: 16 }}
      >
        ← Back
      </button>

      <div className="module-head" style={{ marginBottom: 24 }}>
        <h1>Digital Asset Management</h1>
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button
            onClick={() => setShowUpload(!showUpload)}
            style={{
              padding: '10px 20px',
              background: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            {showUpload ? 'Hide Upload' : '📤 Upload Files'}
          </button>
          
          {selectedAssets.length > 0 && (
            <button
              onClick={handleBulkDelete}
              style={{
                padding: '10px 20px',
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              🗑️ Delete Selected ({selectedAssets.length})
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar - Folders */}
        <div style={{ width: '280px', flexShrink: 0, overflowY: 'auto' }}>
          <FolderTree
            onFolderSelect={setSelectedFolderId}
            selectedFolderId={selectedFolderId}
          />
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Upload Area */}
          {showUpload && (
            <FileUpload
              folderId={selectedFolderId}
              onUploadComplete={handleUploadComplete}
            />
          )}

          {/* Filters and Search */}
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            marginBottom: 16,
            padding: '16px',
            background: '#fafafa',
            borderRadius: '8px'
          }}>
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 16px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: '10px 16px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                minWidth: '150px'
              }}
            >
              <option value="all">All Types</option>
              <option value="image/%">Images</option>
              <option value="video/%">Videos</option>
              <option value="application/pdf">PDFs</option>
              <option value="application/%">Documents</option>
            </select>
          </div>

          {/* Asset Grid */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%' 
              }}>
                <div style={{ fontSize: '48px' }}>⏳</div>
              </div>
            ) : (
              <AssetGrid
                assets={filteredAssets}
                onAssetClick={handleAssetClick}
                onAssetSelect={handleAssetSelect}
                selectedAssets={selectedAssets}
              />
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewAsset && (
        <AssetPreviewModal
          asset={previewAsset}
          onClose={() => setPreviewAsset(null)}
          onUpdate={loadAssets}
          onDelete={loadAssets}
        />
      )}
    </div>
  );
}
