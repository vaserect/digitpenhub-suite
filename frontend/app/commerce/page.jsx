'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../../components/ui/Button';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import TabBar from '../../components/ui/TabBar';
import Badge from '../../components/ui/Badge';

const TABS = [
  { key: 'products', label: 'Products' },
  { key: 'orders', label: 'Orders' },
  { key: 'subscriptions', label: 'Subscriptions' },
];

export default function CommercePage() {
  const router = useRouter();
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [p, o, s] = await Promise.all([
        apiFetch('/api/v1/store-builder/products').catch(() => ({ products: [] })),
        apiFetch('/api/v1/orders').catch(() => ({ orders: [] })),
        apiFetch('/api/v1/customer-subs').catch(() => ({ subscriptions: [] })),
      ]);
      setProducts(p.products || []);
      setOrders(o.orders || []);
      setSubs(s.subscriptions || []);
    } catch { toast.error('Failed to load store data'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="panel">
      <button className="back-link" onClick={() => router.push('/')}>← Back to workspace</button>
      <div className="module-head">
        <h1>Commerce</h1>
        <p className="module-sub">Manage your online store, products, orders, and subscriptions.</p>
      </div>
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      {loading ? <SkeletonRows rows={4} /> : tab === 'products' && (
        products.length === 0 ? <EmptyState icon="🛍️" title="No products yet" /> : (
          <div className="card-shell">{products.map(p => (
            <div key={p.id} className="card" style={{padding:'12px 16px',marginBottom:4,display:'flex',justifyContent:'space-between'}}>
              <div><div style={{fontWeight:600}}>{p.name}</div><div style={{fontSize:12,color:'var(--text-muted)'}}>₦{Number(p.price||0).toLocaleString()} · {p.stock||0} in stock</div></div>
              <Badge variant={p.status === 'active' ? 'success' : 'neutral'}>{p.status}</Badge>
            </div>
          ))}</div>
        )
      )}
      {tab === 'orders' && (orders.length === 0 ? <EmptyState icon="📦" title="No orders yet" /> : (
        <div className="card-shell">{orders.map(o => (
          <div key={o.id} className="card" style={{padding:'12px 16px',marginBottom:4}}>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <div style={{fontWeight:600}}>Order #{o.order_number || o.id?.slice(0,8)}</div>
              <Badge variant={o.status === 'completed' ? 'success' : o.status === 'pending' ? 'warning' : 'neutral'}>{o.status}</Badge>
            </div>
            <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>₦{Number(o.total||0).toLocaleString()} · {new Date(o.created_at).toLocaleDateString()}</div>
          </div>
        ))}</div>
      ))}
      {tab === 'subscriptions' && (subs.length === 0 ? <EmptyState icon="🔄" title="No subscriptions" /> : (
        <div className="card-shell">{subs.map(s => (
          <div key={s.id} className="card" style={{padding:'12px 16px',marginBottom:4}}>
            <div style={{fontWeight:600}}>{s.plan_name || s.name}</div>
            <div style={{fontSize:12,color:'var(--text-muted)'}}>{s.status} · {s.customer_email}</div>
          </div>
        ))}</div>
      ))}
    </div>
  );
}
