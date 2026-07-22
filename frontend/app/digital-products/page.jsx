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

export default function DigitalProductsPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', price: '' });
  useEffect(() => {
    apiFetch('/api/v1/digital-products').then(d => setItems(d.products || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);
  async function handleCreate(e) { e.preventDefault(); try { await apiFetch('/api/v1/digital-products', {method:'POST',body:JSON.stringify({...form,price:Number(form.price)})}); toast.success('Created!'); setShowForm(false); setForm({name:'',price:''}); const d=await apiFetch('/api/v1/digital-products'); setItems(d.products||[]); } catch(err) { toast.error(err.message); } }
  return (
    <ModulePage back={{label:'Workspace',onClick:()=>router.push('/')}} title="Digital Products" description="Manage digital downloads and products.">
      <Button onClick={()=>setShowForm(true)} style={{marginBottom:16}}>+ New product</Button>
      {loading ? <SkeletonRows rows={4} /> : items.length === 0 ? <EmptyState icon="💾" title="No products yet" action={<Button onClick={()=>setShowForm(true)}>+ New product</Button>} /> : (
        <div className="card-shell">{items.map((item,i) => <div key={item.id||i} className="card" style={{padding:'12px 16px',marginBottom:4}}><div style={{fontWeight:600}}>{item.name||item.title}</div><div style={{fontSize:12,color:'var(--text-muted)'}}>₦{Number(item.price||0).toLocaleString()}</div></div>)}</div>
      )}
      {showForm && (<Modal isOpen title="New product" onClose={()=>setShowForm(false)}><form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:14}}>
        <div className="field"><label className="field-label">Name</label><input className="field-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
        <div className="field"><label className="field-label">Price (₦)</label><input className="field-input" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} /></div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}><Button onClick={()=>setShowForm(false)} variant="ghost">Cancel</Button><Button type="submit">Create</Button></div>
      </form></Modal>)}
    </ModulePage>
  );
}
