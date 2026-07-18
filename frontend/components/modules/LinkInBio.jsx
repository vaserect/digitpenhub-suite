'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import EmptyState from '../ui/EmptyState';

export default function LinkInBioModule({ goHome, showToast }) {
  const [libLoaded, setLibLoaded] = useState(false);
  const [libPages, setLibPages] = useState([]);
  const [libStats, setLibStats] = useState(null);
  const [libViewPage, setLibViewPage] = useState(null);
  const [libLinks, setLibLinks] = useState([]);
  
  // Page Form State
  const [libPageForm, setLibPageForm] = useState(false);
  const [libPageDraft, setLibPageDraft] = useState({
    title: '',
    bio: '',
    avatarUrl: '',
    slug: '',
    bgColor: '#ffffff',
    accentColor: '#2563eb'
  });

  // Link Form State
  const [libLinkForm, setLibLinkForm] = useState(false);
  const [editingLibLink, setEditingLibLink] = useState(null);
  const [libLinkDraft, setLibLinkDraft] = useState({
    title: '',
    url: '',
    icon: '🔗'
  });

  const [libPageConfirmDelete, setLibPageConfirmDelete] = useState(null);
  const [libPageDeleting, setLibPageDeleting] = useState(false);
  const [libLinkConfirmDelete, setLibLinkConfirmDelete] = useState(null);
  const [libLinkDeleting, setLibLinkDeleting] = useState(false);

  const loadLinkInBio = useCallback(async () => {
    try {
      const [stats, pages] = await Promise.all([
        apiFetch('/api/v1/link-in-bio/stats'),
        apiFetch('/api/v1/link-in-bio/')
      ]);
      setLibStats(stats.stats);
      setLibPages(pages.pages || []);
      setLibLoaded(true);
    } catch {
      setLibLoaded(true);
    }
  }, []);

  const loadBioLinks = useCallback(async (pageId) => {
    const data = await apiFetch(`/api/v1/link-in-bio/${pageId}/links`).catch(() => ({ links: [] }));
    setLibLinks(data.links || []);
  }, []);

  useEffect(() => {
    loadLinkInBio();
  }, [loadLinkInBio]);

  async function handleSaveLibPage(e) {
    e.preventDefault();
    if (!libPageDraft.title.trim() || !libPageDraft.slug.trim()) {
      showToast('Title and slug are required.');
      return;
    }
    const method = libViewPage ? 'PUT' : 'POST';
    const url = libViewPage ? `/api/v1/link-in-bio/${libViewPage.id}` : '/api/v1/link-in-bio/';
    const data = await apiFetch(url, { method, body: JSON.stringify(libPageDraft) });
    if (data.error) {
      showToast(data.error);
      return;
    }
    setLibPageForm(false);
    showToast(libViewPage ? 'Page updated.' : 'Page created.');
    await loadLinkInBio();
    if (!libViewPage) {
      setLibViewPage(data.page);
      setLibLinks([]);
    } else {
      setLibViewPage(data.page);
    }
  }

  function handleDeleteLibPage(id) {
    setLibPageConfirmDelete({ id });
  }

  async function confirmLibPageDelete() {
    if (!libPageConfirmDelete) return;
    setLibPageDeleting(true);
    try {
      await apiFetch(`/api/v1/link-in-bio/${libPageConfirmDelete.id}`, { method: 'DELETE' });
      setLibPages((p) => p.filter((x) => x.id !== libPageConfirmDelete.id));
      setLibViewPage(null);
      showToast('Page deleted.');
    } catch (err) {
      showToast('Failed to delete page.');
    } finally {
      setLibPageDeleting(false);
      setLibPageConfirmDelete(null);
    }
  }

  async function handleSaveLibLink(e) {
    e.preventDefault();
    if (!libViewPage) return;
    if (!libLinkDraft.title.trim() || !libLinkDraft.url.trim()) {
      showToast('Title and URL are required.');
      return;
    }
    const method = editingLibLink ? 'PUT' : 'POST';
    const url = editingLibLink ? `/api/v1/link-in-bio/links/${editingLibLink.id}` : `/api/v1/link-in-bio/${libViewPage.id}/links`;
    const data = await apiFetch(url, { method, body: JSON.stringify(libLinkDraft) });
    if (data.error) {
      showToast(data.error);
      return;
    }
    setLibLinkForm(false);
    setEditingLibLink(null);
    showToast(editingLibLink ? 'Link updated.' : 'Link added.');
    await loadBioLinks(libViewPage.id);
  }

  function handleDeleteLibLink(id) {
    setLibLinkConfirmDelete({ id });
  }

  async function confirmLibLinkDelete() {
    if (!libLinkConfirmDelete) return;
    setLibLinkDeleting(true);
    try {
      await apiFetch(`/api/v1/link-in-bio/links/${libLinkConfirmDelete.id}`, { method: 'DELETE' });
      setLibLinks((l) => l.filter((x) => x.id !== libLinkConfirmDelete.id));
      showToast('Link deleted.');
    } catch (err) {
      showToast('Failed to delete link.');
    } finally {
      setLibLinkDeleting(false);
      setLibLinkConfirmDelete(null);
    }
  }

  return (
    <div className="panel" style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <button className="back-link" onClick={() => libViewPage ? setLibViewPage(null) : goHome()} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', fontWeight: 500, fontSize: '0.875rem', padding: 0, marginBottom: '0.5rem' }}>
            ← {libViewPage ? 'Back to Pages' : 'Back to Workspace'}
          </button>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)' }}>
            {libViewPage ? libViewPage.title : 'Link-in-Bio'}
          </h1>
          {!libViewPage && (
            <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.875rem' }}>
              Create link-in-bio landing pages to showcase all your links in one place. Part of Website Builder.
            </p>
          )}
        </div>
        {!libViewPage && !libPageForm && (
          <Button onClick={() => { setLibPageDraft({ title: '', bio: '', avatarUrl: '', slug: '', bgColor: '#ffffff', accentColor: '#2563eb' }); setLibPageForm(true); }}>
            + New Page
          </Button>
        )}
        {libViewPage && !libLinkForm && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="ghost" onClick={() => { setLibPageDraft({ title: libViewPage.title, bio: libViewPage.bio || '', avatarUrl: libViewPage.avatar_url || '', slug: libViewPage.slug, bgColor: libViewPage.bg_color || '#ffffff', accentColor: libViewPage.accent_color || '#2563eb' }); setLibPageForm(true); }}>
              Edit Page Settings
            </Button>
            <Button onClick={() => { setLibLinkDraft({ title: '', url: '', icon: '🔗' }); setEditingLibLink(null); setLibLinkForm(true); }}>
              + Add Link
            </Button>
          </div>
        )}
      </div>

      {libStats && !libViewPage && !libPageForm && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pages</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>{libStats.pages || 0}</span>
          </div>
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Links</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>{libStats.total_links || 0}</span>
          </div>
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Page Views</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{(libStats.total_views || 0).toLocaleString()}</span>
          </div>
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Link Clicks</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{(libStats.total_clicks || 0).toLocaleString()}</span>
          </div>
        </div>
      )}

      {libPageForm && (
        <form onSubmit={handleSaveLibPage} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '1.5rem', marginBottom: '1rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600 }}>
            {libViewPage ? 'Edit Page Details' : 'Create Link-in-Bio Page'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Page Title *</label>
              <input className="form-input" placeholder="e.g. John Doe Portfolio" value={libPageDraft.title} onChange={(e) => setLibPageDraft((d) => ({ ...d, title: e.target.value }))} required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Slug (URL Path) *</label>
              <input className="form-input" placeholder="e.g. johndoe" value={libPageDraft.slug} onChange={(e) => setLibPageDraft((d) => ({ ...d, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} required style={{ width: '100%' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Avatar Image URL</label>
              <input className="form-input" placeholder="https://example.com/avatar.jpg" value={libPageDraft.avatarUrl} onChange={(e) => setLibPageDraft((d) => ({ ...d, avatarUrl: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Short Bio</label>
              <textarea className="form-input" placeholder="A brief description about yourself" value={libPageDraft.bio} onChange={(e) => setLibPageDraft((d) => ({ ...d, bio: e.target.value }))} style={{ width: '100%', minHeight: 60 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '0.2rem' }}>Background Color</label>
              <input type="color" value={libPageDraft.bgColor} onChange={(e) => setLibPageDraft((d) => ({ ...d, bgColor: e.target.value }))} style={{ height: 36, width: '100%', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '0.2rem' }}>Accent Color</label>
              <input type="color" value={libPageDraft.accentColor} onChange={(e) => setLibPageDraft((d) => ({ ...d, accentColor: e.target.value }))} style={{ height: 36, width: '100%', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button type="submit">{libViewPage ? 'Update' : 'Create'} Page</Button>
            <Button variant="ghost" type="button" onClick={() => setLibPageForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {!libLoaded ? (
        <p className="muted">Loading Link-in-Bio pages…</p>
      ) : !libViewPage ? (
        libPages.length === 0 ? (
          <EmptyState title="No bio pages yet." description="Create your first link-in-bio page to start organizing links." action={<Button onClick={() => setLibPageForm(true)}>+ New Page</Button>} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
            {libPages.map((p) => (
              <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => { setLibViewPage(p); loadBioLinks(p.id); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: p.accent_color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                      {p.title[0]}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text)' }}>{p.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>/{p.slug}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--muted)', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                  <span>{p.link_count || 0} links</span>
                  <span>{p.views || 0} views</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {libLinkForm && (
              <form onSubmit={handleSaveLibLink} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600 }}>
                  {editingLibLink ? 'Edit Link' : 'Add New Link'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '70px 1.5fr 2fr', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.2rem' }}>Icon</label>
                    <input className="form-input" placeholder="Icon" value={libLinkDraft.icon} onChange={(e) => setLibLinkDraft((d) => ({ ...d, icon: e.target.value }))} style={{ textAlign: 'center', fontSize: '1.2rem', width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.2rem' }}>Title *</label>
                    <input className="form-input" placeholder="e.g. My Website" value={libLinkDraft.title} onChange={(e) => setLibLinkDraft((d) => ({ ...d, title: e.target.value }))} required style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.2rem' }}>URL *</label>
                    <input className="form-input" placeholder="https://..." value={libLinkDraft.url} onChange={(e) => setLibLinkDraft((d) => ({ ...d, url: e.target.value }))} required style={{ width: '100%' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button type="submit">{editingLibLink ? 'Update' : 'Add'} Link</Button>
                  <Button variant="ghost" type="button" onClick={() => { setLibLinkForm(false); setEditingLibLink(null); }}>Cancel</Button>
                </div>
              </form>
            )}

            {libLinks.length === 0 ? (
              <EmptyState title="No links yet. Add your first link." action={<Button onClick={() => { setLibLinkDraft({ title: '', url: '', icon: '🔗' }); setEditingLibLink(null); setLibLinkForm(true); }}>+ Add Link</Button>} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {libLinks.map((link) => (
                  <div key={link.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>{link.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>{link.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>{link.url}</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginRight: '0.5rem' }}>{link.clicks || 0} clicks</span>
                    <button className="btn-ghost" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => { setEditingLibLink(link); setLibLinkDraft({ title: link.title, url: link.url, icon: link.icon }); setLibLinkForm(true); }}>Edit</button>
                    <button className="btn-ghost" style={{ fontSize: '0.75rem', color: 'var(--danger)', padding: '4px 8px' }} onClick={() => handleDeleteLibLink(link.id)}>Del</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: libViewPage.bg_color || '#ffffff', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: 1 }}>Live Preview</p>
              {libViewPage.avatar_url && <img src={libViewPage.avatar_url} alt="" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', marginBottom: '0.5rem', border: '2px solid var(--border)' }} />}
              <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: libViewPage.bg_color === '#ffffff' ? '#000' : '#fff' }}>{libViewPage.title}</div>
              {libViewPage.bio && <div style={{ fontSize: '0.8rem', marginBottom: '1rem', color: libViewPage.bg_color === '#ffffff' ? '#555' : 'rgba(255,255,255,0.8)' }}>{libViewPage.bio}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {libLinks.map((link) => (
                  <div key={link.id} style={{ background: libViewPage.accent_color || '#2563eb', color: '#fff', borderRadius: 8, padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span>{link.icon}</span>{link.title}
                  </div>
                ))}
              </div>
            </div>
            <button className="btn-ghost" style={{ width: '100%', fontSize: '0.8rem', color: 'var(--danger)', border: '1px dashed var(--danger-border)', padding: '8px', borderRadius: 6 }} onClick={() => handleDeleteLibPage(libViewPage.id)}>
              Delete Page
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!libPageConfirmDelete}
        onClose={() => setLibPageConfirmDelete(null)}
        onConfirm={confirmLibPageDelete}
        title="Delete this page?"
        description="This will permanently delete this page and all nested links. This can't be undone."
        confirmLabel="Delete"
        danger
        loading={libPageDeleting}
      />

      <ConfirmDialog
        isOpen={!!libLinkConfirmDelete}
        onClose={() => setLibLinkConfirmDelete(null)}
        onConfirm={confirmLibLinkDelete}
        title="Delete this link?"
        description="This will remove this link from your page. This can't be undone."
        confirmLabel="Delete"
        danger
        loading={libLinkDeleting}
      />
    </div>
  );
}
