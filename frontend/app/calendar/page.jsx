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

export default function CalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', time: '', color: '#2563eb' });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    try { const d = await apiFetch('/api/v1/calendar'); setEvents(d.events || []); }
    catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = events.filter((e) => !search || e.title.toLowerCase().includes(search.toLowerCase()));

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.date) return;
    try {
      await apiFetch('/api/v1/calendar', { method: 'POST', body: JSON.stringify({ ...form, date: `${form.date}T${form.time || '00:00'}` }) });
      toast.success('Event created!'); setShowForm(false); setForm({ title: '', date: '', time: '', color: '#2563eb' }); await load();
    } catch (err) { toast.error(err.message); }
  }

  async function handleDelete(id) {
    try { await apiFetch(`/api/v1/calendar/${id}`, { method: 'DELETE' }); toast.success('Deleted'); await load(); }
    catch (err) { toast.error(err.message); } finally { setConfirmDelete(null); }
  }

  return (
    <ModulePage back={{ label: 'Workspace', onClick: () => router.push('/') }} title="Calendar" description="Manage events and appointments.">
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px' }}><SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events…" /></div>
        <Button onClick={() => setShowForm(true)}>+ New event</Button>
      </div>
      {loading ? <SkeletonRows rows={3} /> : filtered.length === 0 ? (
        <EmptyState icon="📅" title="No events" action={<Button onClick={() => setShowForm(true)}>+ New event</Button>} />
      ) : (
        <div className="card-shell">
          {filtered.map((e) => (
            <div key={e.id} className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: e.color || '#2563eb' }} />
                <div><div style={{ fontWeight: 600 }}>{e.title}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(e.date || e.created_at).toLocaleDateString()}</div></div>
              </div>
              <Button size="sm" variant="danger" onClick={() => setConfirmDelete(e)}>Delete</Button>
            </div>
          ))}
        </div>
      )}
      {showForm && (<Modal isOpen title="New event" onClose={() => setShowForm(false)}><form onSubmit={handleCreate} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div className="field"><label className="field-label">Title</label><input className="field-input" value={form.title} onChange={(e) => setForm({...form, title:e.target.value})} /></div>
        <div className="field"><label className="field-label">Date</label><input className="field-input" type="date" value={form.date} onChange={(e) => setForm({...form, date:e.target.value})} /></div>
        <div className="field"><label className="field-label">Time</label><input className="field-input" type="time" value={form.time} onChange={(e) => setForm({...form, time:e.target.value})} /></div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}><Button onClick={() => setShowForm(false)} variant="ghost">Cancel</Button><Button type="submit">Create</Button></div>
      </form></Modal>)}
      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => handleDelete(confirmDelete.id)} title="Delete event?" confirmLabel="Delete" cancelLabel="Cancel" danger />
    </ModulePage>
  );
}
