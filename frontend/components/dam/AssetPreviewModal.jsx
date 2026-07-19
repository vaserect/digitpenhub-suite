'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';
import TagManager from './TagManager';
import ImageTransformControls from './ImageTransformControls';

export default function AssetPreviewModal({ asset, onClose, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('metadata'); // metadata, tags, transform
  const [transformedUrl, setTransformedUrl] = useState(null);
  const [formData, setFormData] = useState({
    filename: asset?.filename || '',
    altText: asset?.alt_text || '',
    caption: asset?.caption || '',
    credit: asset?.credit || ''
  });

  useEffect(() => {
    if (asset) {
      setFormData({
        filename: asset.filename || '',
        altText: asset.alt_text || '',
        caption: asset.caption || '',
        credit: asset.credit || ''
      });
      setTransformedUrl(null);
    }
  }, [asset]);

  if (!asset) return null;

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSave = async () => {
    try {
      await apiFetch(`/api/v1/dam/${asset.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          filename: formData.filename,
          altText: formData.altText,
          caption: formData.caption,
          credit: formData.credit
        })
      });
      toast.success('Asset updated');
      setEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to update asset');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this asset permanently?')) return;

    try {
      await apiFetch(`/api/v1/dam/${asset.id}`, { method: 'DELETE' });
      toast.success('Asset deleted');
      if (onDelete) onDelete();
      onClose();
    } catch (error) {
      toast.error('Failed to delete asset');
    }
  };

  const handleDownload = () => {
    const url = transformedUrl || `/api/v1/dam/serve/${asset.id}`;
    window.open(url, '_blank');
  };

  const handleTransform = (url) => {
    setTransformedUrl(url);
    toast.success('Transformation applied! Preview updated.');
  };

  const renderPreview = () => {
    const previewUrl = transformedUrl || `/api/v1/dam/serve/${asset.id}`;

    if (asset.mime_type?.startsWith('image/')) {
      return (
        <div style={{ position: 'relative' }}>
          <img
            src={previewUrl}
            alt={asset.filename}
            style={{
              maxWidth: '100%',
              maxHeight: '600px',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto'
            }}
          />
          {transformedUrl && (
            <div style={{
              position: 'absolute',
              top: 16,
              right: 16,
              padding: '8px 16px',
              background: 'rgba(33, 150, 243, 0.9)',
              color: 'white',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600
            }}>
              Transformed Preview
            </div>
          )}
        </div>
      );
    }

    if (asset.mime_type?.startsWith('video/')) {
      return (
        <video
          controls
          style={{
            maxWidth: '100%',
            maxHeight: '600px',
            display: 'block',
            margin: '0 auto'
          }}
        >
          <source src={previewUrl} type={asset.mime_type} />
          Your browser does not support video playback.
        </video>
      );
    }

    if (asset.mime_type === 'application/pdf') {
      return (
        <iframe
          src={previewUrl}
          style={{
            width: '100%',
            height: '600px',
            border: 'none'
          }}
          title={asset.filename}
        />
      );
    }

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 20px',
        color: '#666'
      }}>
        <div style={{ fontSize: '96px', marginBottom: '24px' }}>📄</div>
        <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
          {asset.filename}
        </div>
        <div style={{ fontSize: '14px', color: '#999' }}>
          Preview not available for this file type
        </div>
        <button
          onClick={handleDownload}
          style={{
            marginTop: '24px',
            padding: '12px 24px',
            background: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          Download File
        </button>
      </div>
    );
  };

  const isImage = asset.mime_type?.startsWith('image/');

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '1200px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Preview Area */}
        <div style={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto',
          background: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {renderPreview()}
        </div>

        {/* Sidebar */}
        <div style={{
          width: '350px',
          padding: '24px',
          overflowY: 'auto',
          borderLeft: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Asset Details</h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px 8px',
                color: '#666'
              }}
            >
              ×
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <button
              onClick={handleDownload}
              style={{
                flex: 1,
                padding: '10px',
                background: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              Download
            </button>
            <button
              onClick={handleDelete}
              style={{
                flex: 1,
                padding: '10px',
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              Delete
            </button>
          </div>

          {/* Tab Navigation */}
          <div style={{ 
            display: 'flex', 
            gap: 4, 
            marginBottom: 16,
            borderBottom: '2px solid #e0e0e0'
          }}>
            <button
              onClick={() => setActiveTab('metadata')}
              style={{
                flex: 1,
                padding: '10px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'metadata' ? '3px solid #2196f3' : 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                color: activeTab === 'metadata' ? '#2196f3' : '#666',
                marginBottom: '-2px'
              }}
            >
              Metadata
            </button>
            <button
              onClick={() => setActiveTab('tags')}
              style={{
                flex: 1,
                padding: '10px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'tags' ? '3px solid #2196f3' : 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                color: activeTab === 'tags' ? '#2196f3' : '#666',
                marginBottom: '-2px'
              }}
            >
              Tags
            </button>
            {isImage && (
              <button
                onClick={() => setActiveTab('transform')}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'transform' ? '3px solid #2196f3' : 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: activeTab === 'transform' ? '#2196f3' : '#666',
                  marginBottom: '-2px'
                }}
              >
                Transform
              </button>
            )}
          </div>

          {/* Content Area */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activeTab === 'metadata' && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: 4, color: '#666' }}>
                    Filename
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.filename}
                      onChange={(e) => setFormData({ ...formData, filename: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: '14px', padding: '8px 0' }}>{asset.filename}</div>
                  )}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: 4, color: '#666' }}>
                    Alt Text
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.altText}
                      onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
                      placeholder="Describe the image..."
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: '14px', padding: '8px 0', color: formData.altText ? '#333' : '#999' }}>
                      {formData.altText || 'No alt text'}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: 4, color: '#666' }}>
                    Caption
                  </label>
                  {editing ? (
                    <textarea
                      value={formData.caption}
                      onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                      placeholder="Add a caption..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: '14px', padding: '8px 0', color: formData.caption ? '#333' : '#999' }}>
                      {formData.caption || 'No caption'}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: 4, color: '#666' }}>
                    Credit
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.credit}
                      onChange={(e) => setFormData({ ...formData, credit: e.target.value })}
                      placeholder="Photo credit..."
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: '14px', padding: '8px 0', color: formData.credit ? '#333' : '#999' }}>
                      {formData.credit || 'No credit'}
                    </div>
                  )}
                </div>

                {editing ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={handleSave}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#f0f0f0',
                        color: '#333',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#f0f0f0',
                      color: '#333',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600
                    }}
                  >
                    Edit Metadata
                  </button>
                )}

                <div style={{
                  marginTop: 24,
                  paddingTop: 24,
                  borderTop: '1px solid #e0e0e0'
                }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 12 }}>Technical Details</h3>
                  <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.8 }}>
                    <div><strong>Type:</strong> {asset.mime_type}</div>
                    <div><strong>Size:</strong> {formatFileSize(asset.size_bytes)}</div>
                    {asset.width && asset.height && (
                      <div><strong>Dimensions:</strong> {asset.width} × {asset.height}</div>
                    )}
                    <div><strong>Uploaded:</strong> {new Date(asset.created_at).toLocaleString()}</div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'tags' && (
              <TagManager 
                assetId={asset.id} 
                onTagsUpdate={onUpdate}
              />
            )}

            {activeTab === 'transform' && isImage && (
              <ImageTransformControls
                asset={asset}
                onTransform={handleTransform}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
