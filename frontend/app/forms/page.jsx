'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

export default function FormsPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  useEffect(() => { apiFetch('/api/v1/leads/forms').then(d => setData(d.forms||[])).catch(() => {}).finally(() => setLoading(false)); }, []);
  async function handleCreate(e) { e.preventDefault(); try { await apiFetch('/api/v1/leads/forms',{method:'POST',body:JSON.stringify({name})}); toast.success('Form created!'); setShowForm(false); setName(''); const d=await apiFetch('/api/v1/leads/forms'); setData(d.forms||[]); } catch(err) { toast.error(err.message); } }
  return (<div className="panel"><button className="back-link" onClick={()=>router.push('/')}>← Back</button>
    <div className="module-head"><h1>Forms</h1><p className="module-sub">Build and manage forms, surveys, and lead capture forms.</p></div>
    <Button onClick={()=>setShowForm(true)} style={{marginBottom:16}}>+ New form</Button>
    {loading ? <SkeletonRows rows={3} /> : data.length === 0 ? <EmptyState icon="📋" title="No forms yet" action={<Button onClick={()=>setShowForm(true)}>+ New form</Button>} /> : (
      <div className="card-shell">{data.map(f => <div key={f.id} className="card" style={{padding:'12px 16px',marginBottom:4}}><div style={{fontWeight:600}}>{f.name}</div><div style={{fontSize:12,color:'var(--text-muted)'}}>{(f.fields||[]).length} fields · {f.submission_count||0} submissions</div></div>)}</div>
    )}
    {showForm && (<Modal isOpen title="New form" onClose={()=>setShowForm(false)}><form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:14}}>
      <div className="field"><label className="field-label">Name</label><input className="field-input" value={name} onChange={e=>setName(e.target.value)} /></div>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}><Button onClick={()=>setShowForm(false)} variant="ghost">Cancel</Button><Button type="submit">Create</Button></div>
    </form></Modal>)}
  </div>);
}
