'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PauseIcon,
  PlayIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export default function EnrollmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('workflowId');

  const [enrollments, setEnrollments] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(workflowId || 'all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedWorkflow]);

  const loadData = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedWorkflow && selectedWorkflow !== 'all') {
        params.append('workflowId', selectedWorkflow);
      }

      const [enrollmentsRes, workflowsRes] = await Promise.all([
        fetch(`/api/v1/automation/enrollments?${params}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/v1/automation/workflows', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      if (enrollmentsRes.ok) {
        const data = await enrollmentsRes.json();
        setEnrollments(data.enrollments || []);
      }

      if (workflowsRes.ok) {
        const data = await workflowsRes.json();
        setWorkflows(data.workflows || []);
      }
    } catch (error) {
      console.error('Failed to load enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (enrollmentId, newStatus) => {
    try {
      const res = await fetch(`/api/v1/automation/enrollments/${enrollmentId}`, {
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
      console.error('Failed to update enrollment:', error);
    }
  };

  const handleDeleteEnrollment = async (enrollmentId) => {
    if (!confirm('Are you sure you want to delete this enrollment?')) return;

    try {
      const res = await fetch(`/api/v1/automation/enrollments/${enrollmentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Failed to delete enrollment:', error);
    }
  };

  const handleViewStepRuns = (enrollmentId) => {
    router.push(`/modules/marketing-automation/enrollments/${enrollmentId}/runs`);
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: { bg: 'bg-blue-100', text: 'text-blue-800', icon: ClockIcon },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleIcon },
      paused: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: PauseIcon },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircleIcon },
    };

    const style = styles[status] || styles.active;
    const Icon = style.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredEnrollments = enrollments.filter((enrollment) => {
    if (statusFilter !== 'all' && enrollment.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        enrollment.contact_email?.toLowerCase().includes(query) ||
        enrollment.contact_name?.toLowerCase().includes(query) ||
        enrollment.workflow_name?.toLowerCase().includes(query)
      );
    }
    return true;
  });

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
        <h1 className="text-3xl font-bold text-gray-900">Workflow Enrollments</h1>
        <p className="mt-2 text-sm text-gray-600">
          View and manage contacts enrolled in automation workflows
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email or name..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <select
          value={selectedWorkflow}
          onChange={(e) => setSelectedWorkflow(e.target.value)}
          className="border-gray-300 rounded-md text-sm"
        >
          <option value="all">All Workflows</option>
          {workflows.map((workflow) => (
            <option key={workflow.id} value={workflow.id}>
              {workflow.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border-gray-300 rounded-md text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Enrollments Table */}
      {filteredEnrollments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No enrollments found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Enrollments will appear here once contacts enter workflows'}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredEnrollments.map((enrollment) => (
              <li key={enrollment.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {enrollment.contact_email}
                        </h3>
                        {getStatusBadge(enrollment.status)}
                        {enrollment.goal_achieved && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            🎯 Goal Achieved
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span className="truncate">{enrollment.workflow_name}</span>
                        <span>Step {enrollment.current_step + 1}</span>
                        <span>
                          Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
                        </span>
                      </div>
                      {enrollment.contact_name && (
                        <div className="text-sm text-gray-500 mt-1">
                          Name: {enrollment.contact_name}
                        </div>
                      )}
                      {/* Channel Stats */}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        {enrollment.total_emails_sent > 0 && (
                          <span>📧 {enrollment.total_emails_sent} emails</span>
                        )}
                        {enrollment.total_sms_sent > 0 && (
                          <span>💬 {enrollment.total_sms_sent} SMS</span>
                        )}
                        {enrollment.total_whatsapp_sent > 0 && (
                          <span>📱 {enrollment.total_whatsapp_sent} WhatsApp</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewStepRuns(enrollment.id)}
                        className="p-2 text-gray-400 hover:text-blue-600"
                        title="View Step History"
                      >
                        <ClockIcon className="h-5 w-5" />
                      </button>
                      {enrollment.status === 'active' && (
                        <button
                          onClick={() => handleUpdateStatus(enrollment.id, 'paused')}
                          className="p-2 text-gray-400 hover:text-yellow-600"
                          title="Pause"
                        >
                          <PauseIcon className="h-5 w-5" />
                        </button>
                      )}
                      {enrollment.status === 'paused' && (
                        <button
                          onClick={() => handleUpdateStatus(enrollment.id, 'active')}
                          className="p-2 text-gray-400 hover:text-green-600"
                          title="Resume"
                        >
                          <PlayIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteEnrollment(enrollment.id)}
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
        </div>
      )}

      {/* Pagination info */}
      {filteredEnrollments.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          Showing {filteredEnrollments.length} enrollment{filteredEnrollments.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
