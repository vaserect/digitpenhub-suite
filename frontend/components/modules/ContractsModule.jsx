'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';
import Badge from '../ui/Badge';

export default function ContractsModule({ goHome }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ title: '', description: '', content: '', parties: [] });
  const [viewing, setViewing] = useState(null);
  const [signaturePad, setSignaturePad] = useState(null);
  const [signingName, setSigningName] = useState('');
  const [showDelete, setShowDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = tab !== 'all' ? `?status=${tab}` : '';
      const d = await apiFetch(`/api/v1/contracts${params}`);
      setContracts(d.contracts || []);
    } catch { toast.error('Failed to load contracts'); }
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function createContract(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/contracts', { method: 'POST', body: JSON.stringify(draft) });
      toast.success('Contract created');
      setShowForm(false);
      setDraft({ title: '', description: '', content: '', parties: [] });
      load();
    } catch (err) { toast.error(err.message); }
  }

  async function deleteContract(id) {
    try {
      await apiFetch(`/api/v1/contracts/${id}`, { method: 'DELETE' });
      toast.success('Contract deleted');
      setShowDelete(null);
      load();
    } catch { toast.error('Failed to delete'); }
  }

  async function sendForSignature(id) {
    try {
      await apiFetch(`/api/v1/contracts/${id}/send`, { method: 'POST' });
      toast.success('Sent for signature');
      load();
    } catch (err) { toast.error(err.message); }
  }

  async function submitSignature(id) {
    try {
      await apiFetch(`/api/v1/contracts/${id}/sign`, {
        method: 'POST',
        body: JSON.stringify({ partyName: signingName, signatureData: signaturePad }),
      });
      toast.success('Contract signed!');
      setSignaturePad(null);
      setSigningName('');
      load();
    } catch (err) { toast.error(err.message); }
  }

  async function loadDetail(id) {
    try {
      const d = await apiFetch(`/api/v1/contracts/${id}`);
      setViewing(d);
    } catch { toast.error('Failed to load contract'); }
  }

  const statusColor = (s) => {
    if (s === 'draft') return 'var(--text-muted)';
    if (s === 'sent') return 'var(--warning)';
    if (s === 'signed') return 'var(--success)';
    if (s === 'expired') return 'var(--danger)';
    return 'var(--text-muted)';
  };

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <div>
          <h1>Contracts &amp; E-Signatures</h1>
          <p className="module-sub">Create, send, and sign contracts digitally.</p>
        </div>
      </div>

      <div className="invoice-tabs" style={{ marginBottom: 16 }}>
        {[{ k: 'all', l: 'All' }, { k: 'draft', l: 'Drafts' }, { k: 'sent', l: 'Sent' }, { k: 'signed', l: 'Signed' }].map((t) => (
          <button key={t.k} className={`invoice-tab${tab === t.k ? ' active' : ''}`} onClick={() => setTab(t.k)}>{t.l}</button>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <Button onClick={() => setShowForm(true)}>+ New Contract</Button>
      </div>

      <Modal isOpen={showForm} title="Create Contract" onClose={() => setShowForm(false)} size="lg">
        <form onSubmit={createContract}>
          <div className="field">
            <label className="field-label">Title *</label>
            <input className="field-input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required />
          </div>
          <div className="field">
            <label className="field-label">Description</label>
            <textarea className="field-input" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} />
          </div>
          <div className="field">
            <label className="field-label">Contract content (markdown/HTML)</label>
            <textarea className="field-input" value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} rows={8} style={{ fontFamily: 'monospace' }} />
          </div>
          <div className="field">
            <label className="field-label">Parties (one per line: Name &lt;email&gt;)</label>
            <textarea className="field-input" value={draft.parties.join('\n')} onChange={(e) => setDraft({ ...draft, parties: e.target.value.split('\n').filter(Boolean) })} rows={3} placeholder="John Doe <john@example.com>" />
          </div>
          <Button type="submit">Create Contract</Button>
        </form>
      </Modal>

      {loading ? <SkeletonRows rows={5} /> : contracts.length === 0 ? (
        <EmptyState icon="📝" title="No contracts yet" description="Create your first contract and send it for e-signature." action={<Button onClick={() => setShowForm(true)}>+ New Contract</Button>} />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Title</th><th>Status</th><th>Parties</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => loadDetail(c.id)}>{c.title}</td>
                  <td><span style={{ color: statusColor(c.status), fontWeight: 600 }}>{c.status}</span></td>
                  <td style={{ fontSize: '0.8rem' }}>{(c.parties || []).length} party(s)</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Button variant="ghost" size="sm" onClick={() => loadDetail(c.id)}>View</Button>
                      {c.status === 'draft' && <Button variant="ghost" size="sm" onClick={() => sendForSignature(c.id)}>Send</Button>}
                      <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }} onClick={() => setShowDelete(c.id)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewing && (
        <Modal isOpen={true} title={viewing.contract.title} onClose={() => setViewing(null)} size="lg">
          <div style={{ fontSize: '0.85rem', lineHeight: 1.7, maxHeight: '50vh', overflowY: 'auto', whiteSpace: 'pre-wrap', marginBottom: 16, padding: 12, background: 'var(--surface-muted)', borderRadius: 8 }}>
            {viewing.contract.content || 'No content.'}
          </div>
          {viewing.signatures?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Signatures</div>
              {viewing.signatures.map((s) => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '6px 10px', background: 'var(--surface-muted)', borderRadius: 6, marginBottom: 4 }}>
                  <span>{s.party_name} ({s.party_email})</span>
                  <span style={{ color: s.signed_at ? 'var(--success)' : 'var(--text-muted)' }}>{s.signed_at ? `Signed ${new Date(s.signed_at).toLocaleString()}` : 'Pending'}</span>
                </div>
              ))}
            </div>
          )}
          {viewing.contract.status !== 'signed' && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Sign this contract</div>
              <input className="form-input" placeholder="Your name" value={signingName} onChange={(e) => setSigningName(e.target.value)} style={{ marginBottom: 8 }} />
              <textarea className="form-input" placeholder="Type your full name as electronic signature" value={signaturePad || ''} onChange={(e) => setSignaturePad(e.target.value)} rows={2} />
              <Button onClick={() => submitSignature(viewing.contract.id)} disabled={!signingName || !signaturePad}>Sign &amp; Submit</Button>
            </div>
          )}
        </Modal>
      )}

      {showDelete && (
        <Modal isOpen title="Delete contract?" description="This cannot be undone." onClose={() => setShowDelete(null)}>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="danger" onClick={() => deleteContract(showDelete)}>Delete</Button>
            <Button variant="secondary" onClick={() => setShowDelete(null)}>Cancel</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
