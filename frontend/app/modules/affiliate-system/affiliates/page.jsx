'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Pause,
  Play,
  Trash2,
  Edit,
  ExternalLink,
  Mail,
  Phone,
  TrendingUp,
  DollarSign,
  MousePointerClick
} from 'lucide-react';

export default function AffiliatesManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [affiliates, setAffiliates] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAffiliates, setSelectedAffiliates] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    promo_code: '',
    commission_type: 'percentage',
    commission_value: 10,
    payment_method: 'bank_transfer',
    notes: ''
  });

  useEffect(() => {
    fetchAffiliates();
  }, [searchTerm, statusFilter, sortBy, sortOrder, pagination.offset]);

  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pagination.limit,
        offset: pagination.offset,
        sort_by: sortBy,
        sort_order: sortOrder
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`/api/v1/affiliates?${params}`, {
        credentials: 'include'
      });
      const data = await res.json();

      if (data.success) {
        setAffiliates(data.data || []);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching affiliates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAffiliate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          promo_code: '',
          commission_type: 'percentage',
          commission_value: 10,
          payment_method: 'bank_transfer',
          notes: ''
        });
        fetchAffiliates();
      } else {
        alert(data.message || 'Failed to create affiliate');
      }
    } catch (error) {
      console.error('Error creating affiliate:', error);
      alert('Failed to create affiliate');
    }
  };

  const handleApprove = async (affiliateId) => {
    try {
      const res = await fetch(`/api/v1/affiliates/${affiliateId}/approve`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await res.json();
      if (data.success) {
        fetchAffiliates();
      } else {
        alert(data.message || 'Failed to approve affiliate');
      }
    } catch (error) {
      console.error('Error approving affiliate:', error);
    }
  };

  const handlePause = async (affiliateId) => {
    try {
      const res = await fetch(`/api/v1/affiliates/${affiliateId}/pause`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await res.json();
      if (data.success) {
        fetchAffiliates();
      }
    } catch (error) {
      console.error('Error pausing affiliate:', error);
    }
  };

  const handleResume = async (affiliateId) => {
    try {
      const res = await fetch(`/api/v1/affiliates/${affiliateId}/resume`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await res.json();
      if (data.success) {
        fetchAffiliates();
      }
    } catch (error) {
      console.error('Error resuming affiliate:', error);
    }
  };

  const handleDelete = async (affiliateId) => {
    if (!confirm('Are you sure you want to delete this affiliate? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/affiliates/${affiliateId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await res.json();
      if (data.success) {
        fetchAffiliates();
      } else {
        alert(data.message || 'Failed to delete affiliate');
      }
    } catch (error) {
      console.error('Error deleting affiliate:', error);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/v1/affiliates/export?format=csv', {
        credentials: 'include'
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `affiliates-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting affiliates:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount / 100);
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      paused: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Pause },
      terminated: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const generatePromoCode = () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setFormData({ ...formData, promo_code: code });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Affiliate Management</h1>
            <p className="text-gray-600 mt-1">Manage your affiliate partners</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Affiliate
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search affiliates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="paused">Paused</option>
            <option value="terminated">Terminated</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="created_at">Date Created</option>
            <option value="name">Name</option>
            <option value="lifetime_conversions">Conversions</option>
            <option value="lifetime_revenue_ngn">Revenue</option>
            <option value="lifetime_commission_ngn">Commission</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="DESC">Descending</option>
            <option value="ASC">Ascending</option>
          </select>
        </div>
      </div>

      {/* Affiliates Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Affiliate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Promo Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commission
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {affiliates.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No affiliates found</p>
                        <button
                          onClick={() => setShowAddModal(true)}
                          className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Add your first affiliate
                        </button>
                      </td>
                    </tr>
                  ) : (
                    affiliates.map((affiliate) => (
                      <tr key={affiliate.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{affiliate.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                              {affiliate.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {affiliate.email}
                                </span>
                              )}
                              {affiliate.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {affiliate.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {affiliate.promo_code}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(affiliate.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {affiliate.commission_type === 'percentage' 
                                ? `${affiliate.commission_value}%`
                                : formatCurrency(affiliate.commission_value * 100)
                              }
                            </div>
                            <div className="text-gray-500">
                              {affiliate.tier_name || 'No tier'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-2">
                              <MousePointerClick className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-600">{affiliate.total_clicks || 0} clicks</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-600">{affiliate.lifetime_conversions || 0} conversions</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-600">{formatCurrency(affiliate.lifetime_revenue_ngn || 0)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {affiliate.status === 'pending' && (
                              <button
                                onClick={() => handleApprove(affiliate.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {affiliate.status === 'active' && (
                              <button
                                onClick={() => handlePause(affiliate.id)}
                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                                title="Pause"
                              >
                                <Pause className="w-4 h-4" />
                              </button>
                            )}
                            {affiliate.status === 'paused' && (
                              <button
                                onClick={() => handleResume(affiliate.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                title="Resume"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => router.push(`/modules/affiliate-system/affiliates/${affiliate.id}`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="View Details"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(affiliate.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total > pagination.limit && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} affiliates
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination({ ...pagination, offset: Math.max(0, pagination.offset - pagination.limit) })}
                    disabled={pagination.offset === 0}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination({ ...pagination, offset: pagination.offset + pagination.limit })}
                    disabled={pagination.offset + pagination.limit >= pagination.total}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Affiliate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Add New Affiliate</h2>
            </div>
            <form onSubmit={handleCreateAffiliate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Promo Code *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formData.promo_code}
                      onChange={(e) => setFormData({ ...formData, promo_code: e.target.value.toUpperCase() })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    />
                    <button
                      type="button"
                      onClick={generatePromoCode}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commission Type *
                  </label>
                  <select
                    value={formData.commission_type}
                    onChange={(e) => setFormData({ ...formData, commission_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="flat">Flat Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commission Value *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.commission_value}
                    onChange={(e) => setFormData({ ...formData, commission_value: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Stripe</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Affiliate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
