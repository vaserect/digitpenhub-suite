'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../../components/ui/Button';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

export default function RecruitmentPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { apiFetch('/api/v1/recruitment/jobs').then(d => setJobs(d.jobs || [])).catch(() => toast.error('Failed to load jobs')).finally(() => setLoading(false)); }, []);
  return (
    <div className="panel">
      <button className="back-link" onClick={() => router.push('/')}>← Back to workspace</button>
      <div className="module-head"><h1>Recruitment</h1><p className="module-sub">Manage job postings and applicants.</p></div>
      {loading ? <SkeletonRows rows={3} /> : jobs.length === 0 ? <EmptyState icon="💼" title="No jobs yet" /> : (
        <div className="card-shell">{jobs.map(j => <div key={j.id} className="card" style={{padding:'12px 16px',marginBottom:4}}><div style={{fontWeight:600}}>{j.title}</div></div>)}</div>
      )}
    </div>
  );
}
