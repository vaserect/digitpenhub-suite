'use client';
import { useState } from 'react';

export default function ImageTransformControls({ asset, onTransform }) {
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [format, setFormat] = useState('');
  const [quality, setQuality] = useState(85);
  const [fit, setFit] = useState('inside');

  if (!asset?.mime_type?.startsWith('image/')) {
    return null;
  }

  const handleApply = () => {
    const params = new URLSearchParams();
    if (width) params.append('width', width);
    if (height) params.append('height', height);
    if (format) params.append('format', format);
    if (quality !== 85) params.append('quality', quality);
    if (fit !== 'inside') params.append('fit', fit);

    const transformUrl = `/api/v1/dam/${asset.id}/transform?${params.toString()}`;
    if (onTransform) onTransform(transformUrl);
  };

  const handleReset = () => {
    setWidth('');
    setHeight('');
    setFormat('');
    setQuality(85);
    setFit('inside');
  };

  const presets = [
    { name: 'Thumbnail', width: 150, height: 150, fit: 'cover' },
    { name: 'Small', width: 400, height: 400, fit: 'inside' },
    { name: 'Medium', width: 800, height: 800, fit: 'inside' },
    { name: 'Large', width: 1200, height: 1200, fit: 'inside' },
    { name: 'HD', width: 1920, height: 1080, fit: 'inside' }
  ];

  return (
    <div style={{ padding: '16px 0' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 16 }}>
        Image Transformations
      </h3>

      {/* Presets */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: 8, color: '#666' }}>
          Quick Presets
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {presets.map(preset => (
            <button
              key={preset.name}
              onClick={() => {
                setWidth(preset.width.toString());
                setHeight(preset.height.toString());
                setFit(preset.fit);
              }}
              style={{
                padding: '6px 12px',
                background: '#f0f0f0',
                border: '1px solid #ddd',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Dimensions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: 4, color: '#666' }}>
            Width (px)
          </label>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="Auto"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 14
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: 4, color: '#666' }}>
            Height (px)
          </label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="Auto"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 14
            }}
          />
        </div>
      </div>

      {/* Fit Mode */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: 4, color: '#666' }}>
          Fit Mode
        </label>
        <select
          value={fit}
          onChange={(e) => setFit(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: 4,
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          <option value="inside">Inside (maintain aspect)</option>
          <option value="outside">Outside (fill dimensions)</option>
          <option value="cover">Cover (crop to fit)</option>
          <option value="contain">Contain (letterbox)</option>
          <option value="fill">Fill (stretch)</option>
        </select>
      </div>

      {/* Format */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: 4, color: '#666' }}>
          Format
        </label>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: 4,
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          <option value="">Original</option>
          <option value="jpeg">JPEG</option>
          <option value="png">PNG</option>
          <option value="webp">WebP</option>
        </select>
      </div>

      {/* Quality */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: 4, color: '#666' }}>
          Quality: {quality}%
        </label>
        <input
          type="range"
          min="1"
          max="100"
          value={quality}
          onChange={(e) => setQuality(parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleApply}
          style={{
            flex: 1,
            padding: '10px',
            background: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600
          }}
        >
          Apply Transform
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: '10px 16px',
            background: '#f0f0f0',
            color: '#333',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600
          }}
        >
          Reset
        </button>
      </div>

      <div style={{ 
        marginTop: 12, 
        padding: 12, 
        background: '#f9f9f9', 
        borderRadius: 4,
        fontSize: 12,
        color: '#666'
      }}>
        <strong>Note:</strong> Transformations are applied on-the-fly. Original file remains unchanged.
      </div>
    </div>
  );
}
