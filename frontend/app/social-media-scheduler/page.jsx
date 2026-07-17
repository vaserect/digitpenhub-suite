'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import AccountManager from '../../components/social/AccountManager';
import ContentCalendar from '../../components/social/ContentCalendar';
import PostEditor from '../../components/social/PostEditor';
import MediaPicker from '../../components/social/MediaPicker';
import Modal from '../../components/ui/Modal';

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
  const [inboxMessages, setInboxMessages] = useState([]);
  const [mediaItems, setMediaItems] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const fetchPosts = async () => {
    try {
      const p = await apiFetch('/api/v1/social-media/posts?limit=50');
      setPosts(p.posts || []);
    } catch { toast.error('Failed to load posts'); }
  };

  const fetchMedia = async () => {
    try {
      const res = await apiFetch('/api/v1/social-media/media?limit=100');
      setMediaItems(res.media || []);
    } catch {}
  };

  const fetchAccounts = async () => {
    try {
      const a = await apiFetch('/api/v1/social-media/accounts');
      setAccounts(a.accounts || []);
    } catch {}
  };

  useEffect(() => {
    setLoading(true);
    if (activeTab === 'posts') fetchPosts().finally(() => setLoading(false));
    else if (activeTab === 'accounts') fetchAccounts().finally(() => setLoading(false));
    else if (activeTab === 'media') fetchMedia().finally(() => setLoading(false));
    else if (activeTab === 'calendar') setLoading(false);
    else if (activeTab === 'inbox') setLoading(false);
    else if (activeTab === 'analytics') fetchAccounts().finally(() => setLoading(false));
    else setLoading(false);
  }, [activeTab]);

  const handleExport = async (format) => {
    try {
      const url = `/api/v1/social-media/calendar/export?format=${format}`;
      if (format === 'ical' || format === 'ics') {
        window.open(url, '_blank');
        toast.success('Calendar exported');
      } else {
        const res = await apiFetch(url);
        // Download JSON
        const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'social-calendar-export.json';
        a.click();
        toast.success('Calendar exported');
      }
    } catch { toast.error('Export failed'); }
  };

  const renderTab = () => {
    if (loading) return <SkeletonRows rows={8} />;

    switch (activeTab) {
      case 'calendar':
        return (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button className="ctag" onClick={() => handleExport('json')}>📥 Export JSON</button>
              <button className="ctag" onClick={() => handleExport('ics')}>📥 Export iCal</button>
            </div>
            <ContentCalendar />
          </div>
        );

      case 'posts':
        return (
          <div>
            <div className="module-head" style={{ marginBottom: 24 }}>
              <div>
                <h2>Posts</h2>
                <p className="module-sub">{posts.length} posts</p>
              </div>
              <PostEditor onDone={() => { setShowEditor(false); fetchPosts(); }} />
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

      case 'accounts':
        return <AccountManager onRefresh={fetchAccounts} />;

      case 'inbox':
        return <EmptyState icon="💬" title="Social Inbox" description="Inbox will populate once messages are synced from connected accounts." />;

      case 'analytics':
        return (
          <div>
            <div className="module-head" style={{ marginBottom: 24 }}>
              <h2>Analytics</h2>
              <p className="module-sub">Performance overview across all accounts</p>
            </div>
            {accounts.filter(a => a.health_status === 'connected').length === 0 ? (
              <EmptyState icon="📊" title="No analytics data" description="Connect accounts to see performance data." />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {accounts.filter(a => a.health_status === 'connected').map(acc => (
                  <div key={acc.id} className="card" style={{ padding: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{acc.account_name}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{acc.platform_name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      • Health: <span style={{ color: '#16a34a', fontWeight: 600 }}>{acc.health_status}</span><br />
                      • Connect for 7+ days to see trend data.
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
              <p className="module-sub">{mediaItems.length} asset(s)</p>
              <Button onClick={() => setShowMediaPicker(true)}>📤 Upload Media</Button>
            </div>
            {showMediaPicker && (
              <Modal title="Media Library" onClose={() => { setShowMediaPicker(false); fetchMedia(); }} wide>
                <div style={{ padding: 16 }}>
                  <MediaPicker
                    selected={[]}
                    onSelect={() => {}}
                    onClose={() => setShowMediaPicker(false)}
                    multi={true}
                  />
                </div>
              </Modal>
            )}
            {!showMediaPicker && mediaItems.length === 0 ? (
              <EmptyState icon="🖼️" title="No media yet" description="Upload images, videos, and GIFs to use in your posts.">
                <Button onClick={() => setShowMediaPicker(true)}>Upload Media</Button>
              </EmptyState>
            ) : !showMediaPicker ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                {mediaItems.map(item => (
                  <div key={item.id} style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0', aspectRatio: '1' }}>
                    {item.type === 'image' || item.type === 'gif' ? (
                      <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    ) : item.type === 'video' ? (
                      <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: '#f1f5f9', fontSize: 32 }}>
                        📄
                      </div>
                    )}
                    <div style={{ padding: '2px 6px', fontSize: 10, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
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

      {renderTab()}
    </div>
  );
}
