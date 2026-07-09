'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';
import Badge from '../ui/Badge';

export default function PayrollModule({ goHome }) {
  const [tab, setTab] = useState('runs');
  const [runs, setRuns] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ name: '', periodStart: '', periodEnd: '', notes: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        apiFetch('/api/v1/payroll/stats'),
        apiFetch('/api/v1/payroll'),
      ]);
      setStats(s.stats || null);
      setRuns(r.runs || []);
    } catch { toast.error('Failed to load payroll data'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createRun(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/payroll', { method: 'POST', body: JSON.stringify(draft) });
      toast.success('Payroll run created');
      setShowForm(false);
      setDraft({ name: '', periodStart: '', periodEnd: '', notes: '' });
      load();
    } catch (err) { toast.error(err.message); }
  }

  async function processRun(id) {
    try {
      await apiFetch(`/api/v1/payroll/${id}/process`, { method: 'POST' });
      toast.success('Payroll processed');
      load();
    } catch (err) { toast.error(err.message); }
  }

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <h1>Payroll</h1>
        <p className="module-sub">Run payroll with real tax calculations and payslip PDF generation.</p>
      </div>

      {stats && (
        <div className="stats-row">
          <div className="stat-card"><div className="stat-value">{stats.total_runs || 0}</div><div className="stat-label">Total Runs</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--success)' }}>{stats.processed_runs || 0}</div><div className="stat-label">Processed</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--primary)' }}>{stats.employees || 0}</div><div className="stat-label">Employees</div></div>
          <div className="stat-card"><div className="stat-value">₦{Number(stats.total_gross || 0).toLocaleString()}</div><div className="stat-label">Total Gross</div></div>
        </div>
      )}

      <Button onClick={() => setShowForm(true)}>+ New Payroll Run</Button>

      <Modal isOpen={showForm} title="New Payroll Run" onClose={() => setShowForm(false)}>
        <form onSubmit={createRun}>
          <div className="field"><label className="field-label">Name</label><input className="field-input" value={draft.name} onChange={(e) => setDraft({...draft,name:e.target.value})} required placeholder="e.g. July 2026 Payroll" /></div>
          <div className="field"><label className="field-label">Period start</label><input className="field-input" type="date" value={draft.periodStart} onChange={(e) => setDraft({...draft,periodStart:e.target.value})} /></div>
          <div className="field"><label className="field-label">Period end</label><input className="field-input" type="date" value={draft.periodEnd} onChange={(e) => setDraft({...draft,periodEnd:e.target.value})} /></div>
          <Button type="submit">Create Run</Button>
        </form>
      </Modal>

      {loading ? <SkeletonRows rows={5} /> : runs.length === 0 ? (
        <EmptyState icon="💰" title="No payroll runs yet" description="Create a payroll run with real tax bracket calculations." action={<Button onClick={() => setShowForm(true)}>+ New Payroll Run</Button>} />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Period</th><th>Gross</th><th>Tax</th><th>Net</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontSize: '0.8rem' }}>{r.period_start?.slice(0, 10)} — {r.period_end?.slice(0, 10)}</td>
                  <td>₦{Number(r.gross_pay || 0).toLocaleString()}</td>
                  <td style={{ color: 'var(--danger)' }}>₦{Number(r.tax || 0).toLocaleString()}</td>
                  <td style={{ fontWeight: 600, color: 'var(--success)' }}>₦{Number(r.net_pay || 0).toLocaleString()}</td>
                  <td><Badge variant={r.status === 'processed' ? 'success' : r.status === 'draft' ? 'neutral' : 'info'}>{r.status}</Badge></td>
                  <td>
                    {r.status === 'draft' && <Button variant="ghost" size="sm" onClick={() => processRun(r.id)}>Process</Button>}
                    {r.status === 'processed' && <Button variant="ghost" size="sm" onClick={() => window.open(`/api/v1/payroll/${r.id}/items/${r.item_id}/payslip`, '_blank')}>Payslip PDF</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
