'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DocumentDuplicateIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  EnvelopeIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

const CATEGORY_ICONS = {
  welcome: EnvelopeIcon,
  nurture: UserGroupIcon,
  re_engagement: BoltIcon,
  abandoned_cart: ShoppingCartIcon,
  post_purchase: SparklesIcon,
  event_based: BoltIcon,
  lead_scoring: UserGroupIcon,
};

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, selectedCategory, searchQuery]);

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/v1/automation/templates', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleUseTemplate = async (templateId) => {
    const name = prompt('Enter a name for your new workflow:');
    if (!name) return;

    try {
      const res = await fetch('/api/v1/automation/templates/create-from', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ templateId, name }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/modules/marketing-automation/builder/${data.workflow.id}`);
      }
    } catch (error) {
      console.error('Failed to create workflow from template:', error);
      alert('Failed to create workflow from template');
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      welcome: 'Welcome',
      nurture: 'Lead Nurture',
      re_engagement: 'Re-engagement',
      abandoned_cart: 'Abandoned Cart',
      post_purchase: 'Post-Purchase',
      event_based: 'Event-Based',
      lead_scoring: 'Lead Scoring',
    };
    return labels[category] || category;
  };

  const getCategoryIcon = (category) => {
    const Icon = CATEGORY_ICONS[category] || DocumentDuplicateIcon;
    return Icon;
  };

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'welcome', label: 'Welcome' },
    { value: 'nurture', label: 'Lead Nurture' },
    { value: 're_engagement', label: 'Re-engagement' },
    { value: 'abandoned_cart', label: 'Abandoned Cart' },
    { value: 'post_purchase', label: 'Post-Purchase' },
    { value: 'event_based', label: 'Event-Based' },
    { value: 'lead_scoring', label: 'Lead Scoring' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Automation Templates</h1>
        <p className="mt-2 text-sm text-gray-600">
          Start with pre-built workflows designed for common marketing scenarios
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border-gray-300 rounded-md text-sm"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <DocumentDuplicateIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => {
            const Icon = getCategoryIcon(template.category);
            return (
              <div
                key={template.id}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0">
                      <Icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getCategoryLabel(template.category)}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {template.name}
                  </h3>

                  <p className="text-sm text-gray-500 mb-4 line-clamp-3">
                    {template.description}
                  </p>

                  {/* Tags */}
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {template.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <UserGroupIcon className="h-4 w-4 mr-1" />
                      <span>{template.usage_count || 0} uses</span>
                    </div>
                    {template.rating > 0 && (
                      <div className="flex items-center">
                        <span className="text-yellow-400 mr-1">★</span>
                        <span>{template.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleUseTemplate(template.id)}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Back Button */}
      <div className="mt-8">
        <button
          onClick={() => router.push('/modules/marketing-automation')}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to Workflows
        </button>
      </div>
    </div>
  );
}
