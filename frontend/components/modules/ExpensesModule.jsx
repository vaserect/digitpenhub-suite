'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';
import SearchInput from '../ui/SearchInput';
import Pagination from '../ui/Pagination';
import { useHotkey, useSearchHotkey } from '../../lib/hotkeys';

export default function ExpensesModule({ goHome }) {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [draft, setDraft] = useState({ description: '', amount: 0, categoryId: '', date: '' });
  const [catName, setCatName] = useState('');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  useSearchHotkey();
  useHotkey('n', () => { setShowForm(true); setDraft({ description: '', amount: 0, categoryId: '', date: '' }); });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, e, c] = await Promise.all([
        apiFetch('/api/v1/expenses/stats'),
        apiFetch('/api/v1/expenses'),
        apiFetch('/api/v1/expenses/categories'),
      ]);
      setStats(s.stats || null);
      setExpenses(e.expenses || []);
      setCategories(c.categories || []);
    } catch { toast.error('Failed to load expenses'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let rows = expenses;
    if (catFilter) rows = rows.filter(e => e.category_id === catFilter || e.categoryId === catFilter);
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter(e => (e.description || '').toLowerCase().includes(q));
    return rows;
  }, [expenses, search, catFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, catFilter]);

  async function createExpense(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/expenses', { method: 'POST', body: JSON.stringify(draft) });
      toast.success('Expense recorded');
      setShowForm(false);
      setDraft({ description: '', amount: 0, categoryId: '', date: '' });
      load();
    } catch (err) { toast.error(err.message); }
  }

  async function createCategory(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/expenses/categories', { method: 'POST', body: JSON.stringify({ name: catName }) });
      toast.success('Category created');
      setShowCatForm(false); setCatName(''); load();
    } catch (err) { toast.error(err.message); }
  }

  function exportCsv() {
    const header = ['Date', 'Description', 'Category', 'Amount'];
    const rows = filtered.map(e => [e.date || '', e.description, e.category_name || '', e.amount || 0]);
    const csv = [header.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(blob);
    toast.success('CSV exported');
  }

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <div>
          <h1>Expenses</h1>
          <p className="module-sub">Track expenses by category with receipt upload support. <kbd style={{background:'var(--surface-muted)',padding:'2px 6px',borderRadius:4,fontSize:'0.72rem',color:'var(--text-muted)'}}>⌘N new</kbd> <kbd style={{background:'var(--surface-muted)',padding:'2px 6px',borderRadius:4,fontSize:'0.72rem',color:'var(--text-muted)'}}>⌘F search</kbd></p>
        </div>
      </div>
      {stats && (
        <div className="stats-row">
          <div className="stat-card"><div className="stat-value">{stats.totalExpenses || 0}</div><div className="stat-label">Total</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--danger)' }}>₦{Number(stats.totalAmount || 0).toLocaleString()}</div><div className="stat-label">Total Amount</div></div>
          <div className="stat-card"><div className="stat-value">{stats.categories || 0}</div><div className="stat-label">Categories</div></div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button onClick={() => { setShowForm(true); setDraft({ description: '', amount: 0, categoryId: '', date: '' }); }}>+ New Expense</Button>
        <Button variant="secondary" onClick={() => setShowCatForm(true)}>+ Category</Button>
      </div>
      {expenses.length > 0 && (
        <div className="toolbar-row">
          <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search expenses…" data-hotkey-search />
          <select className="toolbar-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Button variant="secondary" size="sm" onClick={exportCsv}>📥 CSV</Button>
        </div>
      )}
      <Modal isOpen={showForm} title="Record Expense" onClose={() => setShowForm(false)}>
        <form onSubmit={createExpense}>
          <div className="field"><label className="field-label">Description</label><input className="field-input" value={draft.description} onChange={(e) => setDraft({...draft,description:e.target.value})} required autoFocus /></div>
          <div className="field"><label className="field-label">Amount (₦)</label><input className="field-input" type="number" min="0" step="0.01" value={draft.amount} onChange={(e) => setDraft({...draft,amount:parseFloat(e.target.value)})} required /></div>
          <div className="field"><label className="field-label">Category</label>
            <select className="field-input" value={draft.categoryId} onChange={(e) => setDraft({...draft,categoryId:e.target.value})}>
              <option value="">Uncategorized</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field"><label className="field-label">Date</label><input className="field-input" type="date" value={draft.date} onChange={(e) => setDraft({...draft,date:e.target.value})} /></div>
          <div style={{display:'flex',gap:8}}><Button type="submit">Record</Button><Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Button></div>
        </form>
      </Modal>
      <Modal isOpen={showCatForm} title="New Category" onClose={() => setShowCatForm(false)}>
        <form onSubmit={createCategory}>
          <div className="field"><label className="field-label">Name</label><input className="field-input" value={catName} onChange={(e) => setCatName(e.target.value)} required autoFocus /></div>
          <Button type="submit">Create</Button>
        </form>
      </Modal>
      {loading ? <SkeletonRows rows={4} /> : expenses.length === 0 ? (
        <EmptyState icon="💸" title="No expenses yet" action={<Button onClick={() => { setShowForm(true); setDraft({ description: '', amount: 0, categoryId: '', date: '' }); }}>+ Record Expense</Button>} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title="No matching expenses" description="Try a different search or category filter." />
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th></tr></thead>
              <tbody>
                {pageRows.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontSize: '0.8rem' }}>{e.date ? new Date(e.date).toLocaleDateString() : '—'}</td>
                    <td style={{ fontWeight: 600 }}>{e.description}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{e.category_name || '—'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--danger)' }}>₦{Number(e.amount || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pageCount > 1 && <Pagination page={page} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
}
