'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';
import Badge from '../ui/Badge';

export default function QuotationsModule({ goHome }) {
  const [quotes, setQuotes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ title: '', description: '', amount: 0, status: 'draft' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, q] = await Promise.all([
        apiFetch('/api/v1/quotations/stats'),
        apiFetch('/api/v1/quotations'),
      ]);
      setStats(s.stats || null);
      setQuotes(q.quotations || []);
    } catch { toast.error('Failed to load quotations'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createQuote(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/quotations', { method: 'POST', body: JSON.stringify(draft) });
      toast.success('Quotation created');
      setShowForm(false);
      setDraft({ title: '', description: '', amount: 0, status: 'draft' });
      load();
    } catch (err) { toast.error(err.message); }
  }

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <h1>Quotations</h1>
        <p className="module-sub">Create and manage professional quotations for your clients.</p>
      </div>
      {stats && (
        <div className="stats-row">
          <div className="stat-card"><div className="stat-value">{stats.totalQuotations || 0}</div><div className="stat-label">Total</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--primary)' }}>₦{Number(stats.totalAmount || 0).toLocaleString()}</div><div className="stat-label">Total Value</div></div>
          <div className="stat-card"><div className="stat-value">{stats.pendingQuotes || 0}</div><div className="stat-label">Pending</div></div>
        </div>
      )}
      <Button onClick={() => setShowForm(true)}>+ New Quotation</Button>
      <Modal isOpen={showForm} title="Create Quotation" onClose={() => setShowForm(false)}>
        <form onSubmit={createQuote}>
          <div className="field"><label className="field-label">Title</label><input className="field-input" value={draft.title} onChange={(e) => setDraft({...draft,title:e.target.value})} required /></div>
          <div className="field"><label className="field-label">Description</label><textarea className="field-input" value={draft.description} onChange={(e) => setDraft({...draft,description:e.target.value})} rows={3} /></div>
          <div className="field"><label className="field-label">Amount (₦)</label><input className="field-input" type="number" min="0" step="0.01" value={draft.amount} onChange={(e) => setDraft({...draft,amount:parseFloat(e.target.value)})} required /></div>
          <Button type="submit">Create</Button>
        </form>
      </Modal>
      {loading ? <SkeletonRows rows={4} /> : quotes.length === 0 ? (
        <EmptyState icon="📋" title="No quotations yet" action={<Button onClick={() => setShowForm(true)}>+ New Quotation</Button>} />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Title</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id}>
                  <td style={{ fontWeight: 600 }}>{q.title}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(q.created_at).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 600 }}>₦{Number(q.amount || 0).toLocaleString()}</td>
                  <td><Badge variant={q.status === 'approved' ? 'success' : q.status === 'rejected' ? 'danger' : 'neutral'}>{q.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
