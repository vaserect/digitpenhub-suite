'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';

export default function QrCodeGeneratorModule({ goHome, showToast }) {
  const [qrLoaded, setQrLoaded] = useState(false);
  const [qrCodes, setQrCodes] = useState([]);
  const [qrStats, setQrStats] = useState(null);
  const [qrForm, setQrForm] = useState(false);
  const [qrConfirmDelete, setQrConfirmDelete] = useState(null);
  const [qrDeleting, setQrDeleting] = useState(false);

  // Draft State
  const [qrDraft, setQrDraft] = useState({
    title: '',
    content: '',
    type: 'url',
    color: '#000000',
    bgColor: '#ffffff',
    size: 200
  });

  const loadQrCodes = useCallback(async () => {
    try {
      const [s, l] = await Promise.all([
        apiFetch('/api/v1/qr-codes/stats'),
        apiFetch('/api/v1/qr-codes/')
      ]);
      setQrStats(s);
      setQrCodes(l.qrCodes || []);
      setQrLoaded(true);
    } catch {
      setQrLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadQrCodes();
  }, [loadQrCodes]);

  async function handleSaveQrCode(e) {
    e.preventDefault();
    if (!qrDraft.title.trim() || !qrDraft.content.trim()) {
      showToast('Title and content are required.');
      return;
    }
    const data = await apiFetch('/api/v1/qr-codes/', { method: 'POST', body: JSON.stringify(qrDraft) });
    if (data.error) {
      showToast(data.error);
      return;
    }
    setQrForm(false);
    setQrDraft({ title: '', content: '', type: 'url', color: '#000000', bgColor: '#ffffff', size: 200 });
    showToast('QR code created.');
    await loadQrCodes();
  }

  function handleDeleteQrCode(id) {
    setQrConfirmDelete({ id });
  }

  async function confirmQrDelete() {
    if (!qrConfirmDelete) return;
    setQrDeleting(true);
    try {
      await apiFetch(`/api/v1/qr-codes/${qrConfirmDelete.id}`, { method: 'DELETE' });
      setQrCodes((q) => q.filter((x) => x.id !== qrConfirmDelete.id));
      showToast('QR code deleted.');
      const s = await apiFetch('/api/v1/qr-codes/stats');
      setQrStats(s);
    } catch (err) {
      showToast('Failed to delete QR code.');
    } finally {
      setQrDeleting(false);
      setQrConfirmDelete(null);
    }
  }

  function buildQrUrl(content, size = 200, color = '000000', bgColor = 'ffffff') {
    const c = color.replace('#', '');
    const bg = bgColor.replace('#', '');
    return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(content)}&size=${size}x${size}&color=${c}&bgcolor=${bg}`;
  }

  return (
    <div className="panel" style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <button className="back-link" onClick={goHome} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', fontWeight: 500, fontSize: '0.875rem', padding: 0, marginBottom: '0.5rem' }}>
            ← Back to Workspace
          </button>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)' }}>QR Code Generator</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.875rem' }}>
            Generate trackable QR codes for links, WiFi, vCards, SMS, and more. Part of Lead Generation.
          </p>
        </div>
        {!qrForm && (
          <Button onClick={() => { setQrDraft({ title: '', content: '', type: 'url', color: '#000000', bgColor: '#ffffff', size: 200 }); setQrForm(true); }}>
            + New QR Code
          </Button>
        )}
      </div>

      {qrStats && !qrForm && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total QR Codes</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>{qrStats.total || 0}</span>
          </div>
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Scans</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{qrStats.total_scans || 0}</span>
          </div>
        </div>
      )}

      {qrForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '1.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
            <form onSubmit={handleSaveQrCode}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600 }}>Create QR Code</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Title *</label>
                  <input className="form-input" placeholder="Campaign, Storefront, etc." value={qrDraft.title} onChange={(e) => setQrDraft((d) => ({ ...d, title: e.target.value }))} required style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>QR Type</label>
                  <select className="form-input" value={qrDraft.type} onChange={(e) => setQrDraft((d) => ({ ...d, type: e.target.value }))} style={{ width: '100%' }}>
                    <option value="url">URL (Trackable)</option>
                    <option value="text">Static Text</option>
                    <option value="email">Email Address</option>
                    <option value="phone">Phone Number</option>
                    <option value="sms">SMS Message</option>
                    <option value="wifi">WiFi Network</option>
                    <option value="vcard">vCard Contact</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Content *</label>
                  <textarea className="form-input" placeholder={qrDraft.type === 'url' ? 'https://example.com' : qrDraft.type === 'wifi' ? 'WIFI:S:NetworkName;T:WPA;P:password;;' : qrDraft.type === 'vcard' ? 'BEGIN:VCARD\nFN:Name\nTEL:+234...\nEND:VCARD' : 'Enter QR code content'} value={qrDraft.content} onChange={(e) => setQrDraft((d) => ({ ...d, content: e.target.value }))} required style={{ width: '100%', minHeight: 70 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '0.2rem' }}>Foreground Color</label>
                    <input type="color" value={qrDraft.color} onChange={(e) => setQrDraft((d) => ({ ...d, color: e.target.value }))} style={{ height: 36, width: '100%', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '0.2rem' }}>Background Color</label>
                    <input type="color" value={qrDraft.bgColor} onChange={(e) => setQrDraft((d) => ({ ...d, bgColor: e.target.value }))} style={{ height: 36, width: '100%', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '0.2rem' }}>Size: {qrDraft.size}px</label>
                  <input type="range" min={100} max={400} step={50} value={qrDraft.size} onChange={(e) => setQrDraft((d) => ({ ...d, size: Number(e.target.value) }))} style={{ width: '100%', cursor: 'pointer' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button type="submit">Save QR Code</Button>
                <Button variant="ghost" type="button" onClick={() => setQrForm(false)}>Cancel</Button>
              </div>
            </form>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem' }}>
              {qrDraft.content ? (
                <>
                  <img src={buildQrUrl(qrDraft.content, qrDraft.size, qrDraft.color, qrDraft.bgColor)} alt="QR Preview" style={{ maxWidth: 200, border: '1px solid var(--border)', borderRadius: 8, marginBottom: '0.5rem', background: '#fff' }} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: 0 }}>Live preview</p>
                </>
              ) : (
                <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Enter content to preview</p>
              )}
            </div>
          </div>
        </div>
      )}

      {!qrForm && (
        !qrLoaded ? (
          <SkeletonRows rows={3} />
        ) : qrCodes.length === 0 ? (
          <EmptyState icon="▦" title="No QR codes yet" description="Create your first QR code to start tracking scans." action={<Button onClick={() => setQrForm(true)}>+ New QR Code</Button>} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {qrCodes.map((q) => {
              const trackableContent = q.type === 'url' ? `${window.location.origin}/api/v1/qr-codes/r/${q.id}` : q.content;
              return (
                <div key={q.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '1rem', background: 'var(--surface)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img src={buildQrUrl(trackableContent, 160, q.color, q.bg_color)} alt={q.title} style={{ width: 160, height: 160, border: '1px solid var(--border)', borderRadius: 4, marginBottom: '0.5rem', background: '#fff' }} />
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', color: 'var(--text)' }}>
                    {q.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
                    <span className="ctag" style={{ marginRight: 4 }}>{q.type}</span>
                    {q.scans || 0} scans
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center', flexWrap: 'wrap', width: '100%', marginTop: 'auto' }}>
                    <a href={buildQrUrl(trackableContent, 400, q.color, q.bg_color)} download={`${q.title}.png`} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: '0.7rem', textDecoration: 'none', padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 4 }}>
                      Download
                    </a>
                    <Button variant="ghost" size="sm" style={{ fontSize: '0.7rem' }} onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/qr/${q.id}`); showToast('QR code link copied.'); }}>
                      Link
                    </Button>
                    <Button variant="ghost" size="sm" style={{ color: 'var(--danger)', fontSize: '0.7rem' }} onClick={() => handleDeleteQrCode(q.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      <ConfirmDialog
        isOpen={!!qrConfirmDelete}
        onClose={() => setQrConfirmDelete(null)}
        onConfirm={confirmQrDelete}
        title="Delete QR code?"
        description="Anyone who scans this code afterward will get an error. This can't be undone."
        confirmLabel="Delete"
        danger
        loading={qrDeleting}
      />
    </div>
  );
}
