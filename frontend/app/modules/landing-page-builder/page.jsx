'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

/**
 * Landing Page Builder Module
 * Conversion-focused landing page creation and management
 */
export default function LandingPageBuilder() {
  const router = useRouter();
  const [landingPages, setLandingPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusCounts, setStatusCounts] = useState({});

  useEffect(() => {
    fetchLandingPages();
  }, [statusFilter, searchQuery]);

  const fetchLandingPages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '50',
        offset: '0',
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/v1/landing-pages?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setLandingPages(data.data || []);
        setStatusCounts(data.statusCounts || {});
      }
    } catch (error) {
      console.error('Error fetching landing pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    router.push('/modules/landing-page-builder/new');
  };

  const handleEdit = (id) => {
    router.push(`/modules/landing-page-builder/edit/${id}`);
  };

  const handleViewAnalytics = (id) => {
    router.push(`/modules/landing-page-builder/analytics/${id}`);
  };

  const handleDuplicate = async (id) => {
    try {
      const response = await fetch(`/api/v1/landing-pages/${id}/duplicate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        fetchLandingPages();
      }
    } catch (error) {
      console.error('Error duplicating landing page:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this landing page?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/landing-pages/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchLandingPages();
      }
    } catch (error) {
      console.error('Error deleting landing page:', error);
    }
  };

  const handlePublish = async (id, currentStatus) => {
    const endpoint = currentStatus === 'published' ? 'unpublish' : 'publish';

    try {
      const response = await fetch(`/api/v1/landing-pages/${id}/${endpoint}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        fetchLandingPages();
      }
    } catch (error) {
      console.error(`Error ${endpoint}ing landing page:`, error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          badges[status] || badges.draft
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Landing Page Builder
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Create high-converting landing pages in minutes
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Landing Page
            </button>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
            <div className="bg-white overflow-hidden rounded-lg border border-gray-200 px-4 py-5">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Pages
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {Object.values(statusCounts).reduce((a, b) => a + b, 0)}
              </dd>
            </div>
            <div className="bg-white overflow-hidden rounded-lg border border-gray-200 px-4 py-5">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Published
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-green-600">
                {statusCounts.published || 0}
              </dd>
            </div>
            <div className="bg-white overflow-hidden rounded-lg border border-gray-200 px-4 py-5">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Drafts
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-600">
                {statusCounts.draft || 0}
              </dd>
            </div>
            <div className="bg-white overflow-hidden rounded-lg border border-gray-200 px-4 py-5">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Avg. Conversion
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-blue-600">
                0%
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
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
                placeholder="Search landing pages..."
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Landing Pages List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-500">Loading landing pages...</p>
          </div>
        ) : landingPages.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <RocketLaunchIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No landing pages
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first landing page.
            </p>
            <div className="mt-6">
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Landing Page
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {landingPages.map((page) => (
              <div
                key={page.id}
                className="bg-white overflow-hidden rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200"
              >
                {/* Thumbnail */}
                <div className="h-48 bg-gray-100 relative">
                  {page.og_image ? (
                    <img
                      src={page.og_image}
                      alt={page.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <RocketLaunchIcon className="h-16 w-16 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(page.status)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {page.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {page.description || 'No description'}
                  </p>
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <span>Updated {formatDate(page.updated_at)}</span>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">0</div>
                      <div className="text-xs text-gray-500">Views</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">0</div>
                      <div className="text-xs text-gray-500">Leads</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">0%</div>
                      <div className="text-xs text-gray-500">Conv.</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleEdit(page.id)}
                      className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleViewAnalytics(page.id)}
                      className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <ChartBarIcon className="h-4 w-4 mr-1" />
                      Stats
                    </button>
                  </div>

                  {/* More Actions */}
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handlePublish(page.id, page.status)}
                      className="flex-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      {page.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleDuplicate(page.id)}
                      className="flex-1 text-xs text-gray-600 hover:text-gray-800"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => handleDelete(page.id)}
                      className="flex-1 text-xs text-red-600 hover:text-red-800"
                    >
                      Delete
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
