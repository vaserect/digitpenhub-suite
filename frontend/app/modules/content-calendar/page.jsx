'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function ContentCalendar() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('calendar');
  const [content, setContent] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    contentType: '',
    campaignId: '',
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    if (activeTab === 'calendar') loadCalendarData();
    else if (activeTab === 'content') loadContent();
    else if (activeTab === 'campaigns') loadCampaigns();
    else if (activeTab === 'templates') loadTemplates();
    else if (activeTab === 'approvals') loadApprovals();
    else if (activeTab === 'connections') loadConnections();
  }, [activeTab, filters]);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: filters.dateFrom,
        endDate: filters.dateTo
      });
      const res = await fetch(`/api/v1/content-calendar/calendar?${params}`, {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      const data = await res.json();
      setContent(data.items || []);
    } catch (err) {
      console.error('Error loading calendar:', err);
    }
    setLoading(false);
  };

  const loadContent = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.contentType) params.append('contentType', filters.contentType);
      if (filters.campaignId) params.append('campaignId', filters.campaignId);
      
      const res = await fetch(`/api/v1/content-calendar/content?${params}`, {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      const data = await res.json();
      setContent(data.items || []);
    } catch (err) {
      console.error('Error loading content:', err);
    }
    setLoading(false);
  };

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/content-calendar/campaigns', {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      console.error('Error loading campaigns:', err);
    }
    setLoading(false);
  };

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/content-calendar/templates', {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error('Error loading templates:', err);
    }
    setLoading(false);
  };

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/content-calendar/approvals/pending', {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      const data = await res.json();
      setApprovals(data.approvals || []);
    } catch (err) {
      console.error('Error loading approvals:', err);
    }
    setLoading(false);
  };

  const loadConnections = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/content-calendar/connections', {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      const data = await res.json();
      setConnections(data.connections || []);
    } catch (err) {
      console.error('Error loading connections:', err);
    }
    setLoading(false);
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      idea: 'bg-gray-100 text-gray-800',
      draft: 'bg-blue-100 text-blue-800',
      in_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      scheduled: 'bg-purple-100 text-purple-800',
      published: 'bg-indigo-100 text-indigo-800',
      archived: 'bg-gray-100 text-gray-600'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getContentTypeIcon = (type) => {
    const icons = {
      blog: '📝',
      social_facebook: '📘',
      social_twitter: '🐦',
      social_linkedin: '💼',
      social_instagram: '📷',
      email: '📧',
      video: '🎥',
      podcast: '🎙️',
      infographic: '📊',
      ebook: '📚',
      webinar: '🎓',
      press_release: '📰'
    };
    return icons[type] || '📄';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Content Calendar</h1>
        <p className="text-gray-600">Plan, schedule, and manage your content across all channels</p>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-4">
          {['calendar', 'content', 'campaigns', 'templates', 'approvals', 'connections'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      {(activeTab === 'calendar' || activeTab === 'content') && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">All Statuses</option>
                <option value="idea">Idea</option>
                <option value="draft">Draft</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Content Type</label>
              <select
                value={filters.contentType}
                onChange={(e) => setFilters({...filters, contentType: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">All Types</option>
                <option value="blog">Blog Post</option>
                <option value="social_facebook">Facebook</option>
                <option value="social_twitter">Twitter</option>
                <option value="social_linkedin">LinkedIn</option>
                <option value="email">Email</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Campaign</label>
              <select
                value={filters.campaignId}
                onChange={(e) => setFilters({...filters, campaignId: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">All Campaigns</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      ) : (
        <>
          {activeTab === 'calendar' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Calendar View</h2>
                <button
                  onClick={() => openModal('content')}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + New Content
                </button>
              </div>
              <div className="space-y-2">
                {content.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No content scheduled. Create your first content item to get started.
                  </div>
                ) : (
                  content.map(item => (
                    <div
                      key={item.id}
                      className="p-4 border rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => openModal('content', item)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getContentTypeIcon(item.content_type)}</span>
                            <h3 className="font-medium">{item.title}</h3>
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </div>
                          {item.campaign_name && (
                            <div className="mt-1 text-sm text-gray-600">
                              Campaign: {item.campaign_name}
                            </div>
                          )}
                          {item.scheduled_at && (
                            <div className="mt-1 text-sm text-gray-500">
                              📅 {new Date(item.scheduled_at).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">Content Items</h2>
                <button
                  onClick={() => openModal('content')}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + New Content
                </button>
              </div>
              <div className="divide-y">
                {content.map(item => (
                  <div key={item.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getContentTypeIcon(item.content_type)}</span>
                        <div>
                          <h3 className="font-medium">{item.title}</h3>
                          <div className="flex gap-2 mt-1">
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                            {item.campaign_name && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                {item.campaign_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => openModal('content', item)}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">Campaigns</h2>
                <button
                  onClick={() => openModal('campaign')}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + New Campaign
                </button>
              </div>
              <div className="divide-y">
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: campaign.color }}
                        ></div>
                        <div>
                          <h3 className="font-medium">{campaign.name}</h3>
                          <p className="text-sm text-gray-600">{campaign.description}</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">Content Templates</h2>
                <button
                  onClick={() => openModal('template')}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + New Template
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                {templates.map(template => (
                  <div key={template.id} className="border rounded p-4 hover:shadow-md cursor-pointer">
                    <h3 className="font-medium mb-2">{template.name}</h3>
                    <span className="text-sm text-gray-600">{template.content_type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'approvals' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Pending Approvals</h2>
              </div>
              <div className="divide-y">
                {approvals.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No pending approvals
                  </div>
                ) : (
                  approvals.map(approval => (
                    <div key={approval.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{approval.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {approval.content_type} • Scheduled: {new Date(approval.scheduled_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
                            Approve
                          </button>
                          <button className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'connections' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">Publishing Connections</h2>
                <button
                  onClick={() => openModal('connection')}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + Connect Platform
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                {['facebook', 'twitter', 'linkedin', 'instagram', 'wordpress', 'mailchimp'].map(platform => {
                  const conn = connections.find(c => c.platform === platform);
                  return (
                    <div key={platform} className="border rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium capitalize">{platform}</h3>
                        <span className={`px-2 py-1 rounded text-xs ${
                          conn?.status === 'connected' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {conn?.status || 'disconnected'}
                        </span>
                      </div>
                      {conn ? (
                        <p className="text-sm text-gray-600">{conn.account_name}</p>
                      ) : (
                        <button
                          onClick={() => openModal('connection', { platform })}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
