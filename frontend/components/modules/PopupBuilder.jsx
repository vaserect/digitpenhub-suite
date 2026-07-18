'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';
import SearchInput from '../ui/SearchInput';
import Tooltip from '../ui/Tooltip';

export default function PopupBuilderModule({ goHome, showToast }) {
  const [loading, setLoading] = useState(true);
  const [popups, setPopups] = useState([]);
  const [pbStats, setPbStats] = useState(null);
  const [pbQuery, setPbQuery] = useState('');
  const [pbForm, setPbForm] = useState(false);
  const [editingPopup, setEditingPopup] = useState(null);
  const [pbPreview, setPbPreview] = useState(null);
  const [pbConfirmDelete, setPbConfirmDelete] = useState(null);
  const [pbDeleting, setPbDeleting] = useState(false);

  // Form State
  const [pbDraft, setPbDraft] = useState({
    name: '',
    trigger_type: 'delay',
    trigger_delay: 5,
    trigger_scroll: 50,
    headline: '',
    body_text: '',
    cta_text: '',
    cta_url: '',
    image_url: '',
    bg_color: '#ffffff',
    text_color: '#111111',
    accent_color: '#2563eb',
    position: 'center',
    size: 'medium',
    status: 'draft'
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, popsRes] = await Promise.all([
        apiFetch('/api/v1/popup-builder/stats'),
        apiFetch('/api/v1/popup-builder/')
      ]);
      setPbStats(statsRes.stats);
      setPopups(popsRes.popups || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load popup data.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSavePopup = async (e) => {
    e.preventDefault();
    if (!pbDraft.name.trim()) {
      showToast('Popup name is required.');
      return;
    }

    const method = editingPopup ? 'PUT' : 'POST';
    const url = editingPopup ? `/api/v1/popup-builder/${editingPopup.id}` : '/api/v1/popup-builder/';

    try {
      const data = await apiFetch(url, { method, body: JSON.stringify(pbDraft) });
      if (data.error) {
        showToast(data.error);
        return;
      }
      showToast(editingPopup ? 'Popup updated.' : 'Popup created.');
      setPbForm(false);
      setEditingPopup(null);
      await loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to save popup.');
    }
  };

  const handleDeletePopup = (id) => {
    setPbConfirmDelete({ id });
  };

  const confirmPbDelete = async () => {
    if (!pbConfirmDelete) return;
    setPbDeleting(true);
    try {
      await apiFetch(`/api/v1/popup-builder/${pbConfirmDelete.id}`, { method: 'DELETE' });
      showToast('Popup deleted.');
      await loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete popup.');
    } finally {
      setPbDeleting(false);
      setPbConfirmDelete(null);
    }
  };

  const pbFiltered = popups.filter((p) => {
    const q = pbQuery.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || (p.headline || '').toLowerCase().includes(q);
  });

  return (
    <div className="panel" style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <button className="back-link" onClick={goHome} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', fontWeight: 500, fontSize: '0.875rem', padding: 0, marginBottom: '0.5rem' }}>
            ← Back to Workspace
          </button>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)' }}>Popup Builder</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.875rem' }}>
            On-site popups to capture leads and promote offers. Part of Marketing.
          </p>
        </div>
        {!pbForm && (
          <Button onClick={() => {
            setEditingPopup(null);
            setPbDraft({
              name: '',
              trigger_type: 'delay',
              trigger_delay: 5,
              trigger_scroll: 50,
              headline: '',
              body_text: '',
              cta_text: '',
              cta_url: '',
              image_url: '',
              bg_color: '#ffffff',
              text_color: '#111111',
              accent_color: '#2563eb',
              position: 'center',
              size: 'medium',
              status: 'draft'
            });
            setPbForm(true);
          }}>
            + New Popup
          </Button>
        )}
      </div>

      {/* Stats Summary Panel */}
      {pbStats && !pbForm && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Popups</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>{pbStats.total || 0}</span>
          </div>
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Campaigns</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{pbStats.active || 0}</span>
          </div>
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Impressions</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>{(pbStats.total_impressions || 0).toLocaleString()}</span>
          </div>
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conversions</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{(pbStats.total_conversions || 0).toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Main Form Block */}
      {pbForm ? (
        <form onSubmit={handleSavePopup} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>
              {editingPopup ? 'Edit Popup Settings' : 'Create New Popup'}
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Campaign Name *</label>
              <input
                className="form-input"
                placeholder="e.g. Summer Discount Offer"
                value={pbDraft.name}
                onChange={(e) => setPbDraft((d) => ({ ...d, name: e.target.value }))}
                required
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Trigger Trigger</label>
                <select
                  className="form-input"
                  value={pbDraft.trigger_type}
                  onChange={(e) => setPbDraft((d) => ({ ...d, trigger_type: e.target.value }))}
                  style={{ width: '100%' }}
                >
                  <option value="delay">Time Delay</option>
                  <option value="scroll">Scroll Percentage</option>
                  <option value="exit">Exit Intent</option>
                </select>
              </div>

              <div>
                {pbDraft.trigger_type === 'delay' && (
                  <>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Delay (seconds)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={pbDraft.trigger_delay}
                      onChange={(e) => setPbDraft((d) => ({ ...d, trigger_delay: Number(e.target.value) }))}
                      min="0"
                      style={{ width: '100%' }}
                    />
                  </>
                )}
                {pbDraft.trigger_type === 'scroll' && (
                  <>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Scroll Depth (%)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={pbDraft.trigger_scroll}
                      onChange={(e) => setPbDraft((d) => ({ ...d, trigger_scroll: Number(e.target.value) }))}
                      min="1"
                      max="100"
                      style={{ width: '100%' }}
                    />
                  </>
                )}
                {pbDraft.trigger_type === 'exit' && (
                  <>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Exit Intent Action</label>
                    <input
                      className="form-input"
                      value="Instantly on exit intent detection"
                      disabled
                      style={{ width: '100%', opacity: 0.7 }}
                    />
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Placement Position</label>
                <select
                  className="form-input"
                  value={pbDraft.position}
                  onChange={(e) => setPbDraft((d) => ({ ...d, position: e.target.value }))}
                  style={{ width: '100%' }}
                >
                  <option value="center">Center Modal</option>
                  <option value="top">Top Banner</option>
                  <option value="bottom">Bottom Banner</option>
                  <option value="bottom-right">Slide-in Right</option>
                  <option value="bottom-left">Slide-in Left</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Popup Size</label>
                <select
                  className="form-input"
                  value={pbDraft.size}
                  onChange={(e) => setPbDraft((d) => ({ ...d, size: e.target.value }))}
                  style={{ width: '100%' }}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Campaign Status</label>
                <select
                  className="form-input"
                  value={pbDraft.status}
                  onChange={(e) => setPbDraft((d) => ({ ...d, status: e.target.value }))}
                  style={{ width: '100%' }}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                </select>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>Popup Visual Copy</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Headline Text</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Subscribe to our newsletter!"
                    value={pbDraft.headline}
                    onChange={(e) => setPbDraft((d) => ({ ...d, headline: e.target.value }))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Body Description</label>
                  <textarea
                    className="form-input"
                    placeholder="e.g. Get 20% off your first checkout today."
                    value={pbDraft.body_text}
                    onChange={(e) => setPbDraft((d) => ({ ...d, body_text: e.target.value }))}
                    rows="3"
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>CTA Button Text</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Claim Discount"
                      value={pbDraft.cta_text}
                      onChange={(e) => setPbDraft((d) => ({ ...d, cta_text: e.target.value }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>CTA Redirect URL</label>
                    <input
                      className="form-input"
                      placeholder="e.g. https://yoursite.com/shop"
                      value={pbDraft.cta_url}
                      onChange={(e) => setPbDraft((d) => ({ ...d, cta_url: e.target.value }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Banner Image URL</label>
                  <input
                    className="form-input"
                    placeholder="e.g. https://images.unsplash.com/... (optional)"
                    value={pbDraft.image_url}
                    onChange={(e) => setPbDraft((d) => ({ ...d, image_url: e.target.value }))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>Color Palette</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Background Color</label>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <input
                      type="color"
                      value={pbDraft.bg_color}
                      onChange={(e) => setPbDraft((d) => ({ ...d, bg_color: e.target.value }))}
                      style={{ width: '38px', height: '38px', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', padding: 0 }}
                    />
                    <input
                      className="form-input"
                      value={pbDraft.bg_color}
                      onChange={(e) => setPbDraft((d) => ({ ...d, bg_color: e.target.value }))}
                      style={{ flex: 1, textTransform: 'uppercase' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Text Color</label>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <input
                      type="color"
                      value={pbDraft.text_color}
                      onChange={(e) => setPbDraft((d) => ({ ...d, text_color: e.target.value }))}
                      style={{ width: '38px', height: '38px', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', padding: 0 }}
                    />
                    <input
                      className="form-input"
                      value={pbDraft.text_color}
                      onChange={(e) => setPbDraft((d) => ({ ...d, text_color: e.target.value }))}
                      style={{ flex: 1, textTransform: 'uppercase' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>CTA Accent Color</label>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <input
                      type="color"
                      value={pbDraft.accent_color}
                      onChange={(e) => setPbDraft((d) => ({ ...d, accent_color: e.target.value }))}
                      style={{ width: '38px', height: '38px', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', padding: 0 }}
                    />
                    <input
                      className="form-input"
                      value={pbDraft.accent_color}
                      onChange={(e) => setPbDraft((d) => ({ ...d, accent_color: e.target.value }))}
                      style={{ flex: 1, textTransform: 'uppercase' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <Button type="submit">
                {editingPopup ? 'Update Campaign' : 'Publish Campaign'}
              </Button>
              <Button variant="ghost" type="button" onClick={() => { setPbForm(false); setEditingPopup(null); }}>
                Cancel
              </Button>
            </div>
          </div>

          {/* Real-time Customizer Preview Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)' }}>Real-time Customizer Preview</h4>
            <div style={{ flex: 1, minHeight: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)', border: '2px dashed var(--border)', borderRadius: '12px', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ background: pbDraft.bg_color, color: pbDraft.text_color, borderRadius: '12px', padding: '1.5rem', maxWidth: pbDraft.size === 'large' ? '100%' : pbDraft.size === 'small' ? '280px' : '360px', width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
                <span style={{ position: 'absolute', top: '10px', right: '12px', color: pbDraft.text_color, opacity: 0.6, fontSize: '1rem', cursor: 'pointer' }}>✕</span>
                {pbDraft.image_url && (
                  <img src={pbDraft.image_url} alt="Banner" style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px' }} />
                )}
                {pbDraft.headline ? (
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{pbDraft.headline}</h3>
                ) : (
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--muted)' }}>Headline Placeholder</h3>
                )}
                {pbDraft.body_text ? (
                  <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4, opacity: 0.9 }}>{pbDraft.body_text}</p>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4, color: 'var(--muted)' }}>Detailed description of the popup offer goes here...</p>
                )}
                {pbDraft.cta_text && (
                  <button style={{ background: pbDraft.accent_color, color: '#ffffff', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start', marginTop: '0.25rem' }}>
                    {pbDraft.cta_text}
                  </button>
                )}
              </div>
              <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Position: {pbDraft.position}
              </div>
            </div>
          </div>
        </form>
      ) : (
        /* Popups Table List */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '1rem' }}>
            <SearchInput
              value={pbQuery}
              onChange={(e) => setPbQuery(e.target.value)}
              placeholder="Search popups by campaign name or headline copy..."
              style={{ width: '100%' }}
            />
          </div>

          {loading ? (
            <SkeletonRows rows={4} />
          ) : pbFiltered.length === 0 ? (
            <EmptyState
              icon="📢"
              title={pbQuery ? 'No matching popups' : 'No popups created yet'}
              description={pbQuery ? 'Try clearing or modifying your filter.' : 'Launch custom lead magnets and discount campaigns in minutes.'}
              action={
                pbQuery ? (
                  <Button variant="secondary" onClick={() => setPbQuery('')}>Clear Search</Button>
                ) : (
                  <Button onClick={() => setPbForm(true)}>+ New Popup</Button>
                )
              }
            />
          ) : (
            <div className="table-wrap" style={{ flex: 1, border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Campaign Name</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Trigger Action</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Impressions</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Conversions</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pbFiltered.map((p) => {
                    const embedCode = `<script src="${window.location.origin}/api/v1/popup-builder/embed/${p.id}.js" async></script>`;
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
                          {p.headline && <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>&quot;{p.headline}&quot;</div>}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text)' }}>
                          <span className="ctag" style={{ textTransform: 'capitalize' }}>
                            {p.trigger_type === 'delay' ? `${p.trigger_delay}s delay` : p.trigger_type === 'scroll' ? `${p.trigger_scroll}% scroll` : 'Exit Intent'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text)' }}>{(p.impressions || 0).toLocaleString()}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text)' }}>{(p.conversions || 0).toLocaleString()}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className="ctag" style={{
                            background: p.status === 'active' ? 'var(--success-bg)' : 'var(--surface-muted)',
                            color: p.status === 'active' ? 'var(--success)' : 'var(--muted)',
                            fontWeight: 600
                          }}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <Tooltip label="Test rendering this popup template preview">
                              <button className="btn-ghost" style={{ fontSize: '0.75rem', fontWeight: 600 }} onClick={() => setPbPreview(p)}>Preview</button>
                            </Tooltip>
                            <Tooltip label="Copy script tag to embed this popup on any webpage">
                              <button className="btn-ghost" style={{ fontSize: '0.75rem', fontWeight: 600 }} onClick={() => {
                                navigator.clipboard.writeText(embedCode);
                                showToast('Popup embed script copied.');
                              }}>
                                Embed Script
                              </button>
                            </Tooltip>
                            <button className="btn-ghost" style={{ fontSize: '0.75rem' }} onClick={() => {
                              setEditingPopup(p);
                              setPbDraft({
                                name: p.name,
                                trigger_type: p.trigger_type,
                                trigger_delay: p.trigger_delay || 5,
                                trigger_scroll: p.trigger_scroll || 50,
                                headline: p.headline || '',
                                body_text: p.body_text || '',
                                cta_text: p.cta_text || '',
                                cta_url: p.cta_url || '',
                                image_url: p.image_url || '',
                                bg_color: p.bg_color || '#ffffff',
                                text_color: p.text_color || '#111111',
                                accent_color: p.accent_color || '#2563eb',
                                position: p.position || 'center',
                                size: p.size || 'medium',
                                status: p.status
                              });
                              setPbForm(true);
                            }}>
                              Edit
                            </button>
                            <button className="btn-ghost" style={{ fontSize: '0.75rem', color: 'var(--danger)' }} onClick={() => handleDeletePopup(p.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Test Preview Modal Overlay */}
      {pbPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: pbPreview.position === 'bottom' ? 'flex-end' : pbPreview.position === 'top' ? 'flex-start' : 'center', justifyContent: pbPreview.position === 'bottom-right' ? 'flex-end' : pbPreview.position === 'bottom-left' ? 'flex-start' : 'center', padding: '1.5rem' }}>
          <div style={{ background: pbPreview.bg_color, color: pbPreview.text_color, borderRadius: '12px', padding: '2rem', maxWidth: pbPreview.size === 'large' ? '600px' : pbPreview.size === 'small' ? '300px' : '420px', width: '100%', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button onClick={() => setPbPreview(null)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: pbPreview.text_color, opacity: 0.8 }}>✕</button>
            {pbPreview.image_url && (
              <img src={pbPreview.image_url} alt="Banner" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }} />
            )}
            {pbPreview.headline && <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{pbPreview.headline}</h3>}
            {pbPreview.body_text && <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, opacity: 0.85 }}>{pbPreview.body_text}</p>}
            {pbPreview.cta_text && (
              <button
                style={{ background: pbPreview.accent_color, color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', alignSelf: 'flex-start' }}
                onClick={() => {
                  if (pbPreview.cta_url) {
                    window.open(pbPreview.cta_url, '_blank', 'noopener,noreferrer');
                  }
                  setPbPreview(null);
                }}
              >
                {pbPreview.cta_text}
              </button>
            )}
            <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', opacity: 0.4, textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
              Preview Mode — Click anywhere outside or ✕ to close
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!pbConfirmDelete}
        onClose={() => setPbConfirmDelete(null)}
        onConfirm={confirmPbDelete}
        title="Delete this popup campaign?"
        description="This can't be undone. All visitor metrics for this campaign will be removed permanently."
        confirmLabel="Delete"
        danger
        loading={pbDeleting}
      />
    </div>
  );
}
