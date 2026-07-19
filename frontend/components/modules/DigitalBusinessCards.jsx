'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import EmptyState from '../ui/EmptyState';

export default function DigitalBusinessCardsModule({ goHome, showToast }) {
  const [activeTab, setActiveTab] = useState('cards'); // 'cards', 'leads', 'templates'
  const [loaded, setLoaded] = useState(false);
  const [cards, setCards] = useState([]);
  const [stats, setStats] = useState(null);
  const [viewCard, setViewCard] = useState(null);
  
  // Card Details sub-states
  const [sections, setSections] = useState([]);
  const [links, setLinks] = useState([]);
  const [cardAnalytics, setCardAnalytics] = useState(null);

  // Form states
  const [cardForm, setCardForm] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [cardDraft, setCardDraft] = useState({
    name: '', title: '', company: '', department: '', email: '', phone: '', mobile: '',
    website: '', linkedin: '', twitter: '', facebook: '', instagram: '', address: '',
    bio: '', tagline: '', slug: '', theme: 'modern', primary_color: '#2563eb',
    layout_style: 'standard', avatar_url: '', cover_image_url: '', logo_url: ''
  });

  // Section/Link creator states
  const [sectionForm, setSectionForm] = useState(false);
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionIcon, setSectionIcon] = useState('📁');
  
  const [linkForm, setLinkForm] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [linkDraft, setLinkDraft] = useState({
    title: '', url: '', description: '', icon: '🔗', section_id: '', sort_order: 0
  });

  // Leads list
  const [leads, setLeads] = useState([]);
  const [leadSearch, setLeadSearch] = useState('');

  // Dialog/Delete states
  const [cardConfirmDelete, setCardConfirmDelete] = useState(null);
  const [cardDeleting, setCardDeleting] = useState(false);
  const [linkConfirmDelete, setLinkConfirmDelete] = useState(null);
  const [linkDeleting, setLinkDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, cardsRes, leadsRes] = await Promise.all([
        apiFetch('/api/v1/biz-cards/stats'),
        apiFetch('/api/v1/biz-cards/'),
        apiFetch('/api/v1/biz-cards/contacts/list')
      ]);
      setStats(statsRes.stats);
      setCards(cardsRes.cards || []);
      setLeads(leadsRes.contacts || []);
      setLoaded(true);
    } catch (err) {
      console.error(err);
      setLoaded(true);
    }
  }, []);

  const loadCardDetails = useCallback(async (cardId) => {
    try {
      const [detailsRes, analyticsRes] = await Promise.all([
        apiFetch(`/api/v1/biz-cards/${cardId}`),
        apiFetch(`/api/v1/biz-cards/${cardId}/analytics`)
      ]);
      setSections(detailsRes.sections || []);
      setLinks(detailsRes.links || []);
      setCardAnalytics(analyticsRes || null);
    } catch (err) {
      console.error('Failed to load card details:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSelectCard(card) {
    setViewCard(card);
    await loadCardDetails(card.id);
  }

  async function handleSaveCard(e) {
    e.preventDefault();
    if (!cardDraft.name.trim()) {
      showToast('Name is required.');
      return;
    }
    const method = editingCard ? 'PUT' : 'POST';
    const url = editingCard ? `/api/v1/biz-cards/${editingCard.id}` : '/api/v1/biz-cards/';
    const data = await apiFetch(url, { method, body: JSON.stringify(cardDraft) });
    if (data.error) {
      showToast(data.error);
      return;
    }
    setCardForm(false);
    setEditingCard(null);
    showToast(editingCard ? 'Business card updated.' : 'Business card created.');
    await loadData();
    if (!editingCard) {
      setViewCard(data.card);
      await loadCardDetails(data.card.id);
    } else {
      setViewCard(data.card);
    }
  }

  async function confirmCardDelete() {
    if (!cardConfirmDelete) return;
    setCardDeleting(true);
    try {
      await apiFetch(`/api/v1/biz-cards/${cardConfirmDelete.id}`, { method: 'DELETE' });
      setCards((c) => c.filter((x) => x.id !== cardConfirmDelete.id));
      setViewCard(null);
      showToast('Card deleted.');
      await loadData();
    } catch {
      showToast('Failed to delete card.');
    } finally {
      setCardDeleting(false);
      setCardConfirmDelete(null);
    }
  }

  async function handleAddSection(e) {
    e.preventDefault();
    if (!viewCard || !sectionTitle.trim()) return;

    try {
      const data = await apiFetch(`/api/v1/biz-cards/${viewCard.id}/sections`, {
        method: 'POST',
        body: JSON.stringify({
          title: sectionTitle.trim(),
          section_type: 'custom',
          icon: sectionIcon,
          sort_order: sections.length
        })
      });
      if (data.error) {
        showToast(data.error);
      } else {
        showToast('Section added.');
        setSectionTitle('');
        setSectionForm(false);
        await loadCardDetails(viewCard.id);
      }
    } catch (err) {
      showToast('Failed to add section.');
    }
  }

  async function handleSaveLink(e) {
    e.preventDefault();
    if (!viewCard || !linkDraft.title.trim() || !linkDraft.url.trim() || !linkDraft.section_id) {
      showToast('Title, URL, and Section are required.');
      return;
    }

    try {
      const method = editingLink ? 'PUT' : 'POST';
      const url = editingLink ? `/api/v1/biz-cards/links/${editingLink.id}` : `/api/v1/biz-cards/${viewCard.id}/links`;
      const data = await apiFetch(url, { method, body: JSON.stringify(linkDraft) });
      
      if (data.error) {
        showToast(data.error);
      } else {
        showToast(editingLink ? 'Link updated.' : 'Link added.');
        setLinkForm(false);
        setEditingLink(null);
        await loadCardDetails(viewCard.id);
      }
    } catch (err) {
      showToast('Failed to save link.');
    }
  }

  async function confirmLinkDelete() {
    if (!linkConfirmDelete) return;
    setLinkDeleting(true);
    try {
      await apiFetch(`/api/v1/biz-cards/links/${linkConfirmDelete.id}`, { method: 'DELETE' });
      showToast('Link removed.');
      await loadCardDetails(viewCard.id);
    } catch {
      showToast('Failed to remove link.');
    } finally {
      setLinkDeleting(false);
      setLinkConfirmDelete(null);
    }
  }

  function copyCardLink(card) {
    const cardUrl = `${window.location.origin}/card/${card.slug || card.id}`;
    navigator.clipboard.writeText(cardUrl);
    showToast('Link copied to clipboard!');
  }

  function downloadVCard(card) {
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${card.name}\nTITLE:${card.title || ''}\nORG:${card.company || ''}\nEMAIL:${card.email || ''}\nTEL:${card.phone || ''}\nURL:${card.website || ''}\nADR:;;${card.address || ''};;;;\nNOTE:${card.bio || ''}\nEND:VCARD`;
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${card.name.replace(/\s+/g, '-')}.vcf`;
    a.click();
    showToast('vCard downloaded.');
  }

  function exportLeadsCSV() {
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Source', 'Notes', 'Date'];
    const rows = leads.map(l => [
      l.name || '',
      l.email || '',
      l.phone || '',
      l.company || '',
      l.source || '',
      l.notes || '',
      new Date(l.created_at).toLocaleDateString()
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "digital_card_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filteredLeads = leads.filter(l => 
    (l.name && l.name.toLowerCase().includes(leadSearch.toLowerCase())) ||
    (l.email && l.email.toLowerCase().includes(leadSearch.toLowerCase())) ||
    (l.company && l.company.toLowerCase().includes(leadSearch.toLowerCase()))
  );

  return (
    <div className="panel" style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <button className="back-link" onClick={() => viewCard ? setViewCard(null) : goHome()} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', fontWeight: 500, fontSize: '0.875rem', padding: 0, marginBottom: '0.5rem' }}>
            ← {viewCard ? 'Back to Cards' : 'Back to Workspace'}
          </button>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)' }}>
            {viewCard ? viewCard.name : 'Digital Business Cards'}
          </h1>
          {!viewCard && (
            <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.875rem' }}>
              Create stunning, modern digital business cards, track scan analytics, and capture visitor leads.
            </p>
          )}
        </div>

        {!viewCard && !cardForm && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant={activeTab === 'cards' ? 'primary' : 'ghost'} onClick={() => setActiveTab('cards')}>Cards</Button>
            <Button variant={activeTab === 'leads' ? 'primary' : 'ghost'} onClick={() => setActiveTab('leads')}>Leads</Button>
            <Button onClick={() => { setEditingCard(null); setCardDraft({ name: '', title: '', company: '', department: '', email: '', phone: '', mobile: '', website: '', linkedin: '', twitter: '', facebook: '', instagram: '', address: '', bio: '', tagline: '', slug: '', theme: 'modern', primary_color: '#2563eb', layout_style: 'standard', avatar_url: '', cover_image_url: '', logo_url: '' }); setCardForm(true); }}>
              + New Card
            </Button>
          </div>
        )}

        {viewCard && !cardForm && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="ghost" onClick={() => { setEditingCard(viewCard); setCardDraft({ name: viewCard.name, title: viewCard.title || '', company: viewCard.company || '', department: viewCard.department || '', email: viewCard.email || '', phone: viewCard.phone || '', mobile: viewCard.mobile || '', website: viewCard.website || '', linkedin: viewCard.linkedin || '', twitter: viewCard.twitter || '', facebook: viewCard.facebook || '', instagram: viewCard.instagram || '', address: viewCard.address || '', bio: viewCard.bio || '', tagline: viewCard.tagline || '', slug: viewCard.slug || '', theme: viewCard.theme || 'modern', primary_color: viewCard.primary_color || '#2563eb', layout_style: viewCard.layout_style || 'standard', avatar_url: viewCard.avatar_url || '', cover_image_url: viewCard.cover_image_url || '', logo_url: viewCard.logo_url || '' }); setCardForm(true); }}>
              ⚙️ Settings
            </Button>
            <Button variant="ghost" onClick={() => downloadVCard(viewCard)}>
              ⬇️ vCard
            </Button>
            <Button variant="ghost" style={{ color: 'var(--danger)' }} onClick={() => setCardConfirmDelete(viewCard)}>
              Delete Card
            </Button>
          </div>
        )}
      </div>

      {/* Main Tabs */}
      {!viewCard && !cardForm && (
        <>
          {/* Stats Bar */}
          {stats && activeTab === 'cards' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="card" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>Cards</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.total_cards || 0}</span>
              </div>
              <div className="card" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>Active</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{stats.active_cards || 0}</span>
              </div>
              <div className="card" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>Total Views</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{(stats.total_views || 0).toLocaleString()}</span>
              </div>
              <div className="card" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>VCF Saves</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)' }}>{(stats.total_downloads || 0).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Cards Tab */}
          {activeTab === 'cards' && (
            cards.length === 0 ? (
              <EmptyState title="No digital business cards yet" action={<Button onClick={() => setCardForm(true)}>+ Create Card</Button>} />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {cards.map((c) => (
                  <div key={c.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => handleSelectCard(c)}>
                    <div style={{ background: c.primary_color || '#2563eb', padding: '1.5rem 1rem', color: '#ffffff', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)' }} />
                      ) : (
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700 }}>{c.name[0]}</div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{c.name}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>{c.title || 'No Title'}</div>
                      </div>
                    </div>
                    <div style={{ padding: '1rem', fontSize: '0.8rem', flex: 1, display: 'flex', flexDirection: 'column', justify: 'space-between' }}>
                      <div style={{ color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }}>
                        {c.company && <span>🏢 {c.company}</span>}
                        {c.email && <span>✉️ {c.email}</span>}
                        {c.phone && <span>📞 {c.phone}</span>}
                        <span>🔗 /card/{c.slug || c.id.substring(0, 8)}</span>
                      </div>
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)' }} onClick={e => e.stopPropagation()}>
                        <span>{c.total_views || 0} views</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-ghost" style={{ padding: '2px 6px', fontSize: '0.7rem' }} onClick={() => copyCardLink(c)}>Copy Link</button>
                          <button className="btn-ghost" style={{ padding: '2px 6px', fontSize: '0.7rem' }} onClick={() => window.open(`/card/${c.slug || c.id}`, '_blank')}>Open</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Leads Tab */}
          {activeTab === 'leads' && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem' }}>
                <input className="form-input" placeholder="Search contacts..." value={leadSearch} onChange={e => setLeadSearch(e.target.value)} style={{ maxWidth: 300, width: '100%' }} />
                <Button variant="ghost" onClick={exportLeadsCSV}>📤 Export CSV</Button>
              </div>

              {filteredLeads.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem 0' }}>No leads or contacts captured yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--muted)', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem' }}>Name</th>
                        <th style={{ padding: '0.75rem' }}>Email</th>
                        <th style={{ padding: '0.75rem' }}>Phone</th>
                        <th style={{ padding: '0.75rem' }}>Company</th>
                        <th style={{ padding: '0.75rem' }}>Card Name</th>
                        <th style={{ padding: '0.75rem' }}>Notes</th>
                        <th style={{ padding: '0.75rem' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map(l => (
                        <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 600 }}>{l.name}</td>
                          <td style={{ padding: '0.75rem' }}>{l.email || '-'}</td>
                          <td style={{ padding: '0.75rem' }}>{l.phone || '-'}</td>
                          <td style={{ padding: '0.75rem' }}>{l.company || '-'}</td>
                          <td style={{ padding: '0.75rem', color: 'var(--primary)' }}>{l.card_name || 'Card'}</td>
                          <td style={{ padding: '0.75rem', color: 'var(--muted)', fontSize: '0.8rem' }}>{l.notes || '-'}</td>
                          <td style={{ padding: '0.75rem', color: 'var(--muted)' }}>{new Date(l.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Card Form */}
      {cardForm && (
        <form onSubmit={handleSaveCard} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', marginBottom: '1rem' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.15rem' }}>{editingCard ? 'Edit Business Card Settings' : 'Create Contactless Business Card'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Full Name *</label>
              <input className="form-input" placeholder="e.g. John Doe" value={cardDraft.name} onChange={e => setCardDraft(d => ({ ...d, name: e.target.value }))} required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Job Title</label>
              <input className="form-input" placeholder="e.g. Sales Manager" value={cardDraft.title} onChange={e => setCardDraft(d => ({ ...d, title: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Company</label>
              <input className="form-input" placeholder="e.g. Digitpen Corp" value={cardDraft.company} onChange={e => setCardDraft(d => ({ ...d, company: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Custom Slug (URL suffix)</label>
              <input className="form-input" placeholder="johndoe" value={cardDraft.slug} onChange={e => setCardDraft(d => ({ ...d, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Department</label>
              <input className="form-input" placeholder="e.g. Sales & Support" value={cardDraft.department} onChange={e => setCardDraft(d => ({ ...d, department: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Primary Email</label>
              <input className="form-input" type="email" placeholder="email@address.com" value={cardDraft.email} onChange={e => setCardDraft(d => ({ ...d, email: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Phone</label>
              <input className="form-input" placeholder="+234..." value={cardDraft.phone} onChange={e => setCardDraft(d => ({ ...d, phone: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Mobile</label>
              <input className="form-input" placeholder="+234..." value={cardDraft.mobile} onChange={e => setCardDraft(d => ({ ...d, mobile: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Website</label>
              <input className="form-input" placeholder="https://..." value={cardDraft.website} onChange={e => setCardDraft(d => ({ ...d, website: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>LinkedIn</label>
              <input className="form-input" placeholder="https://linkedin.com/in/..." value={cardDraft.linkedin} onChange={e => setCardDraft(d => ({ ...d, linkedin: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Twitter / X</label>
              <input className="form-input" placeholder="https://x.com/..." value={cardDraft.twitter} onChange={e => setCardDraft(d => ({ ...d, twitter: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Instagram</label>
              <input className="form-input" placeholder="https://instagram.com/..." value={cardDraft.instagram} onChange={e => setCardDraft(d => ({ ...d, instagram: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div style={{ gridColumn: '1 / 3' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Location / Address</label>
              <input className="form-input" placeholder="123 Street Address, City, Country" value={cardDraft.address} onChange={e => setCardDraft(d => ({ ...d, address: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Primary Theme Color</label>
              <input type="color" value={cardDraft.primary_color} onChange={e => setCardDraft(d => ({ ...d, primary_color: e.target.value }))} style={{ height: 38, width: '100%', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }} />
            </div>
            <div style={{ gridColumn: '1 / 3' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Bio / Tagline</label>
              <textarea className="form-input" placeholder="Short description..." value={cardDraft.bio} onChange={e => setCardDraft(d => ({ ...d, bio: e.target.value }))} style={{ width: '100%', minHeight: 60 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Profile Layout</label>
              <select className="form-input" value={cardDraft.layout_style} onChange={e => setCardDraft(d => ({ ...d, layout_style: e.target.value }))} style={{ width: '100%' }}>
                <option value="standard">Standard</option>
                <option value="minimal">Minimalist</option>
                <option value="creative">Creative</option>
                <option value="corporate">Corporate</option>
                <option value="modern">Modern</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Profile Image / Avatar URL</label>
              <input className="form-input" placeholder="https://..." value={cardDraft.avatar_url} onChange={e => setCardDraft(d => ({ ...d, avatar_url: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Cover Background Banner Image URL</label>
              <input className="form-input" placeholder="https://..." value={cardDraft.cover_image_url} onChange={e => setCardDraft(d => ({ ...d, cover_image_url: e.target.value }))} style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button type="submit">{editingCard ? 'Update' : 'Create'} Card</Button>
            <Button variant="ghost" type="button" onClick={() => { setCardForm(false); setEditingCard(null); }}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Card Detail & View Section */}
      {viewCard && !cardForm && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', marginTop: '0.5rem' }}>
          
          {/* Card Management Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Custom Sections and Links Builder */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Custom Link Sections</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="ghost" size="small" onClick={() => setSectionForm(true)}>+ Add Section</Button>
                  {sections.length > 0 && (
                    <Button variant="ghost" size="small" onClick={() => { setEditingLink(null); setLinkDraft({ title: '', url: '', description: '', icon: '🔗', section_id: sections[0].id, sort_order: links.length }); setLinkForm(true); }}>+ Add Link</Button>
                  )}
                </div>
              </div>

              {/* Add Section Inline Form */}
              {sectionForm && (
                <form onSubmit={handleAddSection} style={{ border: '1px dashed var(--border)', padding: '1rem', borderRadius: 8, marginBottom: '1rem', background: 'var(--background)' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem' }}>New Link Group Section</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <input className="form-input" placeholder="Section title (e.g. Work Portfolio)" value={sectionTitle} onChange={e => setSectionTitle(e.target.value)} required style={{ flex: 1 }} />
                    <input className="form-input" placeholder="Emoji" value={sectionIcon} onChange={e => setSectionIcon(e.target.value)} style={{ width: 60, textAlign: 'center' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <Button type="submit" size="small">Add Section</Button>
                    <Button variant="ghost" size="small" type="button" onClick={() => setSectionForm(false)}>Cancel</Button>
                  </div>
                </form>
              )}

              {/* Add/Edit Link Inline Form */}
              {linkForm && (
                <form onSubmit={handleSaveLink} style={{ border: '1px dashed var(--border)', padding: '1rem', borderRadius: 8, marginBottom: '1rem', background: 'var(--background)' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem' }}>{editingLink ? 'Edit Custom Link' : 'Add Custom Link'}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: 2 }}>Link Title *</label>
                      <input className="form-input" placeholder="My GitHub Profile" value={linkDraft.title} onChange={e => setLinkDraft(d => ({ ...d, title: e.target.value }))} required style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: 2 }}>Group Section *</label>
                      <select className="form-input" value={linkDraft.section_id} onChange={e => setLinkDraft(d => ({ ...d, section_id: e.target.value }))} required style={{ width: '100%' }}>
                        <option value="">Select Section</option>
                        {sections.map(s => <option key={s.id} value={s.id}>{s.icon} {s.title}</option>)}
                      </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: 2 }}>Destination URL *</label>
                      <input className="form-input" placeholder="https://..." value={linkDraft.url} onChange={e => setLinkDraft(d => ({ ...d, url: e.target.value }))} required style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: 2 }}>Description (optional)</label>
                      <input className="form-input" placeholder="Project repos & code" value={linkDraft.description} onChange={e => setLinkDraft(d => ({ ...d, description: e.target.value }))} style={{ width: '100%' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: 2 }}>Icon Emoji</label>
                        <input className="form-input" value={linkDraft.icon} onChange={e => setLinkDraft(d => ({ ...d, icon: e.target.value }))} style={{ width: '100%', textAlign: 'center' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: 2 }}>Order No.</label>
                        <input className="form-input" type="number" value={linkDraft.sort_order} onChange={e => setLinkDraft(d => ({ ...d, sort_order: parseInt(e.target.value) || 0 }))} style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <Button type="submit" size="small">{editingLink ? 'Save Changes' : 'Add Link'}</Button>
                    <Button variant="ghost" size="small" type="button" onClick={() => { setLinkForm(false); setEditingLink(null); }}>Cancel</Button>
                  </div>
                </form>
              )}

              {sections.length === 0 ? (
                <p style={{ color: 'var(--muted)', textAlign: 'center', fontSize: '0.85rem', padding: '1rem 0' }}>Add a group section first before creating custom links.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {sections.map(section => {
                    const sectionLinks = links.filter(l => l.section_id === section.id);
                    return (
                      <div key={section.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span>{section.icon}</span> {section.title}
                        </div>
                        {sectionLinks.length === 0 ? (
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', padding: '0.25rem 0' }}>No links in this group.</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {sectionLinks.map(link => (
                              <div key={link.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--background)', padding: '0.4rem 0.6rem', borderRadius: 6, fontSize: '0.8rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span>{link.icon}</span>
                                  <div>
                                    <div style={{ fontWeight: 600 }}>{link.title}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>{link.url}</div>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                  <button className="btn-ghost" style={{ fontSize: '0.7rem', padding: '2px 4px' }} onClick={() => { setEditingLink(link); setLinkDraft({ title: link.title, url: link.url, description: link.description || '', icon: link.icon || '🔗', section_id: link.section_id, sort_order: link.sort_order || 0 }); setLinkForm(true); }}>Edit</button>
                                  <button className="btn-ghost" style={{ fontSize: '0.7rem', color: 'var(--danger)', padding: '2px 4px' }} onClick={() => setLinkConfirmDelete(link)}>Remove</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Card Analytics breakdown */}
            {cardAnalytics && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 700 }}>Card Performance Analytics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Range Views</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{cardAnalytics.summary?.total_views || 0}</span>
                  </div>
                  <div className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Unique Visitors</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{cardAnalytics.summary?.unique_visitors || 0}</span>
                  </div>
                </div>

                {/* Link Performance Table */}
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Top Custom Link Clicks</h4>
                {cardAnalytics.linkPerformance?.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', textAlign: 'center' }}>No custom link clicks tracked yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {cardAnalytics.linkPerformance?.map((lp, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--background)', padding: '0.5rem 0.75rem', borderRadius: 6, fontSize: '0.8rem' }}>
                        <span style={{ fontWeight: 600 }}>{lp.title}</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{lp.clicks || 0} clicks</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right Panel: Live Card Mock Preview & Sharing */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Live Card Mock Preview */}
            <div style={{ background: viewCard.background_color || '#ffffff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', textAlign: 'center', color: viewCard.text_color || '#1f2937', boxShadow: 'var(--shadow-md)' }}>
              
              {/* Cover Banner Mock */}
              <div style={{ height: 110, background: viewCard.cover_image_url ? `url(${viewCard.cover_image_url}) center/cover no-repeat` : `linear-gradient(135deg, ${viewCard.primary_color || '#2563eb'}, ${viewCard.secondary_color || '#1e40af'})` }} />
              
              {/* Avatar Mock */}
              <div style={{ padding: '0 1rem 1.5rem', marginTop: -35, position: 'relative' }}>
                {viewCard.avatar_url ? (
                  <img src={viewCard.avatar_url} alt="" style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${viewCard.background_color || '#ffffff'}`, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', margin: '0 auto' }} />
                ) : (
                  <div style={{ width: 70, height: 70, borderRadius: '50%', background: viewCard.primary_color || '#2563eb', color: '#fff', fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `3px solid ${viewCard.background_color || '#ffffff'}`, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', margin: '0 auto' }}>{viewCard.name[0]}</div>
                )}

                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.75rem', marginBottom: '0.2rem' }}>{viewCard.name}</h4>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  {viewCard.title && <span style={{ fontWeight: 600 }}>{viewCard.title}</span>}
                  {viewCard.company && <span>{viewCard.company}</span>}
                </div>
                
                {/* Micro social icons mock */}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.75rem' }}>
                  {viewCard.email && <span style={{ fontSize: '1.1rem' }}>✉️</span>}
                  {viewCard.phone && <span style={{ fontSize: '1.1rem' }}>📞</span>}
                  {viewCard.website && <span style={{ fontSize: '1.1rem' }}>🌐</span>}
                  {viewCard.linkedin && <span style={{ fontSize: '1.1rem' }}>👔</span>}
                </div>
              </div>

            </div>

            {/* Share settings / QR Code */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>Contact Sharing QR Code</h4>
              
              {/* Dynamic QR Code Mock image linked to public card page */}
              <div style={{ width: 140, height: 140, margin: '0 auto 1rem', background: '#ffffff', padding: '0.5rem', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/card/${viewCard.slug || viewCard.id}`)}`} alt="QR Code" style={{ width: '100%', height: '100%' }} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Button variant="ghost" style={{ width: '100%', fontSize: '0.8rem' }} onClick={() => copyCardLink(viewCard)}>📋 Copy URL Link</Button>
                <Button variant="ghost" style={{ width: '100%', fontSize: '0.8rem' }} onClick={() => window.open(`/card/${viewCard.slug || viewCard.id}`, '_blank')}>👁️ View Live Card</Button>
                <a href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/card/${viewCard.slug || viewCard.id}`)}`} target="_blank" rel="noopener noreferrer" download="business_card_qr.png" style={{ textDecoration: 'none' }}>
                  <Button variant="ghost" style={{ width: '100%', fontSize: '0.8rem' }}>📥 Download QR Image</Button>
                </a>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Confirm Deletion Dialogs */}
      <ConfirmDialog isOpen={!!cardConfirmDelete} onClose={() => setCardConfirmDelete(null)} onConfirm={confirmCardDelete} title="Delete this digital business card?" description="This will permanently delete this card, custom sections, and nested links. This cannot be undone." confirmLabel="Delete" danger loading={cardDeleting} />
      <ConfirmDialog isOpen={!!linkConfirmDelete} onClose={() => setLinkConfirmDelete(null)} onConfirm={confirmLinkDelete} title="Remove this link?" description="This will remove this link from your card group." confirmLabel="Remove" danger loading={linkDeleting} />

    </div>
  );
}
