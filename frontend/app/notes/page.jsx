'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import ModulePage from '../../components/ui/ModulePage';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });

  useEffect(() => {
    apiFetch('/api/v1/notes').then(d => setNotes(d.notes || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      await apiFetch('/api/v1/notes', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Note created!'); setShowForm(false); setForm({ title: '', content: '' });
      const d = await apiFetch('/api/v1/notes'); setNotes(d.notes || []);
    } catch (err) { toast.error(err.message); }
  }

  return (
    <ModulePage back={{ label: 'Workspace', onClick: () => router.push('/') }} title="Notes" description="Capture and organize your notes.">
      <Button onClick={() => setShowForm(true)} style={{ marginBottom: 16 }}>+ New note</Button>
      {loading ? <SkeletonRows rows={4} /> : notes.length === 0 ? (
        <EmptyState icon="📝" title="No notes yet" action={<Button onClick={() => setShowForm(true)}>+ New note</Button>} />
      ) : (
        <div className="card-shell">{notes.map(n => (
          <div key={n.id} className="card" style={{ padding: '14px 18px', marginBottom: 4 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{n.title}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{(n.content || '').substring(0, 200)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{new Date(n.created_at).toLocaleDateString()}</div>
          </div>
        ))}</div>
      )}
      {showForm && (
        <Modal isOpen title="New note" onClose={() => setShowForm(false)}>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field"><label className="field-label">Title</label><input className="field-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
            <div className="field"><label className="field-label">Content</label><textarea className="field-textarea" rows={6} value={form.content} onChange={e => setForm({...form, content: e.target.value})} /></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Button onClick={() => setShowForm(false)} variant="ghost">Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Modal>
      )}
    </ModulePage>
  );
}
