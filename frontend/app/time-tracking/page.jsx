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

export default function TimeTrackingPage() {
  const router = useRouter();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: '', hours: '', date: '' });

  useEffect(() => {
    apiFetch('/api/v1/time-tracking').then(d => setEntries(d.entries || d.timeEntries || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/time-tracking', { method: 'POST', body: JSON.stringify({ ...form, hours: Number(form.hours) }) });
      toast.success('Entry added!'); setShowForm(false); setForm({ description: '', hours: '', date: '' });
      const d = await apiFetch('/api/v1/time-tracking'); setEntries(d.entries || d.timeEntries || []);
    } catch (err) { toast.error(err.message); }
  }

  return (
    <ModulePage back={{ label: 'Workspace', onClick: () => router.push('/') }} title="Time Tracking" description="Track billable hours and time entries.">
      <Button onClick={() => setShowForm(true)} style={{ marginBottom: 16 }}>+ Log time</Button>
      {loading ? <SkeletonRows rows={4} /> : entries.length === 0 ? (
        <EmptyState icon="⏱️" title="No time entries yet" action={<Button onClick={() => setShowForm(true)}>+ Log time</Button>} />
      ) : (
        <div className="card-shell">{entries.map((item, i) => (
          <div key={item.id || i} className="card" style={{ padding: '12px 16px', marginBottom: 4 }}>
            <div style={{ fontWeight: 600 }}>{item.description || item.name || item.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.hours ? `${item.hours}h` : ''} {item.date ? `· ${new Date(item.date).toLocaleDateString()}` : ''}</div>
          </div>
        ))}</div>
      )}
      {showForm && (<Modal isOpen title="Log time" onClose={() => setShowForm(false)}><form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="field"><label className="field-label">Description</label><input className="field-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
        <div className="field"><label className="field-label">Hours</label><input className="field-input" type="number" min="0.25" step="0.25" value={form.hours} onChange={e => setForm({...form, hours: e.target.value})} /></div>
        <div className="field"><label className="field-label">Date</label><input className="field-input" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button onClick={() => setShowForm(false)} variant="ghost">Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form></Modal>)}
    </ModulePage>
  );
}
