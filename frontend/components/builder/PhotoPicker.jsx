'use client';

import { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';

/**
 * PhotoPicker Component
 * Allows users to search and select stock photos from Pexels
 */
export default function PhotoPicker({ onSelect, onClose, currentImage = null }) {
  const [activeTab, setActiveTab] = useState('search'); // search, curated, categories
  const [searchQuery, setSearchQuery] = useState('');
  const [photos, setPhotos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [pexelsConfigured, setPexelsConfigured] = useState(false);

  // Check if Pexels is configured
  useEffect(() => {
    checkPexelsStatus();
    loadCategories();
  }, []);

  // Load photos when tab or page changes
  useEffect(() => {
    if (activeTab === 'curated') {
      loadCuratedPhotos();
    }
  }, [activeTab, page]);

  const checkPexelsStatus = async () => {
    try {
      const res = await fetch('/api/v1/pexels/status', {
        credentials: 'include'
      });
      const data = await res.json();
      setPexelsConfigured(data.configured);
      
      if (!data.configured) {
        setError('Pexels API is not configured. Please contact your administrator.');
      }
    } catch (err) {
      console.error('Error checking Pexels status:', err);
      setError('Failed to check Pexels configuration');
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/v1/pexels/categories', {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadCuratedPhotos = async () => {
    if (!pexelsConfigured) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/v1/pexels/curated?page=${page}&perPage=20`, {
        credentials: 'include'
      });
      
      if (!res.ok) throw new Error('Failed to load photos');
      
      const data = await res.json();
      
      if (data.success) {
        setPhotos(prev => page === 1 ? data.data.photos : [...prev, ...data.data.photos]);
        setHasMore(!!data.data.nextPage);
      }
    } catch (err) {
      console.error('Error loading curated photos:', err);
      setError('Failed to load photos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const searchPhotos = async (query) => {
    if (!query.trim() || !pexelsConfigured) return;
    
    setLoading(true);
    setError(null);
    setPage(1);
    
    try {
      const res = await fetch(`/api/v1/pexels/search?query=${encodeURIComponent(query)}&page=1&perPage=20`, {
        credentials: 'include'
      });
      
      if (!res.ok) throw new Error('Failed to search photos');
      
      const data = await res.json();
      
      if (data.success) {
        setPhotos(data.data.photos);
        setHasMore(!!data.data.nextPage);
      }
    } catch (err) {
      console.error('Error searching photos:', err);
      setError('Failed to search photos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryPhotos = async (category) => {
    if (!pexelsConfigured) return;
    
    setLoading(true);
    setError(null);
    setPage(1);
    
    try {
      const res = await fetch(`/api/v1/pexels/category/${category}?page=1&perPage=20`, {
        credentials: 'include'
      });
      
      if (!res.ok) throw new Error('Failed to load category photos');
      
      const data = await res.json();
      
      if (data.success) {
        setPhotos(data.data.photos);
        setHasMore(!!data.data.nextPage);
      }
    } catch (err) {
      console.error('Error loading category photos:', err);
      setError('Failed to load photos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveTab('search');
      searchPhotos(searchQuery);
    }
  };

  const handleCategoryClick = (categoryId) => {
    setActiveTab('categories');
    loadCategoryPhotos(categoryId);
  };

  const handlePhotoSelect = (photo) => {
    setSelectedPhoto(photo);
  };

  const handleConfirmSelection = () => {
    if (selectedPhoto) {
      onSelect({
        url: selectedPhoto.src.large,
        alt: selectedPhoto.alt,
        photographer: selectedPhoto.photographer,
        photographerUrl: selectedPhoto.photographerUrl,
        pexelsId: selectedPhoto.id
      });
      onClose();
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  if (!pexelsConfigured && error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <PhotoIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Stock Photos Unavailable</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Stock Photos</h2>
            <p className="text-sm text-gray-600 mt-1">Powered by Pexels</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for photos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 px-6 pt-4 border-b">
          <button
            onClick={() => {
              setActiveTab('curated');
              setPage(1);
              loadCuratedPhotos();
            }}
            className={`pb-3 px-2 font-medium transition-colors ${
              activeTab === 'curated'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Curated
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`pb-3 px-2 font-medium transition-colors ${
              activeTab === 'categories'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Categories
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Categories Grid */}
          {activeTab === 'categories' && photos.length === 0 && (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-6">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-center"
                >
                  <div className="text-3xl mb-2">{category.icon}</div>
                  <div className="text-sm font-medium text-gray-900">{category.name}</div>
                </button>
              ))}
            </div>
          )}

          {/* Error Message */}
          {error && !loading && (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && photos.length === 0 && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading photos...</p>
            </div>
          )}

          {/* Photos Grid */}
          {photos.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => handlePhotoSelect(photo)}
                    className={`relative cursor-pointer rounded-lg overflow-hidden group ${
                      selectedPhoto?.id === photo.id ? 'ring-4 ring-blue-600' : ''
                    }`}
                  >
                    <img
                      src={photo.src.medium}
                      alt={photo.alt}
                      className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-end">
                      <div className="p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        by {photo.photographer}
                      </div>
                    </div>
                    {selectedPhoto?.id === photo.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="text-center mt-8">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!loading && photos.length === 0 && activeTab !== 'categories' && (
            <div className="text-center py-12">
              <PhotoIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No photos found. Try a different search.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedPhoto && (
              <span>
                Photo by{' '}
                <a
                  href={selectedPhoto.photographerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {selectedPhoto.photographer}
                </a>
                {' '}on Pexels
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSelection}
              disabled={!selectedPhoto}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Use This Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
