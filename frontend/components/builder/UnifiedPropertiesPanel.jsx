'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * UnifiedPropertiesPanel - Right panel for editing block properties
 * Context-aware based on selected block type
 */
export default function UnifiedPropertiesPanel({
  block,
  project,
  currentPage,
  onUpdate,
  onClose
}) {
  if (!block) return null;

  const handleChange = (field, value) => {
    const updates = { 
      ...block,
      [field]: value 
    };
    onUpdate(updates);
  };

  const handlePropsChange = (field, value) => {
    const updates = { 
      ...block,
      props: { 
        ...(block.props || {}), 
        [field]: value 
      } 
    };
    onUpdate(updates);
  };

  return (
    <div style={{ width: '320px', backgroundColor: '#ffffff', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
          Block Properties
        </h3>
        <button
          onClick={onClose}
          style={{ padding: '4px', color: '#9ca3af', backgroundColor: 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', transition: 'color 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#6b7280'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
        >
          <XMarkIcon style={{ width: '20px', height: '20px' }} />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Block Type
          </div>
          <div style={{ padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: '8px', fontSize: '14px', fontWeight: 500, color: '#111827', textTransform: 'capitalize' }}>
            {block.type}
          </div>
        </div>

        {/* Common Properties */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Block ID (read-only) */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
              Block ID
            </label>
            <input
              type="text"
              value={block.id}
              readOnly
              style={{ width: '100%', padding: '8px 12px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#6b7280' }}
            />
          </div>

          {/* Type-specific properties */}
          {renderTypeSpecificProperties(block, handlePropsChange)}
        </div>

        {/* Advanced Settings */}
        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Advanced
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
                Custom CSS Class
              </label>
              <input
                type="text"
                value={block.props?.className || ''}
                onChange={(e) => handlePropsChange('className', e.target.value)}
                placeholder="custom-class"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
                onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
                Custom ID
              </label>
              <input
                type="text"
                value={block.props?.customId || ''}
                onChange={(e) => handlePropsChange('customId', e.target.value)}
                placeholder="custom-id"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
                onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
        <button
          onClick={onClose}
          style={{ width: '100%', padding: '8px 16px', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500, transition: 'background-color 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
        >
          Done
        </button>
      </div>
    </div>
  );
}

/**
 * Render properties specific to each block type
 */
function renderTypeSpecificProperties(block, onChange) {
  const props = block.props || {};

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '4px'
  };

  switch (block.type) {
    case 'hero':
      return (
        <>
          <div>
            <label style={labelStyle}>
              Heading
            </label>
            <input
              type="text"
              value={props.heading || ''}
              onChange={(e) => onChange('heading', e.target.value)}
              placeholder="Welcome to our site"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Subheading
            </label>
            <input
              type="text"
              value={props.subheading || ''}
              onChange={(e) => onChange('subheading', e.target.value)}
              placeholder="Your tagline goes here"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              CTA Text
            </label>
            <input
              type="text"
              value={props.ctaText || ''}
              onChange={(e) => onChange('ctaText', e.target.value)}
              placeholder="Get Started"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              CTA URL
            </label>
            <input
              type="url"
              value={props.ctaUrl || ''}
              onChange={(e) => onChange('ctaUrl', e.target.value)}
              placeholder="https://..."
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Background Color
            </label>
            <input
              type="color"
              value={props.bgColor || '#2563eb'}
              onChange={(e) => onChange('bgColor', e.target.value)}
              style={{ width: '100%', height: '40px', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' }}
            />
          </div>
        </>
      );

    case 'text':
      return (
        <>
          <div>
            <label style={labelStyle}>
              Heading (Optional)
            </label>
            <input
              type="text"
              value={props.heading || ''}
              onChange={(e) => onChange('heading', e.target.value)}
              placeholder="Section heading"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Body Text
            </label>
            <textarea
              value={props.body || ''}
              onChange={(e) => onChange('body', e.target.value)}
              placeholder="Your content here..."
              rows={6}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
        </>
      );

    case 'image':
      return (
        <>
          <div>
            <label style={labelStyle}>
              Image URL
            </label>
            <input
              type="url"
              value={props.url || ''}
              onChange={(e) => onChange('url', e.target.value)}
              placeholder="https://..."
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          {props.url && (
            <div>
              <img 
                src={props.url} 
                alt={props.alt || ''} 
                style={{ width: '100%', height: '128px', objectFit: 'cover', borderRadius: '8px' }}
              />
            </div>
          )}
          <div>
            <label style={labelStyle}>
              Alt Text
            </label>
            <input
              type="text"
              value={props.alt || ''}
              onChange={(e) => onChange('alt', e.target.value)}
              placeholder="Describe the image"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
        </>
      );

    case 'spacer':
      return (
        <div>
          <label style={labelStyle}>
            Height (px)
          </label>
          <input
            type="number"
            value={props.height || 40}
            onChange={(e) => onChange('height', parseInt(e.target.value))}
            min={8}
            max={400}
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
            onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
          />
        </div>
      );

    case 'video':
      return (
        <>
          <div>
            <label style={labelStyle}>
              Video URL (YouTube/Vimeo)
            </label>
            <input
              type="url"
              value={props.url || ''}
              onChange={(e) => onChange('url', e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Heading (Optional)
            </label>
            <input
              type="text"
              value={props.heading || ''}
              onChange={(e) => onChange('heading', e.target.value)}
              placeholder="Video title"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
        </>
      );

    case 'cta':
    case 'call-to-action':
      return (
        <>
          <div>
            <label style={labelStyle}>
              Heading
            </label>
            <input
              type="text"
              value={props.heading || ''}
              onChange={(e) => onChange('heading', e.target.value)}
              placeholder="Ready to get started?"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Body Text
            </label>
            <textarea
              value={props.body || ''}
              onChange={(e) => onChange('body', e.target.value)}
              placeholder="Describe your offer..."
              rows={3}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Button Text
            </label>
            <input
              type="text"
              value={props.buttonText || ''}
              onChange={(e) => onChange('buttonText', e.target.value)}
              placeholder="Get Started"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Button URL
            </label>
            <input
              type="url"
              value={props.buttonUrl || ''}
              onChange={(e) => onChange('buttonUrl', e.target.value)}
              placeholder="https://..."
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Background Color
            </label>
            <input
              type="color"
              value={props.bgColor || '#f8fafc'}
              onChange={(e) => onChange('bgColor', e.target.value)}
              style={{ width: '100%', height: '40px', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' }}
            />
          </div>
        </>
      );

    case 'form':
      return (
        <>
          <div>
            <label style={labelStyle}>
              Form Title
            </label>
            <input
              type="text"
              value={props.title || ''}
              onChange={(e) => onChange('title', e.target.value)}
              placeholder="Contact Us"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Submit Button Text
            </label>
            <input
              type="text"
              value={props.submitText || ''}
              onChange={(e) => onChange('submitText', e.target.value)}
              placeholder="Submit"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Form Action URL
            </label>
            <input
              type="url"
              value={props.action || ''}
              onChange={(e) => onChange('action', e.target.value)}
              placeholder="/api/submit"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
        </>
      );

    case 'columns':
      return (
        <div>
          <label style={labelStyle}>
            Number of Columns
          </label>
          <input
            type="number"
            value={props.columns || 2}
            onChange={(e) => onChange('columns', parseInt(e.target.value))}
            min={1}
            max={4}
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
            onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
          />
        </div>
      );

    case 'divider':
      return (
        <div>
          <label style={labelStyle}>
            Divider Color
          </label>
          <input
            type="color"
            value={props.color || '#e5e7eb'}
            onChange={(e) => onChange('color', e.target.value)}
            style={{ width: '100%', height: '40px', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' }}
          />
        </div>
      );

    case 'gallery':
      return (
        <>
          <div>
            <label style={labelStyle}>
              Gallery Title
            </label>
            <input
              type="text"
              value={props.title || ''}
              onChange={(e) => onChange('title', e.target.value)}
              placeholder="Photo Gallery"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Columns
            </label>
            <input
              type="number"
              value={props.columns || 3}
              onChange={(e) => onChange('columns', parseInt(e.target.value))}
              min={1}
              max={6}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
        </>
      );

    case 'countdown':
      return (
        <>
          <div>
            <label style={labelStyle}>
              Target Date & Time
            </label>
            <input
              type="datetime-local"
              value={props.targetDate || ''}
              onChange={(e) => onChange('targetDate', e.target.value)}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Heading
            </label>
            <input
              type="text"
              value={props.heading || ''}
              onChange={(e) => onChange('heading', e.target.value)}
              placeholder="Limited Time Offer"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
        </>
      );

    case 'embed':
    case 'embed-code':
      return (
        <>
          <div>
            <label style={labelStyle}>
              Embed Code
            </label>
            <textarea
              value={props.code || ''}
              onChange={(e) => onChange('code', e.target.value)}
              placeholder="<iframe>...</iframe>"
              rows={6}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div style={{ padding: '8px', backgroundColor: '#fef3c7', borderRadius: '8px', fontSize: '12px', color: '#92400e' }}>
            ⚠️ Only embed code from trusted sources
          </div>
        </>
      );

    case 'features':
      return (
        <>
          <div>
            <label style={labelStyle}>
              Section Heading
            </label>
            <input
              type="text"
              value={props.heading || ''}
              onChange={(e) => onChange('heading', e.target.value)}
              placeholder="Our Features"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
              Feature items are managed in the advanced editor
            </p>
            <p style={{ fontSize: '11px', color: '#9ca3af' }}>
              Current items: {(props.items || []).length}
            </p>
          </div>
        </>
      );

    case 'testimonials':
      return (
        <>
          <div>
            <label style={labelStyle}>
              Section Heading
            </label>
            <input
              type="text"
              value={props.heading || ''}
              onChange={(e) => onChange('heading', e.target.value)}
              placeholder="What Our Clients Say"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
              Testimonial items are managed in the advanced editor
            </p>
            <p style={{ fontSize: '11px', color: '#9ca3af' }}>
              Current testimonials: {(props.items || []).length}
            </p>
          </div>
        </>
      );

    case 'pricing':
      return (
        <>
          <div>
            <label style={labelStyle}>
              Section Heading
            </label>
            <input
              type="text"
              value={props.heading || ''}
              onChange={(e) => onChange('heading', e.target.value)}
              placeholder="Choose Your Plan"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Subheading
            </label>
            <input
              type="text"
              value={props.subheading || ''}
              onChange={(e) => onChange('subheading', e.target.value)}
              placeholder="Simple, transparent pricing"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>
              Pricing plans are managed in the advanced editor
            </p>
          </div>
        </>
      );

    case 'faq':
      return (
        <>
          <div>
            <label style={labelStyle}>
              Section Heading
            </label>
            <input
              type="text"
              value={props.heading || ''}
              onChange={(e) => onChange('heading', e.target.value)}
              placeholder="Frequently Asked Questions"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>
              FAQ items are managed in the advanced editor
            </p>
          </div>
        </>
      );

    case 'team':
      return (
        <>
          <div>
            <label style={labelStyle}>
              Section Heading
            </label>
            <input
              type="text"
              value={props.heading || ''}
              onChange={(e) => onChange('heading', e.target.value)}
              placeholder="Meet Our Team"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>
              Team members are managed in the advanced editor
            </p>
          </div>
        </>
      );

    case 'newsletter':
      return (
        <>
          <div>
            <label style={labelStyle}>
              Heading
            </label>
            <input
              type="text"
              value={props.heading || ''}
              onChange={(e) => onChange('heading', e.target.value)}
              placeholder="Subscribe to our newsletter"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Description
            </label>
            <textarea
              value={props.description || ''}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Get the latest updates..."
              rows={3}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Button Text
            </label>
            <input
              type="text"
              value={props.buttonText || ''}
              onChange={(e) => onChange('buttonText', e.target.value)}
              placeholder="Subscribe"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
        </>
      );

    case 'stats':
      return (
        <>
          <div>
            <label style={labelStyle}>
              Section Heading
            </label>
            <input
              type="text"
              value={props.heading || ''}
              onChange={(e) => onChange('heading', e.target.value)}
              placeholder="Our Impact"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>
              Statistics are managed in the advanced editor
            </p>
          </div>
        </>
      );

    case 'contact':
      return (
        <>
          <div>
            <label style={labelStyle}>
              Heading
            </label>
            <input
              type="text"
              value={props.heading || ''}
              onChange={(e) => onChange('heading', e.target.value)}
              placeholder="Get in Touch"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Email
            </label>
            <input
              type="email"
              value={props.email || ''}
              onChange={(e) => onChange('email', e.target.value)}
              placeholder="contact@example.com"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Phone
            </label>
            <input
              type="tel"
              value={props.phone || ''}
              onChange={(e) => onChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Address
            </label>
            <textarea
              value={props.address || ''}
              onChange={(e) => onChange('address', e.target.value)}
              placeholder="123 Main St, City, State 12345"
              rows={3}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
        </>
      );

    case 'social':
    case 'social-links':
      return (
        <>
          <div>
            <label style={labelStyle}>
              Facebook URL
            </label>
            <input
              type="url"
              value={props.facebook || ''}
              onChange={(e) => onChange('facebook', e.target.value)}
              placeholder="https://facebook.com/..."
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Twitter URL
            </label>
            <input
              type="url"
              value={props.twitter || ''}
              onChange={(e) => onChange('twitter', e.target.value)}
              placeholder="https://twitter.com/..."
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              LinkedIn URL
            </label>
            <input
              type="url"
              value={props.linkedin || ''}
              onChange={(e) => onChange('linkedin', e.target.value)}
              placeholder="https://linkedin.com/..."
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Instagram URL
            </label>
            <input
              type="url"
              value={props.instagram || ''}
              onChange={(e) => onChange('instagram', e.target.value)}
              placeholder="https://instagram.com/..."
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
        </>
      );

    case 'tabs':
      return (
        <>
          <div>
            <label style={labelStyle}>
              Section Heading
            </label>
            <input
              type="text"
              value={props.heading || ''}
              onChange={(e) => onChange('heading', e.target.value)}
              placeholder="Tabbed Content"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>
              Tab items are managed in the advanced editor
            </p>
          </div>
        </>
      );

    case 'accordion':
      return (
        <>
          <div>
            <label style={labelStyle}>
              Section Heading
            </label>
            <input
              type="text"
              value={props.heading || ''}
              onChange={(e) => onChange('heading', e.target.value)}
              placeholder="Accordion Content"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>
              Accordion items are managed in the advanced editor
            </p>
          </div>
        </>
      );

    case 'map':
      return (
        <>
          <div>
            <label style={labelStyle}>
              Location/Address
            </label>
            <input
              type="text"
              value={props.location || ''}
              onChange={(e) => onChange('location', e.target.value)}
              placeholder="123 Main St, City, State"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Map Height (px)
            </label>
            <input
              type="number"
              value={props.height || 400}
              onChange={(e) => onChange('height', parseInt(e.target.value))}
              min={200}
              max={800}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
        </>
      );

    case 'nav':
    case 'navigation':
      return (
        <>
          <div>
            <label style={labelStyle}>
              Logo Text
            </label>
            <input
              type="text"
              value={props.logoText || ''}
              onChange={(e) => onChange('logoText', e.target.value)}
              placeholder="Your Brand"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Logo Image URL
            </label>
            <input
              type="url"
              value={props.logoUrl || ''}
              onChange={(e) => onChange('logoUrl', e.target.value)}
              placeholder="https://..."
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>
              Navigation links are managed in the advanced editor
            </p>
          </div>
        </>
      );

    case 'footer':
      return (
        <>
          <div>
            <label style={labelStyle}>
              Copyright Text
            </label>
            <input
              type="text"
              value={props.copyright || ''}
              onChange={(e) => onChange('copyright', e.target.value)}
              placeholder="© 2024 Your Company. All rights reserved."
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>
              Footer links and columns are managed in the advanced editor
            </p>
          </div>
        </>
      );

    case 'portfolio':
    case 'blog':
    case 'timeline':
    case 'process':
    case 'comparison':
    case 'logo-cloud':
      return (
        <>
          <div>
            <label style={labelStyle}>
              Section Heading
            </label>
            <input
              type="text"
              value={props.heading || ''}
              onChange={(e) => onChange('heading', e.target.value)}
              placeholder={`${block.type.charAt(0).toUpperCase() + block.type.slice(1)} Section`}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Description
            </label>
            <textarea
              value={props.description || ''}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Section description..."
              rows={3}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid #2563eb'; e.currentTarget.style.borderColor = 'transparent'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>
              {block.type.charAt(0).toUpperCase() + block.type.slice(1)} items are managed in the advanced editor
            </p>
          </div>
        </>
      );

    default:
      return (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Properties for {block.type} block coming soon
          </p>
        </div>
      );
  }
}