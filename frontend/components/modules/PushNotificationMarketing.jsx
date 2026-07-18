'use client';

import { useState, useEffect } from 'react';
import { Bell, Send, Users, BarChart3, Target, Zap, Calendar, Settings } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function PushNotificationMarketing() {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [campaigns, setCampaigns] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [segments, setSegments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'campaigns') {
        const data = await apiFetch('/api/v1/push-notifications/campaigns');
        setCampaigns(data.campaigns || []);
      } else if (activeTab === 'subscribers') {
        const data = await apiFetch('/api/v1/push-notifications/subscribers');
        setSubscribers(data.subscribers || []);
      } else if (activeTab === 'segments') {
        const data = await apiFetch('/api/v1/push-notifications/segments');
        setSegments(data.segments || []);
      } else if (activeTab === 'templates') {
        const data = await apiFetch('/api/v1/push-notifications/templates');
        setTemplates(data.templates || []);
      } else if (activeTab === 'analytics') {
        const data = await apiFetch('/api/v1/push-notifications/analytics/summary');
        setAnalytics(data.summary || {});
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const createCampaign = async (campaignData) => {
    try {
      const data = await apiFetch('/api/v1/push-notifications/campaigns', {
        method: 'POST',
        body: JSON.stringify(campaignData)
      });
      setShowCampaignModal(false);
      loadData();
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  const sendCampaign = async (campaignId) => {
    if (!confirm('Send this campaign now?')) return;
    try {
      await apiFetch(`/api/v1/push-notifications/campaigns/${campaignId}/send`, {
        method: 'POST'
      });
      alert('Campaign sent successfully!');
      loadData();
    } catch (error) {
      console.error('Error sending campaign:', error);
    }
  };

  const deleteCampaign = async (campaignId) => {
    if (!confirm('Delete this campaign?')) return;
    try {
      await apiFetch(`/api/v1/push-notifications/campaigns/${campaignId}`, {
        method: 'DELETE'
      });
      loadData();
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-purple-100 text-purple-800',
      archived: 'bg-gray-100 text-gray-600'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.draft}`}>
        {status}
      </span>
    );
  };

  const getPlatformIcon = (type) => {
    if (type === 'web') return '🌐';
    if (type === 'mobile') return '📱';
    return '🔔';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="w-7 h-7" />
          Push Notification Marketing
        </h1>
        <p className="text-gray-600 mt-1">
          Send web and mobile push notifications to engage your audience
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'campaigns', label: 'Campaigns', icon: Send },
            { id: 'subscribers', label: 'Subscribers', icon: Users },
            { id: 'segments', label: 'Segments', icon: Target },
            { id: 'templates', label: 'Templates', icon: Zap },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
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
          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Push Campaigns</h2>
                <button
                  onClick={() => setShowCampaignModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Create Campaign
                </button>
              </div>

              {campaigns.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No campaigns yet</p>
                  <button
                    onClick={() => setShowCampaignModal(true)}
                    className="mt-4 text-blue-600 hover:text-blue-700"
                  >
                    Create your first campaign
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {campaigns.map(campaign => (
                    <div key={campaign.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{getPlatformIcon(campaign.type)}</span>
                            <div>
                              <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                              <p className="text-sm text-gray-600">{campaign.title}</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mb-3">{campaign.body}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {campaign.schedule_type === 'immediate' ? 'Send Now' : 'Scheduled'}
                            </span>
                            {campaign.scheduled_at && (
                              <span>{new Date(campaign.scheduled_at).toLocaleString()}</span>
                            )}
                            {getStatusBadge(campaign.status)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {campaign.status === 'draft' && (
                            <button
                              onClick={() => sendCampaign(campaign.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                              Send
                            </button>
                          )}
                          <button
                            onClick={() => deleteCampaign(campaign.id)}
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

          {/* Subscribers Tab */}
          {activeTab === 'subscribers' && (
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Subscribers</h2>
                <p className="text-sm text-gray-600">Devices subscribed to push notifications</p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Subscribers</p>
                  <p className="text-2xl font-bold text-blue-600">{subscribers.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {subscribers.filter(s => s.is_active).length}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Web Push</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {subscribers.filter(s => s.platform === 'web').length}
                  </p>
                </div>
              </div>

              <div className="bg-white border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscribed</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subscribers.map(sub => (
                      <tr key={sub.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-2xl">{getPlatformIcon(sub.platform)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sub.browser || sub.device_type || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {sub.city ? `${sub.city}, ${sub.country}` : sub.country || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            sub.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {sub.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(sub.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Segments Tab */}
          {activeTab === 'segments' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Audience Segments</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Create Segment
                </button>
              </div>

              {segments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No segments created yet</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {segments.map(segment => (
                    <div key={segment.id} className="bg-white border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900">{segment.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{segment.description}</p>
                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                        <span>{segment.subscriber_count || 0} subscribers</span>
                        <span>Updated {new Date(segment.updated_at).toLocaleDateString()}</span>
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Notification Templates</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Create Template
                </button>
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
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium text-sm">{template.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{template.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && analytics && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Campaign Analytics</h2>
              
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Campaigns</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.total_campaigns || 0}</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Sent</p>
                  <p className="text-2xl font-bold text-blue-600">{analytics.total_sent || 0}</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Delivery Rate</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.avg_delivery_rate || 0}%</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Click Rate</p>
                  <p className="text-2xl font-bold text-purple-600">{analytics.avg_click_rate || 0}%</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Detailed analytics charts coming soon</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Campaign Creation Modal */}
      {showCampaignModal && (
        <CampaignModal
          onClose={() => setShowCampaignModal(false)}
          onCreate={createCampaign}
          templates={templates}
        />
      )}
    </div>
  );
}

function CampaignModal({ onClose, onCreate, templates }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'web',
    title: '',
    body: '',
    schedule_type: 'immediate',
    priority: 'normal'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Create Push Campaign</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Welcome Campaign"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="web">Web Push</option>
              <option value="mobile">Mobile Push</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notification Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Welcome to our platform!"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
            <textarea
              required
              value={formData.body}
              onChange={(e) => setFormData({...formData, body: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="e.g., Thanks for subscribing! We're excited to have you here."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
              <select
                value={formData.schedule_type}
                onChange={(e) => setFormData({...formData, schedule_type: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="immediate">Send Immediately</option>
                <option value="scheduled">Schedule for Later</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Campaign
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
