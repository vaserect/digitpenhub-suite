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
import Badge from '../../components/ui/Badge';

export default function AffiliatesPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', commissionRate: '' });
  useEffect(() => {
    apiFetch('/api/v1/affiliates').then(d => setItems(d.affiliates || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);
  async function handleCreate(e) { e.preventDefault(); try { await apiFetch('/api/v1/affiliates', {method:'POST',body:JSON.stringify({...form,commissionRate:Number(form.commissionRate)})}); toast.success('Created!'); setShowForm(false); setForm({name:'',commissionRate:''}); const d=await apiFetch('/api/v1/affiliates'); setItems(d.affiliates||[]); } catch(err) { toast.error(err.message); } }
  return (
    <ModulePage back={{label:'Workspace',onClick:()=>router.push('/')}} title="Affiliates" description="Manage affiliates and track commissions.">
      <Button onClick={()=>setShowForm(true)} style={{marginBottom:16}}>+ New affiliate</Button>
      {loading ? <SkeletonRows rows={4} /> : items.length === 0 ? <EmptyState icon="🤝" title="No affiliates yet" action={<Button onClick={()=>setShowForm(true)}>+ New affiliate</Button>} /> : (
        <div className="card-shell">{items.map((item,i) => <div key={item.id||i} className="card" style={{padding:'12px 16px',marginBottom:4}}><div style={{fontWeight:600}}>{item.name||item.full_name||item.email}</div><div style={{display:'flex',gap:8,marginTop:4}}><Badge variant={item.status === 'active' ? 'success' : 'neutral'}>{item.status||'active'}</Badge><span style={{fontSize:12,color:'var(--text-muted)'}}>{item.commission_rate ? `${item.commission_rate}%` : ''}</span></div></div>)}
      </div>)}
      {showForm && (<Modal isOpen title="New affiliate" onClose={()=>setShowForm(false)}><form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:14}}>
        <div className="field"><label className="field-label">Name</label><input className="field-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
        <div className="field"><label className="field-label">Commission rate (%)</label><input className="field-input" type="number" min="0" max="100" value={form.commissionRate} onChange={e=>setForm({...form,commissionRate:e.target.value})} /></div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}><Button onClick={()=>setShowForm(false)} variant="ghost">Cancel</Button><Button type="submit">Create</Button></div>
      </form></Modal>)}
    </ModulePage>
  );
}
