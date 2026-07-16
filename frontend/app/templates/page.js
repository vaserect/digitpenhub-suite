'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function TemplatesLibrary() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Apply filters whenever they change
  useEffect(() => {
    applyFilters();
  }, [templates, searchQuery, selectedCategory, showPremiumOnly]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/site-templates`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch templates');
      
      const data = await response.json();
      setTemplates(data.data || []);
      setFilteredTemplates(data.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...templates];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.category?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Premium filter
    if (showPremiumOnly) {
      filtered = filtered.filter(t => t.is_premium);
    }

    setFilteredTemplates(filtered);
  };

  // Get unique categories for filters
  const categories = ['all', ...new Set(templates.map(t => t.category).filter(Boolean))].sort();

  const handleTemplateClick = (templateId) => {
    router.push(`/templates/preview/${templateId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Website Templates</h1>
          <p className="text-lg text-gray-600">
            Choose from {templates.length} professionally designed templates
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Templates
              </label>
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggle Filters */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showPremiumOnly}
                onChange={(e) => setShowPremiumOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Premium Only</span>
            </label>
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredTemplates.length}</span> of{' '}
              <span className="font-semibold">{templates.length}</span> templates
            </p>
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No templates found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setShowPremiumOnly(false);
              }}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleTemplateClick(template.id)}
                className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer overflow-hidden group"
              >
                {/* Thumbnail */}
                <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
                  {template.thumbnail_url ? (
                    <Image
                      src={template.thumbnail_url}
                      alt={template.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center p-4">
                        <div className="text-4xl mb-2">🎨</div>
                        <div className="text-sm font-medium text-gray-600">{template.name}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-2 right-2 flex gap-2">
                    {template.is_premium && (
                      <span className="px-2 py-1 bg-purple-600 text-white text-xs font-semibold rounded">
                        Premium
                      </span>
                    )}
                    {!template.is_premium && (
                      <span className="px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded">
                        Free
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  {template.rating > 0 && (
                    <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
                      ⭐ {template.rating.toFixed(1)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
                    {template.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-600 capitalize">{template.category}</span>
                    {template.pages && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-600">{template.pages.length} pages</span>
                      </>
                    )}
                  </div>

                  {template.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {template.description}
                    </p>
                  )}

                  {/* Features */}
                  {template.features && template.features.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {template.features.slice(0, 3).map((feature, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                    Preview & Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}