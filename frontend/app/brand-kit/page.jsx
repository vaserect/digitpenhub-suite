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

export default function BrandKitPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', colors: '' });
  useEffect(() => {
    apiFetch('/api/v1/brand-kit').then(d => setItems(d.kits || d.brandKits || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);
  async function handleCreate(e) { e.preventDefault(); try { await apiFetch('/api/v1/brand-kit', {method:'POST',body:JSON.stringify(form)}); toast.success('Saved!'); setShowForm(false); setForm({name:'',colors:''}); const d=await apiFetch('/api/v1/brand-kit'); setItems(d.kits||d.brandKits||[]); } catch(err) { toast.error(err.message); } }
  return (
    <ModulePage back={{label:'Workspace',onClick:()=>router.push('/')}} title="Brand Kit" description="Store brand colors, logos, and guidelines.">
      <Button onClick={()=>setShowForm(true)} style={{marginBottom:16}}>+ New kit</Button>
      {loading ? <SkeletonRows rows={4} /> : items.length === 0 ? <EmptyState icon="🎯" title="No brand kits yet" action={<Button onClick={()=>setShowForm(true)}>+ New kit</Button>} /> : (
        <div className="card-shell">{items.map((item,i) => <div key={item.id||i} className="card" style={{padding:'12px 16px',marginBottom:4}}><div style={{fontWeight:600}}>{item.name||item.brand_name||'Brand Kit'}</div></div>)}</div>
      )}
      {showForm && (<Modal isOpen title="New brand kit" onClose={()=>setShowForm(false)}><form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:14}}>
        <div className="field"><label className="field-label">Name</label><input className="field-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
        <div className="field"><label className="field-label">Colors</label><input className="field-input" value={form.colors} onChange={e=>setForm({...form,colors:e.target.value})} placeholder="#2563eb, #1d4ed8" /></div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}><Button onClick={()=>setShowForm(false)} variant="ghost">Cancel</Button><Button type="submit">Save</Button></div>
      </form></Modal>)}
    </ModulePage>
  );
}
