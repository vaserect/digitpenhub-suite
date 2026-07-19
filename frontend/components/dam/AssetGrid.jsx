'use client';
import { useState } from 'react';

export default function AssetGrid({ assets, onAssetClick, onAssetSelect, selectedAssets = [] }) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (!mimeType) return '📄';
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '📦';
    return '📄';
  };

  const isSelected = (assetId) => selectedAssets.includes(assetId);

  const handleSelectToggle = (e, assetId) => {
    e.stopPropagation();
    onAssetSelect(assetId);
  };

  if (assets.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 20px',
        color: '#666'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>📁</div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>No assets yet</h3>
        <p style={{ margin: 0, fontSize: '14px' }}>Upload your first file to get started</p>
      </div>
    );
  }

  return (
    <div className="asset-grid-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {assets.length} asset{assets.length !== 1 ? 's' : ''}
          {selectedAssets.length > 0 && ` • ${selectedAssets.length} selected`}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '6px 12px',
              background: viewMode === 'grid' ? '#2196f3' : '#f0f0f0',
              color: viewMode === 'grid' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '6px 12px',
              background: viewMode === 'list' ? '#2196f3' : '#f0f0f0',
              color: viewMode === 'list' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            List
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {assets.map(asset => (
            <div
              key={asset.id}
              onClick={() => onAssetClick(asset)}
              style={{
                position: 'relative',
                border: isSelected(asset.id) ? '2px solid #2196f3' : '1px solid #e0e0e0',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <input
                type="checkbox"
                checked={isSelected(asset.id)}
                onChange={(e) => handleSelectToggle(e, asset.id)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  zIndex: 10
                }}
              />
              
              <div style={{
                width: '100%',
                height: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f5f5f5',
                overflow: 'hidden'
              }}>
                {asset.mime_type?.startsWith('image/') ? (
                  <img
                    src={`/api/v1/dam/serve/${asset.id}`}
                    alt={asset.filename}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `<div style="font-size: 64px">${getFileIcon(asset.mime_type)}</div>`;
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '64px' }}>{getFileIcon(asset.mime_type)}</div>
                )}
              </div>

              <div style={{ padding: '12px' }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }} title={asset.filename}>
                  {asset.filename}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {formatFileSize(asset.size_bytes)}
                  {asset.width && asset.height && ` • ${asset.width}×${asset.height}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
          {assets.map((asset, index) => (
            <div
              key={asset.id}
              onClick={() => onAssetClick(asset)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: index < assets.length - 1 ? '1px solid #e0e0e0' : 'none',
                cursor: 'pointer',
                backgroundColor: isSelected(asset.id) ? '#e3f2fd' : 'white',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isSelected(asset.id)) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected(asset.id)) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              <input
                type="checkbox"
                checked={isSelected(asset.id)}
                onChange={(e) => handleSelectToggle(e, asset.id)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '20px',
                  height: '20px',
                  marginRight: '16px',
                  cursor: 'pointer'
                }}
              />
              
              <div style={{
                width: '48px',
                height: '48px',
                marginRight: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f5f5f5',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                {asset.mime_type?.startsWith('image/') ? (
                  <img
                    src={`/api/v1/dam/serve/${asset.id}`}
                    alt={asset.filename}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `<div style="font-size: 24px">${getFileIcon(asset.mime_type)}</div>`;
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '24px' }}>{getFileIcon(asset.mime_type)}</div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {asset.filename}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {formatFileSize(asset.size_bytes)}
                  {asset.width && asset.height && ` • ${asset.width}×${asset.height}`}
                  {asset.created_at && ` • ${new Date(asset.created_at).toLocaleDateString()}`}
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#999', marginLeft: '16px' }}>
                {asset.mime_type?.split('/')[1]?.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
