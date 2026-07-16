'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CloudArrowDownIcon,
  ShoppingCartIcon,
  StarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export default function CreatorDashboardPage() {
  const router = useRouter();
  const [components, setComponents] = useState([]);
  const [stats, setStats] = useState({
    totalComponents: 0,
    totalEarnings: 0,
    totalDownloads: 0,
    totalPurchases: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadComponents();
  }, []);

  const loadComponents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/marketplace/my-components', {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setComponents(data.components || []);
        
        // Calculate stats
        const totalEarnings = data.components.reduce((sum, c) => sum + parseFloat(c.total_earnings || 0), 0);
        const totalDownloads = data.components.reduce((sum, c) => sum + parseInt(c.download_count || 0), 0);
        const totalPurchases = data.components.reduce((sum, c) => sum + parseInt(c.purchase_count || 0), 0);
        
        setStats({
          totalComponents: data.components.length,
          totalEarnings,
          totalDownloads,
          totalPurchases
        });
      }
    } catch (error) {
      console.error('Error loading components:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this component? This cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/v1/marketplace/components/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (res.ok) {
        alert('Component deleted');
        loadComponents();
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete component');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Creator Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your marketplace components</p>
            </div>
            <button
              onClick={() => router.push('/marketplace/creator/upload')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Upload Component
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={ChartBarIcon}
            label="Total Components"
            value={stats.totalComponents}
            color="blue"
          />
          <StatCard
            icon={CurrencyDollarIcon}
            label="Total Earnings"
            value={`$${stats.totalEarnings.toFixed(2)}`}
            color="green"
          />
          <StatCard
            icon={CloudArrowDownIcon}
            label="Total Downloads"
            value={stats.totalDownloads}
            color="purple"
          />
          <StatCard
            icon={ShoppingCartIcon}
            label="Total Purchases"
            value={stats.totalPurchases}
            color="orange"
          />
        </div>
      </div>

      {/* Components List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Components</h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : components.length === 0 ? (
            <div className="text-center py-12">
              <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">You haven't uploaded any components yet</p>
              <button
                onClick={() => router.push('/marketplace/creator/upload')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Upload Your First Component
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {components.map(component => (
                <ComponentRow
                  key={component.id}
                  component={component}
                  onEdit={() => router.push(`/marketplace/creator/edit/${component.id}`)}
                  onDelete={() => handleDelete(component.id)}
                  onView={() => router.push(`/marketplace/${component.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Tips for Success</h3>
          <ul className="space-y-2 text-blue-800">
            <li>• Use high-quality preview images to showcase your components</li>
            <li>• Write clear, detailed descriptions explaining features and use cases</li>
            <li>• Add relevant tags to help users discover your components</li>
            <li>• Respond to reviews and feedback to build trust</li>
            <li>• Keep your components updated with the latest features</li>
            <li>• Consider offering a free version to attract more users</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ComponentRow({ component, onEdit, onDelete, onView }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'unpublished':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'published':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4" />;
      case 'rejected':
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 hover:bg-gray-50">
      <div className="flex gap-6">
        {/* Thumbnail */}
        <div className="w-32 h-24 bg-gray-200 rounded flex-shrink-0">
          {component.thumbnail_url ? (
            <img
              src={component.thumbnail_url}
              alt={component.name}
              className="w-full h-full object-cover rounded"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-xs">
              No Preview
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {component.name}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {component.description}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(component.status)}`}>
              {getStatusIcon(component.status)}
              {component.status}
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-3">
            <div>
              <div className="text-sm text-gray-600">Price</div>
              <div className="font-semibold text-gray-900">
                {component.is_free ? 'Free' : `$${component.price}`}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Downloads</div>
              <div className="font-semibold text-gray-900">{component.download_count || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Purchases</div>
              <div className="font-semibold text-gray-900">{component.purchase_count || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Earnings</div>
              <div className="font-semibold text-gray-900">
                ${parseFloat(component.total_earnings || 0).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1">
              <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium text-gray-900">
                {component.rating_average?.toFixed(1) || '0.0'}
              </span>
              <span className="text-sm text-gray-600">
                ({component.rating_count || 0} reviews)
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <EyeIcon className="w-4 h-4" />
              {component.views || 0} views
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onView}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm flex items-center gap-2"
            >
              <EyeIcon className="w-4 h-4" />
              View
            </button>
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm flex items-center gap-2"
            >
              <PencilIcon className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm flex items-center gap-2"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
