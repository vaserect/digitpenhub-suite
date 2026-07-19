'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api';

/**
 * Ambassador Portal - Ambassador-facing dashboard
 * Benchmark: Brandbassador / GRIN Ambassador Portal
 */
export default function AmbassadorPortalPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [activities, setActivities] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [content, setContent] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [training, setTraining] = useState([]);
  const [showSubmitContent, setShowSubmitContent] = useState(false);
  const [showRequestPayout, setShowRequestPayout] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get ambassador profile
      const programs = await apiFetch('/api/v1/ambassador/programs');
      if (programs.data.length === 0) {
        setLoading(false);
        return;
      }

      const programId = programs.data[0].id;
      const profileRes = await apiFetch(`/api/v1/ambassador/me?program_id=${programId}`);
      
      if (!profileRes.data) {
        setLoading(false);
        return;
      }

      setProfile(profileRes.data);

      // Load ambassador data
      const [activitiesRes, rewardsRes, contentRes, campaignsRes, trainingRes] = await Promise.all([
        apiFetch(`/api/v1/ambassador/ambassadors/${profileRes.data.id}/activities?limit=10`),
        apiFetch(`/api/v1/ambassador/ambassadors/${profileRes.data.id}/rewards`),
        apiFetch(`/api/v1/ambassador/content?ambassador_id=${profileRes.data.id}`),
        apiFetch(`/api/v1/ambassador/campaigns?program_id=${programId}`),
        apiFetch(`/api/v1/ambassador/programs/${programId}/training?status=published`)
      ]);

      setActivities(activitiesRes.data);
      setRewards(rewardsRes.data);
      setContent(contentRes.data);
      setCampaigns(campaignsRes.data.filter(c => c.status === 'active'));
      setTraining(trainingRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitContent = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      await apiFetch(`/api/v1/ambassador/ambassadors/${profile.id}/content`, {
        method: 'POST',
        body: JSON.stringify({
          content_type: formData.get('content_type'),
          title: formData.get('title'),
          description: formData.get('description'),
          external_url: formData.get('external_url'),
          campaign_id: formData.get('campaign_id') || null
        })
      });

      await loadData();
      setShowSubmitContent(false);
      alert('Content submitted successfully!');
    } catch (error) {
      console.error('Failed to submit content:', error);
      alert('Failed to submit content');
    }
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      await apiFetch(`/api/v1/ambassador/ambassadors/${profile.id}/payouts/request`, {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(formData.get('amount')),
          payment_method: formData.get('payment_method'),
          payment_details: {
            account: formData.get('account_details')
          }
        })
      });

      await loadData();
      setShowRequestPayout(false);
      alert('Payout requested successfully!');
    } catch (error) {
      console.error('Failed to request payout:', error);
      alert('Failed to request payout');
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/ref/${profile.referral_code}`;
    navigator.clipboard.writeText(link);
    alert('Referral link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your ambassador portal...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Not an Ambassador Yet</h2>
          <p className="text-gray-600 mb-6">You haven't been approved as an ambassador yet. Check back later or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ambassador Portal</h1>
          <p className="text-gray-600">Welcome back, {profile.full_name}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Your Tier</div>
            <div className="text-2xl font-bold" style={{ color: profile.badge_color }}>
              {profile.tier_name || 'No Tier'}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Referrals</div>
            <div className="text-3xl font-bold text-gray-900">{profile.total_referrals}</div>
            <div className="text-sm text-green-600 mt-1">{profile.successful_referrals} successful</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Points Balance</div>
            <div className="text-3xl font-bold text-gray-900">{profile.points_balance}</div>
            <div className="text-sm text-gray-500 mt-1">{profile.lifetime_points} lifetime</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Pending Payout</div>
            <div className="text-3xl font-bold text-gray-900">${parseFloat(profile.pending_payout || 0).toFixed(2)}</div>
            <button
              onClick={() => setShowRequestPayout(true)}
              className="text-sm text-blue-600 hover:text-blue-700 mt-1"
            >
              Request Payout
            </button>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow p-6 mb-8 text-white">
          <h3 className="text-lg font-semibold mb-2">Your Referral Link</h3>
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/ref/${profile.referral_code}`}
              readOnly
              className="flex-1 bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-white placeholder-white/60"
            />
            <button
              onClick={copyReferralLink}
              className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100"
            >
              Copy Link
            </button>
          </div>
          <p className="text-sm text-white/80 mt-2">Share this link to earn rewards for every successful referral!</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {['dashboard', 'content', 'campaigns', 'rewards', 'training'].map(tab => (
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
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {activities.map(activity => (
                      <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium capitalize">{activity.activity_type.replace(/_/g, ' ')}</div>
                          <div className="text-sm text-gray-600">{new Date(activity.created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="text-right">
                          {activity.points_earned > 0 && (
                            <div className="text-sm font-medium text-blue-600">+{activity.points_earned} points</div>
                          )}
                          {activity.reward_amount > 0 && (
                            <div className="text-sm font-medium text-green-600">+${activity.reward_amount}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Your Content ({content.length})</h3>
                  <button
                    onClick={() => setShowSubmitContent(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    + Submit Content
                  </button>
                </div>
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
                      <div className="text-sm text-gray-600 mb-2">{item.content_type}</div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        item.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Campaigns Tab */}
            {activeTab === 'campaigns' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Active Campaigns ({campaigns.length})</h3>
                <div className="space-y-4">
                  {campaigns.map(campaign => (
                    <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="font-medium text-gray-900 mb-2">{campaign.name}</div>
                      <div className="text-sm text-gray-600 mb-3">{campaign.description}</div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-green-600 font-medium">${campaign.reward_per_piece}/piece</span>
                        <span className="text-blue-600 font-medium">{campaign.points_per_piece} points/piece</span>
                      </div>
                      {campaign.brief && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
                          <strong>Brief:</strong> {campaign.brief}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rewards Tab */}
            {activeTab === 'rewards' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Your Rewards ({rewards.length})</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cash</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rewards.map(reward => (
                        <tr key={reward.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                            {reward.reward_type.replace(/_/g, ' ')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{reward.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                            {reward.points > 0 ? `+${reward.points}` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                            {reward.cash_amount > 0 ? `$${reward.cash_amount}` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              reward.status === 'approved' ? 'bg-green-100 text-green-800' :
                              reward.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {reward.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(reward.earned_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Training Tab */}
            {activeTab === 'training' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Training Materials ({training.length})</h3>
                <div className="space-y-4">
                  {training.map(item => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{item.title}</div>
                          <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span className="capitalize">{item.training_type}</span>
                            {item.duration_minutes && <span>{item.duration_minutes} min</span>}
                            {item.required && <span className="text-red-600">Required</span>}
                          </div>
                        </div>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                          Start
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Content Modal */}
      {showSubmitContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Submit Content</h3>
            <form onSubmit={handleSubmitContent}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                  <select name="content_type" required className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="photo">Photo</option>
                    <option value="video">Video</option>
                    <option value="testimonial">Testimonial</option>
                    <option value="review">Review</option>
                    <option value="social_post">Social Post</option>
                    <option value="blog_post">Blog Post</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link to Content</label>
                  <input
                    type="url"
                    name="external_url"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign (Optional)</label>
                  <select name="campaign_id" className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="">None</option>
                    {campaigns.map(campaign => (
                      <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowSubmitContent(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Payout Modal */}
      {showRequestPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Request Payout</h3>
            <form onSubmit={handleRequestPayout}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    max={profile.pending_payout}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="0.00"
                  />
                  <p className="text-sm text-gray-500 mt-1">Available: ${parseFloat(profile.pending_payout || 0).toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select name="payment_method" required className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="paypal">PayPal</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="stripe">Stripe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Details</label>
                  <input
                    type="text"
                    name="account_details"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Email or account number"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRequestPayout(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Request Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
