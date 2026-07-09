'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import Badge from '../ui/Badge';
import { SkeletonRows } from '../ui/Skeleton';
import BulkActionBar from '../ui/BulkActionBar';

export function ApprovalsModule({ goHome }) {
  const [requests, setRequests] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('requests');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, t] = await Promise.all([
        apiFetch('/api/v1/approvals/requests'),
        apiFetch('/api/v1/approvals/templates'),
      ]);
      setRequests(r.requests || []);
      setTemplates(t.templates || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="panel"><button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head"><h1>✅ Approval Workflow</h1><p className="module-sub">Multi-step approval chains with templates and notifications.</p></div>
      <div className="invoice-tabs" style={{ marginBottom: 16 }}>
        {['requests','templates'].map(t => <button key={t} className={`invoice-tab${tab===t?' active':''}`} onClick={() => setTab(t)}>{t}</button>)}
      </div>
      {loading ? <SkeletonRows rows={5} /> : tab === 'requests' ? (
        requests.length === 0 ? <EmptyState icon="✅" title="No approval requests yet" /> : (
          <div className="table-wrap"><table className="data-table">
            <thead><tr><th>Title</th><th>Resource</th><th>Status</th><th>Steps</th></tr></thead>
            <tbody>{requests.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600 }}>{r.title}</td>
                <td style={{ fontSize: '0.82rem' }}>{r.resource_type}:{r.resource_id?.slice(0,8)}</td>
                <td><Badge variant={r.status==='approved'?'success':r.status==='pending'?'warning':r.status==='rejected'?'danger':'neutral'}>{r.status}</Badge></td>
                <td>{r.steps?.length || 0}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )
      ) : (
        templates.length === 0 ? <EmptyState icon="📋" title="No templates yet" /> : (
          <div className="table-wrap"><table className="data-table">
            <thead><tr><th>Name</th><th>Resource Type</th><th>Active</th></tr></thead>
            <tbody>{templates.map(t => (
              <tr key={t.id}><td style={{ fontWeight: 600 }}>{t.name}</td><td>{t.resource_type}</td><td>{t.is_active ? '✅' : '—'}</td></tr>
            ))}</tbody>
          </table></div>
        )
      )}
    </div>
  );
}

export function DocumentsModule({ goHome }) {
  const [docs, setDocs] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, f] = await Promise.all([
        apiFetch('/api/v1/documents'),
        apiFetch('/api/v1/documents/folders'),
      ]);
      setDocs(d.documents || []);
      setFolders(f.folders || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="panel"><button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head"><h1>📄 Document Management</h1><p className="module-sub">Organize files and contracts in folders.</p></div>
      {loading ? <SkeletonRows rows={5} /> : docs.length === 0 ? (
        <EmptyState icon="📄" title="No documents yet" />
      ) : (
        <div className="table-wrap"><table className="data-table">
          <thead><tr><th>Name</th><th>Folder</th><th>Size</th><th>Updated</th></tr></thead>
          <tbody>{docs.map(d => (
            <tr key={d.id}>
              <td style={{ fontWeight: 600 }}>{d.name}</td>
              <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{d.folder_name || '—'}</td>
              <td>{d.file_size ? (d.file_size/1024).toFixed(0)+'KB' : '—'}</td>
              <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(d.updated_at).toLocaleDateString()}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </div>
  );
}

export function ContentCalendarModule({ goHome }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiFetch('/api/v1/platform/calendar');
      setItems(r.items || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="panel"><button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head"><h1>📅 Content Calendar</h1><p className="module-sub">Schedule and publish content across channels.</p></div>
      {loading ? <SkeletonRows rows={4} /> : items.length === 0 ? (
        <EmptyState icon="📅" title="No scheduled content yet" />
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {items.map(i => (
            <div key={i.id} className="card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><div style={{ fontWeight: 600 }}>{i.title}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{i.channel} · {i.scheduled_at?.slice(0,10)}</div></div>
              <Badge variant={i.status==='published'?'success':i.status==='draft'?'neutral':'warning'}>{i.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AffiliatesModule({ goHome }) {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiFetch('/api/v1/affiliates');
      setAffiliates(r.affiliates || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="panel"><button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head"><h1>🔗 Affiliate System</h1><p className="module-sub">Tiered commissions, payouts, and fraud detection.</p></div>
      {loading ? <SkeletonRows rows={4} /> : affiliates.length === 0 ? (
        <EmptyState icon="🔗" title="No affiliates yet" />
      ) : (
        <div className="table-wrap"><table className="data-table">
          <thead><tr><th>Name</th><th>Code</th><th>Commission</th><th>Clicks</th><th>Conversions</th></tr></thead>
          <tbody>{affiliates.map(a => (
            <tr key={a.id}>
              <td style={{ fontWeight: 600 }}>{a.name || a.email}</td>
              <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{a.code}</td>
              <td>{a.commission_rate || a.rate || 0}%</td>
              <td>{a.clicks || 0}</td>
              <td style={{ color: 'var(--success)' }}>{a.conversions || 0}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </div>
  );
}

export { AffiliatesModule as default };
