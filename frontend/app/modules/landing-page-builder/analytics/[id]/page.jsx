'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  ChartBarIcon,
  UsersIcon,
  CursorArrowRaysIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

/**
 * Landing Page Analytics Dashboard
 * Conversion tracking and performance metrics
 */
export default function LandingPageAnalytics() {
  const router = useRouter();
  const params = useParams();
  const pageId = params.id;

  const [page, setPage] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    if (pageId) {
      fetchPageData();
      fetchAnalytics();
      fetchFunnel();
    }
  }, [pageId, dateRange]);

  const fetchPageData = async () => {
    try {
      const response = await fetch(`/api/v1/landing-pages/${pageId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPage(data.data);
      }
    } catch (error) {
      console.error('Error fetching page data:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      params.append('startDate', startDate.toISOString());
      params.append('endDate', endDate.toISOString());

      const response = await fetch(
        `/api/v1/landing-pages/${pageId}/analytics?${params}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFunnel = async () => {
    try {
      const response = await fetch(`/api/v1/landing-pages/${pageId}/funnel`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setFunnel(data.data);
      }
    } catch (error) {
      console.error('Error fetching funnel data:', error);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const formatPercentage = (num) => {
    return `${(num || 0).toFixed(1)}%`;
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  if (!page) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/modules/landing-page-builder')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{page.title}</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Analytics & Performance
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="block pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button
                onClick={() => router.push(`/modules/landing-page-builder/editor?id=${pageId}`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Edit Page
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-500">Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="bg-white overflow-hidden rounded-lg border border-gray-200 px-4 py-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UsersIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Views
                      </dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {formatNumber(analytics?.views)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden rounded-lg border border-gray-200 px-4 py-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CursorArrowRaysIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Unique Visitors
                      </dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {formatNumber(analytics?.uniqueVisitors)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden rounded-lg border border-gray-200 px-4 py-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Conversions
                      </dt>
                      <dd className="text-2xl font-semibold text-green-600">
                        {formatNumber(analytics?.conversions)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden rounded-lg border border-gray-200 px-4 py-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Conversion Rate
                      </dt>
                      <dd className="text-2xl font-semibold text-blue-600">
                        {formatPercentage(analytics?.conversionRate)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
              <div className="bg-white overflow-hidden rounded-lg border border-gray-200 px-4 py-5">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Bounce Rate
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {formatPercentage(analytics?.bounceRate)}
                </dd>
              </div>

              <div className="bg-white overflow-hidden rounded-lg border border-gray-200 px-4 py-5">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Avg. Time on Page
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {formatTime(analytics?.avgTimeOnPage || 0)}
                </dd>
              </div>

              <div className="bg-white overflow-hidden rounded-lg border border-gray-200 px-4 py-5">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Top Source
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {analytics?.topSources?.[0]?.source || 'Direct'}
                </dd>
              </div>
            </div>

            {/* Conversion Funnel */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Conversion Funnel
              </h3>
              <div className="space-y-4">
                {funnel?.steps?.map((step, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {step.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatNumber(step.count)} ({formatPercentage(step.percentage)})
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${step.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Device Breakdown */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-8">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Device Breakdown
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ComputerDesktopIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-700">Desktop</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatPercentage(analytics?.deviceBreakdown?.desktop || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-700">Mobile</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatPercentage(analytics?.deviceBreakdown?.mobile || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ComputerDesktopIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-700">Tablet</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatPercentage(analytics?.deviceBreakdown?.tablet || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Top Traffic Sources
                </h3>
                <div className="space-y-4">
                  {analytics?.topSources?.length > 0 ? (
                    analytics.topSources.slice(0, 5).map((source, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-700">{source.source}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {formatNumber(source.visits)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No traffic data yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* A/B Testing Results (if enabled) */}
            {page.ab_test_enabled && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  A/B Test Results
                </h3>
                <p className="text-sm text-gray-500">
                  A/B testing analytics will be displayed here once data is collected.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
