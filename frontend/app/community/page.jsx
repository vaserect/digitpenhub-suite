'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CommunityPlatform() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('spaces');
  const [spaces, setSpaces] = useState([]);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'spaces') {
        const res = await fetch('/api/v1/community/spaces');
        const data = await res.json();
        setSpaces(data.spaces || []);
      } else if (activeTab === 'events') {
        const res = await fetch('/api/v1/community/events?upcoming=true');
        const data = await res.json();
        setEvents(data.events || []);
      } else if (activeTab === 'members') {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        const res = await fetch(`/api/v1/community/members?${params}`);
        const data = await res.json();
        setMembers(data.members || []);
      } else if (activeTab === 'tiers') {
        const res = await fetch('/api/v1/community/tiers');
        const data = await res.json();
        setTiers(data.tiers || []);
      } else if (activeTab === 'analytics') {
        const res = await fetch('/api/v1/community/analytics');
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleCreateSpace = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/community/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowCreateModal(false);
        setFormData({});
        loadData();
      }
    } catch (error) {
      console.error('Error creating space:', error);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/community/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowCreateModal(false);
        setFormData({});
        loadData();
      }
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleCreateTier = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/community/tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowCreateModal(false);
        setFormData({});
        loadData();
      }
    } catch (error) {
      console.error('Error creating tier:', error);
    }
  };

  const handleRSVP = async (eventId, status) => {
    try {
      await fetch(`/api/v1/community/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      loadData();
    } catch (error) {
      console.error('Error RSVPing:', error);
    }
  };

  const filteredSpaces = spaces.filter(space =>
    space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (space.description && space.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Platform</h1>
              <p className="text-gray-600">Connect, engage, and grow your community</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/community/notifications')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                🔔 Notifications
              </button>
              <button
                onClick={() => router.push('/community/activity')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                📊 Activity
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {(activeTab === 'spaces' || activeTab === 'events' || activeTab === 'members') && (
            <form onSubmit={handleSearch} className="max-w-2xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  className="w-full px-4 py-2 pl-10 border rounded-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              </div>
            </form>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {['spaces', 'events', 'members', 'tiers', 'analytics'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium capitalize ${
                    activeTab === tab
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
              </div>
            ) : (
              <>
                {/* Spaces Tab */}
                {activeTab === 'spaces' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold">Community Spaces</h2>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Create Space
                      </button>
                    </div>

                    {filteredSpaces.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 mb-4">
                          {searchQuery ? 'No spaces found matching your search' : 'No spaces yet. Create your first community space!'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSpaces.map((space) => (
                          <div key={space.id} className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow">
                            {space.cover_image_url && (
                              <img src={space.cover_image_url} alt={space.name} className="w-full h-32 object-cover rounded-lg mb-4" />
                            )}
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-semibold">{space.name}</h3>
                              <span className={`px-2 py-1 text-xs rounded ${
                                space.space_type === 'public' ? 'bg-green-100 text-green-800' :
                                space.space_type === 'private' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {space.space_type}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{space.description}</p>
                            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                              <span>👥 {space.member_count} members</span>
                              <span>📝 {space.post_count} posts</span>
                            </div>
                            <button
                              onClick={() => router.push(`/community/spaces/${space.id}`)}
                              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              View Space
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Events Tab */}
                {activeTab === 'events' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold">Upcoming Events</h2>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Create Event
                      </button>
                    </div>

                    {filteredEvents.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 mb-4">
                          {searchQuery ? 'No events found matching your search' : 'No upcoming events. Create your first event!'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredEvents.map((event) => (
                          <div key={event.id} className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span>📅 {new Date(event.start_time).toLocaleDateString()}</span>
                                  <span>🕐 {new Date(event.start_time).toLocaleTimeString()}</span>
                                  <span className={`px-2 py-1 rounded ${
                                    event.event_type === 'online' ? 'bg-blue-100 text-blue-800' :
                                    event.event_type === 'in_person' ? 'bg-green-100 text-green-800' :
                                    'bg-purple-100 text-purple-800'
                                  }`}>
                                    {event.event_type}
                                  </span>
                                  <span>👥 {event.attendee_count} attending</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleRSVP(event.id, 'going')}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                  Going
                                </button>
                                <button
                                  onClick={() => handleRSVP(event.id, 'maybe')}
                                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                                >
                                  Maybe
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Members Tab */}
                {activeTab === 'members' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-6">Community Members</h2>
                    {members.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-600">
                          {searchQuery ? 'No members found matching your search' : 'No members yet.'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {members.map((member) => (
                          <div
                            key={member.user_id}
                            onClick={() => router.push(`/community/members/${member.user_id}`)}
                            className="bg-white border rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
                          >
                            <div className="flex items-center gap-4 mb-4">
                              {member.avatar_url ? (
                                <img src={member.avatar_url} alt={member.display_name || member.name} className="w-16 h-16 rounded-full" />
                              ) : (
                                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-semibold">
                                  {(member.display_name || member.name || 'U').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <h3 className="font-semibold">{member.display_name || member.name}</h3>
                                <p className="text-sm text-gray-600">{member.email}</p>
                              </div>
                            </div>
                            {member.bio && <p className="text-sm text-gray-600 mb-4 line-clamp-2">{member.bio}</p>}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>📝 {member.post_count || 0} posts</span>
                              <span>💬 {member.comment_count || 0} comments</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tiers Tab */}
                {activeTab === 'tiers' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold">Membership Tiers</h2>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Create Tier
                      </button>
                    </div>

                    {tiers.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 mb-4">No membership tiers yet. Create your first tier!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {tiers.map((tier) => (
                          <div key={tier.id} className="bg-white border-2 rounded-lg p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-center gap-2 mb-4">
                              {tier.badge_icon && <span className="text-2xl">{tier.badge_icon}</span>}
                              <h3 className="text-xl font-bold">{tier.name}</h3>
                            </div>
                            <p className="text-gray-600 mb-6">{tier.description}</p>
                            <div className="mb-6">
                              {tier.price_monthly && (
                                <div className="text-3xl font-bold mb-2">
                                  ${tier.price_monthly}<span className="text-lg text-gray-600">/month</span>
                                </div>
                              )}
                              {tier.price_yearly && (
                                <div className="text-sm text-gray-600">
                                  or ${tier.price_yearly}/year
                                </div>
                              )}
                            </div>
                            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                              Select Tier
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && analytics && (
                  <div>
                    <h2 className="text-xl font-semibold mb-6">Community Analytics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-white border rounded-lg p-6">
                        <div className="text-3xl font-bold text-blue-600 mb-2">{analytics.total_spaces || 0}</div>
                        <div className="text-gray-600">Total Spaces</div>
                      </div>
                      <div className="bg-white border rounded-lg p-6">
                        <div className="text-3xl font-bold text-green-600 mb-2">{analytics.total_members || 0}</div>
                        <div className="text-gray-600">Total Members</div>
                      </div>
                      <div className="bg-white border rounded-lg p-6">
                        <div className="text-3xl font-bold text-purple-600 mb-2">{analytics.total_posts || 0}</div>
                        <div className="text-gray-600">Total Posts</div>
                      </div>
                      <div className="bg-white border rounded-lg p-6">
                        <div className="text-3xl font-bold text-orange-600 mb-2">{analytics.active_members || 0}</div>
                        <div className="text-gray-600">Active Members (30d)</div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">
                Create {activeTab === 'spaces' ? 'Space' : activeTab === 'events' ? 'Event' : 'Tier'}
              </h3>
              <form onSubmit={activeTab === 'spaces' ? handleCreateSpace : activeTab === 'events' ? handleCreateEvent : handleCreateTier}>
                {activeTab === 'spaces' && (
                  <>
                    <input
                      type="text"
                      placeholder="Space Name"
                      className="w-full px-4 py-2 border rounded-lg mb-4"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Slug (e.g., general-discussion)"
                      className="w-full px-4 py-2 border rounded-lg mb-4"
                      value={formData.slug || ''}
                      onChange={(e) => setFormData({...formData, slug: e.target.value})}
                      required
                    />
                    <textarea
                      placeholder="Description"
                      className="w-full px-4 py-2 border rounded-lg mb-4"
                      rows="3"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                    <select
                      className="w-full px-4 py-2 border rounded-lg mb-4"
                      value={formData.space_type || 'public'}
                      onChange={(e) => setFormData({...formData, space_type: e.target.value})}
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="secret">Secret</option>
                    </select>
                  </>
                )}
                {activeTab === 'events' && (
                  <>
                    <input
                      type="text"
                      placeholder="Event Title"
                      className="w-full px-4 py-2 border rounded-lg mb-4"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                    <textarea
                      placeholder="Description"
                      className="w-full px-4 py-2 border rounded-lg mb-4"
                      rows="3"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                    <input
                      type="datetime-local"
                      className="w-full px-4 py-2 border rounded-lg mb-4"
                      value={formData.start_time || ''}
                      onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                      required
                    />
                    <select
                      className="w-full px-4 py-2 border rounded-lg mb-4"
                      value={formData.event_type || 'online'}
                      onChange={(e) => setFormData({...formData, event_type: e.target.value})}
                    >
                      <option value="online">Online</option>
                      <option value="in_person">In Person</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </>
                )}
                {activeTab === 'tiers' && (
                  <>
                    <input
                      type="text"
                      placeholder="Tier Name"
                      className="w-full px-4 py-2 border rounded-lg mb-4"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                    <textarea
                      placeholder="Description"
                      className="w-full px-4 py-2 border rounded-lg mb-4"
                      rows="3"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                    <input
                      type="number"
                      placeholder="Monthly Price"
                      className="w-full px-4 py-2 border rounded-lg mb-4"
                      value={formData.price_monthly || ''}
                      onChange={(e) => setFormData({...formData, price_monthly: e.target.value})}
                    />
                    <input
                      type="number"
                      placeholder="Yearly Price"
                      className="w-full px-4 py-2 border rounded-lg mb-4"
                      value={formData.price_yearly || ''}
                      onChange={(e) => setFormData({...formData, price_yearly: e.target.value})}
                    />
                  </>
                )}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({});
                    }}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
