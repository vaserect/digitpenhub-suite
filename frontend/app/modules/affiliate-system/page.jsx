'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  TrendingUp,
  DollarSign,
  MousePointerClick,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  BarChart3,
  Link as LinkIcon,
  Package,
  CreditCard
} from 'lucide-react';

export default function AffiliateSystemDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [affiliates, setAffiliates] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [recentConversions, setRecentConversions] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics
      const analyticsRes = await fetch('/api/v1/affiliates/analytics', {
        credentials: 'include'
      });
      const analyticsData = await analyticsRes.json();
      setStats(analyticsData.data);

      // Fetch affiliates list
      const affiliatesRes = await fetch('/api/v1/affiliates?limit=10', {
        credentials: 'include'
      });
      const affiliatesData = await affiliatesRes.json();
      setAffiliates(affiliatesData.data || []);

      // Fetch top performers
      const topRes = await fetch('/api/v1/affiliates/top-performers?limit=5', {
        credentials: 'include'
      });
      const topData = await topRes.json();
      setTopPerformers(topData.data || []);

      // Fetch fraud alerts
      const fraudRes = await fetch('/api/v1/affiliates/fraud-alerts?is_resolved=false', {
        credentials: 'include'
      });
      const fraudData = await fraudRes.json();
      setFraudAlerts(fraudData.data || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
      paused: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle },
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
            <h1 className="text-3xl font-bold text-gray-900">Affiliate System</h1>
            <p className="text-gray-600 mt-1">Manage your affiliate program and track performance</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/modules/affiliate-system/materials')}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              Materials
            </button>
            <button
              onClick={() => router.push('/modules/affiliate-system/affiliates')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Affiliate
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Affiliates</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.total_affiliates || 0}
              </p>
              <p className="text-sm text-green-600 mt-1">
                {stats?.active_affiliates || 0} active
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clicks</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.total_clicks?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {stats?.overall_conversion_rate || 0}% conversion
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <MousePointerClick className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats?.total_revenue_ngn || 0)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {stats?.total_conversions || 0} conversions
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Commission</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats?.total_commission_ngn || 0)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Owed to affiliates
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Fraud Alerts */}
      {fraudAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Fraud Alerts</h3>
              <p className="text-sm text-red-700 mt-1">
                {fraudAlerts.length} unresolved fraud alert{fraudAlerts.length !== 1 ? 's' : ''} detected
              </p>
              <button
                onClick={() => router.push('/modules/affiliate-system/analytics?tab=fraud')}
                className="text-sm text-red-600 hover:text-red-800 font-medium mt-2 inline-flex items-center gap-1"
              >
                View Details
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => router.push('/modules/affiliate-system/affiliates')}
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow text-left"
        >
          <Users className="w-8 h-8 text-blue-600 mb-2" />
          <h3 className="font-semibold text-gray-900">Manage Affiliates</h3>
          <p className="text-sm text-gray-600 mt-1">View and manage all affiliates</p>
        </button>

        <button
          onClick={() => router.push('/modules/affiliate-system/links')}
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow text-left"
        >
          <LinkIcon className="w-8 h-8 text-purple-600 mb-2" />
          <h3 className="font-semibold text-gray-900">Tracking Links</h3>
          <p className="text-sm text-gray-600 mt-1">Create and manage tracking links</p>
        </button>

        <button
          onClick={() => router.push('/modules/affiliate-system/analytics')}
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow text-left"
        >
          <BarChart3 className="w-8 h-8 text-green-600 mb-2" />
          <h3 className="font-semibold text-gray-900">Analytics</h3>
          <p className="text-sm text-gray-600 mt-1">View performance metrics</p>
        </button>

        <button
          onClick={() => router.push('/modules/affiliate-system/payouts')}
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow text-left"
        >
          <CreditCard className="w-8 h-8 text-yellow-600 mb-2" />
          <h3 className="font-semibold text-gray-900">Payouts</h3>
          <p className="text-sm text-gray-600 mt-1">Process affiliate payments</p>
        </button>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Top Performers</h2>
            <button
              onClick={() => router.push('/modules/affiliate-system/analytics')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All
            </button>
          </div>
        </div>
        <div className="p-6">
          {topPerformers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No affiliate data yet</p>
          ) : (
            <div className="space-y-4">
              {topPerformers.map((affiliate, index) => (
                <div
                  key={affiliate.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => router.push(`/modules/affiliate-system/affiliates/${affiliate.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      #{index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{affiliate.name}</h3>
                      <p className="text-sm text-gray-600">{affiliate.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(affiliate.lifetime_revenue_ngn || 0)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {affiliate.lifetime_conversions || 0} conversions
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Affiliates */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Recent Affiliates</h2>
            <button
              onClick={() => router.push('/modules/affiliate-system/affiliates')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All
            </button>
          </div>
        </div>
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
                  Conversions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {affiliates.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No affiliates yet. Click "Add Affiliate" to get started.
                  </td>
                </tr>
              ) : (
                affiliates.map((affiliate) => (
                  <tr
                    key={affiliate.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/modules/affiliate-system/affiliates/${affiliate.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{affiliate.name}</div>
                        <div className="text-sm text-gray-500">{affiliate.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {affiliate.promo_code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(affiliate.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {affiliate.commission_type === 'percentage' 
                        ? `${affiliate.commission_value}%`
                        : formatCurrency(affiliate.commission_value * 100)
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {affiliate.lifetime_conversions || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(affiliate.lifetime_revenue_ngn || 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
