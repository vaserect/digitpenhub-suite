'use client';

import { useState } from 'react';
import {
  XMarkIcon,
  SwatchIcon,
  PhotoIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import PhotoPicker from './PhotoPicker';
import AnimationBuilder from './AnimationBuilder';

export default function BuilderPropertiesPanel({ block, onUpdate, onClose }) {
  const [activeTab, setActiveTab] = useState('content'); // content, style, advanced, animations
  const [showAnimationBuilder, setShowAnimationBuilder] = useState(false);

  const tabs = [
    { id: 'content', label: 'Content', icon: AdjustmentsHorizontalIcon },
    { id: 'style', label: 'Style', icon: SwatchIcon },
    { id: 'animations', label: 'Animations', icon: SparklesIcon },
    { id: 'advanced', label: 'Advanced', icon: PhotoIcon }
  ];

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Block Properties</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Block Type Badge */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          {block.type}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'content' && (
          <ContentTab block={block} onUpdate={onUpdate} />
        )}
        {activeTab === 'style' && (
          <StyleTab block={block} onUpdate={onUpdate} />
        )}
        {activeTab === 'animations' && (
          <AnimationsTab 
            block={block} 
            onUpdate={onUpdate}
            onOpenBuilder={() => setShowAnimationBuilder(true)}
          />
        )}
        {activeTab === 'advanced' && (
          <AdvancedTab block={block} onUpdate={onUpdate} />
        )}
      </div>

      {/* Animation Builder Modal */}
      {showAnimationBuilder && (
        <AnimationBuilder
          block={block}
          onUpdateBlock={onUpdate}
          onClose={() => setShowAnimationBuilder(false)}
        />
      )}
    </div>
  );
}

function ContentTab({ block, onUpdate }) {
  const handleChange = (field, value) => {
    onUpdate({
      props: {
        ...block.props,
        [field]: value
      }
    });
  };

  // Render different fields based on block type
  const renderFields = () => {
    switch (block.type) {
      case 'hero':
        return (
          <>
            <FormField
              label="Title"
              value={block.props?.title || ''}
              onChange={(value) => handleChange('title', value)}
              placeholder="Enter hero title"
            />
            <FormField
              label="Subtitle"
              value={block.props?.subtitle || ''}
              onChange={(value) => handleChange('subtitle', value)}
              placeholder="Enter hero subtitle"
              multiline
            />
            <ImageField
              label="Background Image"
              value={block.props?.backgroundImage || ''}
              onChange={(value) => handleChange('backgroundImage', value)}
              placeholder="https://example.com/image.jpg"
            />
            <FormField
              label="CTA Button Text"
              value={block.props?.ctaText || ''}
              onChange={(value) => handleChange('ctaText', value)}
              placeholder="Get Started"
            />
            <FormField
              label="CTA Button Link"
              value={block.props?.ctaLink || ''}
              onChange={(value) => handleChange('ctaLink', value)}
              placeholder="/signup"
            />
          </>
        );

      case 'features':
        return (
          <>
            <FormField
              label="Section Title"
              value={block.props?.title || ''}
              onChange={(value) => handleChange('title', value)}
              placeholder="Features"
            />
            <FormField
              label="Number of Features"
              type="number"
              value={block.props?.featureCount || 3}
              onChange={(value) => handleChange('featureCount', parseInt(value))}
              min={1}
              max={6}
            />
          </>
        );

      case 'cta':
        return (
          <>
            <FormField
              label="Title"
              value={block.props?.title || ''}
              onChange={(value) => handleChange('title', value)}
              placeholder="Ready to get started?"
            />
            <FormField
              label="Subtitle"
              value={block.props?.subtitle || ''}
              onChange={(value) => handleChange('subtitle', value)}
              placeholder="Join thousands of satisfied customers"
            />
            <FormField
              label="Button Text"
              value={block.props?.ctaText || ''}
              onChange={(value) => handleChange('ctaText', value)}
              placeholder="Sign Up Now"
            />
            <FormField
              label="Button Link"
              value={block.props?.ctaLink || ''}
              onChange={(value) => handleChange('ctaLink', value)}
              placeholder="/signup"
            />
          </>
        );

      case 'testimonials':
        return (
          <>
            <FormField
              label="Section Title"
              value={block.props?.title || ''}
              onChange={(value) => handleChange('title', value)}
              placeholder="What Our Customers Say"
            />
            <FormField
              label="Number of Testimonials"
              type="number"
              value={block.props?.testimonialCount || 2}
              onChange={(value) => handleChange('testimonialCount', parseInt(value))}
              min={1}
              max={4}
            />
          </>
        );

      case 'pricing':
        return (
          <>
            <FormField
              label="Section Title"
              value={block.props?.title || ''}
              onChange={(value) => handleChange('title', value)}
              placeholder="Pricing Plans"
            />
            <FormField
              label="Number of Plans"
              type="number"
              value={block.props?.planCount || 3}
              onChange={(value) => handleChange('planCount', parseInt(value))}
              min={1}
              max={4}
            />
          </>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No content options available for this block type.</p>
            <p className="text-xs mt-2">Use the Style tab to customize appearance.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {renderFields()}
    </div>
  );
}

function StyleTab({ block, onUpdate }) {
  const handleStyleChange = (field, value) => {
    onUpdate({
      props: {
        ...block.props,
        style: {
          ...block.props?.style,
          [field]: value
        }
      }
    });
  };

  return (
    <div className="space-y-4">
      <FormField
        label="Background Color"
        type="color"
        value={block.props?.style?.backgroundColor || '#ffffff'}
        onChange={(value) => handleStyleChange('backgroundColor', value)}
      />
      
      <FormField
        label="Text Color"
        type="color"
        value={block.props?.style?.color || '#000000'}
        onChange={(value) => handleStyleChange('color', value)}
      />
    </div>
  );
}

function AnimationsTab({ block, onUpdate, onOpenBuilder }) {
  const currentAnimation = block.props?.animation;

  const handleRemoveAnimation = () => {
    onUpdate({
      props: {
        ...block.props,
        animation: null
      }
    });
  };

  return (
    <div className="space-y-4">
      {currentAnimation && currentAnimation.type !== 'none' ? (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">Current Animation</h4>
            <button
              onClick={handleRemoveAnimation}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Remove
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium text-gray-900 capitalize">
                {currentAnimation.type?.replace(/-/g, ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Trigger:</span>
              <span className="font-medium text-gray-900 capitalize">
                {currentAnimation.trigger?.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium text-gray-900">
                {currentAnimation.duration}ms
              </span>
            </div>
            {currentAnimation.delay > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Delay:</span>
                <span className="font-medium text-gray-900">
                  {currentAnimation.delay}ms
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onOpenBuilder}
            className="w-full mt-4 px-4 py-2 bg-white border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 font-medium text-sm"
          >
            Edit Animation
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <SparklesIcon className="w-8 h-8 text-purple-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">No Animation</h4>
          <p className="text-sm text-gray-600 mb-4">
            Add entrance, scroll, or hover animations to bring your content to life
          </p>
          <button
            onClick={onOpenBuilder}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-medium"
          >
            Add Animation
          </button>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="text-sm font-semibold text-blue-900 mb-2">💡 Pro Tip</h5>
        <p className="text-xs text-blue-800">
          Use entrance animations to grab attention, scroll animations for progressive reveals, 
          and hover animations for interactive elements.
        </p>
      </div>
    </div>
  );
}

function AdvancedTab({ block, onUpdate }) {
  const handleStyleChange = (field, value) => {
    onUpdate({
      props: {
        ...block.props,
        style: {
          ...block.props?.style,
          [field]: value
        }
      }
    });
  };

  return (
    <div className="space-y-4">
      <FormField
        label="Padding Top (px)"
        type="number"
        value={block.props?.style?.paddingTop || 0}
        onChange={(value) => handleStyleChange('paddingTop', value)}
        min={0}
        max={200}
      />

      <FormField
        label="Padding Bottom (px)"
        type="number"
        value={block.props?.style?.paddingBottom || 0}
        onChange={(value) => handleStyleChange('paddingBottom', value)}
        min={0}
        max={200}
      />

      <FormField
        label="Margin Top (px)"
        type="number"
        value={block.props?.style?.marginTop || 0}
        onChange={(value) => handleStyleChange('marginTop', value)}
        min={0}
        max={200}
      />

      <FormField
        label="Margin Bottom (px)"
        type="number"
        value={block.props?.style?.marginBottom || 0}
        onChange={(value) => handleStyleChange('marginBottom', value)}
        min={0}
        max={200}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Border Radius
        </label>
        <select
          value={block.props?.style?.borderRadius || 'none'}
          onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="none">None</option>
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
          <option value="full">Full</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Shadow
        </label>
        <select
          value={block.props?.style?.boxShadow || 'none'}
          onChange={(e) => handleStyleChange('boxShadow', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="none">None</option>
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
          <option value="xl">Extra Large</option>
        </select>
      </div>
    </div>
  );
}

function SEOTab({ block, onUpdate }) {
  const handleSEOChange = (field, value) => {
    onUpdate({
      props: {
        ...block.props,
        seo: {
          ...block.props?.seo,
          [field]: value
        }
      }
    });
  };

  return (
    <div className="space-y-4">
      <FormField
        label="Meta Title"
        value={block.props?.seo?.title || ''}
        onChange={(value) => handleSEOChange('title', value)}
        placeholder="Page title for SEO"
      />

      <FormField
        label="Meta Description"
        type="textarea"
        value={block.props?.seo?.description || ''}
        onChange={(value) => handleSEOChange('description', value)}
        placeholder="Page description for SEO"
        rows={3}
      />

      <FormField
        label="Meta Keywords"
        value={block.props?.seo?.keywords || ''}
        onChange={(value) => handleSEOChange('keywords', value)}
        placeholder="keyword1, keyword2, keyword3"
      />
    </div>
  );
}

function ImageField({ label, value, onChange, placeholder = '' }) {
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);

  const handlePhotoSelect = (photo) => {
    onChange(photo.url);
    setShowPhotoPicker(false);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="space-y-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={() => setShowPhotoPicker(true)}
          className="w-full px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
        >
          <PhotoIcon className="w-4 h-4" />
          Browse Stock Photos
        </button>
        {value && (
          <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
            <img src={value} alt="Preview" className="w-full h-32 object-cover" />
          </div>
        )}
      </div>
      {showPhotoPicker && (
        <PhotoPicker
          onSelect={handlePhotoSelect}
          onClose={() => setShowPhotoPicker(false)}
          currentImage={value}
        />
      )}
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  multiline = false,
  min,
  max
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      )}
    </div>
  );
}
