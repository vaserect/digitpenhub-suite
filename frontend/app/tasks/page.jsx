'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import ModulePage from '../../components/ui/ModulePage';
import Button from '../../components/ui/Button';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';

export default function TasksPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', priority: 'medium' });
  useEffect(() => { apiFetch('/api/v1/tasks').then(d => setData(d.tasks || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)); }, []);
  async function handleCreate(e) { e.preventDefault(); try { await apiFetch('/api/v1/tasks', {method:'POST',body:JSON.stringify(form)}); toast.success('Task created!'); setShowForm(false); setForm({title:'',priority:'medium'}); const d=await apiFetch('/api/v1/tasks'); setData(d.tasks||[]); } catch(err) { toast.error(err.message); } }
  return (
    <ModulePage back={{label:'Workspace',onClick:()=>router.push('/')}} title="Task Management" description="Track standalone tasks and to-dos.">
      <Button onClick={() => setShowForm(true)} style={{marginBottom:16}}>+ New task</Button>
      {loading ? <SkeletonRows rows={3} /> : data.length === 0 ? <EmptyState icon="✅" title="No tasks yet" action={<Button onClick={() => setShowForm(true)}>+ New task</Button>} /> : (
        <div className="card-shell">{[['todo','To do'],['in_progress','In progress'],['done','Done']].map(([status,label]) => {
          const items = data.filter(t => t.status === status);
          return items.length ? <div key={status} style={{marginBottom:12}}><div style={{fontWeight:700,fontSize:12,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--text-muted)',marginBottom:6}}>{label} ({items.length})</div>{items.map(t => <div key={t.id} className="card" style={{padding:'10px 14px',marginBottom:4}}><div style={{fontWeight:600}}>{t.title}</div></div>)}</div> : null;
        })}</div>
      )}
      {showForm && (<Modal isOpen title="New task" onClose={() => setShowForm(false)}><form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:14}}>
        <div className="field"><label className="field-label">Title</label><input className="field-input" value={form.title} onChange={e => setForm({...form,title:e.target.value})} /></div>
        <div className="field"><label className="field-label">Priority</label><select className="field-select" value={form.priority} onChange={e => setForm({...form,priority:e.target.value})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}><Button onClick={() => setShowForm(false)} variant="ghost">Cancel</Button><Button type="submit">Create</Button></div>
      </form></Modal>)}
    </ModulePage>
  );
}
