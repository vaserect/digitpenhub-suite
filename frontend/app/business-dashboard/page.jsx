'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import { SkeletonRows } from '../../components/ui/Skeleton';
import ModulePage from '../../components/ui/ModulePage';

export default function DashboardPage() {
  const router = useRouter();
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
  const [usage, setUsage] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/v1/analytics/overview').then(d => setOverview(d)).catch(() => {}),
      apiFetch('/api/v1/analytics/activity').then(d => setActivity(d.days||[])).catch(() => {}),
      apiFetch('/api/v1/analytics/modules/usage').then(d => setUsage(d.modules||[])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="panel"><SkeletonRows rows={6} /></div>;

  return (
    <ModulePage back={{label:'Workspace',onClick:()=>router.push('/')}} title="Business Dashboard" description="Key metrics across your business at a glance.">
      {overview && (
        <div className="stats-row" style={{marginBottom:20}}>
          {[
            {label:'Contacts',value:overview.contactCount},{label:'Won deals',value:overview.wonDeals},
            {label:'Revenue',value:overview.totalRevenue?`₦${Number(overview.totalRevenue).toLocaleString()}`:'—'},
            {label:'Invoices (MTD)',value:overview.mtdInvoices},{label:'Leads (week)',value:overview.leadsThisWeek},
            {label:'Email lists',value:overview.listCount},{label:'Campaigns sent',value:overview.campaignsSent},
          ].filter(s=>s.value!==undefined).map(s => (
            <div key={s.label} className="stat-pill" style={{padding:'14px 20px'}}>
              <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',color:'var(--text-muted)'}}>{s.label}</div>
              <div style={{fontSize:'1.5rem',fontWeight:800,color:'var(--primary)',marginTop:4}}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {activity.length > 0 && (
        <div className="card" style={{marginBottom:20}}>
          <div style={{fontWeight:700,fontSize:'0.95rem',marginBottom:12}}>Activity (30 days)</div>
          <div style={{display:'flex',gap:4,alignItems:'flex-end',height:80}}>
            {activity.map((d,i) => {
              const max = Math.max(...activity.map(x=>x.total),1);
              const h = (d.total/max)*76;
              return <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                <div style={{width:'100%',background:'var(--primary)',height:h,borderRadius:'4px 4px 0 0',opacity:0.3+0.7*(d.total/max)}} />
              </div>;
            })}
          </div>
        </div>
      )}

      {usage.length > 0 && (
        <div className="card">
          <div style={{fontWeight:700,fontSize:'0.95rem',marginBottom:12}}>Module usage</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:10}}>
            {usage.map(m => <div key={m.module} className="card" style={{padding:'10px 14px'}}>
              <div style={{fontWeight:600,fontSize:13}}>{m.module}</div>
              <div style={{fontSize:'1.2rem',fontWeight:700,color:'var(--primary)'}}>{m.record_count||m.count||0}</div>
            </div>)}
          </div>
        </div>
      )}
    </ModulePage>
  );
}
