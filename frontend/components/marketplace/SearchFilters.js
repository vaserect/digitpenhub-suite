'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  StarIcon
} from '@heroicons/react/24/outline';

export default function SearchFilters({ onFilterChange }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State for all filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategories, setSelectedCategories] = useState(
    searchParams.get('categories')?.split(',').filter(Boolean) || []
  );
  const [selectedTags, setSelectedTags] = useState(
    searchParams.get('tags')?.split(',').filter(Boolean) || []
  );
  const [isFree, setIsFree] = useState(searchParams.get('is_free') || 'all');
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('min_price') || '',
    max: searchParams.get('max_price') || ''
  });
  const [minRating, setMinRating] = useState(searchParams.get('min_rating') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'popular');
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Available categories
  const categories = [
    'Hero', 'Navigation', 'Footer', 'CTA', 'Feature', 'Testimonial',
    'Pricing', 'FAQ', 'Contact', 'Team', 'Stats', 'Blog',
    'Gallery', 'Form', 'Card', 'Modal', 'Animation', 'Other'
  ];

  // Popular tags
  const popularTags = [
    'responsive', 'modern', 'minimal', 'animated', 'gradient',
    'dark-mode', 'glassmorphism', 'neumorphism', 'colorful', 'professional'
  ];

  // Sort options
  const sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'newest', label: 'Newest First' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'trending', label: 'Trending' },
    { value: 'relevance', label: 'Most Relevant' }
  ];

  // Fetch search suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions(null);
        return;
      }

      try {
        const res = await fetch(
          `/api/v1/marketplace/search/suggestions?q=${encodeURIComponent(searchQuery)}&limit=10`,
          { credentials: 'include' }
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategories.length > 0) params.set('categories', selectedCategories.join(','));
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
    if (isFree !== 'all') params.set('is_free', isFree);
    if (priceRange.min) params.set('min_price', priceRange.min);
    if (priceRange.max) params.set('max_price', priceRange.max);
    if (minRating) params.set('min_rating', minRating);
    if (sortBy !== 'popular') params.set('sort', sortBy);

    const newUrl = params.toString() ? `?${params.toString()}` : '';
    router.push(`/marketplace${newUrl}`, { scroll: false });

    // Notify parent component
    if (onFilterChange) {
      onFilterChange({
        search: searchQuery,
        categories: selectedCategories,
        tags: selectedTags,
        is_free: isFree !== 'all' ? isFree : undefined,
        min_price: priceRange.min,
        max_price: priceRange.max,
        min_rating: minRating,
        sort: sortBy
      });
    }
  }, [searchQuery, selectedCategories, selectedTags, isFree, priceRange, minRating, sortBy]);

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleTagToggle = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedTags([]);
    setIsFree('all');
    setPriceRange({ min: '', max: '' });
    setMinRating('');
    setSortBy('popular');
  };

  const activeFilterCount = 
    selectedCategories.length +
    selectedTags.length +
    (isFree !== 'all' ? 1 : 0) +
    (priceRange.min || priceRange.max ? 1 : 0) +
    (minRating ? 1 : 0);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      {/* Search Bar */}
      <div className="relative mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search components, tags, categories..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Search Suggestions */}
        {showSuggestions && suggestions && (searchQuery.length >= 2) && (
          <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
            {suggestions.components?.length > 0 && (
              <div className="p-2">
                <p className="text-xs font-semibold text-gray-500 uppercase px-2 mb-2">Components</p>
                {suggestions.components.map((comp, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSearchQuery(comp.name);
                      setShowSuggestions(false);
                    }}
                    className="w-full flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded text-left"
                  >
                    {comp.thumbnail_url && (
                      <img src={comp.thumbnail_url} alt="" className="w-10 h-10 object-cover rounded" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{comp.name}</p>
                      <p className="text-xs text-gray-500">{comp.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {suggestions.tags?.length > 0 && (
              <div className="p-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase px-2 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2 px-2">
                  {suggestions.tags.map((tag, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        handleTagToggle(tag.tag);
                        setShowSuggestions(false);
                      }}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
                    >
                      {tag.tag} ({tag.count})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {suggestions.categories?.length > 0 && (
              <div className="p-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase px-2 mb-2">Categories</p>
                {suggestions.categories.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      handleCategoryToggle(cat.category);
                      setShowSuggestions(false);
                    }}
                    className="w-full px-2 py-2 hover:bg-gray-50 rounded text-left text-sm"
                  >
                    {cat.category} ({cat.count})
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Toggle & Sort */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <FunnelIcon className="w-5 h-5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedCategories.map(cat => (
            <span key={cat} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {cat}
              <button onClick={() => handleCategoryToggle(cat)}>
                <XMarkIcon className="w-4 h-4" />
              </button>
            </span>
          ))}
          {selectedTags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              #{tag}
              <button onClick={() => handleTagToggle(tag)}>
                <XMarkIcon className="w-4 h-4" />
              </button>
            </span>
          ))}
          {isFree !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
              {isFree === 'true' ? 'Free' : 'Paid'}
              <button onClick={() => setIsFree('all')}>
                <XMarkIcon className="w-4 h-4" />
              </button>
            </span>
          )}
          {(priceRange.min || priceRange.max) && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
              ${priceRange.min || '0'} - ${priceRange.max || '∞'}
              <button onClick={() => setPriceRange({ min: '', max: '' })}>
                <XMarkIcon className="w-4 h-4" />
              </button>
            </span>
          )}
          {minRating && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
              {minRating}+ ⭐
              <button onClick={() => setMinRating('')}>
                <XMarkIcon className="w-4 h-4" />
              </button>
            </span>
          )}
          <button
            onClick={clearAllFilters}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-200">
          {/* Categories */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {categories.map(category => (
                <label key={category} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {popularTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Price & Type */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Price</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="price-type"
                    checked={isFree === 'all'}
                    onChange={() => setIsFree('all')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">All</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="price-type"
                    checked={isFree === 'true'}
                    onChange={() => setIsFree('true')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Free Only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="price-type"
                    checked={isFree === 'false'}
                    onChange={() => setIsFree('false')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Paid Only</span>
                </label>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Minimum Rating</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(rating => (
                <label key={rating} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    checked={minRating === rating.toString()}
                    onChange={() => setMinRating(rating.toString())}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-1">
                    {[...Array(rating)].map((_, i) => (
                      <StarIcon key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-sm text-gray-700 ml-1">& up</span>
                  </div>
                </label>
              ))}
              <button
                onClick={() => setMinRating('')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear rating filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
