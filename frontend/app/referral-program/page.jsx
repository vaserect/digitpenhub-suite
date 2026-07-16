'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';

const NAME = { 'document-management': 'Document Management', 'referral-program': 'Referral Program', 'whatsapp-marketing': 'WhatsApp Marketing', 'sms-marketing': 'SMS Marketing' };
const API = { 'document-management': '/api/v1/documents', 'referral-program': '/api/v1/referrals', 'whatsapp-marketing': '/api/v1/whatsapp/contacts', 'sms-marketing': '/api/v1/sms/contacts' };

export default function ModulePage() {
  const router = useRouter();
  const [slug, setSlug] = useState(''); const [data, setData] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => { const s = window.location.pathname.split('/')[1]; setSlug(s); }, []);
  useEffect(() => { if (!slug) return; apiFetch(API[slug]).then(d => setData(Object.values(d)[0]||[])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)); }, [slug]);
  return (<div className="panel"><button className="back-link" onClick={() => router.push('/')}>← Back</button><div className="module-head"><h1>{NAME[slug]||slug}</h1></div>
    {loading ? <SkeletonRows rows={4} /> : data.length === 0 ? <EmptyState icon="📁" title="No data yet" /> : <div className="card-shell">{data.map((item,i) => <div key={item.id||i} className="card" style={{padding:'12px 16px',marginBottom:4}}><div style={{fontWeight:600}}>{item.name||item.title||item.description||item.label||item.code||item.id}</div></div>)}</div>}
  </div>);}
