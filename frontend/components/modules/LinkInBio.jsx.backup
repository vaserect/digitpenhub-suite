'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import EmptyState from '../ui/EmptyState';

export default function LinkInBioModule({ goHome, showToast }) {
  const [activeTab, setActiveTab] = useState('pages');
  const [loaded, setLoaded] = useState(false);
  const [pages, setPages] = useState([]);
  const [stats, setStats] = useState(null);
  const [viewPage, setViewPage] = useState(null);
  const [links, setLinks] = useState([]);
  const [themes, setThemes] = useState([]);
  const [pageAnalytics, setPageAnalytics] = useState(null);

  const [pageForm, setPageForm] = useState(false);
  const [pageDraft, setPageDraft] = useState({
    title: '', bio: '', avatarUrl: '', slug: '', bgColor: '#ffffff', accentColor: '#2563eb',
    themeId: null, metaTitle: '', metaDescription: '', ogImage: '', faviconUrl: '',
    customCss: '', fontFamily: 'Inter', layoutStyle: 'centered', showBranding: true, analyticsEnabled: true
  });

  const [linkForm, setLinkForm] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [linkDraft, setLinkDraft] = useState({
    title: '', url: '', icon: '🔗', thumbnailUrl: '', description: '',
    isPriority: false, scheduleStart: '', scheduleEnd: '', category: '', animation: 'none'
  });

  const [themeForm, setThemeForm] = useState(false);
  const [themeDraft, setThemeDraft] = useState({
    name: '', description: '', category: 'minimal', bgColor: '#ffffff', textColor: '#000000',
    accentColor: '#2563eb', linkBgColor: '#f3f4f6', linkTextColor: '#000000',
    fontFamily: 'Inter', borderRadius: 'medium', linkStyle: 'solid', layoutStyle: 'centered'
  });

  const [pageConfirmDelete, setPageConfirmDelete] = useState(null);
  const [pageDeleting, setPageDeleting] = useState(false);
  const [linkConfirmDelete, setLinkConfirmDelete] = useState(null);
  const [linkDeleting, setLinkDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, pagesRes, themesRes] = await Promise.all([
        apiFetch('/api/v1/link-in-bio/stats'),
        apiFetch('/api/v1/link-in-bio/'),
        apiFetch('/api/v1/link-in-bio/themes/list')
      ]);
      setStats(statsRes.stats);
      setPages(pagesRes.pages || []);
      setThemes(themesRes.themes || []);
      setLoaded(true);
    } catch { setLoaded(true); }
  }, []);

  const loadPageDetails = useCallback(async (pageId) => {
    try {
      const [linksRes, analyticsRes] = await Promise.all([
        apiFetch(`/api/v1/link-in-bio/${pageId}/links`),
        apiFetch(`/api/v1/link-in-bio/${pageId}/analytics`)
      ]);
      setLinks(linksRes.links || []);
      setPageAnalytics(analyticsRes.analytics || null);
    } catch (err) { console.error('Failed to load page details:', err); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSavePage(e) {
    e.preventDefault();
    if (!pageDraft.title.trim() || !pageDraft.slug.trim()) {
      showToast('Title and slug are required.');
      return;
    }
    const method = viewPage ? 'PUT' : 'POST';
    const url = viewPage ? `/api/v1/link-in-bio/${viewPage.id}` : '/api/v1/link-in-bio/';
    const data = await apiFetch(url, { method, body: JSON.stringify(pageDraft) });
    if (data.error) { showToast(data.error); return; }
    setPageForm(false);
    showToast(viewPage ? 'Page updated.' : 'Page created.');
    await loadData();
    if (!viewPage) {
      setViewPage(data.page);
      await loadPageDetails(data.page.id);
    } else {
      setViewPage(data.page);
    }
  }

  async function confirmPageDelete() {
    if (!pageConfirmDelete) return;
    setPageDeleting(true);
    try {
      await apiFetch(`/api/v1/link-in-bio/${pageConfirmDelete.id}`, { method: 'DELETE' });
      setPages((p) => p.filter((x) => x.id !== pageConfirmDelete.id));
      setViewPage(null);
      showToast('Page deleted.');
    } catch { showToast('Failed to delete page.'); }
    finally { setPageDeleting(false); setPageConfirmDelete(null); }
  }

  async function handleSaveLink(e) {
    e.preventDefault();
    if (!viewPage || !linkDraft.title.trim() || !linkDraft.url.trim()) {
      showToast('Title and URL are required.');
      return;
    }
    const method = editingLink ? 'PUT' : 'POST';
    const url = editingLink ? `/api/v1/link-in-bio/links/${editingLink.id}` : `/api/v1/link-in-bio/${viewPage.id}/links`;
    const data = await apiFetch(url, { method, body: JSON.stringify(linkDraft) });
    if (data.error) { showToast(data.error); return; }
    setLinkForm(false);
    setEditingLink(null);
    showToast(editingLink ? 'Link updated.' : 'Link added.');
    await loadPageDetails(viewPage.id);
  }

  async function confirmLinkDelete() {
    if (!linkConfirmDelete) return;
    setLinkDeleting(true);
    try {
      await apiFetch(`/api/v1/link-in-bio/links/${linkConfirmDelete.id}`, { method: 'DELETE' });
      setLinks((l) => l.filter((x) => x.id !== linkConfirmDelete.id));
      showToast('Link deleted.');
    } catch { showToast('Failed to delete link.'); }
    finally { setLinkDeleting(false); setLinkConfirmDelete(null); }
  }

  async function handleSaveTheme(e) {
    e.preventDefault();
    if (!themeDraft.name.trim()) { showToast('Theme name is required.'); return; }
    const data = await apiFetch('/api/v1/link-in-bio/themes', { method: 'POST', body: JSON.stringify(themeDraft) });
    if (data.error) { showToast(data.error); return; }
    setThemeForm(false);
    showToast('Theme created.');
    await loadData();
  }

  function applyTheme(themeId) {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;
    setPageDraft(prev => ({
      ...prev, themeId: theme.id, bgColor: theme.bg_color, accentColor: theme.accent_color,
      fontFamily: theme.font_family, layoutStyle: theme.layout_style
    }));
    showToast('Theme applied. Save page to confirm.');
  }

  function copyBioLink() {
    if (!viewPage) return;
    const bioUrl = `${window.location.origin}/bio/${viewPage.slug}`;
    navigator.clipboard.writeText(bioUrl);
    showToast('Bio link copied!');
  }

  return (
    <div className="panel" style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <button className="back-link" onClick={() => viewPage ? setViewPage(null) : goHome()} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', fontWeight: 500, fontSize: '0.875rem', padding: 0, marginBottom: '0.5rem' }}>
            ← {viewPage ? 'Back to Pages' : 'Back to Workspace'}
          </button>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)' }}>
            {viewPage ? viewPage.title : 'Link-in-Bio'}
          </h1>
          {!viewPage && (
            <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.875rem' }}>
              Create beautiful link-in-bio pages. Showcase all your links in one place.
            </p>
          )}
        </div>
        {!viewPage && !pageForm && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="ghost" onClick={() => setActiveTab('themes')}>Themes</Button>
            <Button onClick={() => { setPageDraft({ title: '', bio: '', avatarUrl: '', slug: '', bgColor: '#ffffff', accentColor: '#2563eb', themeId: null, metaTitle: '', metaDescription: '', ogImage: '', faviconUrl: '', customCss: '', fontFamily: 'Inter', layoutStyle: 'centered', showBranding: true, analyticsEnabled: true }); setPageForm(true); }}>
              + New Page
            </Button>
          </div>
        )}
        {viewPage && !linkForm && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="ghost" onClick={() => { setPageDraft({ title: viewPage.title, bio: viewPage.bio || '', avatarUrl: viewPage.avatar_url || '', slug: viewPage.slug, bgColor: viewPage.bg_color || '#ffffff', accentColor: viewPage.accent_color || '#2563eb', themeId: viewPage.theme_id, metaTitle: viewPage.meta_title || '', metaDescription: viewPage.meta_description || '', ogImage: viewPage.og_image || '', faviconUrl: viewPage.favicon_url || '', customCss: viewPage.custom_css || '', fontFamily: viewPage.font_family || 'Inter', layoutStyle: viewPage.layout_style || 'centered', showBranding: viewPage.show_branding ?? true, analyticsEnabled: viewPage.analytics_enabled ?? true }); setPageForm(true); }}>
              Edit Settings
            </Button>
            <Button onClick={() => { setLinkDraft({ title: '', url: '', icon: '🔗', thumbnailUrl: '', description: '', isPriority: false, scheduleStart: '', scheduleEnd: '', category: '', animation: 'none' }); setEditingLink(null); setLinkForm(true); }}>
              + Add Link
            </Button>
          </div>
        )}
      </div>

      {activeTab === 'themes' && !viewPage ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <Button variant="ghost" onClick={() => setActiveTab('pages')}>← Back to Pages</Button>
            <Button onClick={() => setThemeForm(true)}>+ Create Theme</Button>
          </div>
          {themeForm && (
            <form onSubmit={handleSaveTheme} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem 0' }}>Create Custom Theme</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem' }}>Theme Name *</label>
                  <input className="form-input" value={themeDraft.name} onChange={(e) => setThemeDraft((d) => ({ ...d, name: e.target.value }))} required style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem' }}>Category</label>
                  <select className="form-input" value={themeDraft.category} onChange={(e) => setThemeDraft((d) => ({ ...d, category: e.target.value }))} style={{ width: '100%' }}>
                    <option value="minimal">Minimal</option>
                    <option value="professional">Professional</option>
                    <option value="creative">Creative</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button type="submit">Create Theme</Button>
                <Button variant="ghost" type="button" onClick={() => setThemeForm(false)}>Cancel</Button>
              </div>
            </form>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {themes.map(t => (
              <div key={t.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{t.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t.category}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {stats && !viewPage && !pageForm && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="card" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>Pages</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.pages || 0}</span>
              </div>
              <div className="card" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>Total Links</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.total_links || 0}</span>
              </div>
              <div className="card" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>Page Views</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{(stats.total_views || 0).toLocaleString()}</span>
              </div>
              <div className="card" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>Link Clicks</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{(stats.total_clicks || 0).toLocaleString()}</span>
              </div>
            </div>
          )}

          {pageForm && (
            <form onSubmit={handleSavePage} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '1.5rem', marginBottom: '1rem' }}>
              <h3 style={{ margin: '0 0 1rem 0' }}>{viewPage ? 'Edit Page Settings' : 'Create Link-in-Bio Page'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem' }}>Page Title *</label>
                  <input className="form-input" placeholder="e.g. John Doe" value={pageDraft.title} onChange={(e) => setPageDraft((d) => ({ ...d, title: e.target.value }))} required style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem' }}>Slug *</label>
                  <input className="form-input" placeholder="johndoe" value={pageDraft.slug} onChange={(e) => setPageDraft((d) => ({ ...d, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} required style={{ width: '100%' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem' }}>Avatar URL</label>
                  <input className="form-input" placeholder="https://..." value={pageDraft.avatarUrl} onChange={(e) => setPageDraft((d) => ({ ...d, avatarUrl: e.target.value }))} style={{ width: '100%' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem' }}>Bio</label>
                  <textarea className="form-input" placeholder="Brief description" value={pageDraft.bio} onChange={(e) => setPageDraft((d) => ({ ...d, bio: e.target.value }))} style={{ width: '100%', minHeight: 60 }} />
                </div>
              </div>
              <details style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--background)', borderRadius: 6 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>SEO & Meta Tags</summary>
                <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Meta Title</label>
                    <input className="form-input" value={pageDraft.metaTitle} onChange={(e) => setPageDraft((d) => ({ ...d, metaTitle: e.target.value }))} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Meta Description</label>
                    <textarea className="form-input" value={pageDraft.metaDescription} onChange={(e) => setPageDraft((d) => ({ ...d, metaDescription: e.target.value }))} style={{ width: '100%', minHeight: 50 }} />
                  </div>
                </div>
              </details>
              <details style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--background)', borderRadius: 6 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Design</summary>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Theme</label>
                    <select className="form-input" value={pageDraft.themeId || ''} onChange={(e) => applyTheme(parseInt(e.target.value))} style={{ width: '100%' }}>
                      <option value="">Custom</option>
                      {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Font</label>
                    <select className="form-input" value={pageDraft.fontFamily} onChange={(e) => setPageDraft((d) => ({ ...d, fontFamily: e.target.value }))} style={{ width: '100%' }}>
                      <option value="Inter">Inter</option>
                      <option value="Poppins">Poppins</option>
                      <option value="Roboto">Roboto</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Background</label>
                    <input type="color" value={pageDraft.bgColor} onChange={(e) => setPageDraft((d) => ({ ...d, bgColor: e.target.value }))} style={{ height: 36, width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Accent</label>
                    <input type="color" value={pageDraft.accentColor} onChange={(e) => setPageDraft((d) => ({ ...d, accentColor: e.target.value }))} style={{ height: 36, width: '100%' }} />
                  </div>
                </div>
              </details>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button type="submit">{viewPage ? 'Update' : 'Create'} Page</Button>
                <Button variant="ghost" type="button" onClick={() => setPageForm(false)}>Cancel</Button>
              </div>
            </form>
          )}

          {!loaded ? (
            <p>Loading...</p>
          ) : !viewPage ? (
            pages.length === 0 ? (
              <EmptyState title="No bio pages yet" description="Create your first link-in-bio page" action={<Button onClick={() => setPageForm(true)}>+ New Page</Button>} />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
                {pages.map((p) => (
                  <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem', cursor: 'pointer' }} onClick={() => { setViewPage(p); loadPageDetails(p.id); }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: p.accent_color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                          {p.title[0]}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700 }}>{p.title}</div>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {linkForm && (
                  <form onSubmit={handleSaveLink} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem' }}>
                    <h3 style={{ margin: '0 0 1rem 0' }}>{editingLink ? 'Edit Link' : 'Add Link'}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Icon</label>
                        <input className="form-input" value={linkDraft.icon} onChange={(e) => setLinkDraft((d) => ({ ...d, icon: e.target.value }))} style={{ textAlign: 'center', fontSize: '1.2rem', width: '100%' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Title *</label>
                        <input className="form-input" value={linkDraft.title} onChange={(e) => setLinkDraft((d) => ({ ...d, title: e.target.value }))} required style={{ width: '100%' }} />
                      </div>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem' }}>URL *</label>
                      <input className="form-input" placeholder="https://..." value={linkDraft.url} onChange={(e) => setLinkDraft((d) => ({ ...d, url: e.target.value }))} required style={{ width: '100%' }} />
                    </div>
                    <details style={{ marginBottom: '1rem' }}>
                      <summary style={{ cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>Advanced</summary>
                      <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.75rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Description</label>
                          <textarea className="form-input" value={linkDraft.description} onChange={(e) => setLinkDraft((d) => ({ ...d, description: e.target.value }))} style={{ width: '100%', minHeight: 50 }} />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={linkDraft.isPriority} onChange={(e) => setLinkDraft((d) => ({ ...d, isPriority: e.target.checked }))} />
                          <span style={{ fontSize: '0.875rem' }}>Priority Link</span>
                        </label>
                      </div>
                    </details>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button type="submit">{editingLink ? 'Update' : 'Add'} Link</Button>
                      <Button variant="ghost" type="button" onClick={() => { setLinkForm(false); setEditingLink(null); }}>Cancel</Button>
                    </div>
                  </form>
                )}
                {links.length === 0 ? (
                  <EmptyState title="No links yet" action={<Button onClick={() => { setLinkDraft({ title: '', url: '', icon: '🔗', thumbnailUrl: '', description: '', isPriority: false, scheduleStart: '', scheduleEnd: '', category: '', animation: 'none' }); setEditingLink(null); setLinkForm(true); }}>+ Add Link</Button>} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {links.map((link) => (
                      <div key={link.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>{link.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{link.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>{link.url}</div>
                        </div>
                        {link.is_priority && <span style={{ fontSize: '0.7rem', background: 'var(--primary)', color: '#fff', padding: '2px 6px', borderRadius: 4 }}>TOP</span>}
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{link.clicks || 0} clicks</span>
                        <button className="btn-ghost" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => { setEditingLink(link); setLinkDraft({ title: link.title, url: link.url, icon: link.icon, thumbnailUrl: link.thumbnail_url || '', description: link.description || '', isPriority: link.is_priority || false, scheduleStart: link.schedule_start || '', scheduleEnd: link.schedule_end || '', category: link.category || '', animation: link.animation || 'none' }); setLinkForm(true); }}>Edit</button>
                        <button className="btn-ghost" style={{ fontSize: '0.75rem', color: 'var(--danger)', padding: '4px 8px' }} onClick={() => setLinkConfirmDelete({ id: link.id })}>Del</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: viewPage.bg_color || '#ffffff', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '1rem' }}>LIVE PREVIEW</p>
                  {viewPage.avatar_url && <img src={viewPage.avatar_url} alt="" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', marginBottom: '0.5rem' }} />}
                  <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: viewPage.bg_color === '#ffffff' ? '#000' : '#fff' }}>{viewPage.title}</div>
                  {viewPage.bio && <div style={{ fontSize: '0.8rem', marginBottom: '1rem', color: viewPage.bg_color === '#ffffff' ? '#555' : 'rgba(255,255,255,0.8)' }}>{viewPage.bio}</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {links.slice(0, 5).map((link) => (
                      <div key={link.id} style={{ background: viewPage.accent_color || '#2563eb', color: '#fff', borderRadius: 8, padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <span>{link.icon}</span>{link.title}
                      </div>
                    ))}
                    {links.length > 5 && <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>+{links.length - 5} more</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Button variant="ghost" style={{ width: '100%', fontSize: '0.85rem' }} onClick={copyBioLink}>📋 Copy Link</Button>
                  <Button variant="ghost" style={{ width: '100%', fontSize: '0.85rem' }} onClick={() => window.open(`/bio/${viewPage.slug}`, '_blank')}>👁️ View Public</Button>
                  <button className="btn-ghost" style={{ width: '100%', fontSize: '0.8rem', color: 'var(--danger)', border: '1px dashed var(--danger-border)', padding: '8px', borderRadius: 6 }} onClick={() => setPageConfirmDelete({ id: viewPage.id })}>Delete Page</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog isOpen={!!pageConfirmDelete} onClose={() => setPageConfirmDelete(null)} onConfirm={confirmPageDelete} title="Delete this page?" description="This will permanently delete this page and all links." confirmLabel="Delete" danger loading={pageDeleting} />
      <ConfirmDialog isOpen={!!linkConfirmDelete} onClose={() => setLinkConfirmDelete(null)} onConfirm={confirmLinkDelete} title="Delete this link?" description="This will remove this link from your page." confirmLabel="Delete" danger loading={linkDeleting} />
    </div>
  );
}
