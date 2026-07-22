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

export default function ColorPalettesPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', colors: '' });
  useEffect(() => {
    apiFetch('/api/v1/color-palettes').then(d => setItems(d.palettes || d.colorPalettes || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);
  async function handleCreate(e) { e.preventDefault(); try { await apiFetch('/api/v1/color-palettes', {method:'POST',body:JSON.stringify({...form,colors:form.colors.split(',').map(c=>c.trim())})}); toast.success('Created!'); setShowForm(false); setForm({name:'',colors:''}); const d=await apiFetch('/api/v1/color-palettes'); setItems(d.palettes||d.colorPalettes||[]); } catch(err) { toast.error(err.message); } }
  return (
    <ModulePage back={{label:'Workspace',onClick:()=>router.push('/')}} title="Color Palettes" description="Create and save color palettes.">
      <Button onClick={()=>setShowForm(true)} style={{marginBottom:16}}>+ New palette</Button>
      {loading ? <SkeletonRows rows={4} /> : items.length === 0 ? <EmptyState icon="🎨" title="No palettes yet" action={<Button onClick={()=>setShowForm(true)}>+ New palette</Button>} /> : (
        <div className="card-shell">{items.map((item,i) => <div key={item.id||i} className="card" style={{padding:'12px 16px',marginBottom:4}}><div style={{fontWeight:600}}>{item.name}</div><div style={{display:'flex',gap:4,marginTop:6}}>{(item.colors||[]).map((c,ci) => <div key={ci} style={{width:20,height:20,borderRadius:4,background:c,border:'1px solid var(--border)'}} />)}</div></div>)}</div>
      )}
      {showForm && (<Modal isOpen title="New palette" onClose={()=>setShowForm(false)}><form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:14}}>
        <div className="field"><label className="field-label">Name</label><input className="field-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
        <div className="field"><label className="field-label">Colors (comma-separated)</label><input className="field-input" value={form.colors} onChange={e=>setForm({...form,colors:e.target.value})} placeholder="#2563eb, #ef4444, #22c55e" /></div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}><Button onClick={()=>setShowForm(false)} variant="ghost">Cancel</Button><Button type="submit">Create</Button></div>
      </form></Modal>)}
    </ModulePage>
  );
}
