'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import {
  Funnel, Plus, BarChart3, Play, Pause, TrendingUp,
  Users, Target, Eye, Copy, Trash2, Filter
} from 'lucide-react';

const FUNNEL_TYPES = [
  { value: 'lead_generation', label: 'Lead Generation', icon: '🎯' },
  { value: 'sales', label: 'Sales', icon: '💰' },
  { value: 'event', label: 'Event Registration', icon: '📅' },
  { value: 'webinar', label: 'Webinar', icon: '🎥' },
  { value: 'product_launch', label: 'Product Launch', icon: '🚀' },
  { value: 'content', label: 'Content Upgrade', icon: '📄' }
];

export default function FunnelBuilder() {
  const router = useRouter();
  const [funnels, setFunnels] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    funnelType: 'lead_generation',
    goal: ''
  });

  useEffect(() => {
    loadFunnels();
  }, [typeFilter, statusFilter]);

  const loadFunnels = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter) params.append('funnelType', typeFilter);
      if (statusFilter) params.append('status', statusFilter);

      const data = await apiFetch(`/api/v1/funnels?${params}`);
      setFunnels(data.funnels || []);
    } catch (error) {
      console.error('Error loading funnels:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await apiFetch('/api/v1/funnel-templates?limit=20');
      setTemplates(data.templates || []);
      setShowTemplates(true);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) return;
    try {
      const data = await apiFetch('/api/v1/funnels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (data.success || data.funnel) {
        setShowCreateModal(false);
        setFormData({ name: '', description: '', funnelType: 'lead_generation', goal: '' });
        const funnel = data.funnel || data;
        router.push(`/builder?type=funnel&id=${funnel.id}`);
      }
    } catch (error) {
      console.error('Error creating funnel:', error);
    }
  };

  const handleUseTemplate = async (template) => {
    const name = prompt(`Enter a name for your new funnel based on "${template.name}":`);
    if (!name) return;
    try {
      const data = await apiFetch(`/api/v1/funnel-templates/${template.id}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (data.success) {
        setShowTemplates(false);
        loadFunnels();
      }
    } catch (error) {
      console.error('Error creating from template:', error);
    }
  };

  const handlePublish = async (id, currentStatus) => {
    try {
      if (currentStatus === 'published') {
        // Toggle back to draft via update
        await apiFetch(`/api/v1/funnels/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'draft' })
        });
      } else {
        await apiFetch(`/api/v1/funnels/${id}/publish`, { method: 'POST' });
      }
      loadFunnels();
    } catch (error) {
      console.error('Error toggling funnel status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this funnel? This cannot be undone.')) return;
    try {
      await apiFetch(`/api/v1/funnels/${id}`, { method: 'DELETE' });
      loadFunnels();
    } catch (error) {
      console.error('Error deleting funnel:', error);
    }
  };

  const handleDuplicate = async (funnel) => {
    try {
      const data = await apiFetch('/api/v1/funnels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${funnel.name} (Copy)`,
          description: funnel.description,
          funnelType: funnel.funnel_type,
          goal: funnel.goal,
          settings: funnel.settings
        })
      });
      if (data.success || data.funnel) loadFunnels();
    } catch (error) {
      console.error('Error duplicating funnel:', error);
    }
  };

  const typeLabel = (type) => FUNNEL_TYPES.find(t => t.value === type)?.label || type;
  const typeIcon = (type) => FUNNEL_TYPES.find(t => t.value === type)?.icon || '🔗';

  const statusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      active: 'bg-green-100 text-green-700',
      published: 'bg-blue-100 text-blue-700',
      paused: 'bg-yellow-100 text-yellow-700',
      archived: 'bg-red-100 text-red-700'
    };
    return colors[status] || colors.draft;
  };

  const totalVisitors = funnels.reduce((sum, f) => sum + (f.total_conversions || f.step_count || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Funnel className="w-8 h-8 text-blue-600" />
            Funnel Builder
          </h1>
          <p className="text-gray-500 mt-1">Create and optimize conversion funnels</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadTemplates}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Templates
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Funnel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="">All Types</option>
          {FUNNEL_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="published">Published</option>
          <option value="paused">Paused</option>
        </select>
        {funnels.length > 0 && (
          <span className="text-sm text-gray-500 self-center ml-auto">{funnels.length} funnels</span>
        )}
      </div>

      {/* Funnel List */}
      {funnels.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
          <Funnel className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No funnels yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Create conversion funnels to capture leads, drive sales, and track your marketing performance from first touch to conversion.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Funnel
            </button>
            <button
              onClick={loadTemplates}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Browse Templates
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {funnels.map((funnel) => (
            <div
              key={funnel.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{typeIcon(funnel.funnel_type)}</span>
                    <h3 className="text-lg font-semibold text-gray-900">{funnel.name}</h3>
                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusBadge(funnel.status)}`}>
                      {funnel.status || 'draft'}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {typeLabel(funnel.funnel_type)}
                    </span>
                  </div>
                  {funnel.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{funnel.description}</p>
                  )}
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {funnel.step_count || 0} steps
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {funnel.total_conversions || 0} conversions
                    </span>
                    {funnel.goal && (
                      <span className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        Goal: {funnel.goal}
                      </span>
                    )}
                    <span className="text-gray-400">
                      Updated {new Date(funnel.updated_at || funnel.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => router.push(`/builder?type=funnel&id=${funnel.id}`)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit in Builder"
                  >
                    <Funnel className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => router.push(`/funnel-builder/${funnel.id}/analytics`)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="View Analytics"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePublish(funnel.id, funnel.status)}
                    className={`p-2 rounded-lg transition-colors ${
                      funnel.status === 'published'
                        ? 'text-yellow-600 hover:bg-yellow-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={funnel.status === 'published' ? 'Unpublish' : 'Publish'}
                  >
                    {funnel.status === 'published' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDuplicate(funnel)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(funnel.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">Create New Funnel</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Funnel Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Summer Campaign Funnel"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your funnel's purpose..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Funnel Type</label>
                <select
                  value={formData.funnelType}
                  onChange={(e) => setFormData({ ...formData, funnelType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {FUNNEL_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal</label>
                <input
                  type="text"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Collect 100 leads, Generate 50 sales"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!formData.name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create & Open Builder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-3xl w-full mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Funnel Templates</h2>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            {templates.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No templates available</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => handleUseTemplate(template)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{typeIcon(template.funnel_type)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <span className="text-xs text-gray-500">{typeLabel(template.funnel_type)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{template.step_count || 0} steps</span>
                      <span>{template.usage_count || 0} uses</span>
                      {template.industry && <span>{template.industry}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
