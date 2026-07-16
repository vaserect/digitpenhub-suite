'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import SearchInput from '../ui/SearchInput';

const BLOCK_DEFAULTS = {
  hero:         { type: 'hero',         heading: 'Welcome', subheading: 'Your tagline goes here.', ctaText: 'Get started', ctaUrl: '', bgColor: '#2563eb', textColor: '#ffffff', align: 'center' },
  text:         { type: 'text',         heading: '',        body: '' },
  features:     { type: 'features',     heading: 'Why choose us?', items: [{ icon: '✓', title: 'Feature 1', desc: 'Describe this benefit.' }] },
  cta:          { type: 'cta',          heading: 'Ready to get started?', body: '', buttonText: 'Get started', buttonUrl: '', bgColor: '#f8fafc' },
  testimonials: { type: 'testimonials', heading: 'What our clients say', items: [{ quote: '', author: '', role: '' }] },
  image:        { type: 'image',        url: '',    alt: '',   caption: '' },
  columns:      { type: 'columns',      columns: 2, items: [{ heading: '', body: '', imageUrl: '' }, { heading: '', body: '', imageUrl: '' }] },
  video:        { type: 'video',        url: '',    heading: '' },
  spacer:       { type: 'spacer',       height: 40 },
  divider:      { type: 'divider' },
  nav:          { type: 'nav',          logoText: 'Your Business', homeHref: '/', links: [], ctaText: '', ctaHref: '' },
  footer:       { type: 'footer',       logoText: 'Your Business', copyright: '', links: [] },
  form:         { type: 'form',         formId: '', heading: 'Get in touch', subheading: 'Send us a message and we\'ll get back to you soon.' },
};

export default function PageEditor({ pageId, onBack, onSaveSuccess }) {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(null);
  const [pageDraft, setPageDraft] = useState({
    title: '', slug: '', metaDescription: '', ogImage: '', canonicalUrl: '',
    customDomain: '', gaMeasurementId: '', metaPixelId: '', googleAdsConversionId: '',
    status: 'draft', blocks: []
  });
  const [pageAnalytics, setPageAnalytics] = useState(null);
  const [pagesSaving, setPagesSaving] = useState(false);

  // Block states
  const [editingBlock, setEditingBlock] = useState(null);
  const [blockDraft, setBlockDraft] = useState({});
  const [addingBlockType, setAddingBlockType] = useState('');
  const [dragBlockIdx, setDragBlockIdx] = useState(null);

  // Forms options
  const [blockFormOptions, setBlockFormOptions] = useState([]);
  const [blockFormOptionsLoading, setBlockFormOptionsLoading] = useState(false);
  const [blockFormCreating, setBlockFormCreating] = useState(false);

  // Pexels states
  const [pexelsPickerOpen, setPexelsPickerOpen] = useState(false);
  const [pexelsTarget, setPexelsTarget] = useState('block'); // ogImage | block
  const [pexelsQuery, setPexelsQuery] = useState('');
  const [pexelsResults, setPexelsResults] = useState([]);
  const [pexelsLoading, setPexelsLoading] = useState(false);

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/v1/pages/${pageId}`);
      setPage(data.page);
      setPageDraft({
        title: data.page.title,
        slug: data.page.slug,
        metaDescription: data.page.meta_description || '',
        ogImage: data.page.og_image || '',
        canonicalUrl: data.page.canonical_url || '',
        customDomain: data.page.custom_domain || '',
        gaMeasurementId: data.page.ga_measurement_id || '',
        metaPixelId: data.page.meta_pixel_id || '',
        googleAdsConversionId: data.page.google_ads_conversion_id || '',
        status: data.page.status,
        blocks: Array.isArray(data.page.blocks) ? data.page.blocks : []
      });
      
      // Load analytics asynchronously
      apiFetch(`/api/v1/pages/${pageId}/analytics`)
        .then(setPageAnalytics)
        .catch((e) => console.error('Failed to load analytics', e));

    } catch (err) {
      toast.error('Failed to load page details');
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  const loadBlockFormOptions = useCallback(async () => {
    setBlockFormOptionsLoading(true);
    try {
      const data = await apiFetch('/api/v1/leads/forms');
      setBlockFormOptions(data.forms || []);
    } catch {
      setBlockFormOptions([]);
    } finally {
      setBlockFormOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage();
    loadBlockFormOptions();
  }, [loadPage, loadBlockFormOptions]);

  async function handleSavePage() {
    setPagesSaving(true);
    try {
      const data = await apiFetch(`/api/v1/pages/${pageId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: pageDraft.title,
          slug: pageDraft.slug,
          metaDescription: pageDraft.metaDescription,
          ogImage: pageDraft.ogImage,
          canonicalUrl: pageDraft.canonicalUrl,
          customDomain: pageDraft.customDomain,
          gaMeasurementId: pageDraft.gaMeasurementId,
          metaPixelId: pageDraft.metaPixelId,
          googleAdsConversionId: pageDraft.googleAdsConversionId,
          status: pageDraft.status,
          blocks: pageDraft.blocks
        }),
      });
      setPage(data.page);
      setPageDraft((d) => ({
        ...d,
        ...data.page,
        blocks: Array.isArray(data.page.blocks) ? data.page.blocks : d.blocks
      }));
      toast.success('Page saved.');
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      toast.error(err.message || 'Failed to save page');
    } finally {
      setPagesSaving(false);
    }
  }

  async function createQuickLeadForm() {
    setBlockFormCreating(true);
    try {
      const data = await apiFetch('/api/v1/leads/forms', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Contact form',
          fields: [
            { id: 'name', label: 'Name', type: 'text', required: true },
            { id: 'email', label: 'Email', type: 'email', required: true },
            { id: 'message', label: 'Message', type: 'textarea', required: true },
          ],
          thankYouMessage: 'Thanks for reaching out — we\'ll be in touch soon.',
        }),
      });
      setBlockFormOptions((prev) => [data.form, ...prev]);
      setBlockDraft((d) => ({ ...d, formId: data.form.id }));
      toast.success('New contact form created and selected.');
    } catch (err) {
      toast.error(err.message || 'Unable to create form.');
    } finally {
      setBlockFormCreating(false);
    }
  }

  function addBlock(type) {
    if (!type) return;
    const newBlock = { ...BLOCK_DEFAULTS[type], id: `blk_${Date.now()}` };
    setPageDraft((d) => ({ ...d, blocks: [...d.blocks, newBlock] }));
    setAddingBlockType('');
    setEditingBlock(newBlock);
    setBlockDraft({ ...newBlock });
  }

  function deleteBlock(blockId) {
    setPageDraft((d) => ({ ...d, blocks: d.blocks.filter((b) => b.id !== blockId) }));
    if (editingBlock?.id === blockId) {
      setEditingBlock(null);
      setBlockDraft({});
    }
  }

  function reorderBlocks(dragIdx, dropIdx) {
    if (dragIdx === dropIdx || dragIdx == null || dropIdx == null) return;
    setPageDraft((d) => {
      const arr = [...d.blocks];
      const [moved] = arr.splice(dragIdx, 1);
      arr.splice(dropIdx, 0, moved);
      return { ...d, blocks: arr };
    });
  }

  function saveBlockDraft() {
    if (!editingBlock) return;
    setPageDraft((d) => ({
      ...d,
      blocks: d.blocks.map((b) => b.id === editingBlock.id ? { ...blockDraft } : b),
    }));
    setEditingBlock(null);
    setBlockDraft({});
  }

  async function searchPexels(q) {
    if (!q.trim()) { setPexelsResults([]); return; }
    setPexelsLoading(true);
    try {
      const data = await apiFetch(`/api/v1/images/search?q=${encodeURIComponent(q.trim())}&orientation=landscape`);
      setPexelsResults(data.images || []);
    } catch {
      toast.error('Pexels search failed');
    } finally {
      setPexelsLoading(false);
    }
  }

  if (loading) {
    return <div className="empty-note">Loading page editor…</div>;
  }

  return (
    <div>
      <button className="back-link" onClick={onBack}>← Pages</button>
      <div className="module-head">
        <div>
          <h1 style={{ fontSize: '1.1rem' }}>{pageDraft.title || 'Untitled page'}</h1>
          <p className="module-sub">
            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>/p/{pageDraft.slug}</span>
            <span style={{ marginLeft: 10 }}>
              <a href={`/p/preview/${pageId}`} target="_blank" rel="noopener" style={{ color: 'var(--primary)', fontSize: 12 }}>Preview ↗</a>
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={pageDraft.status} onChange={(e) => setPageDraft((d) => ({ ...d, status: e.target.value }))}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', color: 'var(--text)', fontSize: 13 }}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <button className="primary-btn" onClick={handleSavePage} disabled={pagesSaving}>
            {pagesSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {pageAnalytics && (
        <div className="stats-row" style={{ marginBottom: 14 }}>
          <div className="stat-card"><div className="stat-value">{pageAnalytics.totalViews}</div><div className="stat-label">Views</div></div>
          <div className="stat-card"><div className="stat-value">{pageAnalytics.uniqueVisitors}</div><div className="stat-label">Unique Visitors</div></div>
          <div className="stat-card"><div className="stat-value">{pageAnalytics.dailyViews?.length || 0}</div><div className="stat-label">Active Days (30d)</div></div>
        </div>
      )}

      {/* Page settings */}
      <div className="card" style={{ marginBottom: 18, padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="field-label">Page title</label>
            <input className="field-input" value={pageDraft.title} onChange={(e) => setPageDraft((d) => ({ ...d, title: e.target.value }))} placeholder="My landing page" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="field-label">Slug (URL path)</label>
            <input className="field-input" value={pageDraft.slug} onChange={(e) => setPageDraft((d) => ({ ...d, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} placeholder="my-landing-page" />
          </div>
          <div className="field" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
            <label className="field-label">Meta description (SEO)</label>
            <input className="field-input" value={pageDraft.metaDescription} onChange={(e) => setPageDraft((d) => ({ ...d, metaDescription: e.target.value }))} placeholder="Brief description for search engines" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="field-label">Social preview image (Open Graph)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="field-input" value={pageDraft.ogImage} onChange={(e) => setPageDraft((d) => ({ ...d, ogImage: e.target.value }))} placeholder="https://…" style={{ flex: 1 }} />
              <Button type="button" variant="secondary" size="sm" onClick={() => { setPexelsTarget('ogImage'); setPexelsPickerOpen(true); setPexelsQuery(''); setPexelsResults([]); }}>Search Pexels</Button>
            </div>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="field-label">Canonical URL (optional)</label>
            <input className="field-input" value={pageDraft.canonicalUrl} onChange={(e) => setPageDraft((d) => ({ ...d, canonicalUrl: e.target.value }))} placeholder="Leave blank to use this page's own URL" />
          </div>
          <div className="field" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
            <label className="field-label">Custom domain (optional)</label>
            <input className="field-input" value={pageDraft.customDomain} onChange={(e) => setPageDraft((d) => ({ ...d, customDomain: e.target.value.toLowerCase() }))} placeholder="www.example.com" />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Point a CNAME record for this domain to your app's host to connect it to this page.</div>
          </div>
          <div className="field" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
            <label className="field-label" style={{ display: 'block', marginTop: 8 }}>Tracking &amp; Ads</label>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Wire up conversion tracking for paid campaigns pointed at this page. Leave blank to skip.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <input className="field-input" value={pageDraft.gaMeasurementId} onChange={(e) => setPageDraft((d) => ({ ...d, gaMeasurementId: e.target.value }))} placeholder="GA Measurement ID (G-XXXXXXXXXX)" />
              <input className="field-input" value={pageDraft.metaPixelId} onChange={(e) => setPageDraft((d) => ({ ...d, metaPixelId: e.target.value }))} placeholder="Meta Pixel ID" />
              <input className="field-input" value={pageDraft.googleAdsConversionId} onChange={(e) => setPageDraft((d) => ({ ...d, googleAdsConversionId: e.target.value }))} placeholder="Google Ads Conversion ID (AW-XXXXXXXXX)" />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: editingBlock ? '1fr 360px' : '1fr', gap: 16, alignItems: 'start' }}>
        {/* Block list */}
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
            Blocks ({pageDraft.blocks.length})
          </div>
          {pageDraft.blocks.length === 0 && (
            <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No blocks yet. Add a block below to start building your page.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {pageDraft.blocks.map((block, idx) => (
              <div
                key={block.id || idx}
                className="card"
                draggable
                onDragStart={() => setDragBlockIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); reorderBlocks(dragBlockIdx, idx); setDragBlockIdx(null); }}
                onDragEnd={() => setDragBlockIdx(null)}
                style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, border: editingBlock?.id === block.id ? '2px solid var(--primary)' : undefined, opacity: dragBlockIdx === idx ? 0.5 : 1, cursor: 'grab' }}
              >
                <span style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1 }} title="Drag to reorder">⠿</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, textTransform: 'capitalize' }}>{block.type}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {block.heading || block.title || block.url || (block.type === 'spacer' ? `${block.height}px` : block.type)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="ctag" onClick={() => { setEditingBlock(block); setBlockDraft({ ...block }); }}>Edit</button>
                  <button className="ctag" style={{ color: 'var(--danger)' }} onClick={() => deleteBlock(block.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>

          {/* Add block */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={addingBlockType} onChange={(e) => setAddingBlockType(e.target.value)}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 10px', color: 'var(--text)', fontSize: 13, flex: 1 }}>
              <option value="">+ Add block…</option>
              {Object.keys(BLOCK_DEFAULTS).map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
            <button className="primary-btn" onClick={() => addBlock(addingBlockType)} disabled={!addingBlockType}>Add</button>
          </div>
        </div>

        {/* Block editor panel */}
        {editingBlock && (
          <div className="card" style={{ padding: '18px 20px', position: 'sticky', top: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, textTransform: 'capitalize' }}>Edit {blockDraft.type} block</div>

            {/* Hero */}
            {blockDraft.type === 'hero' && (<>
              <div className="field"><label className="field-label">Heading</label><input className="field-input" value={blockDraft.heading || ''} onChange={(e) => setBlockDraft((d) => ({ ...d, heading: e.target.value }))} /></div>
              <div className="field"><label className="field-label">Subheading</label><input className="field-input" value={blockDraft.subheading || ''} onChange={(e) => setBlockDraft((d) => ({ ...d, subheading: e.target.value }))} /></div>
              <div className="field"><label className="field-label">CTA button text</label><input className="field-input" value={blockDraft.ctaText || ''} onChange={(e) => setBlockDraft((d) => ({ ...d, ctaText: e.target.value }))} /></div>
              <div className="field"><label className="field-label">CTA button URL</label><input className="field-input" value={blockDraft.ctaUrl || ''} onChange={(e) => setBlockDraft((d) => ({ ...d, ctaUrl: e.target.value }))} placeholder="https://…" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="field"><label className="field-label">Background colour</label><input type="color" value={blockDraft.bgColor || '#2563eb'} onChange={(e) => setBlockDraft((d) => ({ ...d, bgColor: e.target.value }))} style={{ width: '100%', height: 38, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }} /></div>
                <div className="field"><label className="field-label">Text colour</label><input type="color" value={blockDraft.textColor || '#ffffff'} onChange={(e) => setBlockDraft((d) => ({ ...d, textColor: e.target.value }))} style={{ width: '100%', height: 38, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }} /></div>
              </div>
              <div className="field"><label className="field-label">Alignment</label>
                <select className="field-input" value={blockDraft.align || 'center'} onChange={(e) => setBlockDraft((d) => ({ ...d, align: e.target.value }))}>
                  <option value="center">Center</option><option value="left">Left</option>
                </select>
              </div>
            </>)}

            {/* Text */}
            {blockDraft.type === 'text' && (<>
              <div className="field"><label className="field-label">Heading (optional)</label><input className="field-input" value={blockDraft.heading || ''} onChange={(e) => setBlockDraft((d) => ({ ...d, heading: e.target.value }))} /></div>
              <div className="field"><label className="field-label">Body text</label><textarea className="field-input" rows={5} value={blockDraft.body || ''} onChange={(e) => setBlockDraft((d) => ({ ...d, body: e.target.value }))} /></div>
            </>)}

            {/* Features */}
            {blockDraft.type === 'features' && (<>
              <div className="field"><label className="field-label">Section heading</label><input className="field-input" value={blockDraft.heading || ''} onChange={(e) => setBlockDraft((d) => ({ ...d, heading: e.target.value }))} /></div>
              {(blockDraft.items || []).map((item, i) => (
                <div key={i} className="card" style={{ padding: '10px 12px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Feature {i + 1}
                    {blockDraft.items.length > 1 && <button className="ctag" style={{ color: 'var(--danger)', fontSize: 11 }} onClick={() => setBlockDraft((d) => ({ ...d, items: d.items.filter((_, idx) => idx !== i) }))}>Remove</button>}
                  </div>
                  <input className="field-input" value={item.icon || ''} onChange={(e) => { const items = [...blockDraft.items]; items[i] = { ...item, icon: e.target.value }; setBlockDraft((d) => ({ ...d, items })); }} placeholder="Icon or emoji (e.g. ✓)" style={{ marginBottom: 6 }} />
                  <input className="field-input" value={item.title || ''} onChange={(e) => { const items = [...blockDraft.items]; items[i] = { ...item, title: e.target.value }; setBlockDraft((d) => ({ ...d, items })); }} placeholder="Feature title" style={{ marginBottom: 6 }} />
                  <input className="field-input" value={item.desc || ''} onChange={(e) => { const items = [...blockDraft.items]; items[i] = { ...item, desc: e.target.value }; setBlockDraft((d) => ({ ...d, items })); }} placeholder="Short description" />
                </div>
              ))}
              <button className="ctag" onClick={() => setBlockDraft((d) => ({ ...d, items: [...(d.items || []), { icon: '✓', title: '', desc: '' }] }))}>+ Add feature</button>
            </>)}

            {/* CTA */}
            {blockDraft.type === 'cta' && (<>
              <div className="field"><label className="field-label">Heading</label><input className="field-input" value={blockDraft.heading || ''} onChange={(e) => setBlockDraft((d) => ({ ...d, heading: e.target.value }))} /></div>
              <div className="field"><label className="field-label">Body text</label><textarea className="field-input" rows={3} value={blockDraft.body || ''} onChange={(e) => setBlockDraft((d) => ({ ...d, body: e.target.value }))} /></div>
              <div className="field"><label className="field-label">Button text</label><input className="field-input" value={blockDraft.buttonText || ''} onChange={(e) => setBlockDraft((d) => ({ ...d, buttonText: e.target.value }))} /></div>
              <div className="field"><label className="field-label">Button URL</label><input className="field-input" value={blockDraft.buttonUrl || ''} onChange={(e) => setBlockDraft((d) => ({ ...d, buttonUrl: e.target.value }))} placeholder="https://…" /></div>
              <div className="field"><label className="field-label">Background colour</label><input type="color" value={blockDraft.bgColor || '#f8fafc'} onChange={(e) => setBlockDraft((d) => ({ ...d, bgColor: e.target.value }))} style={{ width: '100%', height: 38, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }} /></div>
            </>)}

            {/* Testimonials */}
            {blockDraft.type === 'testimonials' && (<>
              <div className="field"><label className="field-label">Section heading</label><input className="field-input" value={blockDraft.heading || ''} onChange={(e) => setBlockDraft((d) => ({ ...d, heading: e.target.value }))} /></div>
              {(blockDraft.items || []).map((item, i) => (
                <div key={i} className="card" style={{ padding: '10px 12px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Testimonial {i + 1}
                    {blockDraft.items.length > 1 && <button className="ctag" style={{ color: 'var(--danger)', fontSize: 11 }} onClick={() => setBlockDraft((d) => ({ ...d, items: d.items.filter((_, idx) => idx !== i) }))}>Remove</button>}
                  </div>
                  <textarea className="field-input" rows={3} value={item.quote || ''} onChange={(e) => { const items = [...blockDraft.items]; items[i] = { ...item, quote: e.target.value }; setBlockDraft((d) => ({ ...d, items })); }} placeholder="Quote…" style={{ marginBottom: 6 }} />
                  <input className="field-input" value={item.author || ''} onChange={(e) => { const items = [...blockDraft.items]; items[i] = { ...item, author: e.target.value }; setBlockDraft((d) => ({ ...d, items })); }} placeholder="Author name" style={{ marginBottom: 6 }} />
                  <input className="field-input" value={item.role || ''} onChange={(e) => { const items = [...blockDraft.items]; items[i] = { ...item, role: e.target.value }; setBlockDraft((d) => ({ ...d, items })); }} placeholder="Role / company" />
                </div>
              ))}
              <button className="ctag" onClick={() => setBlockDraft((d) => ({ ...d, items: [...(d.items || []), { quote: '', author: '', role: '' }] }))}>+ Add testimonial</button>
            </>)}

            {/* Image */}
            {blockDraft.type === 'image' && (<>
              <div className="field">
                <label className="field-label">Image URL</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input className="field-input" value={blockDraft.url || ''} onChange={(e) => setBlockDraft((d) => ({ ...d, url: e.target.value }))} placeholder="https://…" style={{ flex: 1 }} />
                  <Button type="button" variant="secondary" size="sm" onClick={() => { setPexelsTarget('block'); setPexelsPickerOpen(true); setPexelsQuery(''); setPexelsResults([]); }}>Search Pexels</Button>
                </div>
              </div>
              {blockDraft.url && <img src={blockDraft.url} alt="" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 6, marginTop: -6, marginBottom: 10 }} />}
              <div className="field"><label className="field-label">Alt text</label><input className="field-input" value={blockDraft.alt || ''} onChange={(e) => setBlockDraft((d) => ({ ...d, alt: e.target.value }))} /></div>
              <div className="field"><label className="field-label">Caption (optional)</label><input className="field-input" value={blockDraft.caption || ''} onChange={(e) => setBlockDraft((d) => ({ ...d, caption: e.target.value }))} /></div>
            </>)}

            {/* Columns */}
            {blockDraft.type === 'columns' && (<>
              <div className="field">
                <label className="field-label">Number of columns</label>
                <select className="field-input" value={blockDraft.columns || 2} onChange={(e) => {
                  const n = Number(e.target.value);
                  setBlockDraft((d) => {
                    const items = [...(d.items || [])];
                    while (items.length < n) items.push({ heading: '', body: '', imageUrl: '' });
                    return { ...d, columns: n, items: items.slice(0, n) };
                  });
                }}>
                  <option value={2}>2 columns</option>
                  <option value={3}>3 columns</option>
                </select>
              </div>
              {Array.from({ length: blockDraft.columns || 2 }).map((_, i) => (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6, color: 'var(--text-muted)' }}>Column {i + 1}</div>
                  <div className="field"><label className="field-label">Heading</label><input className="field-input" value={blockDraft.items?.[i]?.heading || ''} onChange={(e) => setBlockDraft((d) => { const items = [...(d.items || [])]; items[i] = { ...items[i], heading: e.target.value }; return { ...d, items }; })} /></div>
                  <div className="field"><label className="field-label">Body</label><textarea className="field-input" rows={3} value={blockDraft.items?.[i]?.body || ''} onChange={(e) => setBlockDraft((d) => { const items = [...(d.items || [])]; items[i] = { ...items[i], body: e.target.value }; return { ...d, items }; })} /></div>
                  <div className="field"><label className="field-label">Image URL (optional)</label><input className="field-input" value={blockDraft.items?.[i]?.imageUrl || ''} onChange={(e) => setBlockDraft((d) => { const items = [...(d.items || [])]; items[i] = { ...items[i], imageUrl: e.target.value }; return { ...d, items }; })} placeholder="https://…" /></div>
                </div>
              ))}
            </>)}

            {/* Video */}
            {blockDraft.type === 'video' && (<>
              <div className="field"><label className="field-label">YouTube or Vimeo URL</label><input className="field-input" value={blockDraft.url || ''} onChange={(e) => setBlockDraft((d) => ({ ...d, url: e.target.value }))} placeholder="https://youtube.com/watch?v=…" /></div>
              <div className="field"><label className="field-label">Heading (optional)</label><input className="field-input" value={blockDraft.heading || ''} onChange={(e) => setBlockDraft((d) => ({ ...d, heading: e.target.value }))} /></div>
            </>)}

            {/* Spacer */}
            {blockDraft.type === 'spacer' && (
              <div className="field"><label className="field-label">Height (px)</label><input className="field-input" type="number" min={8} max={400} value={blockDraft.height || 40} onChange={(e) => setBlockDraft((d) => ({ ...d, height: Number(e.target.value) }))} /></div>
            )}

            {/* Divider */}
            {blockDraft.type === 'divider' && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>A horizontal divider line. No configuration needed.</p>}

            {/* Nav */}
            {blockDraft.type === 'nav' && (<>
              <div className="field"><label className="field-label">Logo text</label><input className="field-input" value={blockDraft.logoText || ''} onChange={(e) => setBlockDraft((d) => ({ ...d, logoText: e.target.value }))} /></div>
              <div className="field"><label className="field-label">Home link URL</label><input className="field-input" value={blockDraft.homeHref || ''} onChange={(e) => setBlockDraft((d) => ({ ...d, homeHref: e.target.value }))} placeholder="/p/your-home-slug" /></div>
              {(blockDraft.links || []).map((link, i) => (
                <div key={i} className="card" style={{ padding: '10px 12px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Link {i + 1}
                    <button className="ctag" style={{ color: 'var(--danger)', fontSize: 11 }} onClick={() => setBlockDraft((d) => ({ ...d, links: d.links.filter((_, idx) => idx !== i) }))}>Remove</button>
                  </div>
                  <input className="field-input" value={link.label || ''} onChange={(e) => { const links = [...blockDraft.links]; links[i] = { ...link, label: e.target.value }; setBlockDraft((d) => ({ ...d, links })); }} placeholder="Label (e.g. About)" style={{ marginBottom: 6 }} />
                  <input className="field-input" value={link.href || ''} onChange={(e) => { const links = [...blockDraft.links]; links[i] = { ...link, href: e.target.value }; setBlockDraft((d) => ({ ...d, links })); }} placeholder="/p/about-slug" />
                </div>
              ))}
              <button className="ctag" onClick={() => setBlockDraft((d) => ({ ...d, links: [...(d.links || []), { label: '', href: '' }] }))}>+ Add link</button>
              <div className="field" style={{ marginTop: 10 }}><label className="field-label">CTA button text (optional)</label><input className="field-input" value={blockDraft.ctaText || ''} onChange={(e) => setBlockDraft((d) => ({ ...d, ctaText: e.target.value }))} /></div>
              <div className="field"><label className="field-label">CTA button URL</label><input className="field-input" value={blockDraft.ctaHref || ''} onChange={(e) => setBlockDraft((d) => ({ ...d, ctaHref: e.target.value }))} placeholder="/p/contact-slug" /></div>
            </>)}

            {/* Footer */}
            {blockDraft.type === 'footer' && (<>
              <div className="field"><label className="field-label">Logo / business name</label><input className="field-input" value={blockDraft.logoText || ''} onChange={(e) => setBlockDraft((d) => ({ ...d, logoText: e.target.value }))} /></div>
              {(blockDraft.links || []).map((link, i) => (
                <div key={i} className="card" style={{ padding: '10px 12px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Link {i + 1}
                    <button className="ctag" style={{ color: 'var(--danger)', fontSize: 11 }} onClick={() => setBlockDraft((d) => ({ ...d, links: d.links.filter((_, idx) => idx !== i) }))}>Remove</button>
                  </div>
                  <input className="field-input" value={link.label || ''} onChange={(e) => { const links = [...blockDraft.links]; links[i] = { ...link, label: e.target.value }; setBlockDraft((d) => ({ ...d, links })); }} placeholder="Label" style={{ marginBottom: 6 }} />
                  <input className="field-input" value={link.href || ''} onChange={(e) => { const links = [...blockDraft.links]; links[i] = { ...link, href: e.target.value }; setBlockDraft((d) => ({ ...d, links })); }} placeholder="/p/slug" />
                </div>
              ))}
              <button className="ctag" onClick={() => setBlockDraft((d) => ({ ...d, links: [...(d.links || []), { label: '', href: '' }] }))}>+ Add link</button>
              <div className="field" style={{ marginTop: 10 }}><label className="field-label">Copyright text</label><input className="field-input" value={blockDraft.copyright || ''} onChange={(e) => setBlockDraft((d) => ({ ...d, copyright: e.target.value }))} placeholder="© 2026 Your Business. All rights reserved." /></div>
            </>)}

            {/* Form */}
            {blockDraft.type === 'form' && (<>
              <div className="field"><label className="field-label">Heading</label><input className="field-input" value={blockDraft.heading || ''} onChange={(e) => setBlockDraft((d) => ({ ...d, heading: e.target.value }))} /></div>
              <div className="field"><label className="field-label">Subheading (optional)</label><input className="field-input" value={blockDraft.subheading || ''} onChange={(e) => setBlockDraft((d) => ({ ...d, subheading: e.target.value }))} /></div>
              <div className="field">
                <label className="field-label">Lead form to embed</label>
                {blockFormOptionsLoading ? (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading forms…</p>
                ) : (
                  <select className="field-input" value={blockDraft.formId || ''} onChange={(e) => setBlockDraft((d) => ({ ...d, formId: e.target.value }))}>
                    <option value="">Select a form…</option>
                    {blockFormOptions.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                )}
              </div>
              <Button type="button" variant="secondary" size="sm" loading={blockFormCreating} onClick={createQuickLeadForm}>+ Create a new contact form</Button>
              {!blockDraft.formId && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Pick or create a form — submissions land in Lead Generation.</p>}
            </>)}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="primary-btn" onClick={saveBlockDraft}>Apply</button>
              <button className="back-link" onClick={() => { setEditingBlock(null); setBlockDraft({}); }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Pexels Search Modal */}
      {pexelsPickerOpen && (
        <Modal isOpen title="Search Pexels" description="Pick a free stock photo for this page or block." onClose={() => setPexelsPickerOpen(false)}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <SearchInput
                value={pexelsQuery}
                onChange={(e) => setPexelsQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') searchPexels(pexelsQuery); }}
                placeholder="e.g. gym workout, luxury interior…"
                autoFocus
              />
            </div>
            <Button size="sm" onClick={() => searchPexels(pexelsQuery)} loading={pexelsLoading}>Search</Button>
          </div>
          {pexelsResults.length === 0 ? (
            <EmptyState icon="🖼️" title={pexelsLoading ? 'Searching…' : 'Search for a photo'} description={pexelsLoading ? '' : 'Try a category or subject, like "restaurant food" or "office team".'} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, maxHeight: '50vh', overflowY: 'auto' }}>
              {pexelsResults.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => {
                    if (pexelsTarget === 'ogImage') {
                      setPageDraft((d) => ({ ...d, ogImage: img.url }));
                    } else {
                      setBlockDraft((d) => ({ ...d, url: img.url, alt: d.alt || img.alt || '' }));
                    }
                    setPexelsPickerOpen(false);
                  }}
                  style={{ padding: 0, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: 'none' }}
                >
                  <img src={img.thumbnail} alt={img.alt} style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }} />
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
