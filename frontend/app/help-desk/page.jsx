'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import ModulePage from '../../components/ui/ModulePage';
import Button from '../../components/ui/Button';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import SearchInput from '../../components/ui/SearchInput';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import TabBar from '../../components/ui/TabBar';

const TABS = [
  { key: 'open', label: 'Open' },
  { key: 'closed', label: 'Closed' },
];

export default function HelpdeskPage() {
  const router = useRouter();
  const [tab, setTab] = useState('open');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', priority: 'medium' });
  const [detail, setDetail] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    try { const d = await apiFetch('/api/v1/helpdesk'); setTickets(d.tickets || []); }
    catch { toast.error('Failed to load tickets'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = tickets.filter(t => {
    if (tab === 'open') return t.status !== 'closed' && t.status !== 'resolved';
    if (tab === 'closed') return t.status === 'closed' || t.status === 'resolved';
    return true;
  }).filter(t => !search || t.subject.toLowerCase().includes(search.toLowerCase()));

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.subject.trim()) return;
    try {
      await apiFetch('/api/v1/helpdesk', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Ticket created!'); setShowForm(false); setForm({ subject: '', description: '', priority: 'medium' }); await load();
    } catch (err) { toast.error(err.message); }
  }

  async function viewDetail(ticket) {
    try { const d = await apiFetch(`/api/v1/helpdesk/${ticket.id}`); setDetail(d); }
    catch (err) { toast.error(err.message); }
  }

  async function handleReply() {
    if (!replyText.trim()) return;
    try {
      await apiFetch(`/api/v1/helpdesk/${detail.ticket.id}/replies`, { method: 'POST', body: JSON.stringify({ body: replyText }) });
      setReplyText(''); await viewDetail(detail.ticket);
    } catch (err) { toast.error(err.message); }
  }

  async function closeTicket(id) {
    try { await apiFetch(`/api/v1/helpdesk/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'closed' }) }); toast.success('Ticket closed'); setDetail(null); await load(); }
    catch (err) { toast.error(err.message); }
  }

  return (
    <ModulePage back={{ label: 'Workspace', onClick: () => router.push('/') }} title="Help Desk" description="Customer support tickets and replies.">
      <TabBar tabs={TABS} activeKey={tab} onChange={setTab} />
      <div style={{ display: 'flex', gap: 10, margin: '16px 0', flexWrap: 'wrap' }}>
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tickets…" />
        <Button onClick={() => setShowForm(true)}>+ New ticket</Button>
      </div>
      {loading ? <SkeletonRows rows={3} /> : filtered.length === 0 ? (
        <EmptyState icon="🎫" title="No tickets" action={<Button onClick={() => setShowForm(true)}>+ New ticket</Button>} />
      ) : (
        <div className="card-shell">{filtered.map(t => (
          <div key={t.id} className="card" style={{ padding: '12px 16px', marginBottom: 4, cursor: 'pointer' }} onClick={() => viewDetail(t)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>{t.subject}</div>
              <Badge variant={t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'warning' : 'neutral'}>{t.priority}</Badge>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{t.status} · {new Date(t.created_at).toLocaleDateString()}</div>
          </div>
        ))}</div>
      )}
      {showForm && (<Modal isOpen title="New ticket" onClose={() => setShowForm(false)}><form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:14}}>
        <div className="field"><label className="field-label">Subject</label><input className="field-input" value={form.subject} onChange={e => setForm({...form,subject:e.target.value})} /></div>
        <div className="field"><label className="field-label">Description</label><textarea className="field-textarea" rows={4} value={form.description} onChange={e => setForm({...form,description:e.target.value})} /></div>
        <div className="field"><label className="field-label">Priority</label><select className="field-select" value={form.priority} onChange={e => setForm({...form,priority:e.target.value})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}><Button onClick={() => setShowForm(false)} variant="ghost">Cancel</Button><Button type="submit">Create</Button></div>
      </form></Modal>)}
      {detail && (<Modal isOpen title={detail.ticket?.subject} onClose={() => setDetail(null)} wide>
        <div style={{marginBottom:12}}><Badge variant={detail.ticket?.priority === 'high' ? 'danger' : 'warning'}>{detail.ticket?.priority}</Badge> <Badge>{detail.ticket?.status}</Badge></div>
        <p style={{fontSize:13,color:'var(--text-muted)'}}>{detail.ticket?.description}</p>
        {detail.replies?.map(r => <div key={r.id} style={{padding:'10px 14px',background:'var(--surface-muted)',borderRadius:8,marginBottom:8}}><div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>{r.author_name} · {new Date(r.created_at).toLocaleString()}</div><div style={{fontSize:13}}>{r.body}</div></div>)}
        {detail.ticket?.status !== 'closed' && (<div style={{marginTop:12}}><textarea className="field-textarea" rows={3} value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write a reply…" /><div style={{display:'flex',gap:8,marginTop:8}}><Button onClick={handleReply}>Send reply</Button><Button onClick={() => closeTicket(detail.ticket.id)} variant="danger">Close ticket</Button></div></div>)}
      </Modal>)}
      <ConfirmDialog isOpen={false} onClose={() => {}} onConfirm={() => {}} title="" confirmLabel="" cancelLabel="" danger />
    </ModulePage>
  );
}
