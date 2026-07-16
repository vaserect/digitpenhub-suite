'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../../components/ui/Button';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import TabBar from '../../components/ui/TabBar';

const TABS = [
  { key: 'services', label: 'Services' },
  { key: 'bookings', label: 'Bookings' },
];

export default function AppointmentsPage() {
  const router = useRouter();
  const [tab, setTab] = useState('services');
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', duration: 30, color: '#2563eb' });
  const [stats, setStats] = useState({});

  useEffect(() => {
    Promise.all([
      apiFetch('/api/v1/appointments').then(d => { setServices(d.services||[]); setBookings(d.bookings||[]); }).catch(() => {}),
      apiFetch('/api/v1/appointments/stats').then(d => setStats(d.stats||{})).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault(); if (!form.name.trim()) return;
    try {
      await apiFetch('/api/v1/appointments', { method: 'POST', body: JSON.stringify({...form, price: Number(form.price)||0, duration: Number(form.duration)||30 }) });
      toast.success('Service created!'); setShowForm(false); setForm({name:'',description:'',price:'',duration:30,color:'#2563eb'});
      const d = await apiFetch('/api/v1/appointments'); setServices(d.services||[]);
    } catch (err) { toast.error(err.message); }
  }

  return (<div className="panel"><button className="back-link" onClick={() => router.push('/')}>← Back</button>
    <div className="module-head"><h1>Appointment Booking</h1><p className="module-sub">Manage services and bookings. Share your booking page to accept appointments.</p></div>
    {stats.total !== undefined && <div className="stats-row" style={{marginBottom:16}}><span className="stat-pill">Services: <strong>{stats.total}</strong></span><span className="stat-pill">Bookings: <strong>{stats.totalBookings||0}</strong></span></div>}
    <TabBar tabs={TABS} active={tab} onChange={setTab} />
    {loading ? <SkeletonRows rows={3} /> : tab === 'services' ? (
      <div><Button onClick={() => setShowForm(true)} style={{margin:'16px 0'}}>+ New service</Button>
      {services.length === 0 ? <EmptyState icon="📅" title="No services yet" action={<Button onClick={()=>setShowForm(true)}>+ New service</Button>} /> : (
        <div className="card-shell">{services.map(s => <div key={s.id} className="card" style={{padding:'12px 16px',marginBottom:4,display:'flex',justifyContent:'space-between'}}>
          <div><div style={{fontWeight:600}}>{s.name}</div><div style={{fontSize:12,color:'var(--text-muted)'}}>{s.duration}min · {s.description}</div></div>
          <div style={{fontWeight:700}}>₦{Number(s.price||0).toLocaleString()}</div>
        </div>)}</div>
      )}</div>
    ) : bookings.length === 0 ? <EmptyState icon="📅" title="No bookings yet" /> : (
      <div className="card-shell">{bookings.map(b => <div key={b.id} className="card" style={{padding:'12px 16px',marginBottom:4}}>
        <div style={{fontWeight:600}}>{b.client_name}</div><div style={{fontSize:12,color:'var(--text-muted)'}}>{b.service_name} · {new Date(b.date||b.created_at).toLocaleDateString()} · <Badge>{b.status}</Badge></div>
      </div>)}</div>
    )}
    {showForm && (<Modal isOpen title="New service" onClose={()=>setShowForm(false)}><form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:14}}>
      <div className="field"><label className="field-label">Name</label><input className="field-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
      <div className="field"><label className="field-label">Description</label><textarea className="field-textarea" rows={2} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
      <div className="field"><label className="field-label">Price (₦)</label><input className="field-input" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} /></div>
      <div className="field"><label className="field-label">Duration (minutes)</label><input className="field-input" type="number" value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})} /></div>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}><Button onClick={()=>setShowForm(false)} variant="ghost">Cancel</Button><Button type="submit">Create</Button></div>
    </form></Modal>)}
  </div>);
}
