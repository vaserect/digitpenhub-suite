'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import SearchInput from '../ui/SearchInput';
import Modal from '../ui/Modal';
import { SkeletonRows } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import ConfirmDialog from '../ui/ConfirmDialog';

function createBlankEmailCampaign() {
  return { subject: '', previewText: '', bodyHtml: '', listId: '' };
}

export default function EmailMarketingModule({ goHome, showToast }) {
  const [emailLists, setEmailLists] = useState([]);
  const [emailCampaigns, setEmailCampaigns] = useState([]);
  const [emailStats, setEmailStats] = useState(null);
  const [emailLoaded, setEmailLoaded] = useState(false);
  const [emailConfirmAction, setEmailConfirmAction] = useState(null);
  const [emailConfirming, setEmailConfirming] = useState(false);
  const [emailTab, setEmailTab] = useState('lists');
  const [showEmailListForm, setShowEmailListForm] = useState(false);
  const [newEmailList, setNewEmailList] = useState({ name: '', description: '' });
  const [selectedListId, setSelectedListId] = useState(null);
  const [listSubscribers, setListSubscribers] = useState([]);
  const [subscribersLoaded, setSubscribersLoaded] = useState(false);
  const [showAddSubscriberForm, setShowAddSubscriberForm] = useState(false);
  const [newSubscriber, setNewSubscriber] = useState({ email: '', name: '' });
  const [showImportForm, setShowImportForm] = useState(false);
  const [importCsv, setImportCsv] = useState('');
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [emailTplGalleryOpen, setEmailTplGalleryOpen] = useState(false);
  const [emailTplList, setEmailTplList] = useState([]);
  const [emailTplCategories, setEmailTplCategories] = useState([]);
  const [emailTplCategoryFilter, setEmailTplCategoryFilter] = useState('');
  const [emailTplSearch, setEmailTplSearch] = useState('');
  const [emailTplLoading, setEmailTplLoading] = useState(false);
  const [newCampaign, setNewCampaign] = useState(createBlankEmailCampaign());
  const [editingCampaignId, setEditingCampaignId] = useState(null);
  const [editCampaignDraft, setEditCampaignDraft] = useState({ subject: '', previewText: '', bodyHtml: '', listId: '' });
  const [emailFormError, setEmailFormError] = useState('');
  const [sendingCampaignId, setSendingCampaignId] = useState(null);

  async function loadEmail() {
    try {
      const [listsRes, campaignsRes, statsRes] = await Promise.all([
        apiFetch('/api/v1/email/lists'),
        apiFetch('/api/v1/email/campaigns'),
        apiFetch('/api/v1/email/stats'),
      ]);
      setEmailLists(listsRes.lists || []);
      setEmailCampaigns(campaignsRes.campaigns || []);
      setEmailStats(statsRes);
      setEmailLoaded(true);
    } catch (err) {
      setEmailLoaded(true);
      showToast('Unable to load email marketing data.');
    }
  }

  async function loadListSubscribers(listId) {
    setSubscribersLoaded(false);
    try {
      const data = await apiFetch(`/api/v1/email/lists/${listId}/subscribers`);
      setListSubscribers(data.subscribers || []);
    } finally {
      setSubscribersLoaded(true);
    }
  }

  async function handleCreateEmailList(e) {
    e.preventDefault();
    setEmailFormError('');
    if (!newEmailList.name.trim()) return;
    try {
      await apiFetch('/api/v1/email/lists', {
        method: 'POST',
        body: JSON.stringify({ name: newEmailList.name, description: newEmailList.description }),
      });
      setNewEmailList({ name: '', description: '' });
      setShowEmailListForm(false);
      await loadEmail();
    } catch (err) {
      setEmailFormError(err.message || 'Unable to create list.');
    }
  }

  function handleDeleteEmailList(id) { setEmailConfirmAction({ type: 'list', id }); }

  function openSubscriberList(listId) {
    setSelectedListId(listId);
    loadListSubscribers(listId);
  }

  async function handleAddSubscriber(e) {
    e.preventDefault();
    setEmailFormError('');
    if (!newSubscriber.email.trim()) return;
    try {
      await apiFetch(`/api/v1/email/lists/${selectedListId}/subscribers`, {
        method: 'POST',
        body: JSON.stringify({ email: newSubscriber.email, name: newSubscriber.name }),
      });
      setNewSubscriber({ email: '', name: '' });
      setShowAddSubscriberForm(false);
      await loadListSubscribers(selectedListId);
      await loadEmail();
    } catch (err) {
      setEmailFormError(err.message || 'Unable to add subscriber.');
    }
  }

  async function handleImportSubscribers(e) {
    e.preventDefault();
    setEmailFormError('');
    if (!importCsv.trim()) return;
    try {
      const data = await apiFetch(`/api/v1/email/lists/${selectedListId}/subscribers/import`, {
        method: 'POST',
        body: JSON.stringify({ csv: importCsv }),
      });
      showToast(`${data.imported} subscriber${data.imported !== 1 ? 's' : ''} imported.`);
      setImportCsv('');
      setShowImportForm(false);
      await loadListSubscribers(selectedListId);
      await loadEmail();
    } catch (err) {
      setEmailFormError(err.message || 'Import failed.');
    }
  }

  function handleRemoveSubscriber(listId, id) { setEmailConfirmAction({ type: 'subscriber', id, listId }); }

  async function handleCreateCampaign(e) {
    e.preventDefault();
    setEmailFormError('');
    if (!newCampaign.subject.trim()) { setEmailFormError('Subject is required.'); return; }
    try {
      await apiFetch('/api/v1/email/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          subject: newCampaign.subject,
          previewText: newCampaign.previewText,
          bodyHtml: newCampaign.bodyHtml,
          listId: newCampaign.listId || null,
        }),
      });
      setNewCampaign(createBlankEmailCampaign());
      setShowCampaignForm(false);
      await loadEmail();
    } catch (err) {
      setEmailFormError(err.message || 'Unable to create campaign.');
    }
  }

  function startEditCampaign(campaign) {
    setEditingCampaignId(campaign.id);
    setEditCampaignDraft({
      subject: campaign.subject || '',
      previewText: campaign.preview_text || '',
      bodyHtml: campaign.body_html || '',
      listId: campaign.list_id || '',
    });
  }

  async function handleSaveCampaign(e) {
    e.preventDefault();
    setEmailFormError('');
    if (!editCampaignDraft.subject.trim()) { setEmailFormError('Subject is required.'); return; }
    try {
      await apiFetch(`/api/v1/email/campaigns/${editingCampaignId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          subject: editCampaignDraft.subject,
          previewText: editCampaignDraft.previewText,
          bodyHtml: editCampaignDraft.bodyHtml,
          listId: editCampaignDraft.listId || null,
        }),
      });
      setEditingCampaignId(null);
      await loadEmail();
    } catch (err) {
      setEmailFormError(err.message || 'Unable to save campaign.');
    }
  }

  function handleDeleteCampaign(id) { setEmailConfirmAction({ type: 'campaign', id }); }

  function handleSendCampaign(id) { setEmailConfirmAction({ type: 'send', id }); }

  async function confirmEmailAction() {
    if (!emailConfirmAction) return;
    const { type, id, listId } = emailConfirmAction;
    setEmailConfirming(true);
    try {
      if (type === 'list') {
        await apiFetch(`/api/v1/email/lists/${id}`, { method: 'DELETE' });
        if (selectedListId === id) setSelectedListId(null);
        await loadEmail();
      } else if (type === 'subscriber') {
        await apiFetch(`/api/v1/email/lists/${listId}/subscribers/${id}`, { method: 'DELETE' });
        await loadListSubscribers(listId);
        await loadEmail();
      } else if (type === 'campaign') {
        await apiFetch(`/api/v1/email/campaigns/${id}`, { method: 'DELETE' });
        await loadEmail();
      } else if (type === 'send') {
        setSendingCampaignId(id);
        try {
          const data = await apiFetch(`/api/v1/email/campaigns/${id}/send`, { method: 'POST' });
          showToast(`Campaign sent to ${data.sent} subscriber${data.sent !== 1 ? 's' : ''}.`);
          await loadEmail();
        } catch (err) {
          showToast(err.message || 'Unable to send campaign.');
        } finally {
          setSendingCampaignId(null);
        }
      }
    } finally { setEmailConfirming(false); setEmailConfirmAction(null); }
  }

  function startBlankEmailCampaign() {
    setEditingCampaignId(null);
    setNewCampaign(createBlankEmailCampaign());
    setEmailFormError('');
    setShowCampaignForm(true);
  }

  function toggleBlankEmailCampaign() {
    if (showCampaignForm) {
      setShowCampaignForm(false);
      return;
    }
    startBlankEmailCampaign();
  }

  async function openEmailTemplateGallery() {
    setEmailTplGalleryOpen(true);
    setEmailTplLoading(true);
    try {
      const [catRes, listRes] = await Promise.all([
        apiFetch('/api/v1/email-templates/categories'),
        apiFetch('/api/v1/email-templates'),
      ]);
      setEmailTplCategories(catRes.categories || []);
      setEmailTplList(listRes.templates || []);
    } finally { setEmailTplLoading(false); }
  }

  async function reloadEmailTemplateList(overrides = {}) {
    setEmailTplLoading(true);
    try {
      const params = new URLSearchParams();
      const category = overrides.category !== undefined ? overrides.category : emailTplCategoryFilter;
      const q = overrides.q !== undefined ? overrides.q : emailTplSearch;
      if (category) params.set('category', category);
      if (q.trim()) params.set('q', q.trim());
      const data = await apiFetch(`/api/v1/email-templates?${params.toString()}`);
      setEmailTplList(data.templates || []);
    } finally { setEmailTplLoading(false); }
  }

  async function useEmailTemplate(id) {
    let data;
    try {
      data = await apiFetch(`/api/v1/email-templates/${id}`);
    } catch (err) {
      showToast(err.message || 'Unable to load that template.');
      return;
    }
    const t = data.template;
    setEditingCampaignId(null);
    setEmailFormError('');
    setNewCampaign({ subject: t.subject, previewText: t.preview_text || '', bodyHtml: t.body_html, listId: '' });
    setEmailTplGalleryOpen(false);
    setShowCampaignForm(true);
    showToast('Template applied — customize it below before sending.');
  }

  function renderEmailTemplateGallery() {
    if (!emailTplGalleryOpen) return null;
    return (
      <Modal isOpen wide title="Choose an email template" description="Pick a starting point — every field stays editable after you apply it." onClose={() => setEmailTplGalleryOpen(false)}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 220px' }}>
            <SearchInput
              value={emailTplSearch}
              onChange={(e) => setEmailTplSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') reloadEmailTemplateList(); }}
              placeholder="Search templates…"
            />
          </div>
          <select
            className="toolbar-select"
            value={emailTplCategoryFilter}
            onChange={(e) => { setEmailTplCategoryFilter(e.target.value); reloadEmailTemplateList({ category: e.target.value }); }}
          >
            <option value="">All categories ({emailTplCategories.reduce((s, c) => s + Number(c.count), 0)})</option>
            {emailTplCategories.map((c) => <option key={c.category} value={c.category}>{c.category} ({c.count})</option>)}
          </select>
          <Button variant="secondary" size="sm" onClick={() => reloadEmailTemplateList()}>Search</Button>
        </div>
        {emailTplLoading ? (
          <SkeletonRows rows={4} />
        ) : emailTplList.length === 0 ? (
          <EmptyState icon="✉️" title="No templates match" description="Try a different search term or category." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, maxHeight: '55vh', overflowY: 'auto', padding: 2 }}>
            {emailTplList.map((t) => (
              <div key={t.id} className="card-shell" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Badge variant="neutral">{t.category}</Badge>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.description}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 6 }}>&quot;{t.subject}&quot;</div>
                <Button size="sm" onClick={() => useEmailTemplate(t.id)}>Use this template</Button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    );
  }

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <div>
          <h1>Email Marketing</h1>
          <p className="module-sub">Manage subscriber lists, build campaigns, and send to your audience.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {emailTab === 'lists' && !selectedListId && (
            <button className="primary-btn" onClick={() => setShowEmailListForm((v) => !v)}>+ New list</button>
          )}
          {emailTab === 'lists' && selectedListId && (
            <>
              <button className="primary-btn" onClick={() => setShowAddSubscriberForm((v) => !v)}>+ Add subscriber</button>
              <button className="primary-btn" onClick={() => setShowImportForm((v) => !v)}>Import CSV</button>
            </>
          )}
          {emailTab === 'campaigns' && (
            <>
              <Button variant="secondary" onClick={openEmailTemplateGallery}>Choose a template</Button>
              <Button onClick={toggleBlankEmailCampaign}>{showCampaignForm ? 'Cancel' : 'Start from scratch'}</Button>
            </>
          )}
        </div>
      </div>

      {emailStats && (
        <div className="stage-strip">
          <div className="stage-card"><div className="num">{emailStats.lists}</div><div className="lbl">Lists</div></div>
          <div className="stage-card"><div className="num">{emailStats.subscribers?.active ?? 0}</div><div className="lbl">Subscribers</div></div>
          <div className="stage-card"><div className="num">{emailStats.campaigns?.sent ?? 0}</div><div className="lbl">Sent</div></div>
          <div className="stage-card"><div className="num">{emailStats.campaigns?.total ?? 0}</div><div className="lbl">Campaigns</div></div>
        </div>
      )}

      <div className="invoice-tabs" style={{ marginBottom: 20 }}>
        {[{ key: 'lists', label: 'Lists & subscribers' }, { key: 'campaigns', label: 'Campaigns' }].map((t) => (
          <button key={t.key} type="button"
            className={`invoice-tab${emailTab === t.key ? ' active' : ''}`}
            onClick={() => { setEmailTab(t.key); setSelectedListId(null); setShowEmailListForm(false); setShowCampaignForm(false); setEmailFormError(''); }}>
            {t.label}
          </button>
        ))}
      </div>

      {emailFormError && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(220,38,38,.1)', color: 'var(--danger)', border: '1px solid rgba(220,38,38,.2)', marginBottom: 14, fontSize: 13 }}>{emailFormError}</div>
      )}

      {/* ── Lists tab ── */}
      {emailTab === 'lists' && !selectedListId && (
        <>
          {showEmailListForm && (
            <form onSubmit={handleCreateEmailList} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18, alignItems: 'flex-end' }}>
              <div className="field" style={{ marginBottom: 0, flex: '1 1 180px' }}>
                <label>List name</label>
                <input value={newEmailList.name} onChange={(e) => setNewEmailList({ ...newEmailList, name: e.target.value })} required autoFocus />
              </div>
              <div className="field" style={{ marginBottom: 0, flex: '2 1 260px' }}>
                <label>Description (optional)</label>
                <input value={newEmailList.description} onChange={(e) => setNewEmailList({ ...newEmailList, description: e.target.value })} />
              </div>
              <button className="primary-btn" type="submit">Create list</button>
            </form>
          )}

          {!emailLoaded ? (
            <div className="empty-note">Loading lists…</div>
          ) : emailLists.length === 0 ? (
            <div className="empty-note">No subscriber lists yet — create your first one above.</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {emailLists.map((list) => (
                <div key={list.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14.5 }}>{list.name}</div>
                    {list.description && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>{list.description}</div>}
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      <strong style={{ color: 'var(--primary)' }}>{list.subscriber_count}</strong> subscribers
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="ctag" onClick={() => openSubscriberList(list.id)}>View subscribers</button>
                    <button className="ctag" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteEmailList(list.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Subscribers for a selected list ── */}
      {emailTab === 'lists' && selectedListId && (() => {
        const list = emailLists.find((l) => l.id === selectedListId);
        return (
          <>
            <div style={{ marginBottom: 14 }}>
              <button className="back-link" style={{ marginBottom: 6 }} onClick={() => { setSelectedListId(null); setShowAddSubscriberForm(false); setShowImportForm(false); }}>
                ← All lists
              </button>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{list?.name}</h2>
            </div>

            {showAddSubscriberForm && (
              <form onSubmit={handleAddSubscriber} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14, alignItems: 'flex-end' }}>
                <div className="field" style={{ marginBottom: 0, flex: '1 1 200px' }}>
                  <label>Email address</label>
                  <input type="email" value={newSubscriber.email} onChange={(e) => setNewSubscriber({ ...newSubscriber, email: e.target.value })} required autoFocus />
                </div>
                <div className="field" style={{ marginBottom: 0, flex: '1 1 160px' }}>
                  <label>Name (optional)</label>
                  <input value={newSubscriber.name} onChange={(e) => setNewSubscriber({ ...newSubscriber, name: e.target.value })} />
                </div>
                <button className="primary-btn" type="submit">Add</button>
              </form>
            )}

            {showImportForm && (
              <form onSubmit={handleImportSubscribers} style={{ marginBottom: 14 }}>
                <div className="field" style={{ marginBottom: 10 }}>
                  <label>Paste CSV — one row per line: <em>email</em> or <em>email, name</em></label>
                  <textarea
                    value={importCsv}
                    onChange={(e) => setImportCsv(e.target.value)}
                    rows={6}
                    placeholder={'alice@example.com, Alice\nbob@example.com'}
                    style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--text)', fontSize: 13, resize: 'vertical', fontFamily: 'monospace' }}
                    autoFocus
                  />
                </div>
                <button className="primary-btn" type="submit">Import</button>
              </form>
            )}

            {!subscribersLoaded ? (
              <div className="empty-note">Loading subscribers…</div>
            ) : listSubscribers.length === 0 ? (
              <div className="empty-note">No subscribers yet — add one or import a CSV.</div>
            ) : (
              <table className="contacts">
                <thead><tr><th>Email</th><th>Name</th><th>Status</th><th>Subscribed</th><th>Actions</th></tr></thead>
                <tbody>
                  {listSubscribers.map((sub) => (
                    <tr key={sub.id}>
                      <td>{sub.email}</td>
                      <td>{sub.name || '—'}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 700,
                          color: sub.status === 'subscribed' ? 'var(--success)' : 'var(--text-muted)',
                          background: sub.status === 'subscribed' ? 'rgba(22,163,74,.1)' : 'var(--surface-muted)' }}>
                          {sub.status === 'subscribed' ? 'Active' : 'Unsubscribed'}
                        </span>
                      </td>
                      <td>{new Date(sub.subscribed_at).toLocaleDateString()}</td>
                      <td><button className="ctag" style={{ color: 'var(--danger)' }} onClick={() => handleRemoveSubscriber(selectedListId, sub.id)}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        );
      })()}

      {/* ── Campaigns tab ── */}
      {emailTab === 'campaigns' && (
        <>
          {showCampaignForm && (
            <form onSubmit={handleCreateCampaign} style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 18 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Subject line</label>
                <input value={newCampaign.subject} onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })} required autoFocus />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Preview text</label>
                <input value={newCampaign.previewText} onChange={(e) => setNewCampaign({ ...newCampaign, previewText: e.target.value })} />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Subscriber list</label>
                <select value={newCampaign.listId} onChange={(e) => setNewCampaign({ ...newCampaign, listId: e.target.value })}>
                  <option value="">No list (save as draft)</option>
                  {emailLists.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.subscriber_count} subscribers)</option>)}
                </select>
              </div>
              <div className="field" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                <label>Email body (HTML)</label>
                <textarea
                  value={newCampaign.bodyHtml}
                  onChange={(e) => setNewCampaign({ ...newCampaign, bodyHtml: e.target.value })}
                  rows={10}
                  placeholder={'<h1>Hello {{name}}</h1>\n<p>Your message here...</p>'}
                  style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--text)', fontSize: 13, resize: 'vertical', fontFamily: 'monospace' }}
                />
              </div>
              <button className="primary-btn" type="submit" style={{ alignSelf: 'end' }}>Save draft</button>
            </form>
          )}

          {!emailLoaded ? (
            <div className="empty-note">Loading campaigns…</div>
          ) : emailCampaigns.length === 0 ? (
            <EmptyState
              icon="✉️"
              title="No campaigns yet"
              description="Start from a blank draft or use one of the ready-made email templates."
              action={(
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button onClick={startBlankEmailCampaign}>Start from scratch</Button>
                  <Button variant="secondary" onClick={openEmailTemplateGallery}>Choose a template</Button>
                </div>
              )}
            />
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {emailCampaigns.map((campaign) => (
                <div key={campaign.id} className="card">
                  {editingCampaignId === campaign.id ? (
                    <form onSubmit={handleSaveCampaign} style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                      <div className="field" style={{ marginBottom: 0 }}>
                        <label>Subject</label>
                        <input value={editCampaignDraft.subject} onChange={(e) => setEditCampaignDraft({ ...editCampaignDraft, subject: e.target.value })} required autoFocus />
                      </div>
                      <div className="field" style={{ marginBottom: 0 }}>
                        <label>Preview text</label>
                        <input value={editCampaignDraft.previewText} onChange={(e) => setEditCampaignDraft({ ...editCampaignDraft, previewText: e.target.value })} />
                      </div>
                      <div className="field" style={{ marginBottom: 0 }}>
                        <label>Subscriber list</label>
                        <select value={editCampaignDraft.listId} onChange={(e) => setEditCampaignDraft({ ...editCampaignDraft, listId: e.target.value })}>
                          <option value="">No list</option>
                          {emailLists.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.subscriber_count} subscribers)</option>)}
                        </select>
                      </div>
                      <div className="field" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                        <label>Email body (HTML)</label>
                        <textarea
                          value={editCampaignDraft.bodyHtml}
                          onChange={(e) => setEditCampaignDraft({ ...editCampaignDraft, bodyHtml: e.target.value })}
                          rows={10}
                          style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--text)', fontSize: 13, resize: 'vertical', fontFamily: 'monospace' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 8, gridColumn: '1 / -1' }}>
                        <button className="primary-btn" type="submit">Save</button>
                        <button type="button" className="back-link" style={{ margin: 0 }} onClick={() => setEditingCampaignId(null)}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 4 }}>{campaign.subject}</div>
                        {campaign.preview_text && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 6 }}>{campaign.preview_text}</div>}
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)' }}>
                          {campaign.list_name && <span>List: <strong style={{ color: 'var(--text)' }}>{campaign.list_name}</strong> ({campaign.recipient_count} subscribers)</span>}
                          {campaign.status === 'sent' && campaign.sent_at && <span>Sent {new Date(campaign.sent_at).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flex: 'none' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700,
                          color: campaign.status === 'sent' ? 'var(--success)' : 'var(--text-muted)',
                          background: campaign.status === 'sent' ? 'rgba(22,163,74,.1)' : 'var(--surface-muted)' }}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </span>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {campaign.status !== 'sent' && (
                            <>
                              <button className="ctag" onClick={() => startEditCampaign(campaign)}>Edit</button>
                              <button
                                className="ctag"
                                style={{ color: 'var(--primary)', fontWeight: 700 }}
                                onClick={() => handleSendCampaign(campaign.id)}
                                disabled={sendingCampaignId === campaign.id}
                              >
                                {sendingCampaignId === campaign.id ? 'Sending…' : '→ Send now'}
                              </button>
                            </>
                          )}
                          <button className="ctag" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteCampaign(campaign.id)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <ConfirmDialog
        isOpen={!!emailConfirmAction}
        onClose={() => setEmailConfirmAction(null)}
        onConfirm={confirmEmailAction}
        title={
          emailConfirmAction?.type === 'list' ? 'Delete this list and all its subscribers?' :
          emailConfirmAction?.type === 'subscriber' ? 'Remove this subscriber?' :
          emailConfirmAction?.type === 'campaign' ? 'Delete this campaign?' :
          'Send this campaign now?'
        }
        description={emailConfirmAction?.type === 'send' ? 'It will be sent to all subscribed contacts in its list immediately.' : "This can't be undone."}
        confirmLabel={emailConfirmAction?.type === 'send' ? 'Send' : 'Delete'}
        danger={emailConfirmAction?.type !== 'send'}
        loading={emailConfirming}
      />
      {renderEmailTemplateGallery()}
    </div>
  );
}
