'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

/**
 * CMS Collection Block - Renders dynamic content from CMS collections
 * Supports list view (multiple items) and single item view
 */
export default function CMSCollectionBlock({ 
  block, 
  isEditing = false,
  onUpdate,
  orgId 
}) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    collectionId,
    collectionSlug,
    displayMode = 'list', // 'list' or 'single'
    itemsLimit = 10,
    sortBy = 'created_at',
    sortOrder = 'desc',
    filterStatus = 'published',
    layoutTemplate = 'grid', // 'grid', 'list', 'carousel', 'masonry'
    columns = 3,
    showFields = [], // Array of field names to display
    customTemplate = null // Custom HTML template with {{field}} placeholders
  } = block.props || {};

  useEffect(() => {
    if (!isEditing && (collectionId || collectionSlug)) {
      loadItems();
    }
  }, [collectionId, collectionSlug, itemsLimit, sortBy, sortOrder, filterStatus]);

  const loadItems = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        status: filterStatus,
        limit: itemsLimit.toString(),
        sort: sortBy,
        order: sortOrder
      });

      const endpoint = collectionId 
        ? `/api/v1/cms/collections/${collectionId}/items?${params}`
        : `/api/v1/cms/public/${orgId}/${collectionSlug}?${params}`;

      const res = await apiFetch(endpoint);
      setItems(res.items || []);
    } catch (err) {
      console.error('Error loading CMS items:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderField = (item, fieldName) => {
    const value = item.data?.[fieldName];
    
    if (!value) return null;

    // Handle different field types
    if (typeof value === 'string' && value.startsWith('http')) {
      // Image URL
      if (value.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        return (
          <img 
            src={value} 
            alt={item.data?.title || fieldName}
            className="w-full h-auto rounded"
          />
        );
      }
      // Regular URL
      return (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {value}
        </a>
      );
    }

    // Rich text / HTML
    if (fieldName.includes('content') || fieldName.includes('description')) {
      return (
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: value }}
        />
      );
    }

    // Plain text
    return <span>{value}</span>;
  };

  const renderItem = (item) => {
    if (customTemplate) {
      // Replace {{field}} placeholders with actual values
      let html = customTemplate;
      Object.keys(item.data || {}).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, item.data[key] || '');
      });
      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    }

    // Default rendering
    const fieldsToShow = showFields.length > 0 ? showFields : Object.keys(item.data || {});
    
    return (
      <div className="cms-item p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
        {fieldsToShow.map(fieldName => (
          <div key={fieldName} className="mb-3">
            <div className="text-sm font-medium text-gray-700 mb-1 capitalize">
              {fieldName.replace(/_/g, ' ')}
            </div>
            <div className="text-gray-900">
              {renderField(item, fieldName)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getLayoutClasses = () => {
    switch (layoutTemplate) {
      case 'grid':
        return `grid grid-cols-1 md:grid-cols-${Math.min(columns, 3)} lg:grid-cols-${columns} gap-6`;
      case 'list':
        return 'space-y-4';
      case 'carousel':
        return 'flex overflow-x-auto gap-6 snap-x snap-mandatory';
      case 'masonry':
        return 'columns-1 md:columns-2 lg:columns-3 gap-6';
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    }
  };

  // Editing mode - show configuration UI
  if (isEditing) {
    return (
      <div className="p-6 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl">📦</div>
          <div>
            <h3 className="font-semibold text-gray-900">CMS Collection Block</h3>
            <p className="text-sm text-gray-600">
              {collectionSlug || collectionId 
                ? `Displaying items from collection`
                : 'Configure collection to display'}
            </p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between p-2 bg-white rounded">
            <span className="text-gray-600">Display Mode:</span>
            <span className="font-medium">{displayMode}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-white rounded">
            <span className="text-gray-600">Layout:</span>
            <span className="font-medium">{layoutTemplate}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-white rounded">
            <span className="text-gray-600">Items Limit:</span>
            <span className="font-medium">{itemsLimit}</span>
          </div>
        </div>

        <button
          onClick={() => onUpdate?.({ ...block, showSettings: true })}
          className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Configure Collection
        </button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-600">Error loading collection: {error}</p>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 text-center">
        <p className="text-gray-600">No items found in this collection</p>
      </div>
    );
  }

  // Render items
  return (
    <div className={getLayoutClasses()}>
      {items.map((item) => (
        <div key={item.id}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}
