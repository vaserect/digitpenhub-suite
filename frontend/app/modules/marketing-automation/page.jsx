'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlayIcon,
  PauseIcon,
  PlusIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  PencilIcon,
  UserGroupIcon,
  BoltIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export default function MarketingAutomationPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('workflows'); // workflows, templates, analytics

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [workflowsRes, statsRes] = await Promise.all([
        fetch('/api/v1/automation/workflows', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/v1/automation/stats', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      if (workflowsRes.ok) {
        const data = await workflowsRes.json();
        setWorkflows(data.workflows || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load automation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = () => {
    router.push('/modules/marketing-automation/builder/new');
  };

  const handleEditWorkflow = (workflowId) => {
    router.push(`/modules/marketing-automation/builder/${workflowId}`);
  };

  const handleToggleWorkflow = async (workflowId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`/api/v1/automation/workflows/${workflowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Failed to toggle workflow:', error);
    }
  };

  const handleDeleteWorkflow = async (workflowId) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      const res = await fetch(`/api/v1/automation/workflows/${workflowId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Failed to delete workflow:', error);
    }
  };

  const handleViewAnalytics = (workflowId) => {
    router.push(`/modules/marketing-automation/analytics/${workflowId}`);
  };

  const handleViewEnrollments = (workflowId) => {
    router.push(`/modules/marketing-automation/enrollments?workflowId=${workflowId}`);
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      draft: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTriggerTypeLabel = (triggerType) => {
    const labels = {
      manual: 'Manual',
      new_subscriber: 'New Subscriber',
      tag_added: 'Tag Added',
      form_submitted: 'Form Submitted',
      page_visit: 'Page Visit',
      link_click: 'Link Click',
      email_opened: 'Email Opened',
      email_clicked: 'Email Clicked',
      purchase: 'Purchase',
      cart_abandoned: 'Cart Abandoned',
      sms_reply: 'SMS Reply',
      whatsapp_reply: 'WhatsApp Reply',
      api_event: 'API Event',
      date_based: 'Date Based',
      lead_score_change: 'Lead Score Change',
      deal_stage_change: 'Deal Stage Change',
    };

    return labels[triggerType] || triggerType;
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marketing Automation</h1>
            <p className="mt-2 text-sm text-gray-600">
              Create multi-channel workflows to nurture leads and engage customers
            </p>
          </div>
          <button
            onClick={handleCreateWorkflow}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Workflow
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BoltIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Workflows</dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {stats.workflows?.active || 0}
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
                    <UserGroupIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Enrollments</dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {stats.enrollments?.active || 0}
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
                    <CheckCircleIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {stats.enrollments?.completed || 0}
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
                      <dt className="text-sm font-medium text-gray-500 truncate">Draft Workflows</dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {stats.workflows?.draft || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('workflows')}
            className={`${
              activeTab === 'workflows'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Workflows
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Analytics
          </button>
        </nav>
      </div>

      {/* Workflows Tab */}
      {activeTab === 'workflows' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {workflows.length === 0 ? (
            <div className="text-center py-12">
              <BoltIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No workflows</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new automation workflow.
              </p>
              <div className="mt-6">
                <button
                  onClick={handleCreateWorkflow}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Workflow
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {workflows.map((workflow) => (
                <li key={workflow.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {workflow.name}
                          </h3>
                          {getStatusBadge(workflow.status)}
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <span className="truncate">
                            Trigger: {getTriggerTypeLabel(workflow.trigger_type)}
                          </span>
                          <span className="mx-2">•</span>
                          <span>{workflow.enrollment_count || 0} enrollments</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewAnalytics(workflow.id)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                          title="View Analytics"
                        >
                          <ChartBarIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleViewEnrollments(workflow.id)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                          title="View Enrollments"
                        >
                          <UserGroupIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEditWorkflow(workflow.id)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleToggleWorkflow(workflow.id, workflow.status)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                          title={workflow.status === 'active' ? 'Pause' : 'Activate'}
                        >
                          {workflow.status === 'active' ? (
                            <PauseIcon className="h-5 w-5" />
                          ) : (
                            <PlayIcon className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteWorkflow(workflow.id)}
                          className="p-2 text-red-400 hover:text-red-600"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <DocumentDuplicateIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Templates</h3>
          <p className="mt-1 text-sm text-gray-500">
            Browse pre-built automation templates to get started quickly.
          </p>
          <div className="mt-6">
            <button
              onClick={() => router.push('/modules/marketing-automation/templates')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Browse Templates
            </button>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Analytics Overview</h3>
          <p className="mt-1 text-sm text-gray-500">
            View detailed analytics for all your automation workflows.
          </p>
          <div className="mt-6">
            <button
              onClick={() => router.push('/modules/marketing-automation/analytics')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              View Analytics
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
