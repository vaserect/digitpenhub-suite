'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users,
  Download,
  ArrowUp,
  ArrowDown,
  Calendar
} from 'lucide-react';
import LineChart from '@/components/analytics/LineChart';
import BarChart from '@/components/analytics/BarChart';
import PieChart from '@/components/analytics/PieChart';

export default function MarketplaceAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [topComponents, setTopComponents] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch all analytics data in parallel
      const [
        overviewRes,
        revenueRes,
        componentsRes,
        earningsRes,
        categoriesRes,
        customersRes
      ] = await Promise.all([
        fetch(`/api/v1/analytics/marketplace/overview?time_range=${timeRange}`, { headers }),
        fetch(`/api/v1/analytics/marketplace/revenue-chart?time_range=${timeRange}&interval=day`, { headers }),
        fetch(`/api/v1/analytics/marketplace/top-components?time_range=${timeRange}&limit=10&sort_by=revenue`, { headers }),
        fetch(`/api/v1/analytics/marketplace/earnings?time_range=${timeRange}`, { headers }),
        fetch(`/api/v1/analytics/marketplace/categories?time_range=${timeRange}`, { headers }),
        fetch(`/api/v1/analytics/marketplace/customers?time_range=${timeRange}&limit=10`, { headers })
      ]);

      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setOverview(data.overview);
      }

      if (revenueRes.ok) {
        const data = await revenueRes.json();
        setRevenueChart(data.chart_data);
      }

      if (componentsRes.ok) {
        const data = await componentsRes.json();
        setTopComponents(data.top_components);
      }

      if (earningsRes.ok) {
        const data = await earningsRes.json();
        setEarnings(data);
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.categories);
      }

      if (customersRes.ok) {
        const data = await customersRes.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, color = 'blue' }) => {
    const isPositive = change >= 0;
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      purple: 'bg-purple-50 text-purple-600',
      orange: 'bg-orange-50 text-orange-600'
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon size={24} />
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {value}
        </div>
        <div className="text-sm text-gray-600">{title}</div>
      </div>
    );
  };

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Marketplace Analytics</h1>
              <p className="text-gray-600 mt-1">Track your sales, revenue, and performance</p>
            </div>
            
            {/* Time Range Selector */}
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-gray-400" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={`$${parseFloat(overview?.total_revenue || 0).toLocaleString()}`}
            change={overview?.revenue_growth}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Total Sales"
            value={parseInt(overview?.total_sales || 0).toLocaleString()}
            change={overview?.sales_growth}
            icon={ShoppingCart}
            color="blue"
          />
          <StatCard
            title="Downloads"
            value={parseInt(overview?.total_downloads || 0).toLocaleString()}
            icon={Download}
            color="purple"
          />
          <StatCard
            title="Customers"
            value={parseInt(overview?.unique_customers || 0).toLocaleString()}
            icon={Users}
            color="orange"
          />
        </div>

        {/* Revenue Chart */}
        <div className="mb-8">
          <LineChart
            data={revenueChart}
            xKey="date"
            yKey="revenue"
            title="Revenue Over Time"
            color="#10B981"
            height={350}
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Components */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Top Components by Revenue</h3>
            <div className="space-y-3">
              {topComponents.slice(0, 5).map((component, i) => (
                <div key={component.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                    {i + 1}
                  </div>
                  {component.thumbnail_url ? (
                    <img
                      src={component.thumbnail_url}
                      alt={component.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{component.name}</div>
                    <div className="text-sm text-gray-600">
                      {component.total_sales} sales
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      ${parseFloat(component.total_revenue).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Performance */}
          <PieChart
            data={categories}
            labelKey="category"
            valueKey="total_revenue"
            title="Revenue by Category"
          />
        </div>

        {/* Earnings Breakdown */}
        {earnings && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-sm text-gray-600 mb-2">Gross Revenue</div>
              <div className="text-3xl font-bold text-gray-900">
                ${parseFloat(earnings.totals.gross_revenue).toLocaleString()}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-sm text-gray-600 mb-2">Platform Fee (15%)</div>
              <div className="text-3xl font-bold text-red-600">
                -${parseFloat(earnings.totals.platform_fee).toLocaleString()}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-sm text-gray-600 mb-2">Net Earnings (85%)</div>
              <div className="text-3xl font-bold text-green-600">
                ${parseFloat(earnings.totals.net_revenue).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        {earnings && earnings.payment_methods.length > 0 && (
          <div className="mb-8">
            <BarChart
              data={earnings.payment_methods}
              xKey="payment_method"
              yKey="total_amount"
              title="Revenue by Payment Method"
              color="#8B5CF6"
              height={300}
            />
          </div>
        )}

        {/* Top Customers */}
        {customers && customers.top_customers.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Top Customers</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Purchases</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Total Spent</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Last Purchase</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.top_customers.map((customer) => (
                    <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {customer.avatar_url ? (
                            <img
                              src={customer.avatar_url}
                              alt={customer.name}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium text-sm">
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{customer.name}</div>
                            <div className="text-sm text-gray-600">{customer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-900">{customer.purchase_count}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        ${parseFloat(customer.total_spent).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(customer.last_purchase_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
