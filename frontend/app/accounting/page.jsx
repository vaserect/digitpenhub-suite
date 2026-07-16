'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../../components/ui/Button';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

export default function AccountingPage() {
  const router = useRouter();
  const [tab, setTab] = useState('accounts');
  const [accounts, setAccounts] = useState([]);
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'income', code: '', description: '' });
  useEffect(() => {
    Promise.all([
      apiFetch('/api/v1/accounting/accounts').then(d => setAccounts(d.accounts||[])).catch(() => {}),
      apiFetch('/api/v1/accounting/entries').then(d => setEntries(d.entries||[])).catch(() => {}),
      apiFetch('/api/v1/accounting/stats').then(d => setStats(d.stats||{})).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);
  async function handleCreate(e) {
    e.preventDefault(); if (!form.name.trim()) return;
    try {
      await apiFetch('/api/v1/accounting/accounts', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Account created!'); setShowForm(false); setForm({name:'',type:'income',code:'',description:''});
      const d = await apiFetch('/api/v1/accounting/accounts'); setAccounts(d.accounts||[]);
    } catch (err) { toast.error(err.message); }
  }
  return (<div className="panel"><button className="back-link" onClick={() => router.push('/')}>← Back</button>
    <div className="module-head"><h1>Accounting</h1><p className="module-sub">Chart of accounts, journal entries, and financial reports.</p></div>
    <div className="stats-row" style={{marginBottom:16}}><span className="stat-pill">Accounts: <strong>{stats.totalAccounts||accounts.length}</strong></span><span className="stat-pill">Entries: <strong>{stats.totalEntries||entries.length}</strong></span></div>
    <div style={{display:'flex',gap:8,marginBottom:16}}>
      <Button onClick={()=>setTab('accounts')} style={{background:tab==='accounts'?'var(--primary)':'var(--surface)',color:tab==='accounts'?'#fff':'inherit'}}>Accounts</Button>
      <Button onClick={()=>setTab('entries')} style={{background:tab==='entries'?'var(--primary)':'var(--surface)',color:tab==='entries'?'#fff':'inherit'}}>Journal Entries</Button>
    </div>
    {loading ? <SkeletonRows rows={4} /> : tab === 'accounts' ? (
      <div><Button onClick={()=>setShowForm(true)} style={{marginBottom:16}}>+ New account</Button>
      {accounts.length === 0 ? <EmptyState icon="📊" title="No accounts yet" /> : (
        <div className="card-shell">{[...new Set(accounts.map(a=>a.type))].map(type => <div key={type} style={{marginBottom:12}}>
          <div style={{fontWeight:700,fontSize:12,textTransform:'uppercase',color:'var(--text-muted)',marginBottom:6}}>{type}</div>
          {accounts.filter(a=>a.type===type).map(a => <div key={a.id} className="card" style={{padding:'10px 14px',marginBottom:4,display:'flex',justifyContent:'space-between'}}>
            <div><div style={{fontWeight:600}}>{a.name}</div><div style={{fontSize:11,color:'var(--text-muted)'}}>{a.code}</div></div>
            {a.balance !== undefined && <div style={{fontWeight:600}}>₦{Number(a.balance).toLocaleString()}</div>}
          </div>)}
        </div>)}</div>
      )}</div>
    ) : entries.length === 0 ? <EmptyState icon="📝" title="No journal entries yet" /> : (
      <div className="card-shell">{entries.map(e => <div key={e.id} className="card" style={{padding:'12px 16px',marginBottom:4}}>
        <div style={{fontWeight:600}}>{e.description||'Journal entry'}</div><div style={{fontSize:12,color:'var(--text-muted)'}}>{new Date(e.date||e.created_at).toLocaleDateString()} · {e.line_count||0} lines</div>
      </div>)}</div>
    )}
    {showForm && (<Modal isOpen title="New account" onClose={()=>setShowForm(false)}><form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:14}}>
      <div className="field"><label className="field-label">Name</label><input className="field-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
      <div className="field"><label className="field-label">Type</label><select className="field-select" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="asset">Asset</option><option value="liability">Liability</option><option value="equity">Equity</option><option value="income">Income</option><option value="expense">Expense</option></select></div>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}><Button onClick={()=>setShowForm(false)} variant="ghost">Cancel</Button><Button type="submit">Create</Button></div>
    </form></Modal>)}
  </div>);
}
