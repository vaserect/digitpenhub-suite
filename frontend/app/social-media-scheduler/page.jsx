'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import AccountManager from '../../components/social/AccountManager';
import PostCreator from '../../components/social/PostCreator';

const TABS = [
  { key: 'calendar', label: '📅 Calendar' },
  { key: 'posts',    label: '📝 Posts' },
  { key: 'accounts', label: '🔌 Accounts' },
  { key: 'inbox',    label: '💬 Inbox' },
  { key: 'analytics', label: '📊 Analytics' },
  { key: 'media',    label: '🖼️ Media' },
];

export default function SocialMediaSchedulerPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('calendar');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [inboxMessages, setInboxMessages] = useState([]);
  const [mediaItems, setMediaItems] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const fetchData = async (tab) => {
    setLoading(true);
    try {
      switch (tab) {
        case 'posts':
          const p = await apiFetch('/api/v1/social-media/posts?limit=50');
          setPosts(p.posts || []);
          break;
        case 'accounts':
          const a = await apiFetch('/api/v1/social-media/accounts');
          setAccounts(a.accounts || []);
          break;
        case 'calendar': {
          const today = new Date();
          const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
          const to = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();
          const c = await apiFetch(`/api/v1/social-media/calendar?from=${from}&to=${to}`);
          setCalendarEvents(c.events || []);
          break;
        }
        case 'analytics':
          try {
            const accs = await apiFetch('/api/v1/social-media/accounts');
            setAccounts(accs.accounts || []);
          } catch {}
          break;
      }
    } catch (err) {
      if (tab !== 'analytics' && tab !== 'accounts') toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(activeTab); }, [activeTab]);

  const renderContent = () => {
    if (loading) return <SkeletonRows rows={8} />;

    switch (activeTab) {
      case 'accounts':
        return <AccountManager onRefresh={() => fetchData('accounts')} />;

      case 'posts':
        return (
          <div>
            <div className="module-head" style={{ marginBottom: 24 }}>
              <div>
                <h2>Posts</h2>
                <p className="module-sub">{posts.length} posts</p>
              </div>
              <PostCreator onCreated={() => fetchData('posts')} />
            </div>
            {posts.length === 0 ? (
              <EmptyState icon="📝" title="No posts yet" description="Create your first post to get started." />
            ) : (
              <div className="card-shell">
                {posts.map(post => (
                  <div key={post.id} className="card" style={{ padding: '12px 16px', marginBottom: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, lineHeight: 1.4 }}>
                          {post.content_text?.substring(0, 200) || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No text content</span>}
                          {(post.content_text?.length || 0) > 200 && '...'}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                          {Array.isArray(post.targets) && post.targets.map((t, i) => (
                            <span key={i} className="status-badge" style={{
                              backgroundColor: t.target_status === 'published' ? '#dcfce7' :
                                              t.target_status === 'scheduled' ? '#fef9c3' : '#f1f5f9',
                              color: t.target_status === 'published' ? '#16a34a' :
                                     t.target_status === 'scheduled' ? '#ca8a04' : '#64748b',
                              fontSize: 11,
                            }}>
                              {t.platform_name || t.platform_slug}
                              {t.scheduled_at && ` · ${new Date(t.scheduled_at).toLocaleDateString()}`}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className={`status-badge status-${post.status}`} style={{ marginLeft: 12 }}>
                        {post.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                      By {post.created_by_name} · {new Date(post.created_at).toLocaleDateString()}
                      {post.ai_generated && ' · 🤖 AI Generated'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'calendar':
        return (
          <div>
            <div className="module-head" style={{ marginBottom: 24 }}>
              <div>
                <h2>Content Calendar</h2>
                <p className="module-sub">{calendarEvents.length} scheduled post(s) this month</p>
              </div>
              <PostCreator onCreated={() => fetchData('calendar')} />
            </div>
            {calendarEvents.length === 0 ? (
              <EmptyState icon="📅" title="No scheduled posts" description="Schedule your first post to see it on the calendar." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {calendarEvents.map(event => (
                  <div key={event.target_id} className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      minWidth: 48, textAlign: 'center', padding: '4px 8px', borderRadius: 6,
                      backgroundColor: '#f1f5f9',
                    }}>
                      <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>
                        {new Date(event.scheduled_at).getDate()}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        {new Date(event.scheduled_at).toLocaleString('default', { month: 'short' })}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{event.content_text?.substring(0, 100) || 'No content'}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        → {event.account_name} ({event.platform_name})
                      </div>
                    </div>
                    <span className={`status-badge status-${event.post_status}`}>{event.post_status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'inbox':
        return <EmptyState icon="💬" title="Social Inbox" description="Inbox will be available once messages are synced from connected accounts." />;

      case 'analytics':
        return (
          <div>
            <div className="module-head" style={{ marginBottom: 24 }}>
              <h2>Analytics</h2>
              <p className="module-sub">Performance overview across all connected accounts</p>
            </div>
            {accounts.length === 0 ? (
              <EmptyState icon="📊" title="No analytics data" description="Connect accounts to see performance data." />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {accounts.filter(a => a.health_status === 'connected').map(acc => (
                  <div key={acc.id} className="card" style={{ padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{acc.account_name}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{acc.platform_name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      Connect for 7+ days to see analytics.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'media':
        return (
          <div>
            <div className="module-head" style={{ marginBottom: 24 }}>
              <h2>Media Library</h2>
              <p className="module-sub">Upload and manage images, videos, and GIFs for your posts</p>
            </div>
            <EmptyState icon="🖼️" title="No media yet" description="Upload images and videos to use in your social posts.">
              <Button className="primary-btn">Upload Media</Button>
            </EmptyState>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="panel">
      <button className="back-link" onClick={() => router.push('/')}>← Workspace</button>

      <div className="module-head">
        <div>
          <h1>Social Media Scheduler</h1>
          <p className="module-sub">Schedule, publish, and manage social media content</p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e2e8f0', marginBottom: 24, overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? '#2563eb' : '#64748b',
              borderBottom: activeTab === tab.key ? '2px solid #2563eb' : '2px solid transparent',
              marginBottom: -2, whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {renderContent()}
    </div>
  );
}
