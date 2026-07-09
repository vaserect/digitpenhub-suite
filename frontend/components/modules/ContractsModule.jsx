'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';
import Badge from '../ui/Badge';
import SearchInput from '../ui/SearchInput';
import Pagination from '../ui/Pagination';
import BulkActionBar from '../ui/BulkActionBar';
import { useHotkey, useSearchHotkey } from '../../lib/hotkeys';

export default function ContractsModule({ goHome }) {
  const [contracts, setContracts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ title: '', description: '', content: '', parties: [] });
  const [viewing, setViewing] = useState(null);
  const [signingName, setSigningName] = useState('');
  const [signaturePad, setSignaturePad] = useState('');
  const [showDelete, setShowDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useSearchHotkey();
  useHotkey('n', () => { setShowForm(true); setDraft({ title: '', description: '', content: '', parties: [] }); });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = tab !== 'all' ? `?status=${tab}` : '';
      const [d, s] = await Promise.all([
        apiFetch(`/api/v1/contracts${params}`),
        apiFetch('/api/v1/contracts/stats'),
      ]);
      setContracts(d.contracts || []);
      setStats(s.stats || null);
    } catch { toast.error('Failed to load contracts'); }
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contracts;
    return contracts.filter(c => (c.title||'').toLowerCase().includes(q) || (c.description||'').toLowerCase().includes(q));
  }, [contracts, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [search, tab]);

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
      setShowDelete(null);
      load();
    } catch (err) { toast.error(err.message); }
  }

  async function loadDetail(id) {
    try {
      const d = await apiFetch(`/api/v1/contracts/${id}`);
      setViewing(d);
    } catch { toast.error('Failed to load contract'); }
  }

  function exportCsv() {
    const cols = ['Title', 'Status', 'Parties', 'Created'];
    const rows = filtered.map(c => [c.title, c.status, (c.parties||[]).length, c.created_at ? new Date(c.created_at).toLocaleDateString() : '']);
    const csv = [cols.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `contracts-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(blob);
    toast.success('CSV exported');
  }

  const statusColor = (s) => {
    if (s === 'draft') return 'var(--text-muted)';
    if (s === 'sent') return 'var(--warning)';
    if (s === 'signed') return 'var(--success)';
    if (s === 'expired') return 'var(--danger)';
    return 'var(--text-muted)';
  };

  const tabTotal = t => t === 'all' ? contracts.length : contracts.filter(c => c.status === t).length;

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <div>
          <h1>Contracts &amp; E-Signatures</h1>
          <p className="module-sub">Create, send, and sign contracts digitally. <kbd style={{background:'var(--surface-muted)',padding:'2px 6px',borderRadius:4,fontSize:'0.72rem',color:'var(--text-muted)'}}>⌘N new</kbd> <kbd style={{background:'var(--surface-muted)',padding:'2px 6px',borderRadius:4,fontSize:'0.72rem',color:'var(--text-muted)'}}>⌘F search</kbd></p>
        </div>
        <Button onClick={() => { setShowForm(true); setDraft({ title: '', description: '', content: '', parties: [] }); }}>+ New Contract</Button>
      </div>

      {stats && (
        <div className="stats-row">
          <div className="stat-card"><div className="stat-value">{stats.total||0}</div><div className="stat-label">Total</div></div>
          <div className="stat-card"><div className="stat-value" style={{color:'var(--text-muted)'}}>{stats.draft||0}</div><div className="stat-label">Drafts</div></div>
          <div className="stat-card"><div className="stat-value" style={{color:'var(--warning)'}}>{stats.sent||0}</div><div className="stat-label">Sent</div></div>
          <div className="stat-card"><div className="stat-value" style={{color:'var(--success)'}}>{stats.signed||0}</div><div className="stat-label">Signed</div></div>
        </div>
      )}

      <div className="invoice-tabs" style={{marginBottom:16}}>
        {[{k:'all',l:'All'},{k:'draft',l:'Drafts'},{k:'sent',l:'Sent'},{k:'signed',l:'Signed'}].map(t=>(
          <button key={t.k} className={`invoice-tab${tab===t.k?' active':''}`} onClick={()=>setTab(t.k)}>
            {t.l} <span className="invoice-tab-count">{tabTotal(t.k)}</span>
          </button>
        ))}
      </div>

      {contracts.length > 0 && (
        <div className="toolbar-row">
          <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contracts…" data-hotkey-search />
          <Button variant="secondary" size="sm" onClick={exportCsv}>📥 CSV</Button>
        </div>
      )}

      <Modal isOpen={showForm} title="Create Contract" onClose={() => setShowForm(false)} size="lg">
        <form onSubmit={createContract}>
          <div className="field"><label className="field-label">Title *</label><input className="field-input" value={draft.title} onChange={e => setDraft({...draft,title:e.target.value})} required autoFocus /></div>
          <div className="field"><label className="field-label">Description</label><textarea className="field-input" value={draft.description} onChange={e => setDraft({...draft,description:e.target.value})} rows={2} /></div>
          <div className="field"><label className="field-label">Content (markdown/HTML)</label><textarea className="field-input" value={draft.content} onChange={e => setDraft({...draft,content:e.target.value})} rows={8} style={{fontFamily:'monospace'}} /></div>
          <div className="field"><label className="field-label">Parties (one per line: Name &lt;email&gt;)</label>
            <textarea className="field-input" value={Array.isArray(draft.parties) ? draft.parties.join('\n') : ''} onChange={e => setDraft({...draft,parties: e.target.value.split('\n').filter(Boolean)})} rows={3} placeholder="John Doe <john@example.com>" /></div>
          <div style={{display:'flex',gap:8}}><Button type="submit">Create</Button><Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Button></div>
        </form>
      </Modal>

      <BulkActionBar selectedCount={selected.length} onClearSelection={() => setSelected([])}
        actions={[{label: `Delete ${selected.length}`, variant: 'danger', requiresConfirm: true,
          onClick: async () => { try { await apiFetch('/api/v1/contracts/bulk-delete', { method: 'POST', body: JSON.stringify({ ids: selected }) }); toast.success('Deleted'); setSelected([]); load(); } catch { toast.error('Bulk delete failed'); }}
        }]} />

      {loading ? <SkeletonRows rows={5} /> : contracts.length === 0 ? (
        <EmptyState icon="📝" title="No contracts yet" action={<Button onClick={() => { setShowForm(true); setDraft({title:'',description:'',content:'',parties:[]}); }}>+ New Contract</Button>} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title="No matching contracts" />
      ) : (
        <><div className="table-wrap"><table className="data-table"><thead><tr>
          <th style={{width:32}}><input type="checkbox" checked={selected.length === pageRows.length && pageRows.length > 0} onChange={e => setSelected(e.target.checked ? pageRows.map(r => r.id) : [])} /></th>
          <th>Title</th><th>Status</th><th>Parties</th><th>Created</th><th>Actions</th>
        </tr></thead>
        <tbody>{pageRows.map(c => (
          <tr key={c.id}>
            <td onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.includes(c.id)} onChange={e => setSelected(e.target.checked ? [...selected, c.id] : selected.filter(id => id !== c.id))} /></td>
            <td style={{fontWeight:600,cursor:'pointer'}} onClick={() => loadDetail(c.id)}>{c.title}</td>
            <td><span style={{color:statusColor(c.status),fontWeight:600}}>{c.status}</span></td>
            <td style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{(c.parties||[]).length} party(s)</td>
            <td style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{new Date(c.created_at).toLocaleDateString()}</td>
            <td><div style={{display:'flex',gap:4}}>
              <Button variant="ghost" size="sm" onClick={() => loadDetail(c.id)}>View</Button>
              {c.status === 'draft' && <Button variant="ghost" size="sm" onClick={() => sendForSignature(c.id)}>Send</Button>}
              <Button variant="ghost" size="sm" style={{color:'var(--danger)'}} onClick={() => setShowDelete(c.id)}>Delete</Button>
            </div></td>
          </tr>
        ))}</tbody></table></div>
        {pageCount > 1 && <Pagination page={page} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />}</>
      )}

      {viewing && (
        <Modal isOpen title={viewing.contract.title} onClose={() => setViewing(null)} size="lg">
          <div className="stats-row" style={{marginBottom:16}}>
            <div className="stat-card"><div className="stat-value" style={{color:statusColor(viewing.contract.status)}}>{viewing.contract.status}</div><div className="stat-label">Status</div></div>
            <div className="stat-card"><div className="stat-value">{(viewing.contract.parties||[]).length}</div><div className="stat-label">Parties</div></div>
          </div>
          <div style={{fontSize:'0.85rem',lineHeight:1.7,maxHeight:'40vh',overflowY:'auto',whiteSpace:'pre-wrap',marginBottom:16,padding:12,background:'var(--surface-muted)',borderRadius:8}}>
            {viewing.contract.content || 'No content.'}
          </div>
          {viewing.signatures?.length > 0 && (
            <div style={{marginBottom:16}}>
              <div style={{fontWeight:600,marginBottom:8}}>Signatures</div>
              {viewing.signatures.map(s => (
                <div key={s.id} style={{display:'flex',justifyContent:'space-between',fontSize:'0.8rem',padding:'6px 10px',background:'var(--surface-muted)',borderRadius:6,marginBottom:4}}>
                  <span>{s.party_name} ({s.party_email})</span>
                  <span style={{color:s.signed_at?'var(--success)':'var(--text-muted)'}}>{s.signed_at?`Signed ${new Date(s.signed_at).toLocaleString()}`:'Pending'}</span>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {showDelete && (
        <Modal isOpen title="Delete contract?" description="This cannot be undone." onClose={() => setShowDelete(null)}>
          <div style={{display:'flex',gap:10}}><Button variant="danger" onClick={() => deleteContract(showDelete)}>Delete</Button><Button variant="secondary" onClick={() => setShowDelete(null)}>Cancel</Button></div>
        </Modal>
      )}
    </div>
  );
}
