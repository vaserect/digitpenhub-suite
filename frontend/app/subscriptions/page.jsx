'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import ModulePage from '../../components/ui/ModulePage';
import Button from '../../components/ui/Button';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';

export default function SubscriptionsPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', amount: '' });
  useEffect(() => {
    apiFetch('/api/v1/customer-subs').then(d => setItems(d.subscriptions || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);
  async function handleCreate(e) { e.preventDefault(); try { await apiFetch('/api/v1/customer-subs', {method:'POST',body:JSON.stringify({...form,amount:Number(form.amount)})}); toast.success('Created!'); setShowForm(false); setForm({name:'',amount:''}); const d=await apiFetch('/api/v1/customer-subs'); setItems(d.subscriptions||[]); } catch(err) { toast.error(err.message); } }
  return (
    <ModulePage back={{label:'Workspace',onClick:()=>router.push('/')}} title="Subscriptions" description="Manage customer subscriptions and recurring billing.">
      <Button onClick={()=>setShowForm(true)} style={{marginBottom:16}}>+ New subscription</Button>
      {loading ? <SkeletonRows rows={4} /> : items.length === 0 ? <EmptyState icon="🔄" title="No subscriptions yet" action={<Button onClick={()=>setShowForm(true)}>+ New subscription</Button>} /> : (
        <div className="card-shell">{items.map((item,i) => <div key={item.id||i} className="card" style={{padding:'12px 16px',marginBottom:4}}><div style={{fontWeight:600}}>{item.name||item.customer_name||item.plan_name}</div><div style={{fontSize:12,color:'var(--text-muted)'}}>{item.amount ? `₦${Number(item.amount).toLocaleString()}/mo` : ''}</div></div>)}</div>
      )}
      {showForm && (<Modal isOpen title="New subscription" onClose={()=>setShowForm(false)}><form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:14}}>
        <div className="field"><label className="field-label">Name</label><input className="field-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
        <div className="field"><label className="field-label">Amount (₦)</label><input className="field-input" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} /></div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}><Button onClick={()=>setShowForm(false)} variant="ghost">Cancel</Button><Button type="submit">Create</Button></div>
      </form></Modal>)}
    </ModulePage>
  );
}
