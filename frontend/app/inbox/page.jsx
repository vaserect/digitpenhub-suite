'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import ModulePage from '../../components/ui/ModulePage';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const SOURCE_LABELS = {
  crm: 'CRM',
  email: 'Email',
  helpdesk: 'Help Desk',
  invoice: 'Invoicing',
  system: 'System',
  community: 'Community',
  appointment: 'Appointments',
  automation: 'Automation',
};
const SOURCE_COLORS = {
  crm: '#3b82f6',
  email: '#22c55e',
  helpdesk: '#f59e0b',
  invoice: '#8b5cf6',
  system: '#64748b',
  community: '#06b6d4',
  appointment: '#ec4899',
  automation: '#14b8a6',
};

export default function InboxPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sourceFilter, setSourceFilter] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [notes, setNotes] = useState([]);
  const [noteDraft, setNoteDraft] = useState('');
  const [sendingNote, setSendingNote] = useState(false);

  const limit = 50;

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (unreadOnly) params.set('unreadOnly', 'true');
      if (sourceFilter) params.set('source', sourceFilter);
      const res = await apiFetch(`/api/v1/inbox?${params}`);
      setMessages(res.messages || []);
      setTotal(res.total || 0);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      toast.error('Failed to load inbox');
    } finally {
      setLoading(false);
    }
  }, [page, unreadOnly, sourceFilter]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  const totalPages = Math.ceil(total / limit);

  async function handleMarkRead(id) {
    await apiFetch(`/api/v1/inbox/${id}/read`, { method: 'PATCH' }).catch(() => {});
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, is_read: true } : m)));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function handleMarkAllRead() {
    await apiFetch('/api/v1/inbox/mark-all-read', { method: 'POST' }).catch(() => {});
    setMessages((prev) => prev.map((m) => ({ ...m, is_read: true })));
    setUnreadCount(0);
    toast.success('All marked as read');
  }

  async function handleDelete(id) {
    await apiFetch(`/api/v1/inbox/${id}`, { method: 'DELETE' });
    setConfirmDelete(null);
    setMessages((prev) => prev.filter((m) => m.id !== id));
    toast.success('Message deleted');
  }

  function openDetail(msg) {
    setSelectedMsg(msg);
    setNotes([]);
    setNoteDraft('');
    if (!msg.is_read) handleMarkRead(msg.id);
    apiFetch(`/api/v1/inbox/${msg.id}/notes`).then((res) => setNotes(res.notes || [])).catch(() => {});
  }

  async function handleAddNote() {
    if (!noteDraft.trim() || !selectedMsg) return;
    setSendingNote(true);
    try {
      const res = await apiFetch(`/api/v1/inbox/${selectedMsg.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ body: noteDraft.trim() }),
      });
      setNotes((prev) => [...prev, { ...res.note, author_name: 'You', created_at: new Date().toISOString() }]);
      setNoteDraft('');
    } catch (err) {
      toast.error('Failed to add note');
    } finally {
      setSendingNote(false);
    }
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    const ms = Date.now() - new Date(dateStr).getTime();
    if (ms < 60000) return 'just now';
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
    if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
    return `${Math.floor(ms / 86400000)}d ago`;
  }

  const stats = [
    { label: 'Total', value: total, icon: '📬' },
    { label: 'Unread', value: unreadCount, icon: '🔴' },
    { label: 'Page', value: `${page} / ${totalPages || 1}`, icon: '📄' },
  ];

  return (
    <div className="panel">
      <div className="module-head">
        <div>
          <button className="back-link" onClick={() => router.push('/')}>← Workspace</button>
          <h1>Unified Inbox</h1>
          <p className="module-sub">Cross-module messages, notifications, and internal notes</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.icon} {s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="toolbar-row" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <select className="form-input" value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
          style={{ width: 140, fontSize: 12 }}>
          <option value="">All sources</option>
          {Object.entries(SOURCE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={unreadOnly} onChange={(e) => { setUnreadOnly(e.target.checked); setPage(1); }} />
          Unread only
        </label>

        <div style={{ flex: 1 }} />

        {unreadCount > 0 && (
          <button className="btn btn-sm btn-ghost" onClick={handleMarkAllRead}>Mark all read</button>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>←</button>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: '0 4px' }}>{page} / {totalPages}</span>
            <button className="btn btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>→</button>
          </div>
        )}
      </div>

      {/* Message list + detail panel */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedMsg ? '1fr 360px' : '1fr', gap: 16, minHeight: 400 }}>
        {/* List */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading messages…</div>
          ) : messages.length === 0 ? (
            <EmptyState icon="📭" title="No messages" description={unreadOnly ? 'No unread messages. Try clearing filters.' : 'Your inbox is empty.'} />
          ) : (
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => openDetail(msg)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: msg.is_read ? 'transparent' : 'var(--bg-active, rgba(59,130,246,0.04))',
                    transition: 'background 0.1s',
                  }}
                  className="hover:bg-muted"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                      {!msg.is_read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />}
                      <span style={{
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                        color: SOURCE_COLORS[msg.source] || '#64748b', flexShrink: 0,
                      }}>
                        {SOURCE_LABELS[msg.source] || msg.source}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: msg.is_read ? 400 : 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {msg.title}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>{timeAgo(msg.created_at)}</span>
                  </div>
                  {msg.body && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {msg.body}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 4, marginTop: 4, marginLeft: 14 }}>
                    {msg.priority === 'high' && <span className="badge badge-danger" style={{ fontSize: 10 }}>High</span>}
                    {msg.link && <span style={{ fontSize: 10, color: '#3b82f6' }}>🔗 Has link</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedMsg && (
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16, maxHeight: '60vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: SOURCE_COLORS[selectedMsg.source] || '#64748b' }}>
                  {SOURCE_LABELS[selectedMsg.source] || selectedMsg.source}
                </span>
                <h3 style={{ margin: '4px 0', fontSize: 14 }}>{selectedMsg.title}</h3>
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => setSelectedMsg(null)} style={{ fontSize: 16, lineHeight: 1 }}>✕</button>
            </div>

            {selectedMsg.body && (
              <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, marginBottom: 12, whiteSpace: 'pre-wrap' }}>{selectedMsg.body}</p>
            )}

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {selectedMsg.link && (
                <a href={selectedMsg.link} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ textDecoration: 'none' }}>
                  🔗 Open link
                </a>
              )}
              <button className="btn btn-sm btn-ghost" onClick={() => setConfirmDelete(selectedMsg.id)}>🗑️ Delete</button>
            </div>

            {/* Internal notes */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--text-muted)' }}>Internal notes</div>
              {notes.map((note) => (
                <div key={note.id} style={{ fontSize: 12, marginBottom: 8, padding: '6px 8px', background: 'var(--bg-card)', borderRadius: 6 }}>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{note.author_name || 'Unknown'}</div>
                  <div style={{ color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{note.body}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{timeAgo(note.created_at)}</div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                <input
                  className="form-input"
                  style={{ flex: 1, fontSize: 12, padding: '6px 8px' }}
                  placeholder="Add a note…"
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddNote(); } }}
                />
                <button className="btn btn-sm" onClick={handleAddNote} disabled={sendingNote || !noteDraft.trim()}>
                  {sendingNote ? '…' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => handleDelete(confirmDelete)}
        title="Delete message" message="This will permanently remove this message from your inbox." />
    </div>
  );
}
