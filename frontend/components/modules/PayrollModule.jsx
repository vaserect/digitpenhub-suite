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

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function PayrollModule({ goHome }) {
  const [runs, setRuns] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ periodMonth: new Date().getMonth() + 1, periodYear: new Date().getFullYear(), notes: '' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useSearchHotkey();
  useHotkey('n', () => { setShowForm(true); setDraft({ periodMonth: new Date().getMonth() + 1, periodYear: new Date().getFullYear(), notes: '' }); });

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
    if (q) rows = rows.filter(r => (`${MONTHS[(r.period_month||1)-1]} ${r.period_year}`).toLowerCase().includes(q));
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
      setDraft({ periodMonth: new Date().getMonth() + 1, periodYear: new Date().getFullYear(), notes: '' });
      load();
    } catch (err) { toast.error(err.message); }
  }

  function exportCsv() {
    const header = ['Period', 'Status', 'Employees', 'Gross', 'Deductions', 'Net', 'Notes'];
    const rowsArr = filtered.map(r => [
      `${MONTHS[(r.period_month||1)-1]} ${r.period_year}`,
      r.status || 'draft',
      r.employee_count || 0,
      r.total_gross || 0,
      r.total_deductions || 0,
      r.total_net || 0,
      (r.notes || '').replace(/"/g, '""'),
    ]);
    const csv = [header.join(','), ...rowsArr.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `payroll-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(blob);
    toast.success('CSV exported');
  }

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <div>
          <h1>Payroll</h1>
          <p className="module-sub">Payroll runs, payslips, tax calculations, and statutory deductions. <kbd style={{background:'var(--surface-muted)',padding:'2px 6px',borderRadius:4,fontSize:'0.72rem',color:'var(--text-muted)'}}>⌘N new</kbd> <kbd style={{background:'var(--surface-muted)',padding:'2px 6px',borderRadius:4,fontSize:'0.72rem',color:'var(--text-muted)'}}>⌘F search</kbd></p>
        </div>
        <Button onClick={() => { setShowForm(true); setDraft({ periodMonth: new Date().getMonth() + 1, periodYear: new Date().getFullYear(), notes: '' }); }}>+ New Run</Button>
      </div>

      {stats && (
        <div className="stage-strip">
          <div className="stage-card"><div className="num">{stats.total_runs || 0}</div><div className="lbl">Runs</div></div>
          <div className="stage-card"><div className="num" style={{color:'var(--primary)'}}>{stats.processed_runs || 0}</div><div className="lbl">Processed</div></div>
          <div className="stage-card"><div className="num">{stats.employees || 0}</div><div className="lbl">Employees</div></div>
          <div className="stage-card"><div className="num">₦{Number(stats.total_gross || 0).toLocaleString()}</div><div className="lbl">Gross</div></div>
          <div className="stage-card"><div className="num" style={{color:'var(--success)'}}>₦{Number(stats.total_net || 0).toLocaleString()}</div><div className="lbl">Net Pay</div></div>
        </div>
      )}

      <Modal isOpen={showForm} title="New Payroll Run" onClose={() => setShowForm(false)}>
        <form onSubmit={createRun}>
          <div className="field"><label className="field-label">Period Month</label>
            <select className="field-input" value={draft.periodMonth} onChange={e => setDraft({...draft, periodMonth: parseInt(e.target.value)})}>
              {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div className="field"><label className="field-label">Period Year</label>
            <select className="field-input" value={draft.periodYear} onChange={e => setDraft({...draft, periodYear: parseInt(e.target.value)})}>
              {[2024,2025,2026,2027,2028].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="field"><label className="field-label">Notes</label><textarea className="field-input" value={draft.notes} onChange={e => setDraft({...draft, notes: e.target.value})} rows={2} /></div>
          <div style={{display:'flex',gap:8}}><Button type="submit">Create</Button><Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Button></div>
        </form>
      </Modal>

      {runs.length > 0 && (
        <div className="toolbar-row">
          <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search payroll runs…" data-hotkey-search />
          <select className="toolbar-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All</option><option value="draft">Draft</option><option value="processing">Processing</option><option value="paid">Paid</option>
          </select>
          <Button variant="secondary" size="sm" onClick={exportCsv}>📥 CSV</Button>
        </div>
      )}

      <BulkActionBar selectedCount={selected.length} onClearSelection={() => setSelected([])}
        actions={[{ label: `Delete ${selected.length}`, variant: 'danger', requiresConfirm: true, onClick: async () => {
          try { await apiFetch('/api/v1/payroll/bulk-delete', { method:'POST', body:JSON.stringify({ids:selected}) }); toast.success(`Deleted ${selected.length}`); setSelected([]); load(); }
          catch { toast.error('Bulk delete failed'); }
        }}]} />

      {loading ? <SkeletonRows rows={5} /> : runs.length === 0 ? (
        <EmptyState icon="💰" title="No payroll runs yet" action={<Button onClick={() => { setShowForm(true); setDraft({ periodMonth: new Date().getMonth() + 1, periodYear: new Date().getFullYear(), notes: '' }); }}>+ New Run</Button>} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title="No matching runs" />
      ) : (
        <><div className="table-wrap"><table className="data-table"><thead><tr>
          <th style={{width:32}}><input type="checkbox" checked={selected.length === pageRows.length && pageRows.length > 0} onChange={e => setSelected(e.target.checked ? pageRows.map(r => r.id) : [])} /></th>
          <th>Period</th><th>Status</th><th>Employees</th><th>Gross</th><th>Net Pay</th><th>Actions</th>
        </tr></thead>
        <tbody>{pageRows.map(r => (
          <tr key={r.id}>
            <td onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.includes(r.id)} onChange={e => setSelected(e.target.checked ? [...selected, r.id] : selected.filter(id => id !== r.id))} /></td>
            <td style={{fontWeight:600}}>{MONTHS[(r.period_month||1)-1]} {r.period_year}</td>
            <td><Badge variant={r.status === 'paid' ? 'success' : r.status === 'processing' ? 'info' : 'warning'}>{r.status || 'draft'}</Badge></td>
            <td>{r.employee_count || 0}</td>
            <td>₦{Number(r.total_gross || 0).toLocaleString()}</td>
            <td style={{fontWeight:700,color:'var(--success)'}}>₦{Number(r.total_net || 0).toLocaleString()}</td>
            <td>{!['paid','cancelled'].includes(r.status) && <Button size="sm" variant="secondary">Edit</Button>}</td>
          </tr>
        ))}</tbody></table></div>
        {pageCount > 1 && <Pagination page={page} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />}</>
      )}
    </div>
  );
}
