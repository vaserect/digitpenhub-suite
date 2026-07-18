'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  TrendingUp,
  MousePointerClick,
  DollarSign,
  Users,
  Calendar,
  Download,
  AlertTriangle,
  CheckCircle,
  Globe,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';

export default function AffiliateAnalytics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [analytics, setAnalytics] = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const params = new URLSearchParams({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      });

      // Fetch overall analytics
      const analyticsRes = await fetch(`/api/v1/affiliates/analytics?${params}`, {
        credentials: 'include'
      });
      const analyticsData = await analyticsRes.json();
      setAnalytics(analyticsData.data);

      // Fetch top performers
      const topRes = await fetch(`/api/v1/affiliates/top-performers?limit=10&metric=${selectedMetric}`, {
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
      console.error('Error fetching analytics:', error);
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

  const handleExport = async () => {
    try {
      const res = await fetch('/api/v1/affiliates/export?format=csv', {
        credentials: 'include'
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `affiliate-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting analytics:', error);
    }
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      low: { bg: 'bg-blue-100', text: 'text-blue-800' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      high: { bg: 'bg-orange-100', text: 'text-orange-800' },
      critical: { bg: 'bg-red-100', text: 'text-red-800' }
    };
    const badge = badges[severity] || badges.medium;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
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
            <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
            <p className="text-gray-600 mt-1">Track affiliate performance and identify trends</p>
          </div>
          <div className="flex gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600">Total Affiliates</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{analytics?.total_affiliates || 0}</p>
          <p className="text-sm text-green-600 mt-1">
            {analytics?.active_affiliates || 0} active
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <MousePointerClick className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-600">Total Clicks</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {analytics?.total_clicks?.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {analytics?.overall_conversion_rate || 0}% conversion
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-600">Conversions</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {analytics?.total_conversions?.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {formatCurrency(analytics?.total_revenue_ngn || 0)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-sm text-gray-600">Commission</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(analytics?.total_commission_ngn || 0)}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Owed to affiliates
          </p>
        </div>
      </div>

      {/* Fraud Alerts Section */}
      {fraudAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h2 className="text-xl font-bold text-gray-900">Fraud Alerts</h2>
              </div>
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                {fraudAlerts.length} unresolved
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {fraudAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{alert.affiliate_name}</h3>
                      {getSeverityBadge(alert.severity)}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
                    <p className="text-xs text-gray-500">
                      {alert.alert_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} • 
                      {new Date(alert.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/modules/affiliate-system/affiliates/${alert.affiliate_id}`)}
                    className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 text-sm font-medium"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
            {fraudAlerts.length > 5 && (
              <button
                onClick={() => router.push('/modules/affiliate-system/fraud-alerts')}
                className="mt-4 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                View all {fraudAlerts.length} alerts →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Performers */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Top Performers</h2>
            <select
              value={selectedMetric}
              onChange={(e) => {
                setSelectedMetric(e.target.value);
                fetchAnalytics();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="revenue">By Revenue</option>
              <option value="conversions">By Conversions</option>
              <option value="commission">By Commission</option>
            </select>
          </div>
        </div>
        <div className="p-6">
          {topPerformers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No performance data available</p>
          ) : (
            <div className="space-y-4">
              {topPerformers.map((affiliate, index) => (
                <div
                  key={affiliate.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => router.push(`/modules/affiliate-system/affiliates/${affiliate.id}`)}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{affiliate.name}</h3>
                    <p className="text-sm text-gray-600">{affiliate.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {selectedMetric === 'revenue' && formatCurrency(affiliate.lifetime_revenue_ngn || 0)}
                      {selectedMetric === 'conversions' && `${affiliate.lifetime_conversions || 0} conversions`}
                      {selectedMetric === 'commission' && formatCurrency(affiliate.lifetime_commission_ngn || 0)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {affiliate.conversion_rate || 0}% conversion rate
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Conversion Funnel</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Clicks</span>
                  <span className="text-sm font-bold text-gray-900">
                    {analytics?.total_clicks?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-600 h-3 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Conversions</span>
                  <span className="text-sm font-bold text-gray-900">
                    {analytics?.total_conversions?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full" 
                    style={{ 
                      width: `${analytics?.total_clicks > 0 
                        ? (analytics.total_conversions / analytics.total_clicks * 100) 
                        : 0}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics?.overall_conversion_rate || 0}% conversion rate
                </p>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Revenue Generated</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(analytics?.total_revenue_ngn || 0)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-purple-600 h-3 rounded-full" 
                    style={{ 
                      width: `${analytics?.total_conversions > 0 ? 85 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Quick Stats</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-gray-900">Active Affiliates</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">
                {analytics?.active_affiliates || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-yellow-600" />
                </div>
                <span className="font-medium text-gray-900">Pending Approval</span>
              </div>
              <span className="text-2xl font-bold text-yellow-600">
                {analytics?.pending_affiliates || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <span className="font-medium text-gray-900">Avg. Conversion Rate</span>
              </div>
              <span className="text-2xl font-bold text-green-600">
                {analytics?.overall_conversion_rate || 0}%
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <span className="font-medium text-gray-900">Avg. Order Value</span>
              </div>
              <span className="text-2xl font-bold text-purple-600">
                {analytics?.total_conversions > 0 
                  ? formatCurrency(Math.round(analytics.total_revenue_ngn / analytics.total_conversions))
                  : formatCurrency(0)
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
