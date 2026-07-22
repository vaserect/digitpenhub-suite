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

export default function SmsMarketingPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  useEffect(() => {
    apiFetch('/api/v1/sms/contacts').then(d => setData(d.contacts || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);
  async function handleCreate(e) { e.preventDefault(); try { await apiFetch('/api/v1/sms/contacts', {method:'POST',body:JSON.stringify(form)}); toast.success('Added!'); setShowForm(false); setForm({name:'',phone:''}); const d=await apiFetch('/api/v1/sms/contacts'); setData(d.contacts||[]); } catch(err) { toast.error(err.message); } }
  return (
    <ModulePage back={{label:'Workspace',onClick:()=>router.push('/')}} title="SMS Marketing" description="Reach customers via SMS campaigns.">
      <Button onClick={()=>setShowForm(true)} style={{marginBottom:16}}>+ Add contact</Button>
      {loading ? <SkeletonRows rows={4} /> : data.length === 0 ? <EmptyState icon="📱" title="No contacts yet" action={<Button onClick={()=>setShowForm(true)}>+ Add contact</Button>} /> : (
        <div className="card-shell">{data.map((item,i) => <div key={item.id||i} className="card" style={{padding:'12px 16px',marginBottom:4}}><div style={{fontWeight:600}}>{item.name||item.first_name||item.phone}</div><div style={{fontSize:12,color:'var(--text-muted)'}}>{item.phone||''}</div></div>)}</div>
      )}
      {showForm && (<Modal isOpen title="Add contact" onClose={()=>setShowForm(false)}><form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:14}}>
        <div className="field"><label className="field-label">Name</label><input className="field-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
        <div className="field"><label className="field-label">Phone</label><input className="field-input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+234..." /></div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}><Button onClick={()=>setShowForm(false)} variant="ghost">Cancel</Button><Button type="submit">Add</Button></div>
      </form></Modal>)}
    </ModulePage>
  );
}
