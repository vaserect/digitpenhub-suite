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

export default function InventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', quantity: '' });
  useEffect(() => { apiFetch('/api/v1/inventory').then(d => setItems(d.items || d.inventory || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)); }, []);
  async function handleCreate(e) { e.preventDefault(); try { await apiFetch('/api/v1/inventory', {method:'POST',body:JSON.stringify({...form,quantity:Number(form.quantity)})}); toast.success('Added!'); setShowForm(false); setForm({name:'',quantity:''}); const d=await apiFetch('/api/v1/inventory'); setItems(d.items||d.inventory||[]); } catch(err) { toast.error(err.message); } }
  return (
    <ModulePage back={{label:'Workspace',onClick:()=>router.push('/')}} title="Inventory" description="Track stock levels and inventory items.">
      <Button onClick={()=>setShowForm(true)} style={{marginBottom:16}}>+ Add item</Button>
      {loading ? <SkeletonRows rows={4} /> : items.length === 0 ? <EmptyState icon="📦" title="No inventory items yet" action={<Button onClick={()=>setShowForm(true)}>+ Add item</Button>} /> : (
        <div className="card-shell">{items.map((item,i) => <div key={item.id||i} className="card" style={{padding:'12px 16px',marginBottom:4,display:'flex',justifyContent:'space-between'}}><div><div style={{fontWeight:600}}>{item.name||item.title}</div><div style={{fontSize:12,color:'var(--text-muted)'}}>{item.sku||''}</div></div><div style={{fontWeight:700}}>{item.quantity||item.stock||0}</div></div>)}</div>
      )}
      {showForm && (<Modal isOpen title="Add item" onClose={()=>setShowForm(false)}><form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:14}}>
        <div className="field"><label className="field-label">Name</label><input className="field-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
        <div className="field"><label className="field-label">Quantity</label><input className="field-input" type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} /></div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}><Button onClick={()=>setShowForm(false)} variant="ghost">Cancel</Button><Button type="submit">Add</Button></div>
      </form></Modal>)}
    </ModulePage>
  );
}
