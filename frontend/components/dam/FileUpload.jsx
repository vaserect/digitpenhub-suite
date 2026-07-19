'use client';
import { useState, useRef } from 'react';
import { toast } from 'sonner';

export default function FileUpload({ folderId, onUploadComplete }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = async (files) => {
    if (files.length === 0) return;

    if (files.length > 10) {
      toast.error('Maximum 10 files per upload');
      return;
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    const oversized = files.filter(f => f.size > maxSize);
    if (oversized.length > 0) {
      toast.error(`File too large: ${oversized[0].name}. Maximum size is 100MB.`);
      return;
    }

    setUploading(true);
    setUploadProgress(files.map(f => ({ name: f.name, progress: 0 })));

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    if (folderId) {
      formData.append('folderId', folderId);
    }

    try {
      const response = await fetch('/api/v1/dam/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      toast.success(result.message || `Uploaded ${files.length} file(s)`);
      
      if (onUploadComplete) {
        onUploadComplete(result.assets);
      }

      // Reset
      setUploadProgress([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        style={{
          border: isDragging ? '2px dashed #2196f3' : '2px dashed #ccc',
          borderRadius: '8px',
          padding: '40px 20px',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          backgroundColor: isDragging ? '#e3f2fd' : '#fafafa',
          transition: 'all 0.2s'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={uploading}
        />
        
        {uploading ? (
          <div>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
              Uploading...
            </div>
            {uploadProgress.map((file, index) => (
              <div key={index} style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                {file.name}
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📤</div>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
              Drop files here or click to upload
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Maximum 10 files, 100MB each
            </div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
              Supported: Images, Videos, Documents, Archives
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
