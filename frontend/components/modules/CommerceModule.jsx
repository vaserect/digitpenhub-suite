'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';
import Badge from '../ui/Badge';
import SearchInput from '../ui/SearchInput';
import Pagination from '../ui/Pagination';
import { useHotkey, useSearchHotkey } from '../../lib/hotkeys';

export default function CommerceModule({ goHome }) {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(null);
  const [prodDraft, setProdDraft] = useState({ name: '', price: 0, description: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useSearchHotkey();
  useHotkey('n', () => { setShowForm('product'); setProdDraft({ name: '', price: 0, description: '' }); });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, o, s] = await Promise.all([
        apiFetch('/api/v1/store-builder/products').catch(() => { console.error('Failed to load products'); return { products: [] } }),
        apiFetch('/api/v1/orders').catch(() => { console.error('Failed to load orders'); return { orders: [] } }),
        apiFetch('/api/v1/customer-subs').catch(() => { console.error('Failed to load subscriptions'); return { subscriptions: [] } }),
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

  function exportCsv(items, filename) {
    if (!items.length) return;
    const cols = Object.keys(items[0]).filter(k => !['id','org_id','password_hash','token','secret'].includes(k));
    const csv = [cols.join(','), ...items.map(r => cols.map(c => `"${String(r[c]||'')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${filename}-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(blob);
    toast.success('CSV exported');
  }

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(p => (p.name||'').toLowerCase().includes(q) || (p.description||'').toLowerCase().includes(q));
  }, [products, search]);

  const filteredOrders = useMemo(() => {
    if (!search.trim() || tab !== 'orders') return orders;
    const q = search.toLowerCase();
    return orders.filter(o => (o.customer_name||'').toLowerCase().includes(q) || (o.order_number||'').toLowerCase().includes(q));
  }, [orders, search]);

  useEffect(() => { setPage(1); }, [search, tab]);

  function dataForTab() {
    if (tab === 'products') return filteredProducts;
    if (tab === 'orders') return filteredOrders;
    if (tab === 'subscriptions') return subscriptions;
    return [];
  }

  const pageData = dataForTab().slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(dataForTab().length / PAGE_SIZE));

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <div>
          <h1>Commerce</h1>
          <p className="module-sub">Online store, orders, marketplace, and subscriptions. <kbd style={{background:'var(--surface-muted)',padding:'2px 6px',borderRadius:4,fontSize:'0.72rem',color:'var(--text-muted)'}}>⌘N new</kbd> <kbd style={{background:'var(--surface-muted)',padding:'2px 6px',borderRadius:4,fontSize:'0.72rem',color:'var(--text-muted)'}}>⌘F search</kbd></p>
        </div>
      </div>
      <div className="invoice-tabs" style={{marginBottom:16}}>
        {[{k:'products',l:'Products'},{k:'orders',l:'Orders'},{k:'subscriptions',l:'Subscriptions'},{k:'marketplace',l:'Marketplace'}].map(t=>(
          <button key={t.k} className={`invoice-tab${tab===t.k?' active':''}`} onClick={()=>setTab(t.k)}>{t.l}{dataForTab().length>0?` (${dataForTab().length})`:''}</button>
        ))}
      </div>
      {loading ? <SkeletonRows rows={5} /> : (
        <>
          {tab === 'products' && (
            <>
              <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
                <Button onClick={()=>{setShowForm('product');setProdDraft({name:'',price:0,description:''});}}>+ New Product</Button>
                {products.length > 0 && <><Button variant="secondary" size="sm" onClick={()=>exportCsv(products,'products')}>📥 CSV</Button>
                  <SearchInput value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products…" data-hotkey-search /></>}
              </div>
              <Modal isOpen={showForm==='product'} title="Create Product" onClose={()=>setShowForm(null)}>
                <form onSubmit={createProduct}>
                  <div className="field"><label className="field-label">Name</label><input className="field-input" value={prodDraft.name} onChange={e=>setProdDraft({...prodDraft,name:e.target.value})} required autoFocus /></div>
                  <div className="field"><label className="field-label">Price (₦)</label><input className="field-input" type="number" min="0" step="0.01" value={prodDraft.price} onChange={e=>setProdDraft({...prodDraft,price:parseFloat(e.target.value)})} required /></div>
                  <div className="field"><label className="field-label">Description</label><textarea className="field-input" value={prodDraft.description} onChange={e=>setProdDraft({...prodDraft,description:e.target.value})} rows={3} /></div>
                  <div style={{display:'flex',gap:8}}><Button type="submit">Create</Button><Button variant="secondary" type="button" onClick={()=>setShowForm(null)}>Cancel</Button></div>
                </form>
              </Modal>
              {products.length === 0 ? <EmptyState icon="🛍️" title="No products yet" action={<Button onClick={()=>{setShowForm('product');setProdDraft({name:'',price:0,description:''});}}>+ New Product</Button>} /> : filteredProducts.length === 0 ? <EmptyState icon="🔍" title="No matching products" /> : (
                <><div className="table-wrap"><table className="data-table"><thead><tr><th>Name</th><th>Price</th><th>Stock</th><th>Status</th></tr></thead>
                  <tbody>{pageData.map(p=><tr key={p.id}><td style={{fontWeight:600}}>{p.name}</td><td>₦{Number(p.price||0).toLocaleString()}</td><td>{p.stock??'—'}</td><td><Badge variant={p.status==='active'?'success':'neutral'}>{p.status||'active'}</Badge></td></tr>)}</tbody></table></div>
                  {pageCount>1&&<Pagination page={page} pageCount={pageCount} total={dataForTab().length} pageSize={PAGE_SIZE} onPageChange={setPage}/>}</>
              )}
            </>
          )}
          {tab === 'orders' && (
            orders.length === 0 ? <EmptyState icon="📦" title="No orders yet" /> : filteredOrders.length === 0 ? <EmptyState icon="🔍" title="No matching orders" /> : (
              <><div style={{marginBottom:12}}><SearchInput value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search orders…" data-hotkey-search /></div>
              <div className="table-wrap"><table className="data-table"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>{pageData.map(o=><tr key={o.id}>
                  <td style={{fontFamily:'monospace',fontSize:'0.8rem'}}>{o.order_number||o.id?.slice(0,8)}</td>
                  <td>{o.customer_name||'—'}</td>
                  <td>{o.item_count||0}</td>
                  <td style={{fontWeight:600}}>₦{Number(o.total||0).toLocaleString()}</td>
                  <td><Badge variant={o.status==='delivered'?'success':o.status==='shipped'?'info':o.status==='processing'?'warning':'neutral'}>{o.status}</Badge></td>
                </tr>)}</tbody></table></div>
                {pageCount>1&&<Pagination page={page} pageCount={pageCount} total={dataForTab().length} pageSize={PAGE_SIZE} onPageChange={setPage}/>}</>
            )
          )}
          {tab === 'subscriptions' && (
            subscriptions.length === 0 ? <EmptyState icon="🔄" title="No subscriptions yet" /> : (
              <div className="table-wrap"><table className="data-table"><thead><tr><th>Plan</th><th>Customer</th><th>Amount</th><th>Status</th><th>Next billing</th></tr></thead>
                <tbody>{subscriptions.map(s=><tr key={s.id}>
                  <td style={{fontWeight:600}}>{s.plan_name||'—'}</td>
                  <td>{s.customer_name||'—'}</td>
                  <td>₦{Number(s.amount||0).toLocaleString()}</td>
                  <td><Badge variant={s.status==='active'?'success':s.status==='past_due'?'danger':'neutral'}>{s.status}</Badge></td>
                  <td style={{fontSize:'0.8rem'}}>{s.next_billing_date?.slice(0,10)||'—'}</td>
                </tr>)}</tbody></table></div>
            )
          )}
          {tab === 'marketplace' && <EmptyState icon="🏪" title="Marketplace" description="Multi-vendor marketplace with payouts — API ready." action={<Badge variant="info">Coming in next update</Badge>} />}
        </>
      )}
    </div>
  );
}
