'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';
import Badge from '../ui/Badge';

export default function CommerceModule({ goHome }) {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(null);
  const [prodDraft, setProdDraft] = useState({ name: '', price: 0, description: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, o, s] = await Promise.all([
        apiFetch('/api/v1/store-builder/products'),
        apiFetch('/api/v1/orders'),
        apiFetch('/api/v1/customer-subs'),
      ]);
      setProducts(p.products || []);
      setOrders(o.orders || []);
      setSubscriptions(s.subscriptions || []);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createProduct(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/store-builder/products', { method: 'POST', body: JSON.stringify(prodDraft) });
      toast.success('Product created');
      setShowForm(null); setProdDraft({ name: '', price: 0, description: '' }); load();
    } catch (err) { toast.error(err.message); }
  }

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <h1>Commerce</h1>
        <p className="module-sub">Online store, orders, marketplace, and subscriptions.</p>
      </div>
      <div className="invoice-tabs" style={{ marginBottom: 16 }}>
        {[{ k: 'products', l: 'Products' }, { k: 'orders', l: 'Orders' }, { k: 'subscriptions', l: 'Subscriptions' }, { k: 'marketplace', l: 'Marketplace' }].map((t) => (
          <button key={t.k} className={`invoice-tab${tab === t.k ? ' active' : ''}`} onClick={() => setTab(t.k)}>{t.l}</button>
        ))}
      </div>
      {loading ? <SkeletonRows rows={5} /> : (
        <>
          {tab === 'products' && (
            <>
              <Button onClick={() => setShowForm('product')}>+ New Product</Button>
              <Modal isOpen={showForm === 'product'} title="Create Product" onClose={() => setShowForm(null)}>
                <form onSubmit={createProduct}>
                  <div className="field"><label className="field-label">Name</label><input className="field-input" value={prodDraft.name} onChange={(e) => setProdDraft({...prodDraft,name:e.target.value})} required /></div>
                  <div className="field"><label className="field-label">Price (₦)</label><input className="field-input" type="number" min="0" step="0.01" value={prodDraft.price} onChange={(e) => setProdDraft({...prodDraft,price:parseFloat(e.target.value)})} required /></div>
                  <div className="field"><label className="field-label">Description</label><textarea className="field-input" value={prodDraft.description} onChange={(e) => setProdDraft({...prodDraft,description:e.target.value})} rows={3} /></div>
                  <Button type="submit">Create</Button>
                </form>
              </Modal>
              {products.length === 0 ? <EmptyState icon="🛍️" title="No products yet" action={<Button onClick={() => setShowForm('product')}>+ New Product</Button>} /> : (
                <div className="table-wrap"><table className="data-table">
                  <thead><tr><th>Name</th><th>Price</th><th>Stock</th></tr></thead>
                  <tbody>{products.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>₦{Number(p.price || 0).toLocaleString()}</td>
                      <td>{p.stock ?? '—'}</td>
                    </tr>
                  ))}</tbody>
                </table></div>
              )}
            </>
          )}
          {tab === 'orders' && (
            orders.length === 0 ? <EmptyState icon="📦" title="No orders yet" /> : (
              <div className="table-wrap"><table className="data-table">
                <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>{orders.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{o.order_number || o.id?.slice(0, 8)}</td>
                    <td>{o.customer_name || '—'}</td>
                    <td style={{ fontWeight: 600 }}>₦{Number(o.total || 0).toLocaleString()}</td>
                    <td><Badge variant={o.status === 'delivered' ? 'success' : o.status === 'shipped' ? 'info' : 'neutral'}>{o.status}</Badge></td>
                  </tr>
                ))}</tbody>
              </table></div>
            )
          )}
          {tab === 'subscriptions' && (
            subscriptions.length === 0 ? <EmptyState icon="🔄" title="No subscriptions yet" /> : (
              <div className="table-wrap"><table className="data-table">
                <thead><tr><th>Plan</th><th>Customer</th><th>Status</th><th>Next billing</th></tr></thead>
                <tbody>{subscriptions.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.plan_name || '—'}</td>
                    <td>{s.customer_name || '—'}</td>
                    <td><Badge variant={s.status === 'active' ? 'success' : s.status === 'past_due' ? 'danger' : 'neutral'}>{s.status}</Badge></td>
                    <td style={{ fontSize: '0.8rem' }}>{s.next_billing_date?.slice(0, 10) || '—'}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            )
          )}
          {tab === 'marketplace' && (
            <EmptyState icon="🏪" title="Marketplace" description="Multi-vendor marketplace with payouts — API ready." action={<Badge variant="info">Coming in next update</Badge>} />
          )}
        </>
      )}
    </div>
  );
}
