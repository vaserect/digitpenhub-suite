'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import StatCard from '../ui/StatCard';
import Table from '../ui/Table';
import EmptyState from '../ui/EmptyState';
import StatusBadge from '../ui/StatusBadge';
import Tooltip from '../ui/Tooltip';
import BulkActionBar from '../ui/BulkActionBar';
import ConfirmDialog from '../ui/ConfirmDialog';

export default function UrlShortenerModule({ goHome }) {
  const [loaded, setLoaded] = useState(false);
  const [stats, setStats] = useState(null);
  const [links, setLinks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ targetUrl: '', title: '', customSlug: '', expiresAt: '' });
  const [copied, setCopied] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState([]);

  const load = useCallback(async () => {
    try {
      const [s, l] = await Promise.all([
        apiFetch('/api/v1/url-shortener/stats'),
        apiFetch('/api/v1/url-shortener/'),
      ]);
      setStats(s);
      setLinks(l.links || []);
    } catch { toast.error('Failed to load links'); }
    setLoaded(true);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/url-shortener/', { method: 'POST', body: JSON.stringify(draft) });
      setShowForm(false);
      setDraft({ targetUrl: '', title: '', customSlug: '', expiresAt: '' });
      toast.success('Short link created!');
      load();
    } catch (err) { toast.error(err.message); }
  }

  function handleCopy(slug) {
    const url = `${window.location.origin}/s/${slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => { setCopied(slug); setTimeout(() => setCopied(null), 2000); });
      toast.success('Copied!');
    }
  }

  function handleDelete(id) { setConfirmDelete({ id }); }

  async function confirmDeleteAction() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/v1/url-shortener/${confirmDelete.id}`, { method: 'DELETE' });
      setLinks((l) => l.filter((x) => x.id !== confirmDelete.id));
      toast.success('Link deleted');
    } catch { toast.error('Delete failed'); }
    setDeleting(false);
    setConfirmDelete(null);
  }

  async function confirmBulkDelete() {
    try {
      await apiFetch('/api/v1/url-shortener/bulk-delete', { method: 'POST', body: JSON.stringify({ ids: selected }) });
      setLinks((l) => l.filter((x) => !selected.includes(x.id)));
      setSelected([]);
      toast.success(`${selected.length} links deleted`);
    } catch { toast.error('Bulk delete failed'); }
  }

  async function toggleStatus(id, current) {
    try {
      await apiFetch(`/api/v1/url-shortener/${id}`, { method: 'PUT', body: JSON.stringify({ status: current === 'active' ? 'inactive' : 'active' }) });
      load();
    } catch { toast.error('Failed to update'); }
  }

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <div>
          <h1>URL Shortener</h1>
          <p className="module-sub">Shorten, track, and manage links.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={() => window.open('/api/v1/url-shortener/export', '_blank')}>Export CSV</Button>
          <Button onClick={() => { setDraft({ targetUrl: '', title: '', customSlug: '', expiresAt: '' }); setShowForm(true); }}>+ Shorten URL</Button>
        </div>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
          <StatCard label="Total Links" value={stats.total} />
          <StatCard label="Active" value={stats.active} />
          <StatCard label="Total Clicks" value={stats.total_clicks} />
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
            <input className="form-input" placeholder="Destination URL *" value={draft.targetUrl} onChange={(e) => setDraft((d) => ({ ...d, targetUrl: e.target.value }))} required style={{ gridColumn: '1/3' }} />
            <input className="form-input" placeholder="Custom slug" value={draft.customSlug} onChange={(e) => setDraft((d) => ({ ...d, customSlug: e.target.value }))} style={{ fontFamily: 'monospace' }} />
            <input className="form-input" placeholder="Title (optional)" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
            <input className="form-input" type="datetime-local" value={draft.expiresAt} onChange={(e) => setDraft((d) => ({ ...d, expiresAt: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="submit">Shorten</Button>
            <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <Table
        loading={!loaded}
        rows={links}
        getRowKey={(l) => l.id}
        selectable
        selectedKeys={selected}
        onSelectionChange={setSelected}
        emptyState={
          <EmptyState icon="🔗" title="No short links yet" description="Shorten your first URL to start tracking clicks." action={<Button onClick={() => setShowForm(true)}>+ Shorten URL</Button>} />
        }
        columns={[
          { key: 'title', header: 'Title / Target', render: (l) => (
            <>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{l.title || 'Untitled'}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.target_url}</div>
            </>
          )},
          { key: 'slug', header: 'Short Link', render: (l) => (
            <>
              <code style={{ fontSize: '0.8rem', background: 'var(--surface)', padding: '2px 6px', borderRadius: 4 }}>/s/{l.slug}</code>
              <Button variant="ghost" size="sm" onClick={() => handleCopy(l.slug)}>{copied === l.slug ? '✓ Copied' : 'Copy'}</Button>
            </>
          )},
          { key: 'clicks', header: 'Clicks', render: (l) => <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{l.clicks}</span> },
          { key: 'status', header: 'Status', render: (l) => <StatusBadge status={l.status} /> },
          { key: 'created_at', header: 'Created', render: (l) => <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{new Date(l.created_at).toLocaleDateString()}</span> },
          { key: 'actions', header: '', render: (l) => (
            <>
              <Button variant="ghost" size="sm" onClick={() => toggleStatus(l.id, l.status)}>{l.status === 'active' ? 'Disable' : 'Enable'}</Button>
              <Tooltip label="Delete this link">
                <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(l.id)}>Delete</Button>
              </Tooltip>
            </>
          )},
        ]}
      />

      <BulkActionBar
        selectedCount={selected.length}
        onClearSelection={() => setSelected([])}
        actions={[{ label: 'Delete', variant: 'danger', requiresConfirm: true, confirmTitle: `Delete ${selected.length} link(s)?`, confirmDescription: "This can't be undone.", onClick: confirmBulkDelete }]}
      />

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteAction}
        title="Delete short link?"
        description="This link will stop redirecting immediately. This can't be undone."
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
}
