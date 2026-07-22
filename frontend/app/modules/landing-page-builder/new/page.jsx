'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

/**
 * Landing Page Template Selection
 * Choose from conversion-optimized templates
 */
export default function NewLandingPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/builder/templates?category=landing', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (templateId) => {
    router.push(`/modules/landing-page-builder/editor?template=${templateId}`);
  };

  const handleStartBlank = () => {
    router.push('/modules/landing-page-builder/editor');
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      searchQuery === '' ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || template.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'lead-generation', label: 'Lead Generation' },
    { value: 'sales', label: 'Sales' },
    { value: 'events', label: 'Events' },
    { value: 'services', label: 'Services' },
    { value: 'education', label: 'Education' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'agency', label: 'Agency' },
    { value: 'app', label: 'App' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Choose a Template
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Start with a conversion-optimized template or build from scratch
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search templates..."
              />
            </div>
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Start Blank Option */}
        <div className="mb-8">
          <button
            onClick={handleStartBlank}
            className="w-full bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200"
          >
            <div className="flex flex-col items-center">
              <SparklesIcon className="h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Start from Blank
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Build your landing page from scratch with our drag-and-drop editor
              </p>
            </div>
          </button>
        </div>

        {/* Template Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-500">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No templates found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white overflow-hidden rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                onClick={() => handleSelectTemplate(template.id)}
              >
                {/* Thumbnail */}
                <div className="h-64 bg-gray-100 relative">
                  {template.thumbnail ? (
                    <img
                      src={template.thumbnail}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <SparklesIcon className="h-16 w-16 text-gray-300" />
                    </div>
                  )}
                  {template.is_premium && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Premium
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {template.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {template.tags?.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Use This Template
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
