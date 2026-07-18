'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  PlusIcon,
  TrashIcon,
  ArrowRightIcon,
  CheckIcon,
  XMarkIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const STEP_TYPES = [
  { value: 'send_email', label: 'Send Email', icon: '📧', channel: 'email' },
  { value: 'send_sms', label: 'Send SMS', icon: '💬', channel: 'sms' },
  { value: 'send_whatsapp', label: 'Send WhatsApp', icon: '📱', channel: 'whatsapp' },
  { value: 'wait_days', label: 'Wait', icon: '⏰', channel: null },
  { value: 'condition', label: 'If/Then Branch', icon: '🔀', channel: null },
  { value: 'split_test', label: 'A/B Split Test', icon: '🧪', channel: null },
  { value: 'add_tag', label: 'Add Tag', icon: '🏷️', channel: null },
  { value: 'remove_tag', label: 'Remove Tag', icon: '🗑️', channel: null },
  { value: 'update_lead_score', label: 'Update Lead Score', icon: '⭐', channel: null },
  { value: 'update_contact_field', label: 'Update Contact Field', icon: '✏️', channel: null },
  { value: 'crm_action', label: 'CRM Action', icon: '🎯', channel: null },
  { value: 'webhook', label: 'Webhook', icon: '🔗', channel: null },
  { value: 'goal_check', label: 'Check Goal', icon: '🎯', channel: null },
  { value: 'end_workflow', label: 'End Workflow', icon: '🏁', channel: null },
];

const TRIGGER_TYPES = [
  { value: 'manual', label: 'Manual' },
  { value: 'new_subscriber', label: 'New Subscriber' },
  { value: 'tag_added', label: 'Tag Added' },
  { value: 'form_submitted', label: 'Form Submitted' },
  { value: 'page_visit', label: 'Page Visit' },
  { value: 'link_click', label: 'Link Click' },
  { value: 'email_opened', label: 'Email Opened' },
  { value: 'email_clicked', label: 'Email Clicked' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'cart_abandoned', label: 'Cart Abandoned' },
  { value: 'sms_reply', label: 'SMS Reply' },
  { value: 'whatsapp_reply', label: 'WhatsApp Reply' },
  { value: 'api_event', label: 'API Event' },
  { value: 'date_based', label: 'Date Based' },
  { value: 'lead_score_change', label: 'Lead Score Change' },
  { value: 'deal_stage_change', label: 'Deal Stage Change' },
];

export default function WorkflowBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const workflowId = params.id;
  const isNew = workflowId === 'new';

  const [workflow, setWorkflow] = useState({
    name: '',
    trigger_type: 'manual',
    trigger_config: {},
    status: 'draft',
  });
  const [steps, setSteps] = useState([]);
  const [selectedStep, setSelectedStep] = useState(null);
  const [showStepModal, setShowStepModal] = useState(false);
  const [showAddStepMenu, setShowAddStepMenu] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      loadWorkflow();
    }
  }, [workflowId]);

  const loadWorkflow = async () => {
    try {
      const [workflowRes, stepsRes] = await Promise.all([
        fetch(`/api/v1/automation/workflows/${workflowId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch(`/api/v1/automation/workflows/${workflowId}/steps`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      if (workflowRes.ok) {
        const data = await workflowRes.json();
        setWorkflow(data.workflow);
      }

      if (stepsRes.ok) {
        const data = await stepsRes.json();
        setSteps(data.steps || []);
      }
    } catch (error) {
      console.error('Failed to load workflow:', error);
    }
  };

  const handleSaveWorkflow = async () => {
    setSaving(true);
    try {
      const url = isNew
        ? '/api/v1/automation/workflows'
        : `/api/v1/automation/workflows/${workflowId}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(workflow),
      });

      if (res.ok) {
        const data = await res.json();
        if (isNew) {
          router.push(`/modules/marketing-automation/builder/${data.workflow.id}`);
        } else {
          alert('Workflow saved successfully');
        }
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
      alert('Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  const handleAddStep = async (stepType) => {
    if (isNew) {
      alert('Please save the workflow first before adding steps');
      return;
    }

    try {
      const res = await fetch(`/api/v1/automation/workflows/${workflowId}/steps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          stepType,
          config: {},
        }),
      });

      if (res.ok) {
        loadWorkflow();
        setShowAddStepMenu(false);
      }
    } catch (error) {
      console.error('Failed to add step:', error);
    }
  };

  const handleDeleteStep = async (stepId) => {
    if (!confirm('Are you sure you want to delete this step?')) return;

    try {
      const res = await fetch(`/api/v1/automation/steps/${stepId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (res.ok) {
        loadWorkflow();
      }
    } catch (error) {
      console.error('Failed to delete step:', error);
    }
  };

  const handleEditStep = (step) => {
    setSelectedStep(step);
    setShowStepModal(true);
  };

  const handleUpdateStep = async (stepId, updates) => {
    try {
      const res = await fetch(`/api/v1/automation/steps/${stepId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        loadWorkflow();
        setShowStepModal(false);
        setSelectedStep(null);
      }
    } catch (error) {
      console.error('Failed to update step:', error);
    }
  };

  const getStepIcon = (stepType) => {
    const step = STEP_TYPES.find((s) => s.value === stepType);
    return step?.icon || '📋';
  };

  const getStepLabel = (stepType) => {
    const step = STEP_TYPES.find((s) => s.value === stepType);
    return step?.label || stepType;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <input
                type="text"
                value={workflow.name}
                onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
                placeholder="Workflow Name"
                className="text-2xl font-bold text-gray-900 border-none focus:ring-0 w-full"
              />
              <div className="mt-2 flex items-center space-x-4">
                <select
                  value={workflow.trigger_type}
                  onChange={(e) => setWorkflow({ ...workflow, trigger_type: e.target.value })}
                  className="text-sm border-gray-300 rounded-md"
                >
                  {TRIGGER_TYPES.map((trigger) => (
                    <option key={trigger.value} value={trigger.value}>
                      Trigger: {trigger.label}
                    </option>
                  ))}
                </select>
                <select
                  value={workflow.status}
                  onChange={(e) => setWorkflow({ ...workflow, status: e.target.value })}
                  className="text-sm border-gray-300 rounded-md"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/modules/marketing-automation')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWorkflow}
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Workflow'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Canvas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Trigger */}
          <div className="flex flex-col items-center">
            <div className="bg-green-100 border-2 border-green-500 rounded-lg p-4 w-64 text-center">
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-medium text-gray-900">
                {TRIGGER_TYPES.find((t) => t.value === workflow.trigger_type)?.label || 'Trigger'}
              </div>
              <div className="text-xs text-gray-500 mt-1">Workflow starts here</div>
            </div>

            {/* Arrow */}
            {steps.length > 0 && (
              <div className="my-4">
                <ArrowRightIcon className="h-6 w-6 text-gray-400 transform rotate-90" />
              </div>
            )}
          </div>

          {/* Steps */}
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center">
              <div className="bg-white border-2 border-blue-500 rounded-lg p-4 w-64 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-2xl mb-2">{getStepIcon(step.step_type)}</div>
                    <div className="font-medium text-gray-900">{getStepLabel(step.step_type)}</div>
                    <div className="text-xs text-gray-500 mt-1">Step {index + 1}</div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEditStep(step)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Cog6ToothIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteStep(step.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              {index < steps.length - 1 && (
                <div className="my-4">
                  <ArrowRightIcon className="h-6 w-6 text-gray-400 transform rotate-90" />
                </div>
              )}
            </div>
          ))}

          {/* Add Step Button */}
          <div className="flex flex-col items-center mt-8">
            {steps.length > 0 && (
              <div className="mb-4">
                <ArrowRightIcon className="h-6 w-6 text-gray-400 transform rotate-90" />
              </div>
            )}
            <div className="relative">
              <button
                onClick={() => setShowAddStepMenu(!showAddStepMenu)}
                className="flex items-center justify-center w-64 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Step
              </button>

              {/* Add Step Menu */}
              {showAddStepMenu && (
                <div className="absolute top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-96 overflow-y-auto">
                  <div className="p-2">
                    {STEP_TYPES.map((stepType) => (
                      <button
                        key={stepType.value}
                        onClick={() => handleAddStep(stepType.value)}
                        className="w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 rounded-md"
                      >
                        <span className="text-2xl mr-3">{stepType.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900">{stepType.label}</div>
                          {stepType.channel && (
                            <div className="text-xs text-gray-500">Channel: {stepType.channel}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Empty State */}
          {steps.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-sm">
                Add your first step to start building your automation workflow
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step Configuration Modal */}
      {showStepModal && selectedStep && (
        <StepConfigModal
          step={selectedStep}
          onClose={() => {
            setShowStepModal(false);
            setSelectedStep(null);
          }}
          onSave={(updates) => handleUpdateStep(selectedStep.id, updates)}
        />
      )}
    </div>
  );
}

// Step Configuration Modal Component
function StepConfigModal({ step, onClose, onSave }) {
  const [config, setConfig] = useState(step.config || {});

  const handleSave = () => {
    onSave({ config });
  };

  const renderConfigFields = () => {
    switch (step.step_type) {
      case 'send_email':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={config.subject || ''}
                onChange={(e) => setConfig({ ...config, subject: e.target.value })}
                className="w-full border-gray-300 rounded-md"
                placeholder="Email subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
              <textarea
                value={config.body || ''}
                onChange={(e) => setConfig({ ...config, body: e.target.value })}
                rows={6}
                className="w-full border-gray-300 rounded-md"
                placeholder="Email body (HTML supported)"
              />
            </div>
          </>
        );

      case 'send_sms':
      case 'send_whatsapp':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={config.message || ''}
              onChange={(e) => setConfig({ ...config, message: e.target.value })}
              rows={4}
              className="w-full border-gray-300 rounded-md"
              placeholder="Message text"
            />
          </div>
        );

      case 'wait_days':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wait Duration (days)</label>
            <input
              type="number"
              value={config.days || 1}
              onChange={(e) => setConfig({ ...config, days: parseInt(e.target.value) })}
              min="1"
              className="w-full border-gray-300 rounded-md"
            />
          </div>
        );

      case 'add_tag':
      case 'remove_tag':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
            <input
              type="text"
              value={config.tag || ''}
              onChange={(e) => setConfig({ ...config, tag: e.target.value })}
              className="w-full border-gray-300 rounded-md"
              placeholder="Tag name"
            />
          </div>
        );

      case 'webhook':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
              <input
                type="url"
                value={config.url || ''}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                className="w-full border-gray-300 rounded-md"
                placeholder="https://example.com/webhook"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
              <select
                value={config.method || 'POST'}
                onChange={(e) => setConfig({ ...config, method: e.target.value })}
                className="w-full border-gray-300 rounded-md"
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
              </select>
            </div>
          </>
        );

      default:
        return (
          <div className="text-sm text-gray-500">
            Configuration options for this step type will be available soon.
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Configure Step: {getStepLabel(step.step_type)}
          </h3>
        </div>
        <div className="px-6 py-4 space-y-4">{renderConfigFields()}</div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function getStepLabel(stepType) {
  const step = STEP_TYPES.find((s) => s.value === stepType);
  return step?.label || stepType;
}
