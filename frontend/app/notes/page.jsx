'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

const API = { 'time-tracking': '/api/v1/time-tracking', 'notes': '/api/v1/notes', 'coupons': '/api/v1/coupons' };
const LABELS = { 'time-tracking': 'Time Tracking', 'notes': 'Notes', 'coupons': 'Coupons' };

export default function Page() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState('');
  useEffect(() => { const s = window.location.pathname.split('/')[1]; setSlug(s); }, []);
  useEffect(() => { if (slug) { apiFetch(API[slug] || '/api/v1/' + slug).then(d => setData(Object.values(d)[0] || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)); } }, [slug]);
  return (<div className="panel"><button className="back-link" onClick={() => router.push('/')}>← Back</button>
    <div className="module-head"><h1>{LABELS[slug] || slug.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</h1></div>
    {loading ? <SkeletonRows rows={4} /> : data.length === 0 ? <EmptyState icon="📋" title="No records yet" /> : (
      <div className="card-shell">{data.map((item,i) => <div key={item.id||i} className="card" style={{padding:'12px 16px',marginBottom:4}}><div style={{fontWeight:600}}>{item.name||item.title||item.description||item.label||item.code||item.id}</div></div>)}</div>
    )}
  </div>);
}
