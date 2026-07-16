'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeSlashIcon,
  TrashIcon,
  StarIcon,
  FlagIcon,
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CloudArrowDownIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';

export default function MarketplaceAdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('pending');
  const [stats, setStats] = useState(null);
  const [pendingComponents, setPendingComponents] = useState([]);
  const [allComponents, setAllComponents] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadData();
  }, [activeTab]);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/v1/marketplace/admin/stats', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      switch (activeTab) {
        case 'pending':
          await loadPendingComponents();
          break;
        case 'components':
          await loadAllComponents();
          break;
        case 'reviews':
          await loadReviews();
          break;
        case 'reports':
          await loadReports();
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingComponents = async () => {
    const res = await fetch('/api/v1/marketplace/admin/components/pending', {
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      setPendingComponents(data.components || []);
    }
  };

  const loadAllComponents = async () => {
    const res = await fetch('/api/v1/marketplace/admin/components', {
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      setAllComponents(data.components || []);
    }
  };

  const loadReviews = async () => {
    const res = await fetch('/api/v1/marketplace/admin/reviews', {
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      setReviews(data.reviews || []);
    }
  };

  const loadReports = async () => {
    const res = await fetch('/api/v1/marketplace/admin/reports', {
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      setReports(data.reports || []);
    }
  };

  const handleApprove = async (id, isFeatured = false) => {
    if (!confirm('Approve this component?')) return;
    
    try {
      const res = await fetch(`/api/v1/marketplace/admin/components/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_featured: isFeatured })
      });
      
      if (res.ok) {
        alert('Component approved!');
        loadData();
        loadStats();
      }
    } catch (error) {
      console.error('Error approving:', error);
      alert('Failed to approve component');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    
    try {
      const res = await fetch(`/api/v1/marketplace/admin/components/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });
      
      if (res.ok) {
        alert('Component rejected');
        loadData();
        loadStats();
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Failed to reject component');
    }
  };

  const handleUnpublish = async (id) => {
    const reason = prompt('Reason for unpublishing:');
    if (!reason) return;
    
    try {
      const res = await fetch(`/api/v1/marketplace/admin/components/${id}/unpublish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });
      
      if (res.ok) {
        alert('Component unpublished');
        loadData();
        loadStats();
      }
    } catch (error) {
      console.error('Error unpublishing:', error);
      alert('Failed to unpublish component');
    }
  };

  const handleToggleFeatured = async (id, currentStatus) => {
    try {
      const res = await fetch(`/api/v1/marketplace/admin/components/${id}/feature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_featured: !currentStatus })
      });
      
      if (res.ok) {
        alert(currentStatus ? 'Component unfeatured' : 'Component featured');
        loadData();
      }
    } catch (error) {
      console.error('Error toggling featured:', error);
      alert('Failed to update featured status');
    }
  };

  const handleDeleteComponent = async (id) => {
    if (!confirm('Permanently delete this component? This cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/v1/marketplace/admin/components/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (res.ok) {
        alert('Component deleted');
        loadData();
        loadStats();
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete component');
    }
  };

  const handleHideReview = async (id) => {
    try {
      const res = await fetch(`/api/v1/marketplace/admin/reviews/${id}/hide`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (res.ok) {
        alert('Review hidden');
        loadData();
      }
    } catch (error) {
      console.error('Error hiding review:', error);
      alert('Failed to hide review');
    }
  };

  const handlePublishReview = async (id) => {
    try {
      const res = await fetch(`/api/v1/marketplace/admin/reviews/${id}/publish`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (res.ok) {
        alert('Review published');
        loadData();
      }
    } catch (error) {
      console.error('Error publishing review:', error);
      alert('Failed to publish review');
    }
  };

  const handleDeleteReview = async (id) => {
    if (!confirm('Delete this review?')) return;
    
    try {
      const res = await fetch(`/api/v1/marketplace/admin/reviews/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (res.ok) {
        alert('Review deleted');
        loadData();
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    }
  };

  const handleResolveReport = async (id, action) => {
    if (!confirm(`Resolve report with action: ${action}?`)) return;
    
    try {
      const res = await fetch(`/api/v1/marketplace/admin/reports/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action })
      });
      
      if (res.ok) {
        alert('Report resolved');
        loadData();
        loadStats();
      }
    } catch (error) {
      console.error('Error resolving report:', error);
      alert('Failed to resolve report');
    }
  };

  const handleDismissReport = async (id) => {
    try {
      const res = await fetch(`/api/v1/marketplace/admin/reports/${id}/dismiss`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (res.ok) {
        alert('Report dismissed');
        loadData();
        loadStats();
      }
    } catch (error) {
      console.error('Error dismissing report:', error);
      alert('Failed to dismiss report');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Marketplace Administration</h1>
          <p className="text-gray-600 mt-1">Manage components, reviews, and reports</p>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={ClockIcon}
              label="Pending Review"
              value={stats.pending_components}
              color="yellow"
            />
            <StatCard
              icon={CheckCircleIcon}
              label="Published"
              value={stats.published_components}
              color="green"
            />
            <StatCard
              icon={FlagIcon}
              label="Pending Reports"
              value={stats.pending_reports}
              color="red"
            />
            <StatCard
              icon={CurrencyDollarIcon}
              label="Total Revenue"
              value={`$${parseFloat(stats.total_revenue).toFixed(2)}`}
              color="blue"
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'pending', label: 'Pending Review', count: stats?.pending_components },
              { id: 'components', label: 'All Components', count: stats?.published_components },
              { id: 'reviews', label: 'Reviews', count: stats?.flagged_reviews },
              { id: 'reports', label: 'Reports', count: stats?.pending_reports }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 py-0.5 px-2 rounded-full bg-gray-200 text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'pending' && (
              <PendingComponentsList
                components={pendingComponents}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            )}
            {activeTab === 'components' && (
              <AllComponentsList
                components={allComponents}
                onUnpublish={handleUnpublish}
                onToggleFeatured={handleToggleFeatured}
                onDelete={handleDeleteComponent}
              />
            )}
            {activeTab === 'reviews' && (
              <ReviewsList
                reviews={reviews}
                onHide={handleHideReview}
                onPublish={handlePublishReview}
                onDelete={handleDeleteReview}
              />
            )}
            {activeTab === 'reports' && (
              <ReportsList
                reports={reports}
                onResolve={handleResolveReport}
                onDismiss={handleDismissReport}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    yellow: 'bg-yellow-50 text-yellow-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    blue: 'bg-blue-50 text-blue-700'
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

function PendingComponentsList({ components, onApprove, onReject }) {
  if (components.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg">
        <CheckCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No pending components</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {components.map(component => (
        <div key={component.id} className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex gap-6">
            <div className="w-48 h-32 bg-gray-200 rounded flex-shrink-0">
              {component.thumbnail_url && (
                <img
                  src={component.thumbnail_url}
                  alt={component.name}
                  className="w-full h-full object-cover rounded"
                />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {component.name}
              </h3>
              <p className="text-gray-600 mb-3 line-clamp-2">{component.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span className="capitalize">{component.category}</span>
                <span>•</span>
                <span>by {component.creator_name}</span>
                <span>•</span>
                <span>{component.is_free ? 'Free' : `$${component.price}`}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onApprove(component.id, false)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Approve
                </button>
                <button
                  onClick={() => onApprove(component.id, true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <StarIcon className="w-5 h-5" />
                  Approve & Feature
                </button>
                <button
                  onClick={() => onReject(component.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <XCircleIcon className="w-5 h-5" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AllComponentsList({ components, onUnpublish, onToggleFeatured, onDelete }) {
  if (components.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg">
        <p className="text-gray-600">No components found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Component</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creator</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {components.map(component => (
            <tr key={component.id}>
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded mr-3">
                    {component.thumbnail_url && (
                      <img src={component.thumbnail_url} alt="" className="w-full h-full object-cover rounded" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{component.name}</div>
                    <div className="text-sm text-gray-500 capitalize">{component.category}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{component.creator_name}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  component.status === 'published' ? 'bg-green-100 text-green-700' :
                  component.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {component.status}
                </span>
                {component.is_featured && (
                  <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                    Featured
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                <div>{component.downloads || 0} downloads</div>
                <div>{component.purchases || 0} purchases</div>
              </td>
              <td className="px-6 py-4 text-right text-sm">
                <button
                  onClick={() => onToggleFeatured(component.id, component.is_featured)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                >
                  {component.is_featured ? 'Unfeature' : 'Feature'}
                </button>
                {component.status === 'published' && (
                  <button
                    onClick={() => onUnpublish(component.id)}
                    className="text-yellow-600 hover:text-yellow-900 mr-3"
                  >
                    Unpublish
                  </button>
                )}
                <button
                  onClick={() => onDelete(component.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReviewsList({ reviews, onHide, onPublish, onDelete }) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg">
        <p className="text-gray-600">No reviews found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map(review => (
        <div key={review.id} className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="font-medium text-gray-900">{review.user_name}</div>
              <div className="text-sm text-gray-600">{review.component_name}</div>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <StarIcon
                  key={star}
                  className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                />
              ))}
            </div>
          </div>
          {review.title && <h4 className="font-medium mb-2">{review.title}</h4>}
          <p className="text-gray-700 mb-4">{review.review_text}</p>
          <div className="flex gap-2">
            {review.status === 'published' ? (
              <button
                onClick={() => onHide(review.id)}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Hide
              </button>
            ) : (
              <button
                onClick={() => onPublish(review.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Publish
              </button>
            )}
            <button
              onClick={() => onDelete(review.id)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportsList({ reports, onResolve, onDismiss }) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg">
        <CheckCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No pending reports</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map(report => (
        <div key={report.id} className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="font-medium text-gray-900">{report.component_name}</div>
              <div className="text-sm text-gray-600">by {report.creator_name}</div>
            </div>
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
              {report.reason}
            </span>
          </div>
          <p className="text-gray-700 mb-3">{report.description}</p>
          <div className="text-sm text-gray-600 mb-4">
            Reported by {report.reporter_name} on {new Date(report.created_at).toLocaleDateString()}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onResolve(report.id, 'unpublish')}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Unpublish Component
            </button>
            <button
              onClick={() => onResolve(report.id, 'delete')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete Component
            </button>
            <button
              onClick={() => onDismiss(report.id)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Dismiss Report
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
