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

export default function RecruitmentPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', location: '' });
  useEffect(() => { apiFetch('/api/v1/recruitment/jobs').then(d => setJobs(d.jobs || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)); }, []);
  async function handleCreate(e) { e.preventDefault(); try { await apiFetch('/api/v1/recruitment/jobs', {method:'POST',body:JSON.stringify(form)}); toast.success('Job posted!'); setShowForm(false); setForm({title:'',description:'',location:''}); const d=await apiFetch('/api/v1/recruitment/jobs'); setJobs(d.jobs||[]); } catch(err) { toast.error(err.message); } }
  return (
    <ModulePage back={{label:'Workspace',onClick:()=>router.push('/')}} title="Recruitment" description="Manage job postings and applicants.">
      <Button onClick={()=>setShowForm(true)} style={{marginBottom:16}}>+ Post job</Button>
      {loading ? <SkeletonRows rows={3} /> : jobs.length === 0 ? <EmptyState icon="💼" title="No jobs yet" action={<Button onClick={()=>setShowForm(true)}>+ Post job</Button>} /> : (
        <div className="card-shell">{jobs.map(j => <div key={j.id} className="card" style={{padding:'12px 16px',marginBottom:4}}><div style={{fontWeight:600}}>{j.title}</div><div style={{fontSize:12,color:'var(--text-muted)'}}>{j.location||''}</div></div>)}</div>
      )}
      {showForm && (<Modal isOpen title="Post job" onClose={()=>setShowForm(false)}><form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:14}}>
        <div className="field"><label className="field-label">Title</label><input className="field-input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} /></div>
        <div className="field"><label className="field-label">Location</label><input className="field-input" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} /></div>
        <div className="field"><label className="field-label">Description</label><textarea className="field-textarea" rows={4} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}><Button onClick={()=>setShowForm(false)} variant="ghost">Cancel</Button><Button type="submit">Post</Button></div>
      </form></Modal>)}
    </ModulePage>
  );
}
