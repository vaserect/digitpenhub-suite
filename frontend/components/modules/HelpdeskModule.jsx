'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import Badge from '../ui/Badge';
import { SkeletonRows } from '../ui/Skeleton';
import SearchInput from '../ui/SearchInput';
import Pagination from '../ui/Pagination';
import { useHotkey, useSearchHotkey } from '../../lib/hotkeys';

export default function HelpdeskModule({ goHome }) {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ subject: '', description: '', priority: 'medium' });
  const [viewing, setViewing] = useState(null);
  const [reply, setReply] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useSearchHotkey();
  useHotkey('n', () => { setShowForm(true); setDraft({ subject: '', description: '', priority: 'medium' }); });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([
        apiFetch('/api/v1/helpdesk/stats'),
        apiFetch('/api/v1/helpdesk'),
      ]);
      setStats(s.stats || null);
      setTickets(t.tickets || []);
    } catch { toast.error('Failed to load help desk'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createTicket(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/helpdesk', { method: 'POST', body: JSON.stringify(draft) });
      toast.success('Ticket created');
      setShowForm(false); setDraft({ subject: '', description: '', priority: 'medium' }); load();
    } catch (err) { toast.error(err.message); }
  }

  async function addReply(ticketId) {
    if (!reply.trim()) return;
    try {
      await apiFetch(`/api/v1/helpdesk/${ticketId}/replies`, { method: 'POST', body: JSON.stringify({ body: reply }) });
      toast.success('Reply added'); setReply(''); load();
    } catch (err) { toast.error(err.message); }
  }

  const filtered = useMemo(() => {
    let rows = tickets;
    if (tab !== 'all') rows = rows.filter(t => t.status === tab);
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter(t => (t.subject||'').toLowerCase().includes(q) || (t.description||'').toLowerCase().includes(q));
    return rows;
  }, [tickets, tab, search]);

  useEffect(() => { setPage(1); }, [search, tab]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusColors = { open: 'var(--success)', pending: 'var(--warning)', closed: 'var(--text-muted)' };
  const tabCount = t => tickets.filter(x => t === 'all' || x.status === t).length;

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <div>
          <h1>Help Desk</h1>
          <p className="module-sub">Support tickets, SLA tracking, and escalations. <kbd style={{background:'var(--surface-muted)',padding:'2px 6px',borderRadius:4,fontSize:'0.72rem',color:'var(--text-muted)'}}>⌘N new</kbd> <kbd style={{background:'var(--surface-muted)',padding:'2px 6px',borderRadius:4,fontSize:'0.72rem',color:'var(--text-muted)'}}>⌘F search</kbd></p>
        </div>
        <Button onClick={()=>{setShowForm(true);setDraft({subject:'',description:'',priority:'medium'});}}>+ New Ticket</Button>
      </div>
      {stats && (
        <div className="stats-row">
          <div className="stat-card"><div className="stat-value" style={{color:'var(--success)'}}>{stats.open||0}</div><div className="stat-label">Open</div></div>
          <div className="stat-card"><div className="stat-value" style={{color:'var(--warning)'}}>{stats.pending||0}</div><div className="stat-label">Pending</div></div>
          <div className="stat-card"><div className="stat-value">{stats.total||0}</div><div className="stat-label">Total</div></div>
        </div>
      )}
      <div className="invoice-tabs" style={{marginBottom:16}}>
        {['all','open','pending','closed'].map(t=>(
          <button key={t} className={`invoice-tab${tab===t?' active':''}`} onClick={()=>setTab(t)}>
            {t.charAt(0).toUpperCase()+t.slice(1)} <span className="invoice-tab-count">{tabCount(t)}</span>
          </button>
        ))}
      </div>

      {tickets.length > 0 && (
        <div className="toolbar-row">
          <SearchInput value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tickets…" data-hotkey-search />
        </div>
      )}

      <Modal isOpen={showForm} title="Create Ticket" onClose={()=>setShowForm(false)}>
        <form onSubmit={createTicket}>
          <div className="field"><label className="field-label">Subject *</label><input className="field-input" value={draft.subject} onChange={e=>setDraft({...draft,subject:e.target.value})} required autoFocus /></div>
          <div className="field"><label className="field-label">Description</label><textarea className="field-input" value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})} rows={4} /></div>
          <div className="field"><label className="field-label">Priority</label>
            <select className="field-input" value={draft.priority} onChange={e=>setDraft({...draft,priority:e.target.value})}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
            </select></div>
          <div style={{display:'flex',gap:8}}><Button type="submit">Create</Button><Button variant="secondary" type="button" onClick={()=>setShowForm(false)}>Cancel</Button></div>
        </form>
      </Modal>

      {loading ? <SkeletonRows rows={5} /> : tickets.length === 0 ? (
        <EmptyState icon="🎫" title="No tickets yet" action={<Button onClick={()=>{setShowForm(true);setDraft({subject:'',description:'',priority:'medium'});}}>+ New Ticket</Button>} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title="No matching tickets" description="Try a different search or filter." />
      ) : (
        <><div className="table-wrap"><table className="data-table"><thead><tr><th>Subject</th><th>Status</th><th>Priority</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>{pageRows.map(t=>(
            <tr key={t.id} style={{cursor:'pointer'}} onClick={()=>setViewing(t)}>
              <td style={{fontWeight:600}}>{t.subject}</td>
              <td><span style={{color:statusColors[t.status],fontWeight:600}}>{t.status}</span></td>
              <td><Badge variant={t.priority==='urgent'?'danger':t.priority==='high'?'warning':'neutral'}>{t.priority}</Badge></td>
              <td style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{new Date(t.created_at).toLocaleDateString()}</td>
              <td><Button variant="ghost" size="sm">View</Button></td>
            </tr>
          ))}</tbody></table></div>
          {pageCount>1&&<Pagination page={page} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage}/>}</>
      )}

      <Modal isOpen={!!viewing} title={viewing?.subject} onClose={()=>setViewing(null)} size="lg">
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          <Badge variant={viewing?.priority==='urgent'?'danger':viewing?.priority==='high'?'warning':'neutral'}>{viewing?.priority}</Badge>
          <span style={{color:statusColors[viewing?.status],fontWeight:600,fontSize:'0.85rem'}}>{viewing?.status}</span>
        </div>
        <div style={{fontSize:'0.85rem',lineHeight:1.7,marginBottom:16,whiteSpace:'pre-wrap',padding:12,background:'var(--surface-muted)',borderRadius:8}}>{viewing?.description||'No description.'}</div>
        <div style={{borderTop:'1px solid var(--border)',paddingTop:16}}>
          <textarea className="field-input" placeholder="Add a reply…" value={reply} onChange={e=>setReply(e.target.value)} rows={3} style={{marginBottom:8}} />
          <Button onClick={()=>addReply(viewing.id)} disabled={!reply.trim()}>Reply</Button>
        </div>
      </Modal>
    </div>
  );
}
