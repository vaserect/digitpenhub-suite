'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

export default function PostCreator({ onCreated }) {
  const [accounts, setAccounts] = useState([]);
  const [show, setShow] = useState(false);
  const [contentText, setContentText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [postType, setPostType] = useState('post');
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      apiFetch('/api/v1/social-media/accounts')
        .then(res => setAccounts(res.accounts || []))
        .catch(() => toast.error('Failed to load accounts'));
    }
  }, [show]);

  const toggleAccount = (id) => {
    setSelectedAccounts(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!contentText.trim()) { toast.error('Post text is required'); return; }
    if (selectedAccounts.length === 0) { toast.error('Select at least one account'); return; }
    setSubmitting(true);

    try {
      const targets = selectedAccounts.map(aid => ({
        accountId: aid,
        scheduledAt: scheduledAt || null,
      }));

      const res = await apiFetch('/api/v1/social-media/posts', {
        method: 'POST',
        body: JSON.stringify({
          contentText: contentText.trim(),
          linkUrl: linkUrl.trim() || null,
          postType,
          targets,
        }),
      });

      // Schedule if a time was set
      if (res.post && scheduledAt) {
        await apiFetch(`/api/v1/social-media/posts/${res.post.id}/schedule`, {
          method: 'POST',
          body: JSON.stringify({
            schedules: res.post.targets.map(t => ({
              targetId: t.id,
              scheduledAt,
            })),
          }),
        });
      }

      // Publish immediately if no time set
      if (res.post && !scheduledAt) {
        await apiFetch(`/api/v1/social-media/posts/${res.post.id}/publish-now`, {
          method: 'POST',
          body: JSON.stringify({ accountIds: selectedAccounts }),
        });
      }

      toast.success(scheduledAt ? 'Post scheduled!' : 'Post published!');
      setShow(false);
      setContentText('');
      setLinkUrl('');
      setSelectedAccounts([]);
      setScheduledAt('');
      if (onCreated) onCreated();
    } catch (err) {
      toast.error('Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button className="primary-btn" onClick={() => setShow(true)}>+ Create Post</Button>

      {show && (
        <Modal title="Create Post" onClose={() => setShow(false)} wide>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Post type selector */}
            <div style={{ display: 'flex', gap: 8 }}>
              {['post', 'story', 'reel', 'thread', 'carousel'].map(type => (
                <button key={type} className={`ctag ${postType === type ? 'active' : ''}`}
                  style={{
                    padding: '6px 14px', borderRadius: 6, border: `1px solid ${postType === type ? '#2563eb' : '#e2e8f0'}`,
                    backgroundColor: postType === type ? '#eff6ff' : 'white',
                    color: postType === type ? '#2563eb' : '#475569', fontWeight: 600, fontSize: 13,
                  }}
                  onClick={() => setPostType(type)}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {/* Content text */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                Post Content <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                className="input-field"
                value={contentText}
                onChange={e => setContentText(e.target.value)}
                placeholder="What would you like to share?"
                rows={5}
                style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }}
              />
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, textAlign: 'right' }}>{contentText.length} characters</div>
            </div>

            {/* Link URL */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Link URL</label>
              <input className="input-field" type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                placeholder="https://example.com" style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }} />
            </div>

            {/* Schedule */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                Schedule (leave empty to publish now)
              </label>
              <input className="input-field" type="datetime-local" value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }} />
            </div>

            {/* Account selection */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8 }}>
                Publish To <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {accounts.filter(a => a.health_status === 'connected').map(acc => (
                  <button key={acc.id} className="ctag"
                    style={{
                      padding: '6px 12px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6,
                      backgroundColor: selectedAccounts.includes(acc.id) ? '#2563eb' : '#f1f5f9',
                      color: selectedAccounts.includes(acc.id) ? 'white' : '#475569',
                      border: 'none', fontSize: 13,
                    }}
                    onClick={() => toggleAccount(acc.id)}>
                    {acc.account_name}
                    <span style={{ fontSize: 11, opacity: 0.7 }}>{acc.platform_slug}</span>
                  </button>
                ))}
              </div>
              {accounts.filter(a => a.health_status === 'connected').length === 0 && (
                <p style={{ fontSize: 13, color: '#94a3b8' }}>No connected accounts. Connect one first.</p>
              )}
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
              <Button onClick={() => setShow(false)}>Cancel</Button>
              <Button className="primary-btn" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Creating...' : scheduledAt ? 'Schedule Post' : 'Publish Now'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
