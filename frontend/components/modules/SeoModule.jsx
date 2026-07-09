'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';
import Badge from '../ui/Badge';

export default function SeoModule({ goHome }) {
  const [tab, setTab] = useState('speed');
  const [speedData, setSpeedData] = useState(null);
  const [seoQueries, setSeoQueries] = useState([]);
  const [scanResults, setScanResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sp, q] = await Promise.all([
        apiFetch('/api/v1/seo/speed'),
        apiFetch('/api/v1/seo/queries'),
      ]);
      setSpeedData(sp.results || sp);
      setSeoQueries(q.queries || []);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function runSpeedTest() {
    if (!url) return toast.error('Enter a URL');
    try {
      const r = await apiFetch('/api/v1/seo/speed', { method: 'POST', body: JSON.stringify({ url }) });
      setSpeedData(r.results || r);
      toast.success('Speed test complete');
    } catch (err) { toast.error(err.message); }
  }

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <h1>SEO &amp; SEM Suite</h1>
        <p className="module-sub">Keyword research, SEO audit, rank tracking, backlink monitoring, search console, speed monitoring, and more.</p>
      </div>
      <div className="invoice-tabs" style={{ marginBottom: 16 }}>
        {[{ k: 'speed', l: 'Speed' }, { k: 'queries', l: 'Search Queries' }, { k: 'audit', l: 'Site Audit' }, { k: 'tools', l: 'Tools' }].map((t) => (
          <button key={t.k} className={`invoice-tab${tab === t.k ? ' active' : ''}`} onClick={() => setTab(t.k)}>{t.l}</button>
        ))}
      </div>
      {loading ? <SkeletonRows rows={4} /> : (
        <>
          {tab === 'speed' && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input className="form-input" placeholder="https://yoursite.com" value={url} onChange={(e) => setUrl(e.target.value)} style={{ flex: 1, maxWidth: 400 }} />
                <Button onClick={runSpeedTest}>Test Speed</Button>
              </div>
              {speedData ? (
                <div className="card" style={{ padding: 16 }}>
                  <h3 style={{ marginBottom: 12 }}>Core Web Vitals</h3>
                  {['lcp','inp','cls','fcp','tbt'].filter(k => speedData[k] !== undefined).map((k) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span style={{ fontWeight: 500 }}>{k.toUpperCase()}</span>
                      <span style={{ color: speedData[k + '_status'] === 'good' ? 'var(--success)' : speedData[k + '_status'] === 'needs-improvement' ? 'var(--warning)' : 'var(--danger)' }}>
                        {typeof speedData[k] === 'number' ? speedData[k].toFixed(2) : speedData[k]}
                        {speedData[k + '_status'] && ` (${speedData[k + '_status']})`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : <p className="muted" style={{ padding: 20 }}>Run a speed test to see results.</p>}
            </>
          )}
          {tab === 'queries' && (
            seoQueries.length === 0 ? <EmptyState icon="🔍" title="No search query data yet" description="Connect Google Search Console to see search queries." /> : (
              <div className="table-wrap"><table className="data-table">
                <thead><tr><th>Query</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Position</th></tr></thead>
                <tbody>{seoQueries.map((q, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{q.query || q.keyword}</td>
                    <td>{q.clicks || 0}</td>
                    <td>{q.impressions || 0}</td>
                    <td>{q.ctr ? (q.ctr * 100).toFixed(1) + '%' : '—'}</td>
                    <td>{q.position ? q.position.toFixed(1) : '—'}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            )
          )}
          {tab === 'audit' && (
            <EmptyState icon="📋" title="Site Audit" description="Run a full SEO audit with crawl diagnostics, broken links, and structured data validation." action={<Badge variant="info">Run audit</Badge>} />
          )}
          {tab === 'tools' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { label: 'Keyword Research', icon: '🔑' },
                { label: 'Rank Tracking', icon: '📈' },
                { label: 'Backlink Monitor', icon: '🔗' },
                { label: 'Schema Generator', icon: '📝' },
                { label: 'Sitemap Generator', icon: '🗺️' },
                { label: 'Meta Generator', icon: '🏷️' },
                { label: 'Robots Generator', icon: '🤖' },
                { label: 'Content Optimizer', icon: '✍️' },
                { label: 'Search Console', icon: '📊' },
                { label: 'Local SEO', icon: '📍' },
              ].map((t) => (
                <div key={t.label} className="card" style={{ padding: 16, textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>{t.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t.label}</div>
                  <Badge variant="info">API ready</Badge>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
