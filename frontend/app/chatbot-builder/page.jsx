'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, Plus, Play, Pause, Copy, Trash2, 
  BarChart3, Settings, Users, Send, Bot, Zap 
} from 'lucide-react';

export default function ChatbotBuilder() {
  const router = useRouter();
  const [flows, setFlows] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, total_conversations: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('flows');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');
  const [newFlowDescription, setNewFlowDescription] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [flowsRes, statsRes] = await Promise.all([
        fetch('/api/v1/chatbot-builder'),
        fetch('/api/v1/chatbot-builder/stats')
      ]);

      if (flowsRes.ok) {
        const flowsData = await flowsRes.json();
        setFlows(flowsData.flows || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats || { total: 0, active: 0, total_conversations: 0 });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createFlow = async () => {
    if (!newFlowName.trim()) return;

    try {
      const res = await fetch('/api/v1/chatbot-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFlowName,
          description: newFlowDescription,
          nodes: []
        })
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/chatbot-builder/builder/${data.flow.id}`);
      }
    } catch (error) {
      console.error('Error creating flow:', error);
    }
  };

  const toggleFlowStatus = async (flowId, currentStatus) => {
    try {
      const endpoint = currentStatus 
        ? `/api/v1/chatbot-builder/${flowId}/deactivate`
        : `/api/v1/chatbot-builder/${flowId}/activate`;

      const res = await fetch(endpoint, { method: 'POST' });
      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error toggling flow status:', error);
    }
  };

  const duplicateFlow = async (flowId) => {
    try {
      const res = await fetch(`/api/v1/chatbot-builder/${flowId}/duplicate`, {
        method: 'POST'
      });

      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error duplicating flow:', error);
    }
  };

  const deleteFlow = async (flowId) => {
    if (!confirm('Are you sure you want to delete this chatbot flow?')) return;

    try {
      const res = await fetch(`/api/v1/chatbot-builder/${flowId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error deleting flow:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bot className="w-8 h-8 text-blue-600" />
            Chatbot Builder
          </h1>
          <p className="text-gray-600 mt-1">Create intelligent conversational flows</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Chatbot
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Chatbots</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Chatbots</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <Zap className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Conversations</p>
              <p className="text-2xl font-bold text-purple-600">{stats.total_conversations}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('flows')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'flows'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Chatbot Flows
            </button>
            <button
              onClick={() => router.push('/chatbot-builder/templates')}
              className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 font-medium text-sm"
            >
              Templates
            </button>
            <button
              onClick={() => router.push('/chatbot-builder/conversations')}
              className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 font-medium text-sm"
            >
              Conversations
            </button>
            <button
              onClick={() => router.push('/chatbot-builder/settings')}
              className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 font-medium text-sm"
            >
              Widget Settings
            </button>
          </div>
        </div>

        {/* Flows List */}
        <div className="p-6">
          {flows.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No chatbots yet</h3>
              <p className="text-gray-600 mb-4">Create your first chatbot to get started</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Create Chatbot
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {flows.map((flow) => (
                <div
                  key={flow.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{flow.name}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            flow.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {flow.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {flow.channel || 'web'}
                        </span>
                      </div>
                      {flow.description && (
                        <p className="text-gray-600 text-sm mb-3">{flow.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{flow.node_count || 0} nodes</span>
                        <span>•</span>
                        <span>{flow.conversations || 0} conversations</span>
                        <span>•</span>
                        <span>Created {new Date(flow.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/chatbot-builder/builder/${flow.id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/chatbot-builder/analytics/${flow.id}`)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                        title="Analytics"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleFlowStatus(flow.id, flow.is_active)}
                        className={`p-2 rounded-lg ${
                          flow.is_active
                            ? 'text-orange-600 hover:bg-orange-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={flow.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {flow.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => duplicateFlow(flow.id)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteFlow(flow.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Chatbot</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={newFlowName}
                  onChange={(e) => setNewFlowName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Customer Support Bot"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newFlowDescription}
                  onChange={(e) => setNewFlowDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Describe what this chatbot does..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewFlowName('');
                  setNewFlowDescription('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createFlow}
                disabled={!newFlowName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
