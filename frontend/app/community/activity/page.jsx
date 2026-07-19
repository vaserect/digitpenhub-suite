'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ActivityFeed() {
  const router = useRouter();
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('all'); // all, posts, comments, events, members
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [filter]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('activity_type', filter);
      
      const res = await fetch(`/api/v1/community/activity?${params}`);
      const data = await res.json();
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
    setLoading(false);
  };

  const getActivityIcon = (type) => {
    const icons = {
      post_created: '📝',
      comment_created: '💬',
      reaction_added: '❤️',
      member_joined: '👋',
      event_created: '📅',
      event_rsvp: '✓',
      space_created: '🏠',
      tier_assigned: '⭐'
    };
    return icons[type] || '📌';
  };

  const getActivityText = (activity) => {
    const actor = activity.actor_name || 'Someone';
    
    switch (activity.activity_type) {
      case 'post_created':
        return `${actor} created a new post`;
      case 'comment_created':
        return `${actor} commented on a post`;
      case 'reaction_added':
        return `${actor} reacted to a ${activity.target_type}`;
      case 'member_joined':
        return `${actor} joined the community`;
      case 'event_created':
        return `${actor} created a new event`;
      case 'event_rsvp':
        return `${actor} RSVPed to an event`;
      case 'space_created':
        return `${actor} created a new space`;
      case 'tier_assigned':
        return `${actor} was assigned a membership tier`;
      default:
        return `${actor} performed an action`;
    }
  };

  const handleActivityClick = (activity) => {
    if (activity.target_type === 'post' && activity.target_id) {
      router.push(`/community/posts/${activity.target_id}`);
    } else if (activity.target_type === 'space' && activity.target_id) {
      router.push(`/community/spaces/${activity.target_id}`);
    } else if (activity.target_type === 'event' && activity.target_id) {
      router.push(`/community/events/${activity.target_id}`);
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/community')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Back to Community
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Feed</h1>
          <p className="text-gray-600">See what's happening in your community</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {[
                { key: 'all', label: 'All Activity' },
                { key: 'posts', label: 'Posts' },
                { key: 'comments', label: 'Comments' },
                { key: 'events', label: 'Events' },
                { key: 'members', label: 'Members' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                    filter === tab.key
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading activity...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-gray-600 mb-2">No activity yet</p>
                <p className="text-sm text-gray-500">
                  Activity will appear here as members interact with the community
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    onClick={() => handleActivityClick(activity)}
                    className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="text-2xl flex-shrink-0">
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        {getActivityText(activity)}
                      </p>
                      {activity.metadata && activity.metadata.title && (
                        <p className="text-sm text-gray-600 mt-1 truncate">
                          "{activity.metadata.title}"
                        </p>
                      )}
                      {activity.metadata && activity.metadata.content && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {activity.metadata.content}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {getTimeAgo(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Activity Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {activities.filter(a => a.activity_type === 'post_created').length}
              </div>
              <div className="text-sm text-gray-600">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {activities.filter(a => a.activity_type === 'comment_created').length}
              </div>
              <div className="text-sm text-gray-600">Comments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {activities.filter(a => a.activity_type === 'event_created').length}
              </div>
              <div className="text-sm text-gray-600">Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {activities.filter(a => a.activity_type === 'member_joined').length}
              </div>
              <div className="text-sm text-gray-600">New Members</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
