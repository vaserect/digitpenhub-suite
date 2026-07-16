'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SearchFilters from '@/components/marketplace/SearchFilters';
import {
  SparklesIcon,
  HeartIcon,
  StarIcon,
  CloudArrowDownIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

export default function MarketplacePage() {
  const router = useRouter();
  const [components, setComponents] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFilters, setCurrentFilters] = useState({});

  useEffect(() => {
    loadFeatured();
    loadComponents();
  }, []);

  const loadFeatured = async () => {
    try {
      const res = await fetch('/api/v1/marketplace/featured', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setFeatured(data.components || []);
      }
    } catch (error) {
      console.error('Error loading featured:', error);
    }
  };

  const loadComponents = async (filters = {}) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.categories?.length > 0) params.append('categories', filters.categories.join(','));
      if (filters.tags?.length > 0) params.append('tags', filters.tags.join(','));
      if (filters.is_free) params.append('is_free', filters.is_free);
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);
      if (filters.min_rating) params.append('min_rating', filters.min_rating);
      if (filters.sort) params.append('sort', filters.sort);

      const res = await fetch(`/api/v1/marketplace/components?${params}`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setComponents(data.components || []);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error loading components:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (filters) => {
    setCurrentFilters(filters);
    loadComponents(filters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <SparklesIcon className="w-12 h-12" />
              <h1 className="text-4xl font-bold">Component Marketplace</h1>
            </div>
            <p className="text-xl text-blue-100 mb-8">
              Discover, share, and sell professional website components
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-3xl font-bold">{pagination?.total || 0}</div>
                <div className="text-sm text-blue-100">Components</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-3xl font-bold">{featured.length}</div>
                <div className="text-sm text-blue-100">Featured</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-3xl font-bold">18</div>
                <div className="text-sm text-blue-100">Categories</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Components */}
      {featured.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 mb-6">
            <SparklesIcon className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900">Featured Components</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.slice(0, 4).map(component => (
              <ComponentCard key={component.id} component={component} />
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <SearchFilters onFilterChange={handleFilterChange} />

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : components.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-600 text-lg mb-2">No components found</p>
            <p className="text-gray-500 text-sm">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Showing <span className="font-semibold">{components.length}</span> of{' '}
                <span className="font-semibold">{pagination?.total || 0}</span> components
              </p>
            </div>

            {/* Components Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {components.map(component => (
                <ComponentCard key={component.id} component={component} />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex gap-2">
                  {[...Array(Math.min(pagination.pages, 10))].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const newFilters = { ...currentFilters, page: i + 1 };
                        loadComponents(newFilters);
                      }}
                      className={`px-4 py-2 rounded-lg ${
                        pagination.page === i + 1
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ComponentCard({ component }) {
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(component.is_favorited || false);

  const handleFavorite = async (e) => {
    e.stopPropagation();
    try {
      const method = isFavorited ? 'DELETE' : 'POST';
      const res = await fetch(`/api/v1/marketplace/components/${component.id}/favorite`, {
        method,
        credentials: 'include'
      });
      
      if (res.ok) {
        setIsFavorited(!isFavorited);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  return (
    <div
      onClick={() => router.push(`/marketplace/${component.id}`)}
      className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer overflow-hidden group"
    >
      {/* Thumbnail */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        {component.thumbnail_url ? (
          <img
            src={component.thumbnail_url}
            alt={component.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No Preview
          </div>
        )}
        
        {/* Favorite Button */}
        <button
          onClick={handleFavorite}
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
        >
          {isFavorited ? (
            <HeartSolidIcon className="w-5 h-5 text-red-500" />
          ) : (
            <HeartIcon className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {/* Featured Badge */}
        {component.is_featured && (
          <span className="absolute top-2 left-2 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded">
            Featured
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
          {component.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {component.description}
        </p>

        {/* Creator */}
        <div className="flex items-center gap-2 mb-3">
          {component.creator_avatar ? (
            <img
              src={component.creator_avatar}
              alt={component.creator_name}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
          )}
          <span className="text-xs text-gray-600">{component.creator_name}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <StarIcon className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span>{component.rating_average?.toFixed(1) || '0.0'}</span>
            </div>
            <div className="flex items-center gap-1">
              <CloudArrowDownIcon className="w-4 h-4" />
              <span>{component.downloads || 0}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500 capitalize">{component.category}</span>
          {component.is_free ? (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded">
              Free
            </span>
          ) : (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded flex items-center gap-1">
              <CurrencyDollarIcon className="w-4 h-4" />
              {component.currency} {component.price}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}