'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Video,
  Image as ImageIcon,
  Heart,
  MessageCircle,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Share2,
  Code,
  Sparkles,
  Settings,
  Pin,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  ExternalLink,
  Activity,
  Eye,
  RefreshCw,
  Trash2
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';

// Fallback mock shop catalog items for shoppable tagging
const MOCK_CATALOG = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Standard Premium Business Cards', price: 19.99 },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Outdoor Vinyl Banners (Standard)', price: 49.99 },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Digital Smart Business Card (Metal)', price: 39.99 },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Corporate Brand Swag Kit', price: 89.99 }
];

export default function UGCAggregator() {
  const { user } = useAuth();
  
  // Navigation / Tabs State
  const [activeTab, setActiveTab] = useState('moderation'); // 'moderation' | 'feeds' | 'widget' | 'analytics'
  const [loading, setLoading] = useState(true);

  // UGC Data States
  const [feeds, setFeeds] = useState([]);
  const [posts, setPosts] = useState([]);
  const [analytics, setAnalytics] = useState({
    total_impressions: 0,
    total_clicks: 0,
    total_shoppable_clicks: 0
  });

  // Forms / Modals States
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  const [isTagProductModalOpen, setIsTagProductModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [syncingFeedId, setSyncingFeedId] = useState(null);

  // Form Fields
  const [feedForm, setFeedForm] = useState({
    name: '',
    source_platform: 'instagram',
    query_type: 'hashtag',
    query_value: '#digitpen'
  });

  const [tagProductId, setTagProductId] = useState('');

  // Embed Code Snippet State
  const [embedCode, setEmbedCode] = useState('');

  // Load UGC Data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [feedsRes, postsRes, analyticsRes, embedRes] = await Promise.all([
        apiFetch('/api/v1/ugc-aggregator/feeds'),
        apiFetch('/api/v1/ugc-aggregator/posts'),
        apiFetch('/api/v1/ugc-aggregator/analytics'),
        apiFetch('/api/v1/ugc-aggregator/embed')
      ]);

      if (feedsRes.success) setFeeds(feedsRes.data);
      if (postsRes.success) setPosts(postsRes.data);
      if (analyticsRes.success) setAnalytics(analyticsRes.data);
      if (embedRes.success) setEmbedCode(embedRes.data.embed_code);
    } catch (error) {
      console.error('Error loading UGC aggregator:', error);
      toast.error('Failed to load UGC configuration.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create Feed Submit
  const handleCreateFeed = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/v1/ugc-aggregator/feeds', {
        method: 'POST',
        body: JSON.stringify(feedForm)
      });

      if (res.success) {
        toast.success('Feed source added successfully!');
        setIsFeedModalOpen(false);
        setFeedForm({
          name: '',
          source_platform: 'instagram',
          query_type: 'hashtag',
          query_value: '#digitpen'
        });
        await loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to add feed source.');
    }
  };

  // Sync / Fetch Mock UGC Posts from Feed
  const handleSyncFeed = async (feedId) => {
    try {
      setSyncingFeedId(feedId);
      toast.info('Connecting to social media sync endpoint...');
      const res = await apiFetch(`/api/v1/ugc-aggregator/feeds/${feedId}/sync`, { method: 'POST' });
      if (res.success) {
        toast.success(`Sync complete! Aggregated ${res.data.length} creator posts into moderation queue.`);
        await loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Sync session error.');
    } finally {
      setSyncingFeedId(null);
    }
  };

  // Post Moderation Curation
  const handlePostStatus = async (postId, status) => {
    try {
      const res = await apiFetch(`/api/v1/ugc-aggregator/posts/${postId}/${status}`, { method: 'PUT' });
      if (res.success) {
        toast.success(`Post successfully marked as ${status}.`);
        await loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Curation update failed.');
    }
  };

  // Pinned toggle
  const handleTogglePin = async (postId, isPinned) => {
    try {
      const res = await apiFetch(`/api/v1/ugc-aggregator/posts/${postId}/pin`, {
        method: 'PUT',
        body: JSON.stringify({ pinned: !isPinned })
      });
      if (res.success) {
        toast.success(`Post ${!isPinned ? 'pinned to header' : 'unpinned'}.`);
        await loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Pin action failed.');
    }
  };

  // Delete Feed
  const handleDeleteFeed = async (id) => {
    if (!confirm('Are you sure you want to delete this feed source?')) return;
    try {
      const res = await apiFetch(`/api/v1/ugc-aggregator/feeds/${id}`, { method: 'DELETE' });
      if (res.success) {
        toast.success('Feed source deleted.');
        await loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Deletion failed.');
    }
  };

  // Shoppable Tagging Modal Submit
  const handleLinkProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/api/v1/ugc-aggregator/posts/${selectedPostId}/shoppable`, {
        method: 'PUT',
        body: JSON.stringify({ productId: tagProductId })
      });

      if (res.success) {
        toast.success('Shoppable product tagged successfully!');
        setIsTagProductModalOpen(false);
        setTagProductId('');
        await loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to tag product.');
    }
  };

  // Public Widget simulator callbacks
  const handleWidgetInteraction = async (type) => {
    try {
      await apiFetch(`/api/v1/ugc-aggregator/public/telemetry/${user?.orgId || user?.org_id}?type=${type}`, { method: 'POST' });
      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  // Filter approved posts for preview widget
  const approvedPosts = useMemo(() => {
    return posts.filter(p => p.moderation_status === 'approved');
  }, [posts]);

  // Product helper lookup
  const getProductDetails = (productId) => {
    return MOCK_CATALOG.find(p => p.id === productId);
  };

  if (loading) {
    return (
      <div className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div className="spinner" style={{ width: 40, height: 40, border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading UGC Aggregator Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>📸</span> UGC & Creator Content Aggregator
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Curate brand social media mentions. Tag store products onto posts and publish shoppable grids.
          </p>
        </div>
        <Button onClick={() => setIsFeedModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Add Feed Source
        </Button>
      </div>

      {/* Tabs Menu */}
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 24 }}>
          <button
            onClick={() => setActiveTab('moderation')}
            style={{
              padding: '10px 0 12px', border: 'none', borderBottom: activeTab === 'moderation' ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
              color: activeTab === 'moderation' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            Curation Queue ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('feeds')}
            style={{
              padding: '10px 0 12px', border: 'none', borderBottom: activeTab === 'feeds' ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
              color: activeTab === 'feeds' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            Social Sources ({feeds.length})
          </button>
          <button
            onClick={() => setActiveTab('widget')}
            style={{
              padding: '10px 0 12px', border: 'none', borderBottom: activeTab === 'widget' ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
              color: activeTab === 'widget' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            Shoppable Widget Preview
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              padding: '10px 0 12px', border: 'none', borderBottom: activeTab === 'analytics' ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
              color: activeTab === 'analytics' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            Widget Analytics
          </button>
        </div>
      </div>

      {/* Tab: Curation Queue */}
      {activeTab === 'moderation' && (
        <>
          {posts.length === 0 ? (
            <EmptyState
              title="No social posts aggregated"
              description="Configure hashtag or handle feeds in the 'Social Sources' tab, then trigger synchronization to aggregate creator content."
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {posts.map((post) => {
                const taggedProd = getProductDetails(post.shoppable_product_id);
                return (
                  <div key={post.id} className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, border: post.pinned ? '2px solid var(--primary)' : '1px solid var(--border)' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <img src={post.creator_avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{post.creator_name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{post.creator_handle}</div>
                        </div>
                      </div>
                      <Badge type={post.moderation_status === 'approved' ? 'success' : post.moderation_status === 'rejected' ? 'danger' : 'neutral'}>
                        {post.moderation_status.toUpperCase()}
                      </Badge>
                    </div>

                    {/* Image Media content */}
                    <div style={{ position: 'relative', width: '100%', paddingBottom: '75%', borderRadius: 8, overflow: 'hidden', background: '#000' }}>
                      <img src={post.media_url} alt="" style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />
                      
                      {post.pinned && (
                        <div style={{ position: 'absolute', top: 8, left: 8, background: 'var(--primary)', color: 'white', padding: 4, borderRadius: '50%' }}>
                          <Pin size={12} />
                        </div>
                      )}
                    </div>

                    {/* Caption text */}
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: 34 }}>
                      {post.caption}
                    </p>

                    {/* Interaction statistics */}
                    <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Heart size={12} /> {post.likes_count}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageCircle size={12} /> {post.comments_count}</span>
                    </div>

                    {/* Shoppable Tag Indicator */}
                    {taggedProd ? (
                      <div style={{ background: 'var(--surface-muted)', padding: '6px 10px', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                        <span style={{ fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 150 }}>
                          🛒 {taggedProd.name}
                        </span>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>${taggedProd.price}</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No products tagged yet.</div>
                    )}

                    {/* Actions Curation controls */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4 }}>
                      {post.moderation_status !== 'approved' ? (
                        <Button variant="secondary" onClick={() => handlePostStatus(post.id, 'approved')} style={{ padding: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <CheckCircle size={12} /> Approve Feed
                        </Button>
                      ) : (
                        <Button variant="danger" onClick={() => handlePostStatus(post.id, 'reject')} style={{ padding: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <XCircle size={12} /> Hide Post
                        </Button>
                      )}
                      
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSelectedPostId(post.id);
                          setTagProductId(post.shoppable_product_id || '');
                          setIsTagProductModalOpen(true);
                        }}
                        style={{ padding: '6px', fontSize: '0.75rem' }}
                      >
                        Tag Product
                      </Button>
                    </div>

                    <Button variant="secondary" onClick={() => handleTogglePin(post.id, post.pinned)} style={{ width: '100%', padding: '4px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <Pin size={12} /> {post.pinned ? 'Unpin' : 'Pin to Widget Grid'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab: Feeds List */}
      {activeTab === 'feeds' && (
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 600 }}>Active UGC Aggregator Feeds</h3>
          {feeds.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No social feeds query linked yet.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {feeds.map((feed) => (
                <div key={feed.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, border: '1px solid var(--border)', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {feed.name}
                      <Badge type="info">{feed.source_platform.toUpperCase()}</Badge>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Sync query: {feed.query_type} values <strong>{feed.query_value}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      variant="secondary"
                      disabled={syncingFeedId === feed.id}
                      onClick={() => handleSyncFeed(feed.id)}
                      style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <RefreshCw size={12} className={syncingFeedId === feed.id ? 'spin' : ''} />
                      {syncingFeedId === feed.id ? 'Syncing...' : 'Sync Now'}
                    </Button>
                    <Button variant="danger" onClick={() => handleDeleteFeed(feed.id)} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Widget Embed & Live Preview widget */}
      {activeTab === 'widget' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
          {/* Embed panel */}
          <div className="card" style={{ padding: 20, alignSelf: 'start' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Code size={18} style={{ color: 'var(--primary)' }} /> HTML/JS Widget Embed
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 12px' }}>
              Paste this block in your store or landing page builder to render the interactive social grid:
            </p>
            <textarea
              rows="4"
              readOnly
              value={embedCode}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-muted)', fontFamily: 'monospace', fontSize: '0.75rem' }}
            />
            
            <h4 style={{ margin: '16px 0 8px', fontSize: '0.85rem' }}>Simulation Actions</h4>
            <div style={{ display: 'grid', gap: 8 }}>
              <Button variant="secondary" onClick={() => handleWidgetInteraction('impression')} style={{ fontSize: '0.75rem' }}>
                Simulate Widget Impression (+1)
              </Button>
              <Button variant="secondary" onClick={() => handleWidgetInteraction('click')} style={{ fontSize: '0.75rem' }}>
                Simulate Grid Post Click (+1)
              </Button>
            </div>
          </div>

          {/* Interactive widget preview */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Eye size={18} style={{ color: 'var(--primary)' }} /> Live Shoppable Grid Preview
            </h3>
            
            {approvedPosts.length === 0 ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No approved posts to display. Approve posts in the moderation queue tab.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {approvedPosts.map((post) => {
                  const taggedProd = getProductDetails(post.shoppable_product_id);
                  return (
                    <div
                      key={post.id}
                      onClick={() => handleWidgetInteraction(taggedProd ? 'shoppable_click' : 'click')}
                      style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
                    >
                      <div style={{ paddingBottom: '100%', position: 'relative' }}>
                        <img src={post.media_url} alt="" style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />
                        
                        {taggedProd && (
                          <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.85)', color: 'white', padding: '4px 8px', borderRadius: 6, fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <ShoppingBag size={10} /> Buy: ${taggedProd.price}
                          </div>
                        )}
                      </div>
                      <div style={{ padding: 8, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        <strong>{post.creator_handle}</strong>: {post.caption.substring(0, 35)}...
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Analytics spend logs */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          <div className="card" style={{ padding: 20 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Widget Impressions</span>
            <div style={{ fontSize: '1.875rem', fontWeight: 700, marginTop: 6 }}>{analytics.total_impressions || 0} Views</div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Widget Clicks</span>
            <div style={{ fontSize: '1.875rem', fontWeight: 700, marginTop: 6 }}>{analytics.total_clicks || 0} Clicks</div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shoppable Carts Conversions</span>
            <div style={{ fontSize: '1.875rem', fontWeight: 700, marginTop: 6, color: 'var(--primary)' }}>
              {analytics.total_shoppable_clicks || 0} Orders
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              CTR: {analytics.total_impressions > 0 ? ((analytics.total_shoppable_clicks / analytics.total_impressions) * 100).toFixed(2) : 0}%
            </span>
          </div>
        </div>
      )}

      {/* MODAL: ADD FEED SOURCE */}
      <Modal isOpen={isFeedModalOpen} onClose={() => setIsFeedModalOpen(false)} title="Add UGC Feed Source">
        <form onSubmit={handleCreateFeed} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Feed Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Brand hashtag review loop"
              value={feedForm.name}
              onChange={e => setFeedForm({ ...feedForm, name: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Source Platform</label>
              <select
                value={feedForm.source_platform}
                onChange={e => setFeedForm({ ...feedForm, source_platform: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              >
                <option value="instagram">Instagram</option>
                <option value="twitter">Twitter / X</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Query Type</label>
              <select
                value={feedForm.query_type}
                onChange={e => setFeedForm({ ...feedForm, query_type: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
              >
                <option value="hashtag">Hashtag (#)</option>
                <option value="handle">User Handle (@)</option>
                <option value="mention">Brand Mention</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Sync Query Value</label>
            <input
              type="text"
              required
              placeholder="e.g. #digitpen"
              value={feedForm.query_value}
              onChange={e => setFeedForm({ ...feedForm, query_value: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <Button variant="secondary" onClick={() => setIsFeedModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Feed Source</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: TAG SHOPPABLE PRODUCT */}
      <Modal isOpen={isTagProductModalOpen} onClose={() => setIsTagProductModalOpen(false)} title="Tag Shoppable Catalog Item">
        <form onSubmit={handleLinkProductSubmit} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Select Catalog Product</label>
            <select
              value={tagProductId}
              onChange={e => setTagProductId(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: '0.875rem' }}
            >
              <option value="">None / Remove tag</option>
              {MOCK_CATALOG.map(p => (
                <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <Button variant="secondary" onClick={() => setIsTagProductModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Tag</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
