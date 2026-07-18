'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import EmptyState from '../ui/EmptyState';

export default function DigitalBusinessCardsModule({ goHome, showToast }) {
  const [dbcLoaded, setDbcLoaded] = useState(false);
  const [dbcCards, setDbcCards] = useState([]);
  const [dbcStats, setDbcStats] = useState(null);
  const [dbcViewCard, setDbcViewCard] = useState(null);
  const [dbcForm, setDbcForm] = useState(false);
  const [editingDbc, setEditingDbc] = useState(null);
  const [dbcConfirmDelete, setDbcConfirmDelete] = useState(null);
  const [dbcDeleting, setDbcDeleting] = useState(false);

  // Form State
  const [dbcDraft, setDbcDraft] = useState({
    name: '',
    title: '',
    company: '',
    email: '',
    phone: '',
    website: '',
    linkedin: '',
    twitter: '',
    instagram: '',
    address: '',
    bio: '',
    avatarUrl: '',
    theme: 'classic',
    accentColor: '#2563eb'
  });

  const loadDigitalBusinessCards = useCallback(async () => {
    try {
      const [stats, cards] = await Promise.all([
        apiFetch('/api/v1/biz-cards/stats'),
        apiFetch('/api/v1/biz-cards/')
      ]);
      setDbcStats(stats.stats);
      setDbcCards(cards.cards || []);
      setDbcLoaded(true);
    } catch {
      setDbcLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadDigitalBusinessCards();
  }, [loadDigitalBusinessCards]);

  async function handleSaveDbc(e) {
    e.preventDefault();
    if (!dbcDraft.name.trim()) {
      showToast('Name is required.');
      return;
    }
    const method = editingDbc ? 'PUT' : 'POST';
    const url = editingDbc ? `/api/v1/biz-cards/${editingDbc.id}` : '/api/v1/biz-cards/';
    const data = await apiFetch(url, { method, body: JSON.stringify(dbcDraft) });
    if (data.error) {
      showToast(data.error);
      return;
    }
    setDbcForm(false);
    setEditingDbc(null);
    showToast(editingDbc ? 'Card updated.' : 'Card created.');
    await loadDigitalBusinessCards();
    if (!editingDbc) {
      setDbcViewCard(data.card);
    } else {
      setDbcViewCard(data.card);
    }
  }

  function handleDeleteDbc(id) {
    setDbcConfirmDelete({ id });
  }

  async function confirmDbcDelete() {
    if (!dbcConfirmDelete) return;
    setDbcDeleting(true);
    try {
      await apiFetch(`/api/v1/biz-cards/${dbcConfirmDelete.id}`, { method: 'DELETE' });
      setDbcCards((c) => c.filter((x) => x.id !== dbcConfirmDelete.id));
      showToast('Card deleted.');
      setDbcViewCard(null);
      const stats = await apiFetch('/api/v1/biz-cards/stats');
      setDbcStats(stats.stats);
    } catch (err) {
      showToast('Failed to delete card.');
    } finally {
      setDbcDeleting(false);
      setDbcConfirmDelete(null);
    }
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

  return (
    <div className="panel" style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <button className="back-link" onClick={() => dbcViewCard ? setDbcViewCard(null) : goHome()} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', fontWeight: 500, fontSize: '0.875rem', padding: 0, marginBottom: '0.5rem' }}>
            ← {dbcViewCard ? 'Back to Cards' : 'Back to Workspace'}
          </button>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)' }}>
            {dbcViewCard ? dbcViewCard.name : 'Digital Business Cards'}
          </h1>
          {!dbcViewCard && (
            <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.875rem' }}>
              Create and share contactless digital business cards with vCard downloads. Part of Website Builder.
            </p>
          )}
        </div>
        {!dbcViewCard && !dbcForm && (
          <Button onClick={() => { setEditingDbc(null); setDbcDraft({ name: '', title: '', company: '', email: '', phone: '', website: '', linkedin: '', twitter: '', instagram: '', address: '', bio: '', avatarUrl: '', theme: 'classic', accentColor: '#2563eb' }); setDbcForm(true); }}>
            + New Card
          </Button>
        )}
        {dbcViewCard && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="ghost" onClick={() => downloadVCard(dbcViewCard)}>
              ⬇ Download vCard
            </Button>
            <Button variant="ghost" onClick={() => { setEditingDbc(dbcViewCard); setDbcDraft({ name: dbcViewCard.name, title: dbcViewCard.title || '', company: dbcViewCard.company || '', email: dbcViewCard.email || '', phone: dbcViewCard.phone || '', website: dbcViewCard.website || '', linkedin: dbcViewCard.linkedin || '', twitter: dbcViewCard.twitter || '', instagram: dbcViewCard.instagram || '', address: dbcViewCard.address || '', bio: dbcViewCard.bio || '', avatarUrl: dbcViewCard.avatar_url || '', theme: dbcViewCard.theme, accentColor: dbcViewCard.accent_color }); setDbcForm(true); }}>
              Edit
            </Button>
            <Button variant="ghost" style={{ color: 'var(--danger)' }} onClick={() => { handleDeleteDbc(dbcViewCard.id); setDbcViewCard(null); }}>
              Delete
            </Button>
          </div>
        )}
      </div>

      {dbcStats && !dbcViewCard && !dbcForm && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Cards</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>{dbcStats.total || 0}</span>
          </div>
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Cards</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{dbcStats.active || 0}</span>
          </div>
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Card Views</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{(dbcStats.total_views || 0).toLocaleString()}</span>
          </div>
        </div>
      )}

      {dbcForm && (
        <form onSubmit={handleSaveDbc} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '1.5rem', marginBottom: '1rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600 }}>
            {editingDbc ? 'Edit Business Card' : 'Create New Business Card'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Full Name *</label>
              <input className="form-input" placeholder="John Doe" value={dbcDraft.name} onChange={(e) => setDbcDraft((d) => ({ ...d, name: e.target.value }))} required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Job Title</label>
              <input className="form-input" placeholder="Software Engineer" value={dbcDraft.title} onChange={(e) => setDbcDraft((d) => ({ ...d, title: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Company</label>
              <input className="form-input" placeholder="Acme Corp" value={dbcDraft.company} onChange={(e) => setDbcDraft((d) => ({ ...d, company: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Email</label>
              <input className="form-input" type="email" placeholder="john@example.com" value={dbcDraft.email} onChange={(e) => setDbcDraft((d) => ({ ...d, email: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Phone</label>
              <input className="form-input" placeholder="+234..." value={dbcDraft.phone} onChange={(e) => setDbcDraft((d) => ({ ...d, phone: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Website</label>
              <input className="form-input" placeholder="https://..." value={dbcDraft.website} onChange={(e) => setDbcDraft((d) => ({ ...d, website: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>LinkedIn URL</label>
              <input className="form-input" placeholder="https://linkedin.com/in/..." value={dbcDraft.linkedin} onChange={(e) => setDbcDraft((d) => ({ ...d, linkedin: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Twitter / X URL</label>
              <input className="form-input" placeholder="https://x.com/..." value={dbcDraft.twitter} onChange={(e) => setDbcDraft((d) => ({ ...d, twitter: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Instagram URL</label>
              <input className="form-input" placeholder="https://instagram.com/..." value={dbcDraft.instagram} onChange={(e) => setDbcDraft((d) => ({ ...d, instagram: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div style={{ gridColumn: '1 / 3' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Address</label>
              <input className="form-input" placeholder="123 Street Address, City" value={dbcDraft.address} onChange={(e) => setDbcDraft((d) => ({ ...d, address: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '0.2rem' }}>Accent Color</label>
              <input type="color" value={dbcDraft.accentColor} onChange={(e) => setDbcDraft((d) => ({ ...d, accentColor: e.target.value }))} style={{ height: 38, width: '100%', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }} />
            </div>
            <div style={{ gridColumn: '1 / 3' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Avatar Image URL (optional)</label>
              <input className="form-input" placeholder="https://..." value={dbcDraft.avatarUrl} onChange={(e) => setDbcDraft((d) => ({ ...d, avatarUrl: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Theme</label>
              <select className="form-input" value={dbcDraft.theme} onChange={(e) => setDbcDraft((d) => ({ ...d, theme: e.target.value }))} style={{ width: '100%' }}>
                <option value="classic">Classic</option>
                <option value="modern">Modern</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Bio / Tagline</label>
              <textarea className="form-input" placeholder="Write a short summary..." value={dbcDraft.bio} onChange={(e) => setDbcDraft((d) => ({ ...d, bio: e.target.value }))} style={{ width: '100%', minHeight: 50 }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button type="submit">{editingDbc ? 'Update' : 'Create'} Card</Button>
            <Button variant="ghost" type="button" onClick={() => { setDbcForm(false); setEditingDbc(null); }}>Cancel</Button>
          </div>
        </form>
      )}

      {!dbcLoaded ? (
        <p className="muted">Loading business cards…</p>
      ) : !dbcViewCard ? (
        dbcCards.length === 0 ? (
          <EmptyState title="No business cards yet. Create your first one." action={<Button onClick={() => setDbcForm(true)}>+ New Card</Button>} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {dbcCards.map((card) => (
              <div key={card.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setDbcViewCard(card)}>
                <div style={{ background: card.accent_color || '#2563eb', padding: '1.25rem', color: '#fff' }}>
                  {card.avatar_url ? (
                    <img src={card.avatar_url} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', marginBottom: '0.5rem', border: '2px solid rgba(255,255,255,0.4)' }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      {card.name[0]}
                    </div>
                  )}
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{card.name}</div>
                  {card.title && <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>{card.title}</div>}
                </div>
                <div style={{ padding: '1rem', fontSize: '0.85rem' }}>
                  {card.company && <div style={{ color: 'var(--muted)', marginBottom: '0.25rem' }}>🏢 {card.company}</div>}
                  {card.email && <div style={{ color: 'var(--muted)', marginBottom: '0.25rem' }}>✉ {card.email}</div>}
                  {card.phone && <div style={{ color: 'var(--muted)', marginBottom: '0.25rem' }}>📞 {card.phone}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                    <span className="ctag">{card.theme}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{card.views || 0} views</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div style={{ maxWidth: 480, margin: '0 auto', width: '100%' }}>
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ background: dbcViewCard.accent_color || '#2563eb', padding: '2rem', color: '#fff', textAlign: 'center' }}>
              {dbcViewCard.avatar_url ? (
                <img src={dbcViewCard.avatar_url} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginBottom: '0.75rem', border: '3px solid rgba(255,255,255,0.5)' }} />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, margin: '0 auto 0.75rem' }}>
                  {dbcViewCard.name[0]}
                </div>
              )}
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{dbcViewCard.name}</div>
              {dbcViewCard.title && <div style={{ opacity: 0.9, marginTop: '0.25rem' }}>{dbcViewCard.title}</div>}
              {dbcViewCard.company && <div style={{ opacity: 0.8, fontSize: '0.9rem' }}>{dbcViewCard.company}</div>}
              {dbcViewCard.bio && <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', opacity: 0.85 }}>{dbcViewCard.bio}</div>}
            </div>
            <div style={{ background: 'var(--surface)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[['email', '✉', dbcViewCard.email], ['phone', '📞', dbcViewCard.phone], ['website', '🌐', dbcViewCard.website], ['address', '📍', dbcViewCard.address]].filter(([,, v]) => v).map(([k, icon, val]) => (
                <div key={k} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text)' }}>{val}</span>
                </div>
              ))}
              {(dbcViewCard.linkedin || dbcViewCard.twitter || dbcViewCard.instagram) && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {dbcViewCard.linkedin && <a href={dbcViewCard.linkedin} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: '0.8rem', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 6, textDecoration: 'none' }}>LinkedIn</a>}
                  {dbcViewCard.twitter && <a href={dbcViewCard.twitter} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: '0.8rem', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 6, textDecoration: 'none' }}>Twitter</a>}
                  {dbcViewCard.instagram && <a href={dbcViewCard.instagram} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: '0.8rem', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 6, textDecoration: 'none' }}>Instagram</a>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!dbcConfirmDelete}
        onClose={() => setDbcConfirmDelete(null)}
        onConfirm={confirmDbcDelete}
        title="Delete this card?"
        description="This will permanently delete this business card. This can't be undone."
        confirmLabel="Delete"
        danger
        loading={dbcDeleting}
      />
    </div>
  );
}
