'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';

export default function ExpensesModule({ goHome }) {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [draft, setDraft] = useState({ description: '', amount: 0, categoryId: '', date: '' });
  const [catName, setCatName] = useState('');

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

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <h1>Expenses</h1>
        <p className="module-sub">Track expenses by category with receipt upload support.</p>
      </div>
      {stats && (
        <div className="stats-row">
          <div className="stat-card"><div className="stat-value">{stats.totalExpenses || 0}</div><div className="stat-label">Total</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--danger)' }}>₦{Number(stats.totalAmount || 0).toLocaleString()}</div><div className="stat-label">Total Amount</div></div>
          <div className="stat-card"><div className="stat-value">{stats.categories || 0}</div><div className="stat-label">Categories</div></div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Button onClick={() => setShowForm(true)}>+ New Expense</Button>
        <Button variant="secondary" onClick={() => setShowCatForm(true)}>+ Category</Button>
      </div>
      <Modal isOpen={showForm} title="Record Expense" onClose={() => setShowForm(false)}>
        <form onSubmit={createExpense}>
          <div className="field"><label className="field-label">Description</label><input className="field-input" value={draft.description} onChange={(e) => setDraft({...draft,description:e.target.value})} required /></div>
          <div className="field"><label className="field-label">Amount (₦)</label><input className="field-input" type="number" min="0" step="0.01" value={draft.amount} onChange={(e) => setDraft({...draft,amount:parseFloat(e.target.value)})} required /></div>
          <div className="field"><label className="field-label">Category</label>
            <select className="field-input" value={draft.categoryId} onChange={(e) => setDraft({...draft,categoryId:e.target.value})}>
              <option value="">Uncategorized</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field"><label className="field-label">Date</label><input className="field-input" type="date" value={draft.date} onChange={(e) => setDraft({...draft,date:e.target.value})} /></div>
          <Button type="submit">Record</Button>
        </form>
      </Modal>
      <Modal isOpen={showCatForm} title="New Category" onClose={() => setShowCatForm(false)}>
        <form onSubmit={createCategory}>
          <div className="field"><label className="field-label">Name</label><input className="field-input" value={catName} onChange={(e) => setCatName(e.target.value)} required /></div>
          <Button type="submit">Create</Button>
        </form>
      </Modal>
      {loading ? <SkeletonRows rows={4} /> : expenses.length === 0 ? (
        <EmptyState icon="💸" title="No expenses yet" action={<Button onClick={() => setShowForm(true)}>+ Record Expense</Button>} />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th></tr></thead>
            <tbody>
              {expenses.map((e) => (
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
      )}
    </div>
  );
}
