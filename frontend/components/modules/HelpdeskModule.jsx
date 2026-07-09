'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import Badge from '../ui/Badge';
import { SkeletonRows } from '../ui/Skeleton';

export default function HelpdeskModule({ goHome }) {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ subject: '', description: '', priority: 'medium' });
  const [viewing, setViewing] = useState(null);
  const [reply, setReply] = useState('');

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

  const statusColors = { open: 'var(--success)', pending: 'var(--warning)', closed: 'var(--text-muted)' };

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head"><h1>Help Desk</h1><p className="module-sub">Support tickets, SLA tracking, and escalations.</p></div>
      {stats && (
        <div className="stats-row">
          <div className="stat-card"><div className="stat-value">{stats.open || 0}</div><div className="stat-label">Open</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.pending || 0}</div><div className="stat-label">Pending</div></div>
          <div className="stat-card"><div className="stat-value">{stats.total || 0}</div><div className="stat-label">Total</div></div>
        </div>
      )}
      <div className="invoice-tabs" style={{ marginBottom: 16 }}>
        {['all','open','pending','closed'].map(t => (
          <button key={t} className={`invoice-tab${tab===t?' active':''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      <Button onClick={() => setShowForm(true)}>+ New Ticket</Button>

      <Modal isOpen={showForm} title="Create Ticket" onClose={() => setShowForm(false)}>
        <form onSubmit={createTicket}>
          <div className="field"><label className="field-label">Subject</label><input className="field-input" value={draft.subject} onChange={e => setDraft({...draft,subject:e.target.value})} required /></div>
          <div className="field"><label className="field-label">Description</label><textarea className="field-input" value={draft.description} onChange={e => setDraft({...draft,description:e.target.value})} rows={4} /></div>
          <div className="field"><label className="field-label">Priority</label>
            <select className="field-input" value={draft.priority} onChange={e => setDraft({...draft,priority:e.target.value})}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
            </select>
          </div>
          <Button type="submit">Create</Button>
        </form>
      </Modal>

      {loading ? <SkeletonRows rows={5} /> : tickets.length === 0 ? (
        <EmptyState icon="🎫" title="No tickets yet" action={<Button onClick={() => setShowForm(true)}>+ New Ticket</Button>} />
      ) : (
        <div className="table-wrap"><table className="data-table">
          <thead><tr><th>Ticket</th><th>Status</th><th>Priority</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>{tickets.filter(t => tab === 'all' || t.status === tab).map(t => (
            <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => setViewing(t)}>
              <td style={{ fontWeight: 600 }}>{t.subject}</td>
              <td><span style={{ color: statusColors[t.status], fontWeight: 600 }}>{t.status}</span></td>
              <td><Badge variant={t.priority === 'urgent' ? 'danger' : t.priority === 'high' ? 'warning' : 'neutral'}>{t.priority}</Badge></td>
              <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(t.created_at).toLocaleDateString()}</td>
              <td><Button variant="ghost" size="sm">View</Button></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}

      <Modal isOpen={!!viewing} title={viewing?.subject} onClose={() => setViewing(null)} size="lg">
        <div style={{ fontSize: '0.85rem', lineHeight: 1.7, marginBottom: 16, whiteSpace: 'pre-wrap' }}>{viewing?.description || 'No description.'}</div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <textarea className="form-input" placeholder="Add a reply…" value={reply} onChange={e => setReply(e.target.value)} rows={3} style={{ marginBottom: 8 }} />
          <Button onClick={() => addReply(viewing.id)}>Reply</Button>
        </div>
      </Modal>
    </div>
  );
}
