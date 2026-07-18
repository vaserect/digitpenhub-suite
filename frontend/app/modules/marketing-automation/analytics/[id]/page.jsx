'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ChartBarIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  DevicePhoneMobileIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

export default function WorkflowAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const workflowId = params.id;

  const [workflow, setWorkflow] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [summary, setSummary] = useState(null);
  const [dateRange, setDateRange] = useState('30'); // days
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [workflowId, dateRange]);

  const loadData = async () => {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const res = await fetch(
        `/api/v1/automation/workflows/${workflowId}/analytics?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics || []);
        setSummary(data.summary || null);
        
        // Get workflow details
        const workflowRes = await fetch(`/api/v1/automation/workflows/${workflowId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (workflowRes.ok) {
          const workflowData = await workflowRes.json();
          setWorkflow(workflowData.workflow);
        }
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/modules/marketing-automation')}
          className="text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          ← Back to Workflows
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {workflow?.name || 'Workflow Analytics'}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Performance metrics and insights for this automation workflow
            </p>
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border-gray-300 rounded-md text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Enrolled</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {summary.total_enrolled || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {summary.completed || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {summary.conversion_rate || 0}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {summary.active || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Channel Performance */}
      {summary && (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Channel Performance</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="flex items-center mb-2">
                <EnvelopeIcon className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Email</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{summary.total_emails || 0}</div>
              <div className="text-sm text-gray-500">messages sent</div>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <div className="flex items-center mb-2">
                <ChatBubbleLeftIcon className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">SMS</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{summary.total_sms || 0}</div>
              <div className="text-sm text-gray-500">messages sent</div>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <div className="flex items-center mb-2">
                <DevicePhoneMobileIcon className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">WhatsApp</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{summary.total_whatsapp || 0}</div>
              <div className="text-sm text-gray-500">messages sent</div>
            </div>
          </div>
        </div>
      )}

      {/* Lead Scoring Impact */}
      {summary && summary.avg_score_change && (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Lead Scoring Impact</h2>
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-3xl font-bold text-gray-900">
                {summary.avg_score_change > 0 ? '+' : ''}
                {parseFloat(summary.avg_score_change).toFixed(1)}
              </div>
              <div className="text-sm text-gray-500">Average score change per enrollment</div>
            </div>
            <div className="text-4xl">
              {summary.avg_score_change > 0 ? '📈' : summary.avg_score_change < 0 ? '📉' : '➡️'}
            </div>
          </div>
        </div>
      )}

      {/* Daily Breakdown */}
      {analytics.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Daily Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrolled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Goals Achieved
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Emails
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SMS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    WhatsApp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.map((day) => (
                  <tr key={day.date}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(day.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.total_enrolled || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.total_completed || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.goal_achieved_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.emails_sent || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.sms_sent || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.whatsapp_sent || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {analytics.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No analytics data</h3>
          <p className="mt-1 text-sm text-gray-500">
            Analytics will appear once the workflow starts processing enrollments
          </p>
        </div>
      )}
    </div>
  );
}
