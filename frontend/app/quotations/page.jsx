'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../../components/ui/Button';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ModulePage from '../../components/ui/ModulePage';
import Badge from '../../components/ui/Badge';

export default function QuotationsPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ clientName: '', clientEmail: '', items: [{ description: '', quantity: 1, unitPrice: 0 }], notes: '' });
  useEffect(() => { apiFetch('/api/v1/quotations').then(d => setData(d.quotations || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)); }, []);
  async function handleCreate(e) { e.preventDefault(); try { await apiFetch('/api/v1/quotations', {method:'POST',body:JSON.stringify(form)}); toast.success('Quotation created!'); setShowForm(false); setForm({clientName:'',clientEmail:'',items:[{description:'',quantity:1,unitPrice:0}],notes:''}); const d=await apiFetch('/api/v1/quotations'); setData(d.quotations||[]); } catch(err) { toast.error(err.message); } }
  return (<div className="panel"><button className="back-link" onClick={() => router.push('/')}>← Back</button>
    <div className="module-head"><h1>Quotations</h1><p className="module-sub">Create and manage quotes for clients.</p></div>
    <Button onClick={() => setShowForm(true)} style={{marginBottom:16}}>+ New quotation</Button>
    {loading ? <SkeletonRows rows={3} /> : data.length === 0 ? <EmptyState icon="📄" title="No quotations yet" action={<Button onClick={() => setShowForm(true)}>+ New quotation</Button>} /> : (
      <div className="card-shell">{data.map(q => <div key={q.id} className="card" style={{padding:'12px 16px',marginBottom:4}}><div style={{fontWeight:600}}>{q.client_name}</div><div style={{fontSize:12,color:'var(--text-muted)'}}>{q.status} · ₦{Number(q.total || 0).toLocaleString()}</div></div>)}</div>
    )}
    {showForm && (<Modal isOpen title="New quotation" onClose={() => setShowForm(false)}><form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:14}}>
      <div className="field"><label className="field-label">Client name</label><input className="field-input" value={form.clientName} onChange={e => setForm({...form,clientName:e.target.value})} /></div>
      <div className="field"><label className="field-label">Client email</label><input className="field-input" type="email" value={form.clientEmail} onChange={e => setForm({...form,clientEmail:e.target.value})} /></div>
      <div className="field"><label className="field-label">Notes</label><textarea className="field-textarea" rows={3} value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} /></div>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}><Button onClick={() => setShowForm(false)} variant="ghost">Cancel</Button><Button type="submit">Create</Button></div>
    </form></Modal>)}
  </div>);
}
