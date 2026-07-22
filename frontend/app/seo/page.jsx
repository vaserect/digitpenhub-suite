'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import ModulePage from '../../components/ui/ModulePage';
import Button from '../../components/ui/Button';
import { SkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import TabBar from '../../components/ui/TabBar';

const TABS = [
  { key: 'keywords', label: 'Keywords' },
  { key: 'audits', label: 'Site Audits' },
  { key: 'backlinks', label: 'Backlinks' },
  { key: 'speed', label: 'Speed' },
  { key: 'local', label: 'Local SEO' },
  { key: 'content', label: 'Content Scores' },
];

export default function SeoPage() {
  const router = useRouter();
  const [tab, setTab] = useState('keywords');
  const [keywords, setKeywords] = useState([]);
  const [audits, setAudits] = useState([]);
  const [domains, setDomains] = useState([]);
  const [speed, setSpeed] = useState([]);
  const [listings, setListings] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ keyword: '', targetUrl: '' });

  const loadAll = useCallback(async () => {
    try {
      const [kw, au, bl, sp, lo, sc] = await Promise.all([
        apiFetch('/api/v1/seo/keywords').catch(() => ({ keywords: [] })),
        apiFetch('/api/v1/seo/audits').catch(() => ({ audits: [] })),
        apiFetch('/api/v1/seo/backlinks/domains').catch(() => ({ domains: [] })),
        apiFetch('/api/v1/seo/speed').catch(() => ({ results: [] })),
        apiFetch('/api/v1/seo/local').catch(() => ({ listings: [] })),
        apiFetch('/api/v1/seo/content-scores').catch(() => ({ scores: [] })),
      ]);
      setKeywords(kw.keywords || []); setAudits(au.audits || []); setDomains(bl.domains || []);
      setSpeed(sp.results || []); setListings(lo.listings || []); setScores(sc.scores || []);
    } catch { toast.error('Failed to load SEO data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function handleCreate(e) {
    e.preventDefault(); if (!form.keyword.trim()) return;
    try {
      await apiFetch('/api/v1/seo/keywords', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Keyword added!'); setShowForm(false); setForm({ keyword: '', targetUrl: '' });
      const d = await apiFetch('/api/v1/seo/keywords'); setKeywords(d.keywords || []);
    } catch (err) { toast.error(err.message); }
  }

  return (
    <ModulePage back={{ label: 'Workspace', onClick: () => router.push('/') }} title="SEO &amp; Search" description="Track rankings, run site audits, monitor backlinks and page speed.">
      <TabBar tabs={TABS} activeKey={tab} onChange={setTab} />
      {loading ? <SkeletonRows rows={5} /> : (
        <>
          {tab === 'keywords' && (
            <div><Button onClick={() => setShowForm(true)} style={{margin:'16px 0'}}>+ Track keyword</Button>
              {keywords.length === 0 ? <EmptyState icon="🔍" title="No keywords tracked" action={<Button onClick={()=>setShowForm(true)}>+ Track keyword</Button>} /> : (
                <div className="card-shell">{keywords.map(k => <div key={k.id} className="card" style={{padding:'12px 16px',marginBottom:4}}>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <div style={{fontWeight:600}}>{k.keyword}</div>
                    <div><Badge>{k.current_rank ? `#${k.current_rank}` : '—'}</Badge></div>
                  </div>
                  {k.target_url && <div style={{fontSize:11,color:'var(--text-muted)'}}>{k.target_url}</div>}
                </div>)}</div>
              )}
            </div>
          )}
          {tab === 'audits' && (audits.length === 0 ? <EmptyState icon="🔎" title="No audits yet" /> : (
            <div className="card-shell">{audits.map(a => <div key={a.id} className="card" style={{padding:'12px 16px',marginBottom:4}}>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <div style={{fontWeight:600}}>{a.url}</div>
                <Badge variant={(a.score||0) >= 80 ? 'success' : (a.score||0) >= 50 ? 'warning' : 'danger'}>{a.score}/100</Badge>
              </div>
              <div style={{fontSize:12,color:'var(--text-muted)'}}>{new Date(a.created_at).toLocaleDateString()}</div>
            </div>)}</div>
          ))}
          {tab === 'backlinks' && (domains.length === 0 ? <EmptyState icon="🔗" title="No backlink domains" /> : (
            <div className="card-shell">{domains.map(d => <div key={d.id} className="card" style={{padding:'12px 16px',marginBottom:4}}>
              <div style={{fontWeight:600}}>{d.domain}</div>
              <div style={{fontSize:12,color:'var(--text-muted)'}}>{d.backlink_count||0} backlinks · Authority: {d.authority_score||'—'}</div>
            </div>)}</div>
          ))}
          {tab === 'speed' && (speed.length === 0 ? <EmptyState icon="⚡" title="No speed tests" /> : (
            <div className="card-shell">{speed.map(s => <div key={s.id} className="card" style={{padding:'12px 16px',marginBottom:4}}>
              <div style={{fontWeight:600}}>{s.url}</div>
              <div style={{fontSize:12,color:'var(--text-muted)'}}>LCP: {s.lcp||'—'} · INP: {s.inp||'—'} · CLS: {s.cls||'—'}</div>
            </div>)}</div>
          ))}
          {tab === 'local' && (listings.length === 0 ? <EmptyState icon="📍" title="No local listings" /> : (
            <div className="card-shell">{listings.map(l => <div key={l.id} className="card" style={{padding:'12px 16px',marginBottom:4}}>
              <div style={{fontWeight:600}}>{l.business_name}</div>
              <div style={{fontSize:12,color:'var(--text-muted)'}}>{l.address} · {l.status}</div>
            </div>)}</div>
          ))}
          {tab === 'content' && (scores.length === 0 ? <EmptyState icon="📝" title="No content scores" /> : (
            <div className="card-shell">{scores.map(s => <div key={s.id} className="card" style={{padding:'12px 16px',marginBottom:4}}>
              <div style={{fontWeight:600}}>{s.url}</div>
              <div style={{fontSize:12,color:'var(--text-muted)'}}>Score: <Badge>{(s.score||0).toFixed(0)}</Badge></div>
            </div>)}</div>
          ))}
        </>
      )}
      {showForm && (<Modal isOpen title="Track keyword" onClose={()=>setShowForm(false)}><form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:14}}>
        <div className="field"><label className="field-label">Keyword</label><input className="field-input" value={form.keyword} onChange={e=>setForm({...form,keyword:e.target.value})} placeholder="e.g. digital marketing agency" /></div>
        <div className="field"><label className="field-label">Target URL</label><input className="field-input" value={form.targetUrl} onChange={e=>setForm({...form,targetUrl:e.target.value})} placeholder="https://..." /></div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}><Button onClick={()=>setShowForm(false)} variant="ghost">Cancel</Button><Button type="submit">Track</Button></div>
      </form></Modal>)}
    </ModulePage>
  );
}
