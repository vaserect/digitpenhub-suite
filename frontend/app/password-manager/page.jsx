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

export default function PasswordManagerPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', url: '', username: '', password: '' });
  useEffect(() => {
    apiFetch('/api/v1/password-manager').then(d => setItems(d.entries || d.passwords || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);
  async function handleCreate(e) { e.preventDefault(); try { await apiFetch('/api/v1/password-manager', {method:'POST',body:JSON.stringify(form)}); toast.success('Saved!'); setShowForm(false); setForm({name:'',url:'',username:'',password:''}); const d=await apiFetch('/api/v1/password-manager'); setItems(d.entries||d.passwords||[]); } catch(err) { toast.error(err.message); } }
  return (
    <ModulePage back={{label:'Workspace',onClick:()=>router.push('/')}} title="Password Manager" description="Store and organize passwords securely.">
      <Button onClick={()=>setShowForm(true)} style={{marginBottom:16}}>+ Add entry</Button>
      {loading ? <SkeletonRows rows={4} /> : items.length === 0 ? <EmptyState icon="🔑" title="No passwords yet" action={<Button onClick={()=>setShowForm(true)}>+ Add entry</Button>} /> : (
        <div className="card-shell">{items.map((item,i) => <div key={item.id||i} className="card" style={{padding:'12px 16px',marginBottom:4}}><div style={{fontWeight:600}}>{item.name||item.title||item.url||'Entry'}</div><div style={{fontSize:12,color:'var(--text-muted)'}}>{item.username}</div></div>)}</div>
      )}
      {showForm && (<Modal isOpen title="Add entry" onClose={()=>setShowForm(false)}><form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:14}}>
        <div className="field"><label className="field-label">Name</label><input className="field-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
        <div className="field"><label className="field-label">URL</label><input className="field-input" value={form.url} onChange={e=>setForm({...form,url:e.target.value})} placeholder="https://" /></div>
        <div className="field"><label className="field-label">Username</label><input className="field-input" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} /></div>
        <div className="field"><label className="field-label">Password</label><input className="field-input" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} /></div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}><Button onClick={()=>setShowForm(false)} variant="ghost">Cancel</Button><Button type="submit">Save</Button></div>
      </form></Modal>)}
    </ModulePage>
  );
}
