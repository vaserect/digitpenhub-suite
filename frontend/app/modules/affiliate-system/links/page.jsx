'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Link as LinkIcon,
  Plus,
  Copy,
  ExternalLink,
  Edit,
  Trash2,
  QrCode,
  BarChart3,
  MousePointerClick,
  TrendingUp,
  Search,
  Filter,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function TrackingLinksManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [affiliates, setAffiliates] = useState([]);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [links, setLinks] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [formData, setFormData] = useState({
    destination_url: '',
    campaign_name: ''
  });

  useEffect(() => {
    fetchAffiliates();
  }, []);

  useEffect(() => {
    if (selectedAffiliate) {
      fetchLinks(selectedAffiliate);
    }
  }, [selectedAffiliate]);

  const fetchAffiliates = async () => {
    try {
      const res = await fetch('/api/v1/affiliates?status=active&limit=100', {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setAffiliates(data.data || []);
        if (data.data && data.data.length > 0) {
          setSelectedAffiliate(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching affiliates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLinks = async (affiliateId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/affiliates/${affiliateId}/links`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setLinks(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async (e) => {
    e.preventDefault();
    if (!selectedAffiliate) return;

    try {
      const res = await fetch(`/api/v1/affiliates/${selectedAffiliate}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setFormData({ destination_url: '', campaign_name: '' });
        fetchLinks(selectedAffiliate);
      } else {
        alert(data.message || 'Failed to create tracking link');
      }
    } catch (error) {
      console.error('Error creating link:', error);
      alert('Failed to create tracking link');
    }
  };

  const handleCopyLink = (linkCode) => {
    const fullUrl = `${window.location.origin}/api/v1/track/${linkCode}`;
    navigator.clipboard.writeText(fullUrl);
    alert('Link copied to clipboard!');
  };

  const handleToggleActive = async (linkId, currentStatus) => {
    try {
      const res = await fetch(`/api/v1/affiliates/links/${linkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !currentStatus })
      });

      const data = await res.json();
      if (data.success) {
        fetchLinks(selectedAffiliate);
      }
    } catch (error) {
      console.error('Error toggling link status:', error);
    }
  };

  const handleDeleteLink = async (linkId) => {
    if (!confirm('Are you sure you want to delete this tracking link?')) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/affiliates/links/${linkId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await res.json();
      if (data.success) {
        fetchLinks(selectedAffiliate);
      } else {
        alert(data.message || 'Failed to delete link');
      }
    } catch (error) {
      console.error('Error deleting link:', error);
    }
  };

  const generateQRCode = (linkCode) => {
    const fullUrl = `${window.location.origin}/api/v1/track/${linkCode}`;
    // Using a free QR code API
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fullUrl)}`;
  };

  const getTrackingUrl = (linkCode) => {
    return `${window.location.origin}/api/v1/track/${linkCode}`;
  };

  const selectedAffiliateData = affiliates.find(a => a.id === selectedAffiliate);

  if (loading && affiliates.length === 0) {
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
            <h1 className="text-3xl font-bold text-gray-900">Tracking Links</h1>
            <p className="text-gray-600 mt-1">Create and manage affiliate tracking links</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!selectedAffiliate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Create Link
          </button>
        </div>
      </div>

      {/* Affiliate Selector */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Affiliate
        </label>
        <select
          value={selectedAffiliate || ''}
          onChange={(e) => setSelectedAffiliate(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Choose an affiliate...</option>
          {affiliates.map((affiliate) => (
            <option key={affiliate.id} value={affiliate.id}>
              {affiliate.name} ({affiliate.promo_code})
            </option>
          ))}
        </select>
        {selectedAffiliateData && (
          <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
            <span>Email: {selectedAffiliateData.email}</span>
            <span>Commission: {selectedAffiliateData.commission_type === 'percentage' 
              ? `${selectedAffiliateData.commission_value}%`
              : `₦${selectedAffiliateData.commission_value}`
            }</span>
          </div>
        )}
      </div>

      {/* Links Grid */}
      {selectedAffiliate ? (
        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : links.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <LinkIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tracking links yet</h3>
              <p className="text-gray-600 mb-6">Create your first tracking link to start tracking clicks and conversions</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create First Link
              </button>
            </div>
          ) : (
            links.map((link) => (
              <div key={link.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {link.campaign_name || 'Untitled Campaign'}
                        </h3>
                        {link.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Destination: <span className="font-mono text-blue-600">{link.destination_url}</span>
                      </p>
                      <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                        <code className="flex-1 text-sm font-mono text-gray-900 break-all">
                          {getTrackingUrl(link.link_code)}
                        </code>
                        <button
                          onClick={() => handleCopyLink(link.link_code)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg flex-shrink-0"
                          title="Copy link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLink(link);
                            setShowQRModal(true);
                          }}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg flex-shrink-0"
                          title="Generate QR code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <MousePointerClick className="w-4 h-4" />
                        <span className="text-xs font-medium">Clicks</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">{link.total_clicks || 0}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-600 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-medium">Conversions</span>
                      </div>
                      <p className="text-2xl font-bold text-green-900">{link.total_conversions || 0}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-purple-600 mb-1">
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-xs font-medium">Conv. Rate</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-900">
                        {link.total_clicks > 0 
                          ? ((link.total_conversions / link.total_clicks) * 100).toFixed(1)
                          : 0
                        }%
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleToggleActive(link.id, link.is_active)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                        link.is_active
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {link.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => window.open(getTrackingUrl(link.link_code), '_blank')}
                      className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <LinkIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Select an affiliate</h3>
          <p className="text-gray-600">Choose an affiliate from the dropdown above to view and manage their tracking links</p>
        </div>
      )}

      {/* Create Link Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Create Tracking Link</h2>
              <p className="text-sm text-gray-600 mt-1">
                For: {selectedAffiliateData?.name}
              </p>
            </div>
            <form onSubmit={handleCreateLink} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/product"
                  value={formData.destination_url}
                  onChange={(e) => setFormData({ ...formData, destination_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The URL where users will be redirected after clicking the tracking link
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  placeholder="Summer Sale 2024"
                  value={formData.campaign_name}
                  onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Give this link a memorable name for tracking purposes
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ destination_url: '', campaign_name: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">QR Code</h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedLink.campaign_name || 'Tracking Link'}
              </p>
            </div>
            <div className="p-6 text-center">
              <img
                src={generateQRCode(selectedLink.link_code)}
                alt="QR Code"
                className="mx-auto mb-4 border border-gray-200 rounded-lg"
              />
              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code to access the tracking link
              </p>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = generateQRCode(selectedLink.link_code);
                  link.download = `qr-${selectedLink.link_code}.png`;
                  link.click();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Download QR Code
              </button>
            </div>
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowQRModal(false);
                  setSelectedLink(null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
