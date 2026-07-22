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

export default function DocumentsPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  useEffect(() => {
    apiFetch('/api/v1/documents').then(d => setItems(d.documents || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);
  async function handleCreate(e) { e.preventDefault(); try { await apiFetch('/api/v1/documents', {method:'POST',body:JSON.stringify(form)}); toast.success('Created!'); setShowForm(false); setForm({title:'',content:''}); const d=await apiFetch('/api/v1/documents'); setItems(d.documents||[]); } catch(err) { toast.error(err.message); } }
  return (
    <ModulePage back={{label:'Workspace',onClick:()=>router.push('/')}} title="Document Management" description="Upload and manage documents.">
      <Button onClick={()=>setShowForm(true)} style={{marginBottom:16}}>+ New document</Button>
      {loading ? <SkeletonRows rows={4} /> : items.length === 0 ? <EmptyState icon="📄" title="No documents yet" action={<Button onClick={()=>setShowForm(true)}>+ New document</Button>} /> : (
        <div className="card-shell">{items.map((item,i) => <div key={item.id||i} className="card" style={{padding:'12px 16px',marginBottom:4}}><div style={{fontWeight:600}}>{item.title||item.name}</div><div style={{fontSize:12,color:'var(--text-muted)'}}>{(item.content||'').substring(0,80)}</div></div>)}</div>
      )}
      {showForm && (<Modal isOpen title="New document" onClose={()=>setShowForm(false)}><form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:14}}>
        <div className="field"><label className="field-label">Title</label><input className="field-input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} /></div>
        <div className="field"><label className="field-label">Content</label><textarea className="field-textarea" rows={6} value={form.content} onChange={e=>setForm({...form,content:e.target.value})} /></div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}><Button onClick={()=>setShowForm(false)} variant="ghost">Cancel</Button><Button type="submit">Create</Button></div>
      </form></Modal>)}
    </ModulePage>
  );
}
