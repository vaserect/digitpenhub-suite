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

export default function CouponsPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', discountType: 'percentage', discountValue: '', maxUses: '' });

  useEffect(() => {
    apiFetch('/api/v1/coupons').then(d => setData(d.coupons || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/coupons', { method: 'POST', body: JSON.stringify({ ...form, discountValue: Number(form.discountValue), maxUses: form.maxUses ? Number(form.maxUses) : null }) });
      toast.success('Coupon created!'); setShowForm(false); setForm({ code: '', discountType: 'percentage', discountValue: '', maxUses: '' });
      const d = await apiFetch('/api/v1/coupons'); setData(d.coupons || []);
    } catch (err) { toast.error(err.message); }
  }

  return (
    <ModulePage back={{ label: 'Workspace', onClick: () => router.push('/') }} title="Coupons" description="Create and manage discount coupons.">
      <Button onClick={() => setShowForm(true)} style={{ marginBottom: 16 }}>+ New coupon</Button>
      {loading ? <SkeletonRows rows={4} /> : data.length === 0 ? (
        <EmptyState icon="🏷️" title="No coupons yet" action={<Button onClick={() => setShowForm(true)}>+ New coupon</Button>} />
      ) : (
        <div className="card-shell">{data.map(item => (
          <div key={item.id} className="card" style={{ padding: '12px 16px', marginBottom: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14 }}>{item.code}</span></div>
              <Badge variant={item.status === 'active' ? 'success' : 'neutral'}>{item.status || 'active'}</Badge>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {item.discount_type === 'percentage' ? `${item.discount_value}% off` : `₦${Number(item.discount_value).toLocaleString()} off`}
              {item.max_uses ? ` · ${item.uses || 0}/${item.max_uses} used` : ''}
            </div>
          </div>
        ))}</div>
      )}
      {showForm && (<Modal isOpen title="New coupon" onClose={() => setShowForm(false)}><form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="field"><label className="field-label">Code</label><input className="field-input" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="e.g. SAVE20" /></div>
        <div className="field"><label className="field-label">Type</label><select className="field-select" value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value})}><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select></div>
        <div className="field"><label className="field-label">Value</label><input className="field-input" type="number" value={form.discountValue} onChange={e => setForm({...form, discountValue: e.target.value})} placeholder={form.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 5000'} /></div>
        <div className="field"><label className="field-label">Max uses (optional)</label><input className="field-input" type="number" value={form.maxUses} onChange={e => setForm({...form, maxUses: e.target.value})} /></div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button onClick={() => setShowForm(false)} variant="ghost">Cancel</Button>
          <Button type="submit">Create</Button>
        </div>
      </form></Modal>)}
    </ModulePage>
  );
}
