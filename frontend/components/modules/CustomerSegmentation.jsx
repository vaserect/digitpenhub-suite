'use client';
import { useState, useEffect } from 'react';
import { Users, Target, TrendingUp, Filter, Plus, Play, Download } from 'lucide-react';

export default function CustomerSegmentation() {
  const [activeTab, setActiveTab] = useState('segments');
  const [segments, setSegments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [members, setMembers] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'segments') {
        const res = await fetch('/api/v1/segments');
        const data = await res.json();
        setSegments(data.segments || []);
      } else if (activeTab === 'templates') {
        const res = await fetch('/api/v1/segments/templates/list');
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const createSegment = async (segmentData) => {
    try {
      const res = await fetch('/api/v1/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(segmentData)
      });
      if (res.ok) {
        setShowCreateModal(false);
        loadData();
      }
    } catch (error) {
      console.error('Error creating segment:', error);
    }
  };

  const calculateSegment = async (segmentId) => {
    try {
      const res = await fetch(`/api/v1/segments/${segmentId}/calculate`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Segment calculated: ${data.total} members (${data.added} added, ${data.removed} removed)`);
        loadData();
      }
    } catch (error) {
      console.error('Error calculating segment:', error);
    }
  };

  const previewSegment = async (criteria) => {
    try {
      const res = await fetch('/api/v1/segments/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criteria, limit: 100 })
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewData(data.contacts || []);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error previewing segment:', error);
    }
  };

  const deleteSegment = async (segmentId) => {
    if (!confirm('Delete this segment?')) return;
    try {
      await fetch(`/api/v1/segments/${segmentId}`, { method: 'DELETE' });
      loadData();
    } catch (error) {
      console.error('Error deleting segment:', error);
    }
  };

  const exportSegment = async (segmentId) => {
    try {
      const res = await fetch(`/api/v1/segments/${segmentId}/export`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `segment-${segmentId}.csv`;
      a.click();
    } catch (error) {
      console.error('Error exporting segment:', error);
    }
  };

  const loadSegmentDetails = async (segmentId) => {
    try {
      const [membersRes, analyticsRes] = await Promise.all([
        fetch(`/api/v1/segments/${segmentId}/members`),
        fetch(`/api/v1/segments/${segmentId}/analytics`)
      ]);
      
      const membersData = await membersRes.json();
      const analyticsData = await analyticsRes.json();
      
      setMembers(membersData.members || []);
      setAnalytics(analyticsData.analytics || []);
    } catch (error) {
      console.error('Error loading segment details:', error);
    }
  };

  const createFromTemplate = async (templateId, name) => {
    try {
      const res = await fetch('/api/v1/segments/templates/create-from', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: templateId, name })
      });
      if (res.ok) {
        alert('Segment created from template!');
        setActiveTab('segments');
        loadData();
      }
    } catch (error) {
      console.error('Error creating from template:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Target className="w-7 h-7" />
          Customer Segmentation Engine
        </h1>
        <p className="text-gray-600 mt-1">
          Create dynamic audience segments based on customer behavior and attributes
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'segments', label: 'Segments', icon: Target },
            { id: 'templates', label: 'Templates', icon: Filter }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      ) : (
        <>
          {/* Segments Tab */}
          {activeTab === 'segments' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Customer Segments</h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Segment
                </button>
              </div>

              {segments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No segments yet</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 text-blue-600 hover:text-blue-700"
                  >
                    Create your first segment
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {segments.map(segment => (
                    <div key={segment.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            <div>
                              <h3 className="font-semibold text-gray-900">{segment.name}</h3>
                              {segment.description && (
                                <p className="text-sm text-gray-600">{segment.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {segment.member_count || 0} members
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              segment.is_dynamic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {segment.is_dynamic ? 'Dynamic' : 'Static'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              segment.is_active ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {segment.is_active ? 'Active' : 'Inactive'}
                            </span>
                            {segment.last_calculated && (
                              <span className="text-xs">
                                Last calculated: {new Date(segment.last_calculated).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => calculateSegment(segment.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center gap-1"
                            title="Recalculate segment"
                          >
                            <Play className="w-3 h-3" />
                            Calculate
                          </button>
                          <button
                            onClick={() => exportSegment(segment.id)}
                            className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm flex items-center gap-1"
                            title="Export to CSV"
                          >
                            <Download className="w-3 h-3" />
                            Export
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSegment(segment);
                              loadSegmentDetails(segment.id);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            View
                          </button>
                          <button
                            onClick={() => deleteSegment(segment.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Segment Templates</h2>
                <p className="text-sm text-gray-600">Pre-built segments you can use as starting points</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {templates.map(template => (
                  <div key={template.id} className="bg-white border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        {template.category && (
                          <span className="text-xs text-gray-500">{template.category}</span>
                        )}
                      </div>
                      {template.is_system && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">System</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <button
                      onClick={() => {
                        const name = prompt('Enter a name for this segment:', template.name);
                        if (name) createFromTemplate(template.id, name);
                      }}
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Segment Modal */}
      {showCreateModal && (
        <SegmentModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createSegment}
          onPreview={previewSegment}
        />
      )}

      {/* Segment Details Modal */}
      {selectedSegment && (
        <SegmentDetailsModal
          segment={selectedSegment}
          members={members}
          analytics={analytics}
          onClose={() => setSelectedSegment(null)}
        />
      )}

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal
          contacts={previewData}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

function SegmentModal({ onClose, onCreate, onPreview }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_dynamic: true,
    refresh_frequency: 'realtime',
    criteria_json: {
      logical_operator: 'AND',
      conditions: []
    }
  });

  const [newCondition, setNewCondition] = useState({
    field: 'email',
    operator: 'contains',
    value: ''
  });

  const addCondition = () => {
    if (!newCondition.value) return;
    setFormData({
      ...formData,
      criteria_json: {
        ...formData.criteria_json,
        conditions: [...formData.criteria_json.conditions, newCondition]
      }
    });
    setNewCondition({ field: 'email', operator: 'contains', value: '' });
  };

  const removeCondition = (index) => {
    const conditions = [...formData.criteria_json.conditions];
    conditions.splice(index, 1);
    setFormData({
      ...formData,
      criteria_json: { ...formData.criteria_json, conditions }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Create Customer Segment</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Segment Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., High Value Customers"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.is_dynamic ? 'dynamic' : 'static'}
                onChange={(e) => setFormData({...formData, is_dynamic: e.target.value === 'dynamic'})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="dynamic">Dynamic (Auto-update)</option>
                <option value="static">Static (Manual)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Refresh</label>
              <select
                value={formData.refresh_frequency}
                onChange={(e) => setFormData({...formData, refresh_frequency: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="realtime">Real-time</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Conditions</label>
            
            {/* Existing conditions */}
            {formData.criteria_json.conditions.map((cond, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded">
                <span className="text-sm">{cond.field}</span>
                <span className="text-sm text-gray-500">{cond.operator}</span>
                <span className="text-sm font-medium">{cond.value}</span>
                <button
                  type="button"
                  onClick={() => removeCondition(idx)}
                  className="ml-auto text-red-600 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}

            {/* Add new condition */}
            <div className="flex gap-2 mt-2">
              <select
                value={newCondition.field}
                onChange={(e) => setNewCondition({...newCondition, field: e.target.value})}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="email">Email</option>
                <option value="name">Name</option>
                <option value="status">Status</option>
                <option value="created_at">Created Date</option>
              </select>
              <select
                value={newCondition.operator}
                onChange={(e) => setNewCondition({...newCondition, operator: e.target.value})}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="equals">Equals</option>
                <option value="contains">Contains</option>
                <option value="starts_with">Starts with</option>
                <option value="is_null">Is empty</option>
                <option value="is_not_null">Is not empty</option>
              </select>
              <input
                type="text"
                value={newCondition.value}
                onChange={(e) => setNewCondition({...newCondition, value: e.target.value})}
                className="flex-1 px-3 py-2 border rounded-lg"
                placeholder="Value"
              />
              <button
                type="button"
                onClick={addCondition}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => onPreview(formData.criteria_json)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Preview
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Segment
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SegmentDetailsModal({ segment, members, analytics, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold">{segment.name}</h2>
            <p className="text-sm text-gray-600">{segment.member_count || 0} members</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Members</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.slice(0, 10).map(member => (
                    <tr key={member.id}>
                      <td className="px-4 py-2 text-sm">{member.name || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm">{member.email}</td>
                      <td className="px-4 py-2 text-sm">{member.status || 'active'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({ contacts, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">Segment Preview ({contacts.length} contacts)</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="space-y-2">
          {contacts.map(contact => (
            <div key={contact.id} className="p-2 border rounded">
              <p className="font-medium">{contact.name || contact.email}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
