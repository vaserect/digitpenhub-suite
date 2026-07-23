'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/api';
import { SkeletonRows } from '../../components/ui/Skeleton';
import ModulePage from '../../components/ui/ModulePage';
import Button from '../../components/ui/Button';

function ArrowUp() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>;
}

function formatNaira(v) {
  if (v == null || isNaN(v)) return '—';
  return `₦${Number(v).toLocaleString()}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [growth, setGrowth] = useState(null);
  const [leadConv, setLeadConv] = useState(null);
  const [taskComp, setTaskComp] = useState(null);
  const [sparkline, setSparkline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/v1/analytics/executive').then(setData).catch(() => {}),
      apiFetch('/api/v1/analytics/growth').then(setGrowth).catch(() => {}),
      apiFetch('/api/v1/analytics/leads/conversion').then(setLeadConv).catch(() => {}),
      apiFetch('/api/v1/analytics/tasks/completion').then(d => setTaskComp(d)).catch(() => {}),
      apiFetch('/api/v1/analytics/revenue/sparkline').then(d => setSparkline(d.sparkline||[])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="panel" style={{padding:24}}><SkeletonRows rows={8} /></div>;

  const d = data || {};

  return (
    <ModulePage
      back={{label:'Workspace',onClick:()=>router.push('/')}}
      title="Command Center"
      description="Executive overview of your business."
    >
      {/* ═══════════════════ KPI ROW ═══════════════════ */}
      <div className="stats-row" style={{marginBottom:20}}>
        {(d.kpis||[]).map(kpi => (
          <div key={kpi.key} className="stat-pill" style={{flex:'1 1 150px',padding:'14px 18px',minWidth:130}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-muted)',marginBottom:2}}>{kpi.label}</div>
            <div style={{fontSize:'1.4rem',fontWeight:800,color:'var(--primary)',marginTop:4}}>{kpi.display}</div>
            <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2,display:'flex',alignItems:'center',gap:3}}>
              {kpi.trend > 0 && <ArrowUp />}
              {kpi.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════════════ ENRICHMENT ROW: Growth, Conversion, Completion ═══════════════════ */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:20}}>
        <div className="card" style={{padding:14}}>
          <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-muted)',marginBottom:6}}>MoM Growth</div>
          <div style={{fontSize:'1.2rem',fontWeight:800,color:'var(--success)'}}>{growth?.contactsGrowth||0}%</div>
          <div style={{fontSize:11,color:'var(--text-muted)'}}>contacts · revenue {growth?.revenueGrowth||0}%</div>
        </div>
        <div className="card" style={{padding:14}}>
          <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-muted)',marginBottom:6}}>Lead Conversion</div>
          <div style={{fontSize:'1.2rem',fontWeight:800,color:'var(--primary)'}}>{leadConv?.rate||0}%</div>
          <div style={{fontSize:11,color:'var(--text-muted)'}}>{leadConv?.converted||0} of {leadConv?.total||0} leads</div>
        </div>
        <div className="card" style={{padding:14}}>
          <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-muted)',marginBottom:6}}>Task Completion</div>
          <div style={{fontSize:'1.2rem',fontWeight:800,color:'var(--warning)'}}>{taskComp?.rate||0}%</div>
          <div style={{fontSize:11,color:'var(--text-muted)'}}>{taskComp?.done||0} of {taskComp?.total||0} tasks</div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        {/* ═══════════════════ REVENUE TREND + SPARKLINE ═══════════════════ */}
        <div className="card" style={{padding:18}}>
          <div style={{fontWeight:700,fontSize:'0.9rem',marginBottom:12}}>Revenue trend</div>
          {(d.revenueTrend||[]).length > 0 ? (
            <div style={{display:'flex',gap:4,alignItems:'flex-end',height:80}}>
              {d.revenueTrend.map((r,i) => {
                const max = Math.max(...d.revenueTrend.map(x=>x.revenue),1);
                const h = (r.revenue/max)*72;
                return (
                  <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                    <div style={{fontSize:9,color:'var(--text-muted)'}}>{r.label?.split(' ')[0]}</div>
                    <div style={{width:'100%',background:'var(--primary)',height:Math.max(h,4),borderRadius:'4px 4px 0 0',opacity:0.3+0.7*(r.revenue/max),transition:'height .3s ease'}} />
                    <div style={{fontSize:8,color:'var(--text-muted)',fontWeight:600}}>{formatNaira(r.revenue)}</div>
                  </div>
                );
              })}
            </div>
          ) : <div style={{fontSize:13,color:'var(--text-muted)',padding:'20px 0',textAlign:'center'}}>No revenue data yet</div>}
          {sparkline.length > 0 && (
            <div style={{marginTop:12}}>
              <div style={{fontSize:11,fontWeight:600,color:'var(--text-muted)',marginBottom:6}}>Last 7 days</div>
              <div style={{display:'flex',gap:2,alignItems:'flex-end',height:30}}>
                {sparkline.map((d,i) => {
                  const max = Math.max(...sparkline.map(x=>x.revenue),1);
                  return <div key={i} style={{flex:1,height:(d.revenue/max)*26,background:'var(--accent)',borderRadius:'2px 2px 0 0',minHeight:2}} />;
                })}
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════ AI USAGE + STORAGE ═══════════════════ */}
        <div className="card" style={{padding:18}}>
          <div style={{fontWeight:700,fontSize:'0.9rem',marginBottom:12}}>AI & storage</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div style={{background:'var(--surface-muted)',borderRadius:10,padding:14}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>AI requests</div>
              <div style={{fontSize:'1.3rem',fontWeight:800,color:'var(--primary)'}}>{(d.aiUsage||{}).total||0}</div>
              <div style={{fontSize:10,color:'var(--text-muted)'}}>{(d.aiUsage||{}).thisWeek||0} this week</div>
            </div>
            <div style={{background:'var(--surface-muted)',borderRadius:10,padding:14}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Storage</div>
              <div style={{fontSize:'1.3rem',fontWeight:800,color:'var(--text)'}}>{(d.storage||{}).display||'—'}</div>
              <div style={{fontSize:10,color:'var(--text-muted)'}}>{(d.storage||{}).files||0} files</div>
            </div>
            <div style={{background:'var(--surface-muted)',borderRadius:10,padding:14}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Tasks</div>
              <div style={{fontSize:'1.3rem',fontWeight:800,color:'var(--text)'}}>{(d.tasks||{}).active||0}</div>
              <div style={{fontSize:10,color:'var(--text-muted)'}}>of {(d.tasks||{}).total||0} total</div>
            </div>
            <div style={{background:'var(--surface-muted)',borderRadius:10,padding:14}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Projects</div>
              <div style={{fontSize:'1.3rem',fontWeight:800,color:'var(--text)'}}>{(d.kpis||[]).find(k=>k.key==='projects')?.value||0}</div>
              <div style={{fontSize:10,color:'var(--text-muted)'}}>active</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════ MODULE USAGE + ACTIVITY ═══════════════════ */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        {/* Module usage grid */}
        <div className="card" style={{padding:18}}>
          <div style={{fontWeight:700,fontSize:'0.9rem',marginBottom:12}}>Module usage</div>
          {(d.modules||[]).length > 0 ? (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {(d.modules||[]).map(m => (
                <div key={m.module} style={{background:'var(--surface-muted)',borderRadius:8,padding:'10px 12px'}}>
                  <div style={{fontSize:11,fontWeight:600,color:'var(--text-muted)'}}>{m.module}</div>
                  <div style={{fontSize:'1.1rem',fontWeight:700,color:'var(--primary)',marginTop:2}}>{m.record_count||0}</div>
                </div>
              ))}
            </div>
          ) : <div style={{fontSize:13,color:'var(--text-muted)',textAlign:'center',padding:'16px 0'}}>No data yet</div>}
        </div>

        {/* Activity feed */}
        <div className="card" style={{padding:18}}>
          <div style={{fontWeight:700,fontSize:'0.9rem',marginBottom:12}}>Recent activity</div>
          {(d.recentActivity||[]).length > 0 ? (
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {(d.recentActivity||[]).map((ev,i) => (
                <div key={i} className="notif-item" style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
                  <span><strong>{ev.user_name||'System'}</strong> {ev.name}</span>
                  <span style={{color:'var(--text-muted)',fontSize:11,whiteSpace:'nowrap'}}>{new Date(ev.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{textAlign:'center',padding:'20px 0'}}>
              <div style={{fontSize:13,color:'var(--text-muted)',marginBottom:12}}>No activity recorded yet</div>
              <Button size="sm" onClick={()=>router.push('/crm')}>Add your first contact</Button>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════ QUICK ACTIONS ═══════════════════ */}
      <div className="card" style={{padding:18}}>
        <div style={{fontWeight:700,fontSize:'0.9rem',marginBottom:12}}>Quick actions</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {[
            {label:'New invoice',icon:'📄',path:'/invoices'},
            {label:'CRM contact',icon:'👤',path:'/crm'},
            {label:'AI Writer',icon:'🤖',path:'/ai-writer'},
            {label:'Lead form',icon:'📋',path:'/modules/lead-generation'},
            {label:'Billing',icon:'💳',path:'/billing'},
            {label:'Team',icon:'👥',path:'/team'},
          ].map(a => (
            <button key={a.label} onClick={()=>router.push(a.path)}
              style={{
                display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:8,
                border:'1px solid var(--border)',background:'var(--surface)',cursor:'pointer',
                fontSize:12,fontWeight:600,color:'var(--text)',
                transition:'border-color .14s,transform .14s',
              }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.transform='translateY(-1px)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='none'}}
            >
              <span>{a.icon}</span> {a.label}
            </button>
          ))}
        </div>
      </div>
    </ModulePage>
  );
}
