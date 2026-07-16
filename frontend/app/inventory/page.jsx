'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../../components/ui/Button';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

export default function InventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { apiFetch('/api/v1/inventory/products').then(d => setProducts(d.products || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)); }, []);
  return (
    <div className="panel">
      <button className="back-link" onClick={() => router.push('/')}>← Back</button>
      <div className="module-head"><h1>Inventory</h1><p className="module-sub">Track products and stock levels.</p></div>
      {loading ? <SkeletonRows rows={3} /> : products.length === 0 ? <EmptyState icon="📦" title="No products yet" /> : (
        <div className="card-shell">{products.map(p => <div key={p.id} className="card" style={{padding:'12px 16px',marginBottom:4}}><div style={{fontWeight:600}}>{p.name}</div></div>)}</div>
      )}
    </div>
  );
}
