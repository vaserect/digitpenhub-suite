'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import MediaPicker from './MediaPicker';

export default function PostEditor({ editPost, onDone }) {
  const isEdit = !!editPost;
  const [show, setShow] = useState(isEdit);
  const [contentText, setContentText] = useState(editPost?.contentText || '');
  const [linkUrl, setLinkUrl] = useState('');
  const [postType, setPostType] = useState(editPost?.postType || 'post');
  const [accounts, setAccounts] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [scheduledAt, setScheduledAt] = useState(editPost?.scheduledAt || '');
  const [submitting, setSubmitting] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaIds, setMediaIds] = useState([]);
  const [mediaItems, setMediaItems] = useState([]);
  const editorRef = useRef(null);

  // Load accounts on mount
  useEffect(() => {
    if (show) {
      apiFetch('/api/v1/social-media/accounts')
        .then(res => {
          const connected = (res.accounts || []).filter(a => a.health_status === 'connected');
          setAccounts(connected);
          // Pre-select the account if editing
          if (editPost?.accountId) {
            setSelectedAccounts([editPost.accountId]);
          }
        })
        .catch(() => toast.error('Failed to load accounts'));
    }
  }, [show, editPost]);

  // Load media previews when mediaIds change
  useEffect(() => {
    if (mediaIds.length === 0) { setMediaItems([]); return; }
    apiFetch(`/api/v1/social-media/media?limit=100`)
      .then(res => {
        const items = (res.media || []).filter(m => mediaIds.includes(m.id));
        setMediaItems(items);
      })
      .catch(() => {});
  }, [mediaIds]);

  const toggleAccount = (id) => {
    setSelectedAccounts(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  // ── Rich text toolbar commands ─────────────────────

  const execCmd = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) execCmd('createLink', url);
  };

  const handlePaste = (e) => {
    // Strip HTML from paste to prevent XSS
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const syncContent = () => {
    if (editorRef.current) {
      setContentText(editorRef.current.innerText);
    }
  };

  // ── Submit ─────────────────────────────────────────

  const handleSubmit = async () => {
    const text = editorRef.current?.innerText?.trim() || contentText.trim();
    if (!text && mediaIds.length === 0) { toast.error('Post content or media is required'); return; }
    if (selectedAccounts.length === 0) { toast.error('Select at least one account'); return; }
    setSubmitting(true);

    try {
      const targets = selectedAccounts.map(aid => ({
        accountId: aid,
        scheduledAt: scheduledAt || null,
      }));

      let post;

      if (isEdit) {
        // Update existing post
        const res = await apiFetch(`/api/v1/social-media/posts/${editPost.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            contentText: text,
            linkUrl: linkUrl || null,
            postType,
            mediaIds,
          }),
        });
        post = res.post;
      } else {
        // Create new post
        const res = await apiFetch('/api/v1/social-media/posts', {
          method: 'POST',
          body: JSON.stringify({
            contentText: text,
            linkUrl: linkUrl || null,
            postType,
            mediaIds: mediaIds.length > 0 ? mediaIds : undefined,
            targets,
          }),
        });
        post = res.post;
      }

      // Schedule or publish
      if (post && scheduledAt) {
        await apiFetch(`/api/v1/social-media/posts/${post.id}/schedule`, {
          method: 'POST',
          body: JSON.stringify({
            schedules: (post.targets || [{}]).map((t, i) => ({
              targetId: t.id,
              scheduledAt,
            })),
          }),
        });
        toast.success('Post scheduled!');
      } else if (post && !isEdit) {
        await apiFetch(`/api/v1/social-media/posts/${post.id}/publish-now`, {
          method: 'POST',
          body: JSON.stringify({ accountIds: selectedAccounts }),
        });
        toast.success('Post published!');
      } else {
        toast.success('Post updated!');
      }

      setShow(false);
      onDone?.();
    } catch (err) {
      toast.error(isEdit ? 'Failed to update post' : 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Toolbar button ─────────────────────────────────

  const ToolBtn = ({ cmd, label, title, active }) => (
    <button type="button"
      onMouseDown={(e) => { e.preventDefault(); cmd(); }}
      style={{
        padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer',
        backgroundColor: active ? '#eff6ff' : 'white', color: active ? '#2563eb' : '#475569',
        fontWeight: 600, fontSize: 13, lineHeight: 1, minWidth: 28,
      }}
      title={title}
    >
      {label}
    </button>
  );

  // ── Media preview thumbnail ─────────────────────────

  const removeMedia = (id) => {
    setMediaIds(prev => prev.filter(m => m !== id));
  };

  return (
    <>
      {!isEdit && (
        <Button className="primary-btn" onClick={() => setShow(true)}>+ Create Post</Button>
      )}

      {show && (
        <Modal title={isEdit ? 'Edit Post' : 'Create Post'} onClose={() => { setShow(false); onDone?.(); }} wide>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '80vh', overflowY: 'auto' }}>
            {/* Post type selector */}
            <div style={{ display: 'flex', gap: 6 }}>
              {['post', 'story', 'reel', 'thread', 'carousel'].map(type => (
                <button key={type} type="button"
                  style={{
                    padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                    border: `1px solid ${postType === type ? '#2563eb' : '#e2e8f0'}`,
                    backgroundColor: postType === type ? '#eff6ff' : 'white',
                    color: postType === type ? '#2563eb' : '#475569',
                    fontWeight: 600, fontSize: 13,
                  }}
                  onClick={() => setPostType(type)}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {/* Rich text editor */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                Content <span style={{ color: '#dc2626' }}>*</span>
              </label>

              {/* Formatting toolbar */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 4, flexWrap: 'wrap' }}>
                <ToolBtn cmd={() => execCmd('bold')} label="B" title="Bold" />
                <ToolBtn cmd={() => execCmd('italic')} label="I" title="Italic" />
                <ToolBtn cmd={() => execCmd('underline')} label="U" title="Underline" />
                <div style={{ width: 1, backgroundColor: '#e2e8f0', margin: '0 4px' }} />
                <ToolBtn cmd={() => execCmd('insertUnorderedList')} label="• List" title="Bullet list" />
                <ToolBtn cmd={() => execCmd('insertOrderedList')} label="1. List" title="Numbered list" />
                <div style={{ width: 1, backgroundColor: '#e2e8f0', margin: '0 4px' }} />
                <ToolBtn cmd={insertLink} label="🔗 Link" title="Insert link" />
                <ToolBtn cmd={() => execCmd('removeFormat')} label="Clear" title="Remove formatting" />
              </div>

              {/* Content editable */}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={syncContent}
                onPaste={handlePaste}
                data-placeholder="What would you like to share?"
                style={{
                  width: '100%', minHeight: 140, padding: 12,
                  border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14,
                  fontFamily: 'inherit', lineHeight: 1.6, outline: 'none',
                  backgroundColor: 'white', cursor: 'text',
                  whiteSpace: 'pre-wrap',
                }}
                dangerouslySetInnerHTML={{
                  __html: isEdit ? contentText.replace(/\n/g, '<br>') : '',
                }}
              />
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, textAlign: 'right' }}>
                {editorRef.current?.innerText?.length || contentText.length} characters
              </div>
            </div>

            {/* Link URL */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                Link URL
              </label>
              <input type="url" value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }} />
            </div>

            {/* Media preview section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  Media {mediaIds.length > 0 && <span style={{ color: '#64748b', fontWeight: 400 }}>({mediaIds.length})</span>}
                </label>
                <button className="ctag" style={{ fontSize: 13 }}
                  onClick={() => setShowMediaPicker(true)}>
                  + Browse Media
                </button>
              </div>

              {/* Thumbnail strip */}
              {mediaItems.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {mediaItems.map(item => (
                    <div key={item.id} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                      {item.type === 'image' || item.type === 'gif' ? (
                        <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : item.type === 'video' ? (
                        <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 24 }}>🎬</div>
                      )}
                      <button type="button"
                        onClick={() => removeMedia(item.id)}
                        style={{
                          position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: 9,
                          backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', fontSize: 12, lineHeight: 1,
                        }}>×</button>
                    </div>
                  ))}
                  {mediaIds.length > mediaItems.length && (
                    <div style={{ width: 80, height: 80, borderRadius: 8, border: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#94a3b8' }}>
                      Loading...
                    </div>
                  )}
                </div>
              )}
              {mediaItems.length === 0 && (
                <div style={{ padding: '16px', border: '1px dashed #e2e8f0', borderRadius: 8, textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
                  No media attached. Click "Browse Media" to add images or videos.
                </div>
              )}
            </div>

            {/* Schedule */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                Schedule {isEdit ? '(leave empty to keep current)' : '(leave empty to publish now)'}
              </label>
              <input type="datetime-local" value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }} />
            </div>

            {/* Account selection */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8 }}>
                Publish To <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {accounts.map(acc => (
                  <button key={acc.id} type="button"
                    style={{
                      padding: '6px 12px', borderRadius: 6, cursor: 'pointer', border: 'none',
                      backgroundColor: selectedAccounts.includes(acc.id) ? '#2563eb' : '#f1f5f9',
                      color: selectedAccounts.includes(acc.id) ? 'white' : '#475569',
                      fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
                    }}
                    onClick={() => toggleAccount(acc.id)}>
                    {acc.account_name}
                    <span style={{ fontSize: 11, opacity: 0.7 }}>{acc.platform_slug}</span>
                  </button>
                ))}
                {accounts.length === 0 && (
                  <p style={{ fontSize: 13, color: '#94a3b8' }}>No connected accounts.</p>
                )}
              </div>
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
              <Button onClick={() => { setShow(false); onDone?.(); }}>Cancel</Button>
              <Button className="primary-btn" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving...' : isEdit ? 'Save Changes' : scheduledAt ? 'Schedule Post' : 'Publish Now'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Media picker modal */}
      {showMediaPicker && (
        <Modal title="Select Media" onClose={() => setShowMediaPicker(false)} wide>
          <div style={{ padding: 16 }}>
            <MediaPicker
              selected={mediaIds}
              onSelect={setMediaIds}
              onClose={() => setShowMediaPicker(false)}
              multi={postType === 'carousel'}
            />
          </div>
        </Modal>
      )}
    </>
  );
}
