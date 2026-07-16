'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../../components/ui/Button';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ModulePage from '../../components/ui/ModulePage';
import Badge from '../../components/ui/Badge';

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', category: '', paymentMethod: 'bank_transfer', date: '' });
  const [stats, setStats] = useState({});
  useEffect(() => {
    Promise.all([
      apiFetch('/api/v1/expenses').then(d => setExpenses(d.expenses || [])).catch(() => {}),
      apiFetch('/api/v1/expenses/stats').then(d => setStats(d.stats || {})).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/expenses', { method: 'POST', body: JSON.stringify({ ...form, amount: Number(form.amount) }) });
      toast.success('Expense added!'); setShowForm(false);
      setForm({ description: '', amount: '', category: '', paymentMethod: 'bank_transfer', date: '' });
      const d = await apiFetch('/api/v1/expenses'); setExpenses(d.expenses || []);
    } catch (err) { toast.error(err.message); }
  }

  return (
    <div className="panel">
      <button className="back-link" onClick={() => router.push('/')}>← Back</button>
      <div className="module-head"><h1>Expenses</h1><p className="module-sub">Track business expenses and categorize spending.</p></div>
      {stats.total !== undefined && (
        <div className="stats-row" style={{marginBottom:16}}>
          <span className="stat-pill">Total: <strong>{stats.total}</strong></span>
          <span className="stat-pill" style={{background:'var(--success-bg)',color:'var(--success)'}}>₦{Number(stats.totalAmount || 0).toLocaleString()}</span>
        </div>
      )}
      <Button onClick={() => setShowForm(true)} style={{marginBottom:16}}>+ Add expense</Button>
      {loading ? <SkeletonRows rows={4} /> : expenses.length === 0 ? (
        <EmptyState icon="💰" title="No expenses yet" action={<Button onClick={() => setShowForm(true)}>+ Add expense</Button>} />
      ) : (
        <div className="card-shell">{
          [...new Set(expenses.map(e => e.category).filter(Boolean))].map(cat => (
            <div key={cat}>{expenses.filter(e => e.category === cat).map(e => (
              <div key={e.id} className="card" style={{padding:'10px 14px',marginBottom:4,display:'flex',justifyContent:'space-between'}}>
                <div><div style={{fontWeight:600}}>{e.description}</div><div style={{fontSize:12,color:'var(--text-muted)'}}>{e.category}</div></div>
                <div style={{fontWeight:700}}>₦{Number(e.amount).toLocaleString()}</div>
              </div>
            ))}</div>
          ))
        }</div>
      )}
      {showForm && (<Modal isOpen title="Add expense" onClose={() => setShowForm(false)}><form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:14}}>
        <div className="field"><label className="field-label">Description</label><input className="field-input" value={form.description} onChange={e => setForm({...form,description:e.target.value})} /></div>
        <div className="field"><label className="field-label">Amount (₦)</label><input className="field-input" type="number" value={form.amount} onChange={e => setForm({...form,amount:e.target.value})} /></div>
        <div className="field"><label className="field-label">Category</label><input className="field-input" value={form.category} onChange={e => setForm({...form,category:e.target.value})} placeholder="e.g. Office supplies" /></div>
        <div className="field"><label className="field-label">Payment method</label><select className="field-select" value={form.paymentMethod} onChange={e => setForm({...form,paymentMethod:e.target.value})}><option value="bank_transfer">Bank transfer</option><option value="cash">Cash</option><option value="card">Card</option><option value="mobile_money">Mobile money</option></select></div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}><Button onClick={() => setShowForm(false)} variant="ghost">Cancel</Button><Button type="submit">Add</Button></div>
      </form></Modal>)}
    </div>
  );
}
