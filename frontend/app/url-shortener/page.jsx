'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../../components/ui/Button';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';

export default function UrlShortenerPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ url: '', slug: '' });
  const [page, setPage] = useState(1);
  const ps = 10;
  useEffect(() => { apiFetch('/api/v1/url-shortener').then(d => setData(d.links || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)); }, []);
  async function handleCreate(e) { e.preventDefault(); try { await apiFetch('/api/v1/url-shortener', {method:'POST',body:JSON.stringify({originalUrl:form.url,customSlug:form.slug})}); toast.success('Short link created!'); setShowForm(false); setForm({url:'',slug:''}); const d=await apiFetch('/api/v1/url-shortener'); setData(d.links||[]); } catch(err) { toast.error(err.message); } }
  const rows = data.slice((page-1)*ps, page*ps);
  return (<div className="panel"><button className="back-link" onClick={() => router.push('/')}>← Back</button>
    <div className="module-head"><h1>URL Shortener</h1><p className="module-sub">Create short links with click tracking.</p></div>
    <Button onClick={() => setShowForm(true)} style={{marginBottom:16}}>+ New short link</Button>
    {loading ? <SkeletonRows rows={3} /> : data.length === 0 ? <EmptyState icon="🔗" title="No short links yet" action={<Button onClick={() => setShowForm(true)}>+ New short link</Button>} /> : (
      <div className="card-shell">{rows.map(l => <div key={l.id} className="card" style={{padding:'12px 16px',marginBottom:4}}><div style={{fontWeight:600}}>/{l.slug || l.short_code}</div><div style={{fontSize:12,color:'var(--text-muted)'}}>{l.original_url} · {l.click_count || 0} clicks</div></div>)}
      <Pagination page={page} pageCount={Math.ceil(data.length/ps)} total={data.length} pageSize={ps} onPageChange={setPage} /></div>
    )}
    {showForm && (<Modal isOpen title="New short link" onClose={() => setShowForm(false)}><form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:14}}>
      <div className="field"><label className="field-label">Destination URL</label><input className="field-input" value={form.url} onChange={e => setForm({...form,url:e.target.value})} placeholder="https://..." /></div>
      <div className="field"><label className="field-label">Custom slug (optional)</label><input className="field-input" value={form.slug} onChange={e => setForm({...form,slug:e.target.value})} placeholder="my-link" /></div>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}><Button onClick={() => setShowForm(false)} variant="ghost">Cancel</Button><Button type="submit">Create</Button></div>
    </form></Modal>)}
  </div>);
}
