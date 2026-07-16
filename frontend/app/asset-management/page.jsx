'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../../components/ui/Button';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

const API_MAP = {
  'payroll': '/api/v1/payroll', 'accounting': '/api/v1/accounting/accounts', 'subscriptions': '/api/v1/customer-subs',
  'appointments': '/api/v1/appointments', 'affiliates': '/api/v1/affiliates', 'referrals': '/api/v1/referrals',
  'delivery-tracking': '/api/v1/delivery', 'password-manager': '/api/v1/password-manager',
  'certificates': '/api/v1/certificates', 'color-palettes': '/api/v1/color-palettes',
  'custom-reports': '/api/v1/custom-reports', 'brand-kit': '/api/v1/brand-kit',
  'digital-products': '/api/v1/digital-products', 'asset-management': '/api/v1/assets',
  'documents': '/api/v1/documents',
};
const LABEL_MAP = {
  'payroll': 'Payroll', 'accounting': 'Accounting', 'subscriptions': 'Subscriptions',
  'appointments': 'Appointment Booking', 'affiliates': 'Affiliates', 'referrals': 'Referral Program',
  'delivery-tracking': 'Delivery Tracking', 'password-manager': 'Password Manager',
  'certificates': 'Certificate Generator', 'color-palettes': 'Color Palettes',
  'custom-reports': 'Custom Reports', 'brand-kit': 'Brand Kit',
  'digital-products': 'Digital Products', 'asset-management': 'Asset Management',
  'documents': 'Document Management',
};

export default function ModulePage() {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const s = window.location.pathname.split('/')[1]; setSlug(s); }, []);
  useEffect(() => { if (!slug) return; apiFetch(API_MAP[slug] || '/api/v1/' + slug).then(d => setData(Object.values(d)[0] || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)); }, [slug]);
  return (<div className="panel"><button className="back-link" onClick={() => router.push('/')}>← Back</button>
    <div className="module-head"><h1>{LABEL_MAP[slug] || slug.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</h1></div>
    {loading ? <SkeletonRows rows={4} /> : data.length === 0 ? <EmptyState icon="📁" title="No records yet" /> : (
      <div className="card-shell">{data.map((item,i) => <div key={item.id||i} className="card" style={{padding:'12px 16px',marginBottom:4}}><div style={{fontWeight:600}}>{item.name||item.title||item.description||item.label||item.code||item.id}</div></div>)}</div>
    )}
  </div>);
}
