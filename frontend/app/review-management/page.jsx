'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';

const TABS = [
  { key: 'inbox',     label: '📥 Reviews Feed' },
  { key: 'requests',  label: '✉️ Send Requests' },
  { key: 'embeds',    label: '🖼️ Embed Widget' },
  { key: 'settings',  label: '⚙️ Gating & Links' },
  { key: 'analytics', label: '📊 Analytics' },
];

export default function ReviewManagementPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('inbox');
  const [loading, setLoading] = useState(true);

  // States for Reviews Feed (Inbox)
  const [reviews, setReviews] = useState([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [page, setPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [replyFilter, setReplyFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyInputs, setReplyInputs] = useState({}); // reviewId -> replyText

  // States for Requests
  const [contacts, setContacts] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [channel, setChannel] = useState('email');
  const [recipientValue, setRecipientValue] = useState('');
  const [requestLogs, setRequestLogs] = useState([]);

  // States for Settings
  const [settings, setSettings] = useState({
    gatingEnabled: true,
    gatingThresholdStars: 4,
    googleReviewUrl: '',
    facebookReviewUrl: '',
    yelpReviewUrl: '',
    trustpilotReviewUrl: '',
    requestEmailSubject: 'How did we do?',
    requestEmailTemplate: 'Hi {{name}},\n\nThank you for choosing us! We would love to hear about your experience. Please take a moment to leave a review here:\n\n{{link}}\n\nBest regards,\nThe Team',
    requestSmsTemplate: 'Hi {{name}}, how did we do? Please leave us a review here: {{link}}',
  });

  // States for Analytics
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    repliedCount: 0,
    responseRate: 0
  });
  const [ratingBreakdown, setRatingBreakdown] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [platformBreakdown, setPlatformBreakdown] = useState({});

  // Org ID for public embed preview
  const [orgId, setOrgId] = useState('');

  // Fetch reviews feed
  const fetchReviews = async () => {
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: 10,
        status: 'active'
      });
      if (ratingFilter) queryParams.append('rating', ratingFilter);
      if (platformFilter) queryParams.append('platform', platformFilter);
      if (replyFilter) queryParams.append('hasReply', replyFilter);
      if (searchQuery) queryParams.append('search', searchQuery);

      const res = await apiFetch(`/api/v1/reviews?${queryParams}`);
      setReviews(res.reviews || []);
      setTotalReviews(res.total || 0);
    } catch {
      toast.error('Failed to load reviews');
    }
  };

  // Seed sample data
  const handleSeedMockData = async () => {
    try {
      const res = await apiFetch('/api/v1/reviews/seed', { method: 'POST' });
      toast.success(res.message || 'Sample reviews seeded');
      fetchReviews();
      fetchStats();
    } catch {
      toast.error('Failed to seed sample reviews');
    }
  };

  // Fetch stats & analytics
  const fetchStats = async () => {
    try {
      const res = await apiFetch('/api/v1/reviews/stats');
      setStats(res.stats || { totalReviews: 0, averageRating: 0, repliedCount: 0, responseRate: 0 });
      setRatingBreakdown(res.ratingBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      setPlatformBreakdown(res.platformBreakdown || {});
    } catch {}
  };

  // Fetch settings
  const fetchSettings = async () => {
    try {
      const res = await apiFetch('/api/v1/reviews/settings');
      if (res.settings) {
        setOrgId(res.settings.org_id || '');
        setSettings({
          gatingEnabled: res.settings.gating_enabled,
          gatingThresholdStars: res.settings.gating_threshold_stars,
          googleReviewUrl: res.settings.google_review_url || '',
          facebookReviewUrl: res.settings.facebook_review_url || '',
          yelpReviewUrl: res.settings.yelp_review_url || '',
          trustpilotReviewUrl: res.settings.trustpilot_review_url || '',
          requestEmailSubject: res.settings.request_email_subject || 'How did we do?',
          requestEmailTemplate: res.settings.request_email_template || '',
          requestSmsTemplate: res.settings.request_sms_template || '',
        });
      }
    } catch {}
  };

  // Fetch CRM contacts
  const fetchContacts = async () => {
    try {
      const res = await apiFetch('/api/v1/crm/contacts');
      setContacts(res.contacts || []);
    } catch {}
  };

  // Fetch request logs
  const fetchRequestLogs = async () => {
    try {
      const res = await apiFetch('/api/v1/reviews/requests');
      setRequestLogs(res.logs || []);
    } catch {}
  };

  // Auto-load tab data
  useEffect(() => {
    setLoading(true);
    if (activeTab === 'inbox') {
      fetchReviews().finally(() => setLoading(false));
    } else if (activeTab === 'requests') {
      Promise.all([fetchContacts(), fetchRequestLogs()]).finally(() => setLoading(false));
    } else if (activeTab === 'settings') {
      fetchSettings().finally(() => setLoading(false));
    } else if (activeTab === 'analytics') {
      fetchStats().finally(() => setLoading(false));
    } else {
      fetchSettings().finally(() => setLoading(false));
    }
  }, [activeTab, page, ratingFilter, platformFilter, replyFilter]);

  // Reply review handler
  const handleReplySubmit = async (reviewId) => {
    const text = replyInputs[reviewId];
    if (!text || !text.trim()) {
      toast.error('Reply content cannot be empty');
      return;
    }

    try {
      await apiFetch(`/api/v1/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyContent: text.trim() }),
      });
      toast.success('Reply submitted successfully');
      setReplyInputs(prev => ({ ...prev, [reviewId]: '' }));
      fetchReviews();
      fetchStats();
    } catch {
      toast.error('Failed to submit reply');
    }
  };

  // Delete reply handler
  const handleDeleteReply = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this reply?')) return;

    try {
      await apiFetch(`/api/v1/reviews/${reviewId}/reply`, { method: 'DELETE' });
      toast.success('Reply deleted');
      fetchReviews();
      fetchStats();
    } catch {
      toast.error('Failed to delete reply');
    }
  };

  // Save Settings handler
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/v1/reviews/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.settings) {
        toast.success('Gating configurations and links saved');
      }
    } catch {
      toast.error('Failed to save settings');
    }
  };

  // Send request handler
  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!recipientValue) {
      toast.error('Recipient value (email/phone) is required');
      return;
    }

    try {
      await apiFetch('/api/v1/reviews/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: selectedContactId || null,
          channel,
          recipientValue: recipientValue.trim()
        }),
      });
      toast.success(`Review request sent via ${channel.toUpperCase()}!`);
      setSelectedContactId('');
      setRecipientValue('');
      fetchRequestLogs();
    } catch {
      toast.error('Failed to send review request');
    }
  };

  // Fill recipient input on contact select
  const handleContactSelect = (contactId) => {
    setSelectedContactId(contactId);
    if (!contactId) {
      setRecipientValue('');
      return;
    }
    const c = contacts.find(item => item.id === contactId);
    if (c) {
      setRecipientValue(channel === 'email' ? c.email || '' : c.phone || '');
    }
  };

  // Helper star renderer
  const renderStars = (rating) => {
    return (
      <div style={{ display: 'inline-flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} style={{
            fontSize: 16,
            color: star <= rating ? '#ca8a04' : '#e2e8f0'
          }}>★</span>
        ))}
      </div>
    );
  };

  const getPlatformLabel = (platform) => {
    const maps = {
      google: { name: 'Google', bg: '#4285F420', text: '#4285F4' },
      facebook: { name: 'Facebook', bg: '#1877F220', text: '#1877F2' },
      yelp: { name: 'Yelp', bg: '#D3232320', text: '#D32323' },
      trustpilot: { name: 'Trustpilot', bg: '#00B67A20', text: '#00B67A' },
      direct: { name: 'Direct Feedback', bg: '#f1f5f9', text: '#475569' }
    };
    return maps[platform] || { name: platform.toUpperCase(), bg: '#f1f5f9', text: '#64748b' };
  };

  const renderTab = () => {
    if (loading) return <SkeletonRows rows={8} />;

    switch (activeTab) {
      case 'inbox':
        return (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <select className="field-select" style={{ width: 140 }}
                value={ratingFilter} onChange={e => { setRatingFilter(e.target.value); setPage(1); }}>
                <option value="">All Stars</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>

              <select className="field-select" style={{ width: 150 }}
                value={platformFilter} onChange={e => { setPlatformFilter(e.target.value); setPage(1); }}>
                <option value="">All Platforms</option>
                <option value="google">Google</option>
                <option value="facebook">Facebook</option>
                <option value="yelp">Yelp</option>
                <option value="trustpilot">Trustpilot</option>
                <option value="direct">Direct Feedback</option>
              </select>

              <select className="field-select" style={{ width: 160 }}
                value={replyFilter} onChange={e => { setReplyFilter(e.target.value); setPage(1); }}>
                <option value="">All Replies</option>
                <option value="false">Unreplied</option>
                <option value="true">Replied</option>
              </select>

              <input className="field-input" style={{ width: 220, marginBottom: 0 }}
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { setPage(1); fetchReviews(); } }}
              />

              <Button variant="secondary" onClick={() => { setPage(1); fetchReviews(); }}>Search</Button>

              <button className="ctag" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', marginLeft: 'auto' }}
                onClick={handleSeedMockData}>🌱 Seed Sample Reviews</button>
            </div>

            {reviews.length === 0 ? (
              <EmptyState icon="📥" title="No reviews found" description="Connect review integrations, send review requests, or click 'Seed Sample Reviews' to populate reviews." />
            ) : (
              <div className="card-shell">
                {reviews.map(review => {
                  const label = getPlatformLabel(review.source_platform);
                  return (
                    <div key={review.id} className="card" style={{ padding: 20, marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <strong style={{ fontSize: 16 }}>{review.reviewer_name}</strong>
                            {review.reviewer_email && <span style={{ color: '#94a3b8', fontSize: 12 }}>({review.reviewer_email})</span>}
                            <span className="status-badge" style={{ backgroundColor: label.bg, color: label.text, fontSize: 10, padding: '2px 8px' }}>
                              {label.name}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {renderStars(review.rating)}
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>
                              {new Date(review.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {review.title && <h3 style={{ fontSize: 15, fontWeight: 600, margin: '8px 0' }}>{review.title}</h3>}
                      <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{review.content}</p>

                      {/* Reply Block */}
                      {review.reply_content ? (
                        <div style={{ marginTop: 16, backgroundColor: '#f8fafc', borderLeft: '3px solid #64748b', padding: 12, borderRadius: '0 6px 6px 0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <strong style={{ fontSize: 13, color: '#475569' }}>Our Response</strong>
                            <button style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}
                              onClick={() => handleDeleteReply(review.id)}>Delete Reply</button>
                          </div>
                          <p style={{ fontSize: 13, color: '#334155', margin: 0 }}>{review.reply_content}</p>
                          {review.replied_at && (
                            <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, display: 'block' }}>
                              Replied on {new Date(review.replied_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div style={{ marginTop: 16, borderTop: '1px dashed #e2e8f0', paddingTop: 16 }}>
                          <textarea className="field-input" rows={2} style={{ fontSize: 13, resize: 'none', marginBottom: 8 }}
                            placeholder="Draft response to this review..."
                            value={replyInputs[review.id] || ''}
                            onChange={e => setReplyInputs(prev => ({ ...prev, [review.id]: e.target.value }))}
                          />
                          <Button size="sm" onClick={() => handleReplySubmit(review.id)}>Submit Response</Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalReviews > 10 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24 }}>
                <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <span style={{ fontSize: 14, color: '#475569' }}>Page {page} of {Math.ceil(totalReviews / 10)}</span>
                <Button size="sm" variant="secondary" disabled={page >= Math.ceil(totalReviews / 10)} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </div>
        );

      case 'requests':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <div className="card-shell" style={{ padding: 20 }}>
                <h2>Send Review Request</h2>
                <p className="module-sub" style={{ marginBottom: 20 }}>Invite your customers from core CRM to leave a rating and review.</p>

                <form onSubmit={handleSendRequest}>
                  <div className="field">
                    <label className="field-label">Select CRM Contact</label>
                    <select className="field-select" value={selectedContactId} onChange={e => handleContactSelect(e.target.value)}>
                      <option value="">-- Choose Contact (Manual Input Below if Empty) --</option>
                      {contacts.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.full_name} {c.company ? `(${c.company})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label className="field-label">Delivery Channel</label>
                    <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input type="radio" checked={channel === 'email'} onChange={() => { setChannel('email'); setRecipientValue(''); }} />
                        Email
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input type="radio" checked={channel === 'sms'} onChange={() => { setChannel('sms'); setRecipientValue(''); }} />
                        SMS
                      </label>
                    </div>
                  </div>

                  <div className="field">
                    <label className="field-label">{channel === 'email' ? 'Recipient Email Address' : 'Recipient Phone Number'}</label>
                    <input className="field-input" type={channel === 'email' ? 'email' : 'text'}
                      placeholder={channel === 'email' ? 'customer@example.com' : '+15551234567'}
                      value={recipientValue}
                      onChange={e => setRecipientValue(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" style={{ marginTop: 12 }}>Send Request</Button>
                </form>
              </div>
            </div>

            <div>
              <div className="card-shell" style={{ padding: 20 }}>
                <h2>Requests Log</h2>
                <p className="module-sub" style={{ marginBottom: 20 }}>Historical list of review requests sent.</p>

                {requestLogs.length === 0 ? (
                  <EmptyState icon="✉️" title="No requests sent yet" description="Initiate review requests to see logs here." />
                ) : (
                  <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: 10 }}>Recipient</th>
                          <th style={{ padding: 10 }}>Channel</th>
                          <th style={{ padding: 10 }}>Date Sent</th>
                          <th style={{ padding: 10 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requestLogs.map(log => (
                          <tr key={log.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: 10 }}>
                              <div>{log.first_name ? `${log.first_name} ${log.last_name || ''}` : 'Customer'}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>{log.recipient_value}</div>
                            </td>
                            <td style={{ padding: 10 }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>{log.channel.toUpperCase()}</span>
                            </td>
                            <td style={{ padding: 10, color: '#64748b' }}>
                              {new Date(log.sent_at).toLocaleDateString()}
                            </td>
                            <td style={{ padding: 10 }}>
                              <span className={`status-badge status-${log.status}`} style={{ fontSize: 10 }}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'embeds': {
        const iframeCode = `<iframe src="${process.env.NODE_ENV === 'production' ? 'https://suite.digitpenhub.com' : 'http://localhost:4000'}/reviews/widget?orgId=${orgId}" style="width:100%; border:none; height:420px; overflow:hidden;" scrolling="no"></iframe>`;
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
            <div>
              <div className="card-shell" style={{ padding: 20 }}>
                <h2>Website Embed Widget</h2>
                <p className="module-sub" style={{ marginBottom: 20 }}>Embed your positive business reviews (4+ stars) on your Website Builder landing pages or external sites.</p>

                <div className="field">
                  <label className="field-label">Copy Widget Code</label>
                  <textarea className="field-input" rows={4} readOnly style={{ fontFamily: 'monospace', fontSize: 12, backgroundColor: '#f8fafc', color: '#0f172a' }}
                    value={iframeCode}
                    onClick={e => { e.target.select(); toast.info('Copied to clipboard'); }}
                  />
                  <span style={{ fontSize: 11, color: '#64748b' }}>Tip: Click inside the box to select and copy the code snippet.</span>
                </div>

                <div style={{ marginTop: 24 }}>
                  <h3 style={{ marginBottom: 12 }}>Widget Preview:</h3>
                  {/* Mock widget rendering */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 20, backgroundColor: '#f8fafc' }}>
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <h4 style={{ margin: 0, fontSize: 18 }}>Customer Reviews</h4>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 'bold' }}>4.8 / 5</span>
                        {renderStars(5)}
                        <span style={{ fontSize: 12, color: '#64748b' }}>based on positive feedback</span>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ padding: 12, backgroundColor: '#fff', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <strong>Sarah J.</strong>
                          {renderStars(5)}
                        </div>
                        <p style={{ fontSize: 12, margin: 0, color: '#475569' }}>"Amazing customer service! The support team resolved my query within minutes."</p>
                      </div>
                      <div style={{ padding: 12, backgroundColor: '#fff', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <strong>Elena R.</strong>
                          {renderStars(5)}
                        </div>
                        <p style={{ fontSize: 12, margin: 0, color: '#475569' }}>"Absolutely perfect experience. Highly professional and extremely fast delivery."</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="card-shell" style={{ padding: 20 }}>
                <h2>Public Feedback Page</h2>
                <p className="module-sub" style={{ marginBottom: 20 }}>Redirect customers to this public URL to collect direct review scores:</p>
                <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                  <a href={`/reviews/feedback/${orgId}`} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all', fontWeight: 600, color: '#2563eb', fontSize: 13 }}>
                    {`/reviews/feedback/${orgId}`}
                  </a>
                </div>
                <span style={{ fontSize: 12, color: '#64748b' }}>This page handles gating: negative feedback (1-3 stars) is captured internally, while positive feedback is encouraged to share on your connected Google or Facebook page links.</span>
              </div>
            </div>
          </div>
        );
      }

      case 'settings':
        return (
          <form onSubmit={handleSaveSettings}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <div className="card-shell" style={{ padding: 20, marginBottom: 24 }}>
                  <h2>Feedback Gating Configuration</h2>
                  <p className="module-sub" style={{ marginBottom: 16 }}>Control how scores are routed when customers leave public reviews.</p>

                  <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <input type="checkbox" id="gatingEnabled" checked={settings.gatingEnabled}
                      onChange={e => setSettings(prev => ({ ...prev, gatingEnabled: e.target.checked }))}
                    />
                    <label htmlFor="gatingEnabled" style={{ fontWeight: 600, cursor: 'pointer' }}>Enable Smart Review Gating</label>
                  </div>

                  {settings.gatingEnabled && (
                    <div className="field">
                      <label className="field-label">Gating Star Threshold</label>
                      <select className="field-select" value={settings.gatingThresholdStars}
                        onChange={e => setSettings(prev => ({ ...prev, gatingThresholdStars: parseInt(e.target.value) }))}>
                        <option value="5">5 Stars (Gate everything below 5)</option>
                        <option value="4">4 Stars (Gate 1-3 stars, recommend sharing 4-5)</option>
                        <option value="3">3 Stars (Gate 1-2 stars, recommend sharing 3-5)</option>
                      </select>
                      <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>
                        Ratings *below* the threshold will route internally so you can resolve complaints privately. Ratings *at or above* will display links to your Google/Facebook reviews.
                      </span>
                    </div>
                  )}
                </div>

                <div className="card-shell" style={{ padding: 20 }}>
                  <h2>Review Request Templates</h2>
                  <p className="module-sub" style={{ marginBottom: 16 }}>Customize content sent to customer invite requests.</p>

                  <div className="field">
                    <label className="field-label">Email Invitation Subject</label>
                    <input className="field-input" value={settings.requestEmailSubject}
                      onChange={e => setSettings(prev => ({ ...prev, requestEmailSubject: e.target.value }))}
                    />
                  </div>

                  <div className="field">
                    <label className="field-label">Email Body Template</label>
                    <textarea className="field-input" rows={6} value={settings.requestEmailTemplate}
                      onChange={e => setSettings(prev => ({ ...prev, requestEmailTemplate: e.target.value }))}
                    />
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Placeholders: {'{{name}}'}, {'{{link}}'}</span>
                  </div>

                  <div className="field">
                    <label className="field-label">SMS Invitation Template</label>
                    <input className="field-input" value={settings.requestSmsTemplate}
                      onChange={e => setSettings(prev => ({ ...prev, requestSmsTemplate: e.target.value }))}
                    />
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Placeholders: {'{{name}}'}, {'{{link}}'}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="card-shell" style={{ padding: 20 }}>
                  <h2>External Share Links</h2>
                  <p className="module-sub" style={{ marginBottom: 16 }}>Configure destination review pages for positive rating sharing redirection.</p>

                  <div className="field">
                    <label className="field-label">Google Review URL</label>
                    <input className="field-input" type="url" placeholder="https://g.page/r/.../review"
                      value={settings.googleReviewUrl}
                      onChange={e => setSettings(prev => ({ ...prev, googleReviewUrl: e.target.value }))}
                    />
                  </div>

                  <div className="field">
                    <label className="field-label">Facebook Page Review URL</label>
                    <input className="field-input" type="url" placeholder="https://www.facebook.com/.../reviews"
                      value={settings.facebookReviewUrl}
                      onChange={e => setSettings(prev => ({ ...prev, facebookReviewUrl: e.target.value }))}
                    />
                  </div>

                  <div className="field">
                    <label className="field-label">Yelp Business Review URL</label>
                    <input className="field-input" type="url" placeholder="https://www.yelp.com/biz/..."
                      value={settings.yelpReviewUrl}
                      onChange={e => setSettings(prev => ({ ...prev, yelpReviewUrl: e.target.value }))}
                    />
                  </div>

                  <div className="field">
                    <label className="field-label">Trustpilot Review URL</label>
                    <input className="field-input" type="url" placeholder="https://www.trustpilot.com/evaluate/..."
                      value={settings.trustpilotReviewUrl}
                      onChange={e => setSettings(prev => ({ ...prev, trustpilotReviewUrl: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                  <Button type="submit">Save Configurations</Button>
                </div>
              </div>
            </div>
          </form>
        );

      case 'analytics':
        return (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1d4ed8' }}>{stats.totalReviews}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Total Reviews</div>
              </div>
              <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ca8a04' }}>{stats.averageRating} / 5</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Average Rating</div>
              </div>
              <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: '#16a34a' }}>{stats.responseRate}%</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Response Rate</div>
              </div>
              <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: '#475569' }}>{stats.repliedCount}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Replied Reviews</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div className="card-shell" style={{ padding: 20 }}>
                <h2>Rating Distribution</h2>
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = ratingBreakdown[star] || 0;
                    const percent = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                    return (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 13, width: 48 }}>{star} Stars</span>
                        <div style={{ flex: 1, backgroundColor: '#e2e8f0', height: 10, borderRadius: 5, overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, backgroundColor: '#ca8a04', height: '100%' }} />
                        </div>
                        <span style={{ fontSize: 12, color: '#64748b', width: 24, textAlign: 'right' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card-shell" style={{ padding: 20 }}>
                <h2>Review Sources Breakdown</h2>
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Object.entries(platformBreakdown).length === 0 ? (
                    <div style={{ color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>No platform metrics recorded.</div>
                  ) : (
                    Object.entries(platformBreakdown).map(([slug, count]) => {
                      const percent = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                      const label = getPlatformLabel(slug);
                      return (
                        <div key={slug} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 13, width: 90, overflow: 'hidden', textOverflow: 'ellipsis' }}>{label.name}</span>
                          <div style={{ flex: 1, backgroundColor: '#e2e8f0', height: 10, borderRadius: 5, overflow: 'hidden' }}>
                            <div style={{ width: `${percent}%`, backgroundColor: label.text, height: '100%' }} />
                          </div>
                          <span style={{ fontSize: 12, color: '#64748b', width: 24, textAlign: 'right' }}>{count}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
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
          <h1>Review Management</h1>
          <p className="module-sub">Monitor reviews feed, reply to customer feedback, configure review gating, and distribute invite requests.</p>
        </div>
      </div>

      {/* Tab Selector */}
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
