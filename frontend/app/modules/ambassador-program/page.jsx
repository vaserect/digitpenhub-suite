'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api';

/**
 * Ambassador Program - Admin Dashboard
 * Benchmark: Brandbassador / GRIN Ambassador
 */
export default function AmbassadorProgramPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [ambassadors, setAmbassadors] = useState([]);
  const [applications, setApplications] = useState([]);
  const [content, setContent] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showCreateProgram, setShowCreateProgram] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, programsRes] = await Promise.all([
        apiFetch('/api/v1/ambassador/stats'),
        apiFetch('/api/v1/ambassador/programs')
      ]);

      setStats(statsRes.data);
      setPrograms(programsRes.data);

      if (programsRes.data.length > 0) {
        const firstProgram = programsRes.data[0];
        setSelectedProgram(firstProgram.id);
        await loadProgramData(firstProgram.id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProgramData = async (programId) => {
    try {
      const [ambassadorsRes, applicationsRes, contentRes, campaignsRes] = await Promise.all([
        apiFetch(`/api/v1/ambassador/ambassadors?program_id=${programId}`),
        apiFetch(`/api/v1/ambassador/programs/${programId}/applications`),
        apiFetch(`/api/v1/ambassador/content`),
        apiFetch(`/api/v1/ambassador/campaigns?program_id=${programId}`)
      ]);

      setAmbassadors(ambassadorsRes.data);
      setApplications(applicationsRes.data);
      setContent(contentRes.data);
      setCampaigns(campaignsRes.data);
    } catch (error) {
      console.error('Failed to load program data:', error);
    }
  };

  const handleCreateProgram = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const res = await apiFetch('/api/v1/ambassador/programs', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.get('name'),
          description: formData.get('description'),
          applicationEnabled: formData.get('applicationEnabled') === 'on',
          autoApprove: formData.get('autoApprove') === 'on'
        })
      });

      setPrograms([...programs, res.data]);
      setShowCreateProgram(false);
      setSelectedProgram(res.data.id);
      await loadProgramData(res.data.id);
    } catch (error) {
      console.error('Failed to create program:', error);
      alert('Failed to create program');
    }
  };

  const handleApproveApplication = async (applicationId) => {
    try {
      await apiFetch(`/api/v1/ambassador/applications/${applicationId}/approve`, {
        method: 'POST'
      });
      
      await loadProgramData(selectedProgram);
      alert('Application approved successfully');
    } catch (error) {
      console.error('Failed to approve application:', error);
      alert('Failed to approve application');
    }
  };

  const handleRejectApplication = async (applicationId) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;

    try {
      await apiFetch(`/api/v1/ambassador/applications/${applicationId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      
      await loadProgramData(selectedProgram);
      alert('Application rejected');
    } catch (error) {
      console.error('Failed to reject application:', error);
      alert('Failed to reject application');
    }
  };

  const handleApproveContent = async (contentId) => {
    try {
      await apiFetch(`/api/v1/ambassador/content/${contentId}/approve`, {
        method: 'POST'
      });
      
      await loadProgramData(selectedProgram);
      alert('Content approved successfully');
    } catch (error) {
      console.error('Failed to approve content:', error);
      alert('Failed to approve content');
    }
  };

  const handleRejectContent = async (contentId) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;

    try {
      await apiFetch(`/api/v1/ambassador/content/${contentId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      
      await loadProgramData(selectedProgram);
      alert('Content rejected');
    } catch (error) {
      console.error('Failed to reject content:', error);
      alert('Failed to reject content');
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      await apiFetch(`/api/v1/ambassador/programs/${selectedProgram}/campaigns`, {
        method: 'POST',
        body: JSON.stringify({
          name: formData.get('name'),
          description: formData.get('description'),
          brief: formData.get('brief'),
          reward_per_piece: parseFloat(formData.get('reward_per_piece') || 0),
          points_per_piece: parseInt(formData.get('points_per_piece') || 0),
          start_date: formData.get('start_date'),
          end_date: formData.get('end_date')
        })
      });

      await loadProgramData(selectedProgram);
      setShowCreateCampaign(false);
      alert('Campaign created successfully');
    } catch (error) {
      console.error('Failed to create campaign:', error);
      alert('Failed to create campaign');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Ambassador Program...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ambassador Program</h1>
          <p className="text-gray-600">Manage your brand ambassadors, campaigns, and rewards</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Total Ambassadors</div>
              <div className="text-3xl font-bold text-gray-900">{stats.total_ambassadors}</div>
              <div className="text-sm text-green-600 mt-1">{stats.active_ambassadors} active</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Pending Applications</div>
              <div className="text-3xl font-bold text-gray-900">{stats.pending_applications}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Total Referrals</div>
              <div className="text-3xl font-bold text-gray-900">{stats.total_referrals}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Rewards Paid</div>
              <div className="text-3xl font-bold text-gray-900">${stats.total_rewards_paid?.toFixed(2) || '0.00'}</div>
            </div>
          </div>
        )}

        {/* Program Selector */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Program:</label>
              <select
                value={selectedProgram || ''}
                onChange={(e) => {
                  setSelectedProgram(e.target.value);
                  loadProgramData(e.target.value);
                }}
                className="border border-gray-300 rounded-lg px-4 py-2"
              >
                {programs.map(program => (
                  <option key={program.id} value={program.id}>{program.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowCreateProgram(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Create Program
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {['overview', 'ambassadors', 'applications', 'content', 'campaigns'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {applications.slice(0, 5).map(app => (
                      <div key={app.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{app.full_name}</div>
                          <div className="text-sm text-gray-600">Applied {new Date(app.submitted_at).toLocaleDateString()}</div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          app.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Ambassadors Tab */}
            {activeTab === 'ambassadors' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Ambassadors ({ambassadors.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referrals</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rewards</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ambassadors.map(ambassador => (
                        <tr key={ambassador.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{ambassador.full_name}</div>
                            <div className="text-sm text-gray-500">{ambassador.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 rounded text-sm" style={{ backgroundColor: ambassador.badge_color + '20', color: ambassador.badge_color }}>
                              {ambassador.tier_name || 'No Tier'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {ambassador.total_referrals}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${parseFloat(ambassador.total_revenue || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${parseFloat(ambassador.rewards_earned || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              ambassador.status === 'active' ? 'bg-green-100 text-green-800' :
                              ambassador.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {ambassador.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Applications Tab */}
            {activeTab === 'applications' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Applications ({applications.length})</h3>
                <div className="space-y-4">
                  {applications.map(app => (
                    <div key={app.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{app.full_name}</div>
                          <div className="text-sm text-gray-600">{app.email}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            Applied: {new Date(app.submitted_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            app.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {app.status}
                          </span>
                          {app.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveApplication(app.id)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectApplication(app.id)}
                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Content Submissions ({content.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {content.map(item => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="aspect-video bg-gray-100 rounded mb-3 flex items-center justify-center">
                        {item.thumbnail_url ? (
                          <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover rounded" />
                        ) : (
                          <span className="text-gray-400">No preview</span>
                        )}
                      </div>
                      <div className="font-medium text-gray-900 mb-1">{item.title}</div>
                      <div className="text-sm text-gray-600 mb-2">{item.ambassador_name}</div>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          item.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.status}
                        </span>
                        {item.status === 'pending' && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleApproveContent(item.id)}
                              className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectContent(item.id)}
                              className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Campaigns Tab */}
            {activeTab === 'campaigns' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Campaigns ({campaigns.length})</h3>
                  <button
                    onClick={() => setShowCreateCampaign(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    + Create Campaign
                  </button>
                </div>
                <div className="space-y-4">
                  {campaigns.map(campaign => (
                    <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{campaign.name}</div>
                          <div className="text-sm text-gray-600 mt-1">{campaign.description}</div>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>Reward: ${campaign.reward_per_piece}/piece</span>
                            <span>Points: {campaign.points_per_piece}/piece</span>
                            <span>Participants: {campaign.participant_count || 0}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                          campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {campaign.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Program Modal */}
      {showCreateProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Create Ambassador Program</h3>
            <form onSubmit={handleCreateProgram}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., Brand Ambassador Program"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Program description..."
                  />
                </div>
                <div className="flex items-center">
                  <input type="checkbox" name="applicationEnabled" id="applicationEnabled" className="mr-2" defaultChecked />
                  <label htmlFor="applicationEnabled" className="text-sm text-gray-700">Enable applications</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" name="autoApprove" id="autoApprove" className="mr-2" />
                  <label htmlFor="autoApprove" className="text-sm text-gray-700">Auto-approve applications</label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateProgram(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Create Campaign</h3>
            <form onSubmit={handleCreateCampaign}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows="2"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Brief</label>
                  <textarea
                    name="brief"
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Guidelines and requirements..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reward per Piece ($)</label>
                    <input
                      type="number"
                      name="reward_per_piece"
                      step="0.01"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Points per Piece</label>
                    <input
                      type="number"
                      name="points_per_piece"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      name="start_date"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      name="end_date"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateCampaign(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
