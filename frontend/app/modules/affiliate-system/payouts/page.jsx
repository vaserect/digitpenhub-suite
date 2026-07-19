'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Plus,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Users,
  Calendar,
  FileText,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export default function PayoutsManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [affiliates, setAffiliates] = useState([]);
  const [formData, setFormData] = useState({
    batch_name: '',
    affiliate_ids: [],
    date_range: {
      start_date: '',
      end_date: ''
    },
    payment_method: 'bank_transfer',
    notes: ''
  });

  useEffect(() => {
    fetchBatches();
    fetchAffiliates();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/affiliates/payouts/batches', {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setBatches(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAffiliates = async () => {
    try {
      const res = await fetch('/api/v1/affiliates?status=active&limit=100', {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setAffiliates(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching affiliates:', error);
    }
  };

  const fetchBatchDetails = async (batchId) => {
    try {
      const res = await fetch(`/api/v1/affiliates/payouts/batches/${batchId}`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setSelectedBatch(data.data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching batch details:', error);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/affiliates/payouts/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setFormData({
          batch_name: '',
          affiliate_ids: [],
          date_range: { start_date: '', end_date: '' },
          payment_method: 'bank_transfer',
          notes: ''
        });
        fetchBatches();
      } else {
        alert(data.message || 'Failed to create payout batch');
      }
    } catch (error) {
      console.error('Error creating batch:', error);
      alert('Failed to create payout batch');
    }
  };

  const handleProcessBatch = async (batchId) => {
    const reference = prompt('Enter payment reference/transaction ID:');
    if (!reference) return;

    try {
      const res = await fetch(`/api/v1/affiliates/payouts/batches/${batchId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ payment_reference: reference })
      });

      const data = await res.json();
      if (data.success) {
        alert('Payout batch processed successfully!');
        fetchBatches();
        if (showDetailsModal) {
          fetchBatchDetails(batchId);
        }
      } else {
        alert(data.message || 'Failed to process batch');
      }
    } catch (error) {
      console.error('Error processing batch:', error);
      alert('Failed to process batch');
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
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle }
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

  const toggleAffiliateSelection = (affiliateId) => {
    setFormData(prev => ({
      ...prev,
      affiliate_ids: prev.affiliate_ids.includes(affiliateId)
        ? prev.affiliate_ids.filter(id => id !== affiliateId)
        : [...prev.affiliate_ids, affiliateId]
    }));
  };

  const selectAllAffiliates = () => {
    setFormData(prev => ({
      ...prev,
      affiliate_ids: affiliates.map(a => a.id)
    }));
  };

  const deselectAllAffiliates = () => {
    setFormData(prev => ({
      ...prev,
      affiliate_ids: []
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payout Management</h1>
            <p className="text-gray-600 mt-1">Process affiliate commission payments</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Payout Batch
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {batches.filter(b => b.status === 'pending').length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Processing</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {batches.filter(b => b.status === 'processing').length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Completed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {batches.filter(b => b.status === 'completed').length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">Total Paid</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(
              batches
                .filter(b => b.status === 'completed')
                .reduce((sum, b) => sum + (b.total_amount_ngn || 0), 0)
            )}
          </p>
        </div>
      </div>

      {/* Batches List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Payout Batches</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Affiliates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No payout batches yet</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Create your first batch
                    </button>
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{batch.batch_name}</div>
                      {batch.payment_reference && (
                        <div className="text-xs text-gray-500 mt-1">
                          Ref: {batch.payment_reference}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(batch.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(batch.total_amount_ngn || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        {batch.item_count || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 capitalize">
                        {batch.payment_method?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {new Date(batch.created_at).toLocaleDateString()}
                      </div>
                      {batch.processed_at && (
                        <div className="text-xs text-gray-500">
                          Processed: {new Date(batch.processed_at).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => fetchBatchDetails(batch.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View Details"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        {batch.status === 'pending' && (
                          <button
                            onClick={() => handleProcessBatch(batch.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                          >
                            Process
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Batch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Create Payout Batch</h2>
              <p className="text-sm text-gray-600 mt-1">
                Select affiliates and date range for commission payout
              </p>
            </div>
            <form onSubmit={handleCreateBatch} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., January 2024 Payouts"
                  value={formData.batch_name}
                  onChange={(e) => setFormData({ ...formData, batch_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.date_range.start_date}
                    onChange={(e) => setFormData({
                      ...formData,
                      date_range: { ...formData.date_range, start_date: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.date_range.end_date}
                    onChange={(e) => setFormData({
                      ...formData,
                      date_range: { ...formData.date_range, end_date: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method *
                </label>
                <select
                  required
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Affiliates
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllAffiliates}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={deselectAllAffiliates}
                      className="text-xs text-gray-600 hover:text-gray-800"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
                  {affiliates.length === 0 ? (
                    <p className="p-4 text-center text-gray-500">No active affiliates</p>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {affiliates.map((affiliate) => (
                        <label
                          key={affiliate.id}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.affiliate_ids.includes(affiliate.id)}
                            onChange={() => toggleAffiliateSelection(affiliate.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{affiliate.name}</div>
                            <div className="text-xs text-gray-500">{affiliate.email}</div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatCurrency(affiliate.lifetime_commission_ngn || 0)}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.affiliate_ids.length} affiliate(s) selected
                </p>
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
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Details Modal */}
      {showDetailsModal && selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedBatch.batch_name}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Created {new Date(selectedBatch.created_at).toLocaleDateString()}
                  </p>
                </div>
                {getStatusBadge(selectedBatch.status)}
              </div>
            </div>
            <div className="p-6">
              {/* Batch Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-600 mb-1">Total Amount</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {formatCurrency(selectedBatch.total_amount_ngn || 0)}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-green-600 mb-1">Affiliates</div>
                  <div className="text-2xl font-bold text-green-900">
                    {selectedBatch.items?.length || 0}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm text-purple-600 mb-1">Payment Method</div>
                  <div className="text-lg font-bold text-purple-900 capitalize">
                    {selectedBatch.payment_method?.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>

              {/* Payout Items */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Payout Items</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Affiliate</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedBatch.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {item.affiliate_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.affiliate_email}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                            {formatCurrency(item.amount_ngn || 0)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {getStatusBadge(item.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedBatch.status === 'pending' && (
                  <button
                    onClick={() => handleProcessBatch(selectedBatch.id)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Process Batch
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
