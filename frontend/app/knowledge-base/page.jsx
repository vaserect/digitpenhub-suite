'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import ModulePage from '../../components/ui/ModulePage';
import Button from '../../components/ui/Button';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import SearchInput from '../../components/ui/SearchInput';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';

export default function KbPage() {
  const router = useRouter();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: '' });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    try { const d = await apiFetch('/api/v1/kb/articles'); setArticles(d.articles || []); }
    catch { toast.error('Failed to load articles'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = articles.filter((a) => !search || a.title.toLowerCase().includes(search.toLowerCase()) || (a.content || '').toLowerCase().includes(search.toLowerCase()));

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      await apiFetch('/api/v1/kb/articles', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Article created!'); setShowForm(false); setForm({ title: '', content: '', category: '' }); await load();
    } catch (err) { toast.error(err.message); }
  }

  async function handleDelete(id) {
    try { await apiFetch(`/api/v1/kb/articles/${id}`, { method: 'DELETE' }); toast.success('Deleted'); await load(); }
    catch (err) { toast.error(err.message); } finally { setConfirmDelete(null); }
  }

  return (
    <ModulePage back={{ label: 'Workspace', onClick: () => router.push('/') }} title="Knowledge Base" description="Create and manage help articles and documentation.">
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px' }}><SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search articles…" /></div>
        <Button onClick={() => setShowForm(true)}>+ New article</Button>
      </div>
      {loading ? <SkeletonRows rows={3} /> : filtered.length === 0 ? (
        <EmptyState icon="📚" title="No articles yet" action={<Button onClick={() => setShowForm(true)}>+ New article</Button>} />
      ) : (
        <div className="card-shell">{[...new Set(articles.map(a => a.category).filter(Boolean))].map(cat => (
          <div key={cat} style={{ marginBottom: 16 }}><div style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>{cat}</div>
            {filtered.filter(a => a.category === cat).map(a => (
              <div key={a.id} className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div><div style={{ fontWeight: 600 }}>{a.title}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(a.content || '').substring(0, 100)}</div></div>
                <Button size="sm" variant="danger" onClick={() => setConfirmDelete(a)}>Delete</Button>
              </div>
            ))}
          </div>
        ))}</div>
      )}
      {showForm && (<Modal isOpen title="New article" onClose={() => setShowForm(false)}><form onSubmit={handleCreate} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div className="field"><label className="field-label">Title</label><input className="field-input" value={form.title} onChange={(e) => setForm({...form, title:e.target.value})} /></div>
        <div className="field"><label className="field-label">Category</label><input className="field-input" value={form.category} onChange={(e) => setForm({...form, category:e.target.value})} placeholder="e.g. Getting Started" /></div>
        <div className="field"><label className="field-label">Content</label><textarea className="field-textarea" rows={6} value={form.content} onChange={(e) => setForm({...form, content:e.target.value})} /></div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}><Button onClick={() => setShowForm(false)} variant="ghost">Cancel</Button><Button type="submit">Create</Button></div>
      </form></Modal>)}
      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => handleDelete(confirmDelete.id)} title="Delete article?" confirmLabel="Delete" cancelLabel="Cancel" danger />
    </ModulePage>
  );
}
