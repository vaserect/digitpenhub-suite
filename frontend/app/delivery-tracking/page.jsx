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
import Badge from '../../components/ui/Badge';

export default function DeliveryTrackingPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ orderRef: '', carrier: '', trackingCode: '' });
  useEffect(() => {
    apiFetch('/api/v1/delivery').then(d => setItems(d.deliveries || d.shipments || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);
  async function handleCreate(e) { e.preventDefault(); try { await apiFetch('/api/v1/delivery', {method:'POST',body:JSON.stringify(form)}); toast.success('Added!'); setShowForm(false); setForm({orderRef:'',carrier:'',trackingCode:''}); const d=await apiFetch('/api/v1/delivery'); setItems(d.deliveries||d.shipments||[]); } catch(err) { toast.error(err.message); } }
  return (
    <ModulePage back={{label:'Workspace',onClick:()=>router.push('/')}} title="Delivery Tracking" description="Track shipments and deliveries.">
      <Button onClick={()=>setShowForm(true)} style={{marginBottom:16}}>+ Add delivery</Button>
      {loading ? <SkeletonRows rows={4} /> : items.length === 0 ? <EmptyState icon="📦" title="No deliveries yet" action={<Button onClick={()=>setShowForm(true)}>+ Add delivery</Button>} /> : (
        <div className="card-shell">{items.map((item,i) => <div key={item.id||i} className="card" style={{padding:'12px 16px',marginBottom:4}}><div style={{fontWeight:600}}>{item.order_ref||item.orderRef||item.tracking_code||item.trackingCode||'Delivery'}</div><div style={{display:'flex',gap:8,marginTop:4}}><Badge variant={item.status === 'delivered' ? 'success' : item.status === 'in_transit' ? 'warning' : 'neutral'}>{item.status||'pending'}</Badge><span style={{fontSize:12,color:'var(--text-muted)'}}>{item.carrier||''}</span></div></div>)}</div>
      )}
      {showForm && (<Modal isOpen title="Add delivery" onClose={()=>setShowForm(false)}><form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:14}}>
        <div className="field"><label className="field-label">Order reference</label><input className="field-input" value={form.orderRef} onChange={e=>setForm({...form,orderRef:e.target.value})} /></div>
        <div className="field"><label className="field-label">Carrier</label><input className="field-input" value={form.carrier} onChange={e=>setForm({...form,carrier:e.target.value})} /></div>
        <div className="field"><label className="field-label">Tracking code</label><input className="field-input" value={form.trackingCode} onChange={e=>setForm({...form,trackingCode:e.target.value})} /></div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}><Button onClick={()=>setShowForm(false)} variant="ghost">Cancel</Button><Button type="submit">Add</Button></div>
      </form></Modal>)}
    </ModulePage>
  );
}
