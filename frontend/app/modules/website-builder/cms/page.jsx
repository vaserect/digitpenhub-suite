'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

export default function CMSPage() {
  const router = useRouter();
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/v1/cms/collections');
      setCollections(res.collections || []);
    } catch (err) {
      console.error('Error loading collections:', err);
      toast.error('Failed to load collections');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCollection = () => {
    router.push('/modules/website-builder/cms/new');
  };

  const handleViewCollection = (collectionId) => {
    router.push(`/modules/website-builder/cms/${collectionId}`);
  };

  const handleDeleteCollection = async (collectionId, collectionName) => {
    if (!confirm(`Are you sure you want to delete "${collectionName}"? This will delete all items in this collection.`)) {
      return;
    }

    try {
      await apiFetch(`/api/v1/cms/collections/${collectionId}`, {
        method: 'DELETE'
      });
      toast.success('Collection deleted successfully');
      loadCollections();
    } catch (err) {
      console.error('Error deleting collection:', err);
      toast.error('Failed to delete collection');
    }
  };

  const filteredCollections = collections.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CMS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CMS Collections</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage dynamic content for your website
              </p>
            </div>
            <button
              onClick={handleCreateCollection}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              New Collection
            </button>
          </div>

          {/* Search */}
          <div className="mt-6">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredCollections.length === 0 ? (
          <div className="text-center py-12">
            <FolderIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No collections found' : 'No collections yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Create your first collection to start managing dynamic content'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleCreateCollection}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Create Collection
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCollections.map((collection) => (
              <div
                key={collection.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{collection.icon || '📦'}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{collection.name}</h3>
                        <p className="text-sm text-gray-500">{collection.slug}</p>
                      </div>
                    </div>
                  </div>

                  {collection.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {collection.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <DocumentTextIcon className="w-4 h-4" />
                      {collection.item_count || 0} items
                    </span>
                    {collection.is_public && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                        Public
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewCollection(collection.id)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
                    >
                      <EyeIcon className="w-4 h-4" />
                      View Items
                    </button>
                    <button
                      onClick={() => router.push(`/modules/website-builder/cms/${collection.id}/edit`)}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 flex items-center justify-center"
                      title="Edit collection"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCollection(collection.id, collection.name)}
                      className="px-3 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50 flex items-center justify-center"
                      title="Delete collection"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
