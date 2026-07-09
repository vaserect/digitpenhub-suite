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

export default function PayrollModule({ goHome }) {
  const [tab, setTab] = useState('runs');
  const [runs, setRuns] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ name: '', periodStart: '', periodEnd: '', notes: '' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useSearchHotkey();
  useHotkey('n', () => { setShowForm(true); setDraft({ name: '', periodStart: '', periodEnd: '', notes: '' }); });

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

  const filtered = useMemo(() => {
    let rows = runs;
    if (statusFilter !== 'all') rows = rows.filter(r => r.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter(r => (r.name || '').toLowerCase().includes(q));
    return rows;
  }, [runs, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, statusFilter]);

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

  function exportCsv() {
    const header = ['Name', 'Period Start', 'Period End', 'Status', 'Employees', 'Total', 'Notes'];
    const rows = filtered.map(r => [r.name, r.period_start || '', r.period_end || '', r.status || '', r.employee_count || 0, r.total_amount || 0, (r.notes || '').replace(/"/g, '""')]);
    const csv = [header.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `payroll-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(blob);
    toast.success('CSV exported');
  }

  async function bulkDelete() {
    if (!selected.length) return;
    try {
      await apiFetch('/api/v1/payroll/bulk-delete', { method: 'POST', body: JSON.stringify({ ids: selected }) });
      toast.success(`Deleted ${selected.length} run(s)`);
      setSelected([]); load();
    } catch { toast.error('Bulk delete failed'); }
  }

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <div>
          <h1>Payroll</h1>
          <p className="module-sub">Payroll runs, payslips, tax calculations, and statutory deductions. <kbd style={{background:'var(--surface-muted)',padding:'2px 6px',borderRadius:4,fontSize:'0.72rem',color:'var(--text-muted)'}}>⌘N new</kbd> <kbd style={{background:'var(--surface-muted)',padding:'2px 6px',borderRadius:4,fontSize:'0.72rem',color:'var(--text-muted)'}}>⌘F search</kbd></p>
        </div>
        <Button onClick={() => { setShowForm(true); setDraft({ name: '', periodStart: '', periodEnd: '', notes: '' }); }}>+ New Run</Button>
      </div>

      {stats && (
        <div className="stage-strip">
          <div className="stage-card"><div className="num">{stats.total_runs || 0}</div><div className="lbl">Runs</div></div>
          <div className="stage-card"><div className="num">{stats.processed_runs || 0}</div><div className="lbl">Processed</div></div>
          <div className="stage-card"><div className="num">{stats.total_employees || 0}</div><div className="lbl">Employees</div></div>
          <div className="stage-card"><div className="num">₦{Number(stats.total_disbursed || 0).toLocaleString()}</div><div className="lbl">Disbursed</div></div>
        </div>
      )}

      <Modal isOpen={showForm} title="New Payroll Run" onClose={() => setShowForm(false)}>
        <form onSubmit={createRun}>
          <div className="field"><label className="field-label">Name</label><input className="field-input" value={draft.name} onChange={e => setDraft({...draft, name: e.target.value})} required autoFocus /></div>
          <div className="field"><label className="field-label">Period Start</label><input className="field-input" type="date" value={draft.periodStart} onChange={e => setDraft({...draft, periodStart: e.target.value})} /></div>
          <div className="field"><label className="field-label">Period End</label><input className="field-input" type="date" value={draft.periodEnd} onChange={e => setDraft({...draft, periodEnd: e.target.value})} /></div>
          <div className="field"><label className="field-label">Notes</label><textarea className="field-input" value={draft.notes} onChange={e => setDraft({...draft, notes: e.target.value})} /></div>
          <div style={{display:'flex',gap:8}}><Button type="submit">Create</Button><Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Button></div>
        </form>
      </Modal>

      {runs.length > 0 && (
        <div className="toolbar-row">
          <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search payroll runs…" data-hotkey-search />
          <select className="toolbar-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All</option><option value="draft">Draft</option><option value="processed">Processed</option><option value="paid">Paid</option>
          </select>
          <Button variant="secondary" size="sm" onClick={exportCsv}>📥 CSV</Button>
        </div>
      )}

      <BulkActionBar selectedCount={selected.length} onClearSelection={() => setSelected([])}
        actions={[{ label: `Delete ${selected.length}`, variant: 'danger', requiresConfirm: true, confirmTitle: `Delete ${selected.length} run(s)?`, onClick: bulkDelete }]} />

      {loading ? <SkeletonRows rows={5} /> : runs.length === 0 ? (
        <EmptyState icon="💰" title="No payroll runs yet" description="Create your first payroll run to process salaries." action={<Button onClick={() => { setShowForm(true); setDraft({ name: '', periodStart: '', periodEnd: '', notes: '' }); }}>+ New Run</Button>} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title="No matching runs" description="Try a different search or filter." />
      ) : (
        <>
          <div className="table-wrap"><table className="data-table">
            <thead><tr>
              <th style={{width:32}}><input type="checkbox" checked={selected.length === pageRows.length && pageRows.length > 0} onChange={e => setSelected(e.target.checked ? pageRows.map(r => r.id) : [])} /></th>
              <th>Name</th><th>Period</th><th>Status</th><th>Employees</th><th>Total</th><th>Actions</th>
            </tr></thead>
            <tbody>{pageRows.map(r => (
              <tr key={r.id}>
                <td onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.includes(r.id)} onChange={e => setSelected(e.target.checked ? [...selected, r.id] : selected.filter(id => id !== r.id))} /></td>
                <td style={{fontWeight:600}}>{r.name}</td>
                <td style={{fontSize:'0.8rem'}}>{r.period_start ? new Date(r.period_start).toLocaleDateString() : '—'} – {r.period_end ? new Date(r.period_end).toLocaleDateString() : '—'}</td>
                <td><Badge variant={r.status === 'paid' ? 'success' : r.status === 'processed' ? 'info' : 'warning'}>{r.status || 'draft'}</Badge></td>
                <td>{r.employee_count || 0}</td>
                <td style={{fontWeight:700}}>₦{Number(r.total_amount || 0).toLocaleString()}</td>
                <td>{r.status !== 'paid' && <Button size="sm" variant="secondary" onClick={() => processRun(r.id)}>Process</Button>}</td>
              </tr>
            ))}</tbody>
          </table></div>
          {pageCount > 1 && <Pagination page={page} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
}
