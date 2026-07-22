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

const API_MAP = { 'payroll': '/api/v1/payroll', 'subscriptions': '/api/v1/customer-subs', 'documents': '/api/v1/documents' };
const DESC_MAP = { 'payroll': 'Manage payroll runs and employee salaries.', 'subscriptions': 'Manage customer subscriptions and recurring billing.', 'documents': 'Upload and manage documents.' };

export default function GenericModulePage() {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  useEffect(() => { const s = window.location.pathname.split('/')[1]; setSlug(s); }, []);
  useEffect(() => { if (!slug) return; apiFetch(API_MAP[slug] || '/api/v1/' + slug).then(d => setItems(Object.values(d)[0] || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)); }, [slug]);
  async function handleCreate(e) { e.preventDefault(); try { await apiFetch(API_MAP[slug] || '/api/v1/' + slug, {method:'POST',body:JSON.stringify(form)}); toast.success('Created!'); setShowForm(false); setForm({name:'',description:''}); const d=await apiFetch(API_MAP[slug] || '/api/v1/' + slug); setItems(Object.values(d)[0] || []); } catch(err) { toast.error(err.message); } }
  const label = slug.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  return (
    <ModulePage back={{label:'Workspace',onClick:()=>router.push('/')}} title={label} description={DESC_MAP[slug] || `Manage ${label.toLowerCase()}.`}>
      <Button onClick={()=>setShowForm(true)} style={{marginBottom:16}}>+ New</Button>
      {loading ? <SkeletonRows rows={4} /> : items.length === 0 ? <EmptyState icon="📁" title={`No ${label.toLowerCase()} yet`} action={<Button onClick={()=>setShowForm(true)}>+ New</Button>} /> : (
        <div className="card-shell">{items.map((item,i) => <div key={item.id||i} className="card" style={{padding:'12px 16px',marginBottom:4}}><div style={{fontWeight:600}}>{item.name||item.title||item.description||item.label||item.code||item.id}</div></div>)}</div>
      )}
      {showForm && (<Modal isOpen title={`New ${label.slice(0,-1)}`} onClose={()=>setShowForm(false)}><form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:14}}>
        <div className="field"><label className="field-label">Name</label><input className="field-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
        <div className="field"><label className="field-label">Description</label><textarea className="field-textarea" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}><Button onClick={()=>setShowForm(false)} variant="ghost">Cancel</Button><Button type="submit">Create</Button></div>
      </form></Modal>)}
    </ModulePage>
  );
}
