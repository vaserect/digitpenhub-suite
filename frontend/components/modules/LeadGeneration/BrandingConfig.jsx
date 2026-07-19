'use client';
import { useState } from 'react';

export default function BrandingConfig({ draft, setDraft }) {
  const brandingConfig = draft.brandingConfig || {
    primaryColor: '#2563eb',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    fontFamily: 'system-ui',
    buttonStyle: 'rounded',
    logoUrl: '',
    customCss: ''
  };

  function updateBranding(key, value) {
    setDraft(prev => ({
      ...prev,
      brandingConfig: { ...brandingConfig, [key]: value }
    }));
  }

  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 15, marginBottom: 12 }}>Custom Branding</h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
        Customize the look and feel of your form to match your brand
      </p>

      <div style={{ display: 'grid', gap: 14 }}>
        {/* Colors */}
        <div className="card" style={{ background: 'var(--surface-muted)', padding: 14 }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Colors</h4>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 12 }}>Primary Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={brandingConfig.primaryColor}
                  onChange={e => updateBranding('primaryColor', e.target.value)}
                  style={{ width: 50, height: 36, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={brandingConfig.primaryColor}
                  onChange={e => updateBranding('primaryColor', e.target.value)}
                  placeholder="#2563eb"
                  style={{ flex: 1, fontSize: 12, padding: '6px 8px' }}
                />
              </div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 12 }}>Background</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={brandingConfig.backgroundColor}
                  onChange={e => updateBranding('backgroundColor', e.target.value)}
                  style={{ width: 50, height: 36, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={brandingConfig.backgroundColor}
                  onChange={e => updateBranding('backgroundColor', e.target.value)}
                  placeholder="#ffffff"
                  style={{ flex: 1, fontSize: 12, padding: '6px 8px' }}
                />
              </div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 12 }}>Text Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={brandingConfig.textColor}
                  onChange={e => updateBranding('textColor', e.target.value)}
                  style={{ width: 50, height: 36, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={brandingConfig.textColor}
                  onChange={e => updateBranding('textColor', e.target.value)}
                  placeholder="#1f2937"
                  style={{ flex: 1, fontSize: 12, padding: '6px 8px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="card" style={{ background: 'var(--surface-muted)', padding: 14 }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Typography</h4>
          <div className="field" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 12 }}>Font Family</label>
            <select
              value={brandingConfig.fontFamily}
              onChange={e => updateBranding('fontFamily', e.target.value)}
              style={{ fontSize: 13, padding: '6px 8px' }}
            >
              <option value="system-ui">System Default</option>
              <option value="'Inter', sans-serif">Inter</option>
              <option value="'Roboto', sans-serif">Roboto</option>
              <option value="'Open Sans', sans-serif">Open Sans</option>
              <option value="'Lato', sans-serif">Lato</option>
              <option value="'Montserrat', sans-serif">Montserrat</option>
              <option value="'Poppins', sans-serif">Poppins</option>
              <option value="'Playfair Display', serif">Playfair Display</option>
              <option value="'Georgia', serif">Georgia</option>
              <option value="'Courier New', monospace">Courier New</option>
            </select>
            <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
              Make sure the font is loaded on your website or use Google Fonts
            </small>
          </div>
        </div>

        {/* Button Style */}
        <div className="card" style={{ background: 'var(--surface-muted)', padding: 14 }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Button Style</h4>
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))' }}>
            {[
              { value: 'rounded', label: 'Rounded', preview: '12px' },
              { value: 'square', label: 'Square', preview: '0px' },
              { value: 'pill', label: 'Pill', preview: '999px' },
              { value: 'soft', label: 'Soft', preview: '6px' }
            ].map(style => (
              <button
                key={style.value}
                type="button"
                onClick={() => updateBranding('buttonStyle', style.value)}
                style={{
                  padding: '10px',
                  border: `2px solid ${brandingConfig.buttonStyle === style.value ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 8,
                  background: brandingConfig.buttonStyle === style.value ? 'rgba(37,99,235,0.05)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontSize: 12
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{style.label}</div>
                <div
                  style={{
                    width: '100%',
                    height: 30,
                    background: brandingConfig.primaryColor,
                    borderRadius: style.preview,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 10
                  }}
                >
                  Submit
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Logo */}
        <div className="card" style={{ background: 'var(--surface-muted)', padding: 14 }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Logo</h4>
          <div className="field" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 12 }}>Logo URL</label>
            <input
              type="url"
              value={brandingConfig.logoUrl}
              onChange={e => updateBranding('logoUrl', e.target.value)}
              placeholder="https://example.com/logo.png"
              style={{ fontSize: 13, padding: '6px 8px' }}
            />
            <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
              Logo will be displayed at the top of the form. Recommended size: 200x60px
            </small>
          </div>
          {brandingConfig.logoUrl && (
            <div style={{ marginTop: 10, padding: 10, background: 'var(--surface)', borderRadius: 6, textAlign: 'center' }}>
              <img
                src={brandingConfig.logoUrl}
                alt="Logo preview"
                style={{ maxWidth: '100%', maxHeight: 60, objectFit: 'contain' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
        </div>

        {/* Advanced */}
        <div className="card" style={{ background: 'var(--surface-muted)', padding: 14 }}>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600
            }}
          >
            <span>Advanced Customization</span>
            <span>{showAdvanced ? '▼' : '▶'}</span>
          </button>

          {showAdvanced && (
            <div style={{ marginTop: 12 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 12 }}>Custom CSS</label>
                <textarea
                  value={brandingConfig.customCss}
                  onChange={e => updateBranding('customCss', e.target.value)}
                  placeholder=".form-container { padding: 20px; }&#10;.submit-button { font-weight: bold; }"
                  rows={6}
                  style={{
                    width: '100%',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '8px 10px',
                    fontSize: 12,
                    resize: 'vertical',
                    fontFamily: 'monospace'
                  }}
                />
                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                  Add custom CSS to further customize your form appearance
                </small>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="card" style={{ marginTop: 14, background: 'var(--surface-muted)', padding: 14 }}>
        <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Preview</h4>
        <div
          style={{
            background: brandingConfig.backgroundColor,
            color: brandingConfig.textColor,
            fontFamily: brandingConfig.fontFamily,
            padding: 20,
            borderRadius: 8,
            border: '1px solid var(--border)'
          }}
        >
          {brandingConfig.logoUrl && (
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <img
                src={brandingConfig.logoUrl}
                alt="Logo"
                style={{ maxWidth: 150, maxHeight: 50, objectFit: 'contain' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Sample Form</div>
          <div style={{ fontSize: 12, marginBottom: 12, opacity: 0.7 }}>This is how your form will look</div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Your Name</label>
            <input
              type="text"
              placeholder="John Doe"
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid rgba(0,0,0,0.2)',
                borderRadius: 6,
                fontSize: 13,
                fontFamily: brandingConfig.fontFamily
              }}
              disabled
            />
          </div>
          <button
            type="button"
            style={{
              background: brandingConfig.primaryColor,
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: brandingConfig.buttonStyle === 'rounded' ? '12px' : brandingConfig.buttonStyle === 'square' ? '0px' : brandingConfig.buttonStyle === 'pill' ? '999px' : '6px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: brandingConfig.fontFamily
            }}
            disabled
          >
            Submit
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14, background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.2)', padding: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text)' }}>💡 Branding Tips:</strong>
          <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
            <li>Use your brand's primary color for buttons and accents</li>
            <li>Ensure sufficient contrast between text and background colors</li>
            <li>Keep your logo simple and recognizable at small sizes</li>
            <li>Test your form on both light and dark backgrounds</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
