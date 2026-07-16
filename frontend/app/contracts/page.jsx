'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../../components/ui/Button';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ModulePage from '../../components/ui/ModulePage';
import Badge from '../../components/ui/Badge';

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', parties: '' });
  const [detail, setDetail] = useState(null);
  useEffect(() => { apiFetch('/api/v1/contracts').then(d => setContracts(d.contracts || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)); }, []);
  async function handleCreate(e) { e.preventDefault(); try { await apiFetch('/api/v1/contracts', {method:'POST',body:JSON.stringify(form)}); toast.success('Created!'); setShowForm(false); const d = await apiFetch('/api/v1/contracts'); setContracts(d.contracts || []); } catch(err) { toast.error(err.message); } }
  return (<div className="panel"><button className="back-link" onClick={() => router.push('/')}>← Back</button>
    <div className="module-head"><h1>Contracts</h1><p className="module-sub">Manage contracts and e-signatures.</p></div>
    <Button onClick={() => setShowForm(true)} style={{marginBottom:16}}>+ New contract</Button>
    {loading ? <SkeletonRows rows={3} /> : contracts.length === 0 ? <EmptyState icon="📝" title="No contracts yet" action={<Button onClick={() => setShowForm(true)}>+ New contract</Button>} /> : (
      <div className="card-shell">{contracts.map(c => <div key={c.id} className="card" style={{padding:'12px 16px',marginBottom:4,cursor:'pointer'}} onClick={() => setDetail(c)}><div style={{fontWeight:600}}>{c.title}</div><div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{c.status} · {new Date(c.created_at).toLocaleDateString()}</div></div>)}</div>
    )}
    {showForm && (<Modal isOpen title="New contract" onClose={() => setShowForm(false)}><form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:14}}>
      <div className="field"><label className="field-label">Title</label><input className="field-input" value={form.title} onChange={e => setForm({...form,title:e.target.value})} /></div>
      <div className="field"><label className="field-label">Parties</label><input className="field-input" value={form.parties} onChange={e => setForm({...form,parties:e.target.value})} placeholder="e.g. Acme Corp and John Doe" /></div>
      <div className="field"><label className="field-label">Content</label><textarea className="field-textarea" rows={8} value={form.content} onChange={e => setForm({...form,content:e.target.value})} /></div>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}><Button onClick={() => setShowForm(false)} variant="ghost">Cancel</Button><Button type="submit">Create</Button></div>
    </form></Modal>)}
    {detail && (<Modal isOpen title={detail.title} onClose={() => setDetail(null)} wide><div style={{marginBottom:12}}><Badge>{detail.status}</Badge></div><pre style={{fontSize:13,whiteSpace:'pre-wrap',background:'var(--surface-muted)',padding:16,borderRadius:8}}>{detail.content}</pre></Modal>)}
  </div>);
}
