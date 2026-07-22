'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import {
  Users, MessageSquare, Calendar, Award, BarChart3, Bell, Activity,
  Plus, Search, MapPin, Globe, ExternalLink, Shield, Lock, Hash,
  Sparkles, TrendingUp, Clock, Eye, Heart, BookOpen
} from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';

const TABS = [
  { key: 'spaces', label: 'Spaces', icon: MessageSquare },
  { key: 'events', label: 'Events', icon: Calendar },
  { key: 'members', label: 'Members', icon: Users },
  { key: 'tiers', label: 'Tiers', icon: Award },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
];

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

  useEffect(() => { loadData(); }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'spaces': {
          const data = await apiFetch('/api/v1/community/spaces');
          setSpaces(data.spaces || []);
          break;
        }
        case 'events': {
          const data = await apiFetch('/api/v1/community/events?upcoming=true');
          setEvents(data.events || []);
          break;
        }
        case 'members': {
          const params = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
          const data = await apiFetch(`/api/v1/community/members${params}`);
          setMembers(data.members || []);
          break;
        }
        case 'tiers': {
          const data = await apiFetch('/api/v1/community/tiers');
          setTiers(data.tiers || []);
          break;
        }
        case 'analytics': {
          const data = await apiFetch('/api/v1/community/analytics');
          setAnalytics(data);
          break;
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Failed to load data');
    }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const endpoint = activeTab === 'spaces' ? '/api/v1/community/spaces'
        : activeTab === 'events' ? '/api/v1/community/events'
        : '/api/v1/community/tiers';

      await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      setShowCreateModal(false);
      setFormData({});
      toast.success(`${activeTab === 'spaces' ? 'Space' : activeTab === 'events' ? 'Event' : 'Tier'} created!`);
      loadData();
    } catch (err) {
      console.error('Error creating:', err);
      toast.error('Failed to create');
    }
  };

  const handleRSVP = async (eventId, status) => {
    try {
      await apiFetch(`/api/v1/community/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      toast.success(status === 'going' ? 'See you there!' : 'Marked as maybe');
      loadData();
    } catch (err) {
      console.error('Error RSVPing:', err);
    }
  };

  const filtered = (items, field = 'name') =>
    items.filter(item =>
      !searchQuery || (item[field] || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

  const SkeletonCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
          <div className="h-3 bg-gray-200 rounded w-full mb-2" />
          <div className="h-3 bg-gray-200 rounded w-2/3 mb-4" />
          <div className="flex gap-4">
            <div className="h-3 bg-gray-200 rounded w-16" />
            <div className="h-3 bg-gray-200 rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            Community Platform
          </h1>
          <p className="text-gray-500 mt-1">Connect, engage, and grow your community</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push('/community/notifications')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Notifications">
            <Bell className="w-5 h-5" />
          </button>
          <button onClick={() => router.push('/community/activity')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Activity">
            <Activity className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search */}
      {activeTab !== 'analytics' && activeTab !== 'tiers' && (
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 px-6">
          <div className="flex items-center justify-between">
            <nav className="flex -mb-px space-x-1">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}>
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
            <button onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
              <Plus className="w-4 h-4" />
              New {activeTab === 'spaces' ? 'Space' : activeTab === 'events' ? 'Event' : 'Tier'}
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? <SkeletonCards /> : (
            <>
              {/* SPACES */}
              {activeTab === 'spaces' && (
                filtered(spaces).length === 0 ? (
                  <div className="text-center py-16">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchQuery ? 'No spaces found' : 'No spaces yet'}
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      {searchQuery ? 'Try a different search term.' : 'Create your first community space to start connecting with your audience.'}
                    </p>
                    {!searchQuery && (
                      <button onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <Plus className="w-4 h-4" /> Create Space
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered(spaces).map(space => (
                      <div key={space.id}
                        className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer"
                        onClick={() => router.push(`/community/spaces/${space.id}`)}>
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-gray-900 text-lg">{space.name}</h3>
                          <span className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                            space.space_type === 'public' ? 'bg-green-50 text-green-700' :
                            space.space_type === 'private' ? 'bg-yellow-50 text-yellow-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {space.space_type === 'public' ? <Globe className="w-3 h-3" /> :
                             space.space_type === 'private' ? <Lock className="w-3 h-3" /> :
                             <Shield className="w-3 h-3" />}
                            {space.space_type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{space.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {space.member_count || 0}</span>
                          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {space.post_count || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* EVENTS */}
              {activeTab === 'events' && (
                filtered(events, 'title').length === 0 ? (
                  <div className="text-center py-16">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming events</h3>
                    <p className="text-gray-500 mb-6">Create your first event to engage your community.</p>
                    <button onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Plus className="w-4 h-4" /> Create Event
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filtered(events, 'title').map(event => (
                      <div key={event.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg mb-2">{event.title}</h3>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{event.description}</p>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(event.start_time).toLocaleDateString()}</span>
                              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                event.event_type === 'online' ? 'bg-blue-50 text-blue-700' :
                                event.event_type === 'in_person' ? 'bg-green-50 text-green-700' :
                                'bg-purple-50 text-purple-700'
                              }`}>{event.event_type}</span>
                              <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {event.attendee_count || 0} attending</span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button onClick={() => handleRSVP(event.id, 'going')}
                              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">Going</button>
                            <button onClick={() => handleRSVP(event.id, 'maybe')}
                              className="px-4 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-colors">Maybe</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* MEMBERS */}
              {activeTab === 'members' && (
                members.length === 0 ? (
                  <div className="text-center py-16">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No members yet</h3>
                    <p className="text-gray-500">Members will appear here once they join spaces.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {members.map(member => (
                      <div key={member.user_id}
                        onClick={() => router.push(`/community/members/${member.user_id}`)}
                        className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-lg hover:border-blue-200 transition-all">
                        <div className="flex items-center gap-4 mb-3">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-semibold">
                              {(member.display_name || member.full_name || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{member.display_name || member.full_name}</h3>
                            <p className="text-sm text-gray-500 truncate">{member.email}</p>
                          </div>
                        </div>
                        {member.bio && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{member.bio}</p>}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {member.post_count || 0} posts</span>
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {member.comment_count || 0} comments</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* TIERS */}
              {activeTab === 'tiers' && (
                tiers.length === 0 ? (
                  <div className="text-center py-16">
                    <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No membership tiers yet</h3>
                    <p className="text-gray-500 mb-6">Create membership tiers to offer premium access and benefits.</p>
                    <button onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Plus className="w-4 h-4" /> Create Tier
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {tiers.map(tier => (
                      <div key={tier.id}
                        className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all">
                        <div className="flex items-center gap-2 mb-4">
                          {tier.badge_icon && <span className="text-2xl">{tier.badge_icon}</span>}
                          <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                        </div>
                        <p className="text-gray-500 text-sm mb-6">{tier.description}</p>
                        <div className="mb-6">
                          {tier.price_monthly && (
                            <div className="text-3xl font-bold text-gray-900 mb-1">
                              ${Number(tier.price_monthly).toFixed(2)}
                              <span className="text-base text-gray-500 font-normal">/month</span>
                            </div>
                          )}
                          {tier.price_yearly && (
                            <div className="text-sm text-gray-500">${Number(tier.price_yearly).toFixed(2)}/year</div>
                          )}
                          {!tier.price_monthly && !tier.price_yearly && (
                            <div className="text-lg font-semibold text-gray-600">Free</div>
                          )}
                        </div>
                        <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          {tier.price_monthly ? 'Subscribe' : 'Join'}
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* ANALYTICS */}
              {activeTab === 'analytics' && analytics && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Community Analytics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Total Spaces', value: analytics.total_spaces || 0, icon: MessageSquare, color: 'text-blue-600' },
                      { label: 'Total Members', value: analytics.total_members || 0, icon: Users, color: 'text-green-600' },
                      { label: 'Total Posts', value: analytics.total_posts || 0, icon: BookOpen, color: 'text-purple-600' },
                      { label: 'Active Members (30d)', value: analytics.active_members || 0, icon: TrendingUp, color: 'text-orange-500' },
                    ].map((stat, i) => {
                      const Icon = stat.icon;
                      return (
                        <div key={i} className="bg-white border border-gray-200 rounded-xl p-6">
                          <div className="flex items-center justify-between mb-3">
                            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                            <Icon className={`w-8 h-8 ${stat.color} opacity-60`} />
                          </div>
                          <div className="text-sm text-gray-500">{stat.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full mx-4">
            <h3 className="text-xl font-bold mb-6">
              Create {activeTab === 'spaces' ? 'Space' : activeTab === 'events' ? 'Event' : 'Membership Tier'}
            </h3>
            <form onSubmit={handleCreate}>
              {activeTab === 'spaces' && (
                <>
                  <input type="text" placeholder="Space Name *" required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
                    value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  <input type="text" placeholder="Slug (e.g., general-discussion)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
                    value={formData.slug || ''} onChange={(e) => setFormData({...formData, slug: e.target.value})} />
                  <textarea placeholder="Description" rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
                    value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                    value={formData.space_type || 'public'}
                    onChange={(e) => setFormData({...formData, space_type: e.target.value})}>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="secret">Secret</option>
                  </select>
                </>
              )}
              {activeTab === 'events' && (
                <>
                  <input type="text" placeholder="Event Title *" required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
                    value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                  <textarea placeholder="Description" rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
                    value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                  <input type="datetime-local" required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
                    value={formData.start_time || ''} onChange={(e) => setFormData({...formData, start_time: e.target.value})} />
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                    value={formData.event_type || 'online'}
                    onChange={(e) => setFormData({...formData, event_type: e.target.value})}>
                    <option value="online">Online</option>
                    <option value="in_person">In Person</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </>
              )}
              {activeTab === 'tiers' && (
                <>
                  <input type="text" placeholder="Tier Name *" required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
                    value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  <textarea placeholder="Description" rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
                    value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Monthly Price"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
                      value={formData.price_monthly || ''} onChange={(e) => setFormData({...formData, price_monthly: e.target.value})} />
                    <input type="number" placeholder="Yearly Price"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
                      value={formData.price_yearly || ''} onChange={(e) => setFormData({...formData, price_yearly: e.target.value})} />
                  </div>
                  <input type="text" placeholder="Badge icon (emoji)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
                    value={formData.badge_icon || ''} onChange={(e) => setFormData({...formData, badge_icon: e.target.value})} />
                </>
              )}
              <div className="flex gap-4">
                <button type="button" onClick={() => { setShowCreateModal(false); setFormData({}); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
