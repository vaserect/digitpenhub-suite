'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import Badge from '../ui/Badge';
import { SkeletonRows } from '../ui/Skeleton';
import Pagination from '../ui/Pagination';
import SearchInput from '../ui/SearchInput';

const API_MAP = {
  'appointment-booking': '/api/v1/appointments', 'calendar': '/api/v1/calendar',
  'time-tracking': '/api/v1/time-tracking', 'notes': '/api/v1/notes',
  'asset-management': '/api/v1/assets', 'document-management': '/api/v1/documents',
  'brand-kit': '/api/v1/brand-kit', 'cloud-storage': '/api/v1/cloud-storage',
  'affiliate-system': '/api/v1/affiliates', 'referral-program': '/api/v1/referrals',
  'coupons': '/api/v1/coupons', 'whatsapp-marketing': '/api/v1/whatsapp',
  'sms-marketing': '/api/v1/sms', 'inventory': '/api/v1/inventory/products',
  'pos': '/api/v1/pos/sessions', 'recruitment': '/api/v1/recruitment',
  'task-management': '/api/v1/tasks', 'forms': '/api/v1/leads/forms',
  'webhooks': '/api/v1/api-keys/webhooks', 'permissions': '/api/v1/permissions/roles',
  'segments': '/api/v1/segments', 'transactions': '/api/v1/billing/payments',
  'subscriptions': '/api/v1/customer-subs', 'reviews': '/api/v1/reviews',
  'sso': '/api/v1/auth/sso/providers', 'legal-templates': '/api/v1/legal-templates',
  'vuln-scans': '/api/v1/vuln-scans', 'runbooks': '/api/v1/runbooks',
  'incidents': '/api/v1/incidents', 'warranties': '/api/v1/warranties',
  'disputes': '/api/v1/disputes',
  'communities': '/api/v1/community/communities', 'events': '/api/v1/community/events',
  'jobs': '/api/v1/community/jobs', 'ideas': '/api/v1/community/ideas',
  'skills': '/api/v1/community/skills', 'ambassadors': '/api/v1/community/ambassadors',
  'timezone-proposals': '/api/v1/community/timezone-proposals',
  'content-calendar': '/api/v1/platform/calendar',
  'cross-module-activity-feed': '/api/v1/platform/activity',
  'legal-templates': '/api/v1/platform/legal-templates',
  'appointment-booking': '/api/v1/appointments',
};

// Normalize slug to likely API paths
function guessApiPath(slug) {
  if (API_MAP[slug]) return API_MAP[slug];
  // Common patterns
  const patterns = [
    slug, slug.replace(/-/g, ''), slug.replace(/-manager$/, '').replace(/-management$/, ''),
    slug.replace(/^ai-/, 'ai-').replace(/^seo-/, 'seo/'),
  ];
  return '/api/v1/' + slug;
}

const TYPE_CONFIG = {
  'appointment-booking': { icon: '📅', label: 'Appointments', listKey: 'appointments' },
  'calendar': { icon: '📅', label: 'Calendar', listKey: 'events' },
  'time-tracking': { icon: '⏱', label: 'Time Entries', listKey: 'entries' },
  'notes': { icon: '📝', label: 'Notes', listKey: 'notes' },
  'asset-management': { icon: '📦', label: 'Assets', listKey: 'assets' },
  'document-management': { icon: '📄', label: 'Documents', listKey: 'documents' },
  'brand-kit': { icon: '🎨', label: 'Brand Kit', listKey: 'brand' },
  'cloud-storage': { icon: '☁️', label: 'Cloud Storage', listKey: 'files' },
  'affiliate-system': { icon: '🔗', label: 'Affiliates', listKey: 'affiliates' },
  'referral-program': { icon: '📣', label: 'Referrals', listKey: 'referrals' },
  'coupons': { icon: '🏷️', label: 'Coupons', listKey: 'coupons' },
  'sms-marketing': { icon: '💬', label: 'SMS', listKey: 'messages' },
  'inventory': { icon: '📊', label: 'Inventory', listKey: 'items' },
  'pos': { icon: '🛒', label: 'POS', listKey: 'sales' },
  'recruitment': { icon: '👔', label: 'Jobs', listKey: 'jobs' },
  'permissions': { icon: '🔐', label: 'Roles', listKey: 'roles' },
  'segments': { icon: '🎯', label: 'Segments', listKey: 'segments' },
  'task-management': { icon: '✅', label: 'Tasks', listKey: 'tasks' },
  'whatsapp-marketing': { icon: '💬', label: 'WhatsApp', listKey: 'messages' },
};

export default function GenericModule({ moduleSlug, goHome, categories }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({});
  const [itemToDelete, setItemToDelete] = useState(null);
  const [page, setPage] = useState(1);
  const [columns, setColumns] = useState([]);

  const mod = categories?.flatMap(c => c.modules || []).find(m => m.slug === moduleSlug);
  const cfg = TYPE_CONFIG[moduleSlug] || {};
  const apiPath = guessApiPath(moduleSlug);
  const listKey = cfg.listKey || (moduleSlug.endsWith('s') ? moduleSlug : moduleSlug + 's');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Try both the guessed path and a stats endpoint
      const r = await apiFetch(apiPath);
      // Find the data key — it's usually the first array property
      const obj = r || {};
      const keys = Object.keys(obj);
      let items = [];
      let fetchedColumns = [];

      // Try common response shapes
      for (const k of keys) {
        if (Array.isArray(obj[k]) && obj[k].length > 0) {
          items = obj[k];
          fetchedColumns = Object.keys(obj[k][0]).filter(c =>
            !['id','org_id','password_hash','token','secret'].includes(c)
          );
          break;
        }
      }

      // If no array found, check if response itself is array
      if (items.length === 0 && Array.isArray(r)) {
        items = r;
        if (r.length > 0) fetchedColumns = Object.keys(r[0]).filter(c => !['id','org_id'].includes(c));
      }

      setData(items.slice(0, 100));
      setColumns(fetchedColumns.slice(0, 8));

      // Try stats endpoint
      try {
        const s = await apiFetch(apiPath + '/stats');
        if (s.stats || s) setStats(s.stats || s);
      } catch { /* stats optional */ }

    } catch (err) {
      // Silent — module just has no data yet
    }
    setLoading(false);
  }, [apiPath]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await apiFetch(apiPath, { method: 'POST', body: JSON.stringify(draft) });
      toast.success('Created'); setShowForm(false); setDraft({}); load();
    } catch (err) { toast.error(err.message); }
  }

  async function handleDelete(id) {
    try {
      await apiFetch(`${apiPath}/${id}`, { method: 'DELETE' });
      toast.success('Deleted'); setItemToDelete(null); load();
    } catch { toast.error('Failed to delete'); }
  }

  // Build form fields from column data
  const formFields = columns.filter(c => !['created_at','updated_at','deleted_at','status'].includes(c));

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <h1>{cfg.icon || '🧩'} {mod?.name || moduleSlug.replace(/-/g, ' ')}</h1>
        <p className="module-sub">{mod?.description || 'API ready — data-driven module.'}</p>
      </div>

      {stats && Object.keys(stats).length > 0 && (
        <div className="stats-row">
          {Object.entries(stats).slice(0, 4).map(([k, v]) => (
            <div key={k} className="stat-card">
              <div className="stat-value">{typeof v === 'number' ? v.toLocaleString() : String(v).slice(0, 20)}</div>
              <div className="stat-label">{k.replace(/_/g, ' ')}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="form-input" placeholder={`Search ${cfg.label || 'items'}…`} value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, maxWidth: 300 }} />
        <Button onClick={() => { setShowForm(true); setDraft({}); }}>+ New</Button>
      </div>

      <Modal isOpen={showForm} title={`New ${cfg.label || 'Item'}`} onClose={() => setShowForm(false)}>
        <form onSubmit={handleCreate}>
          {formFields.slice(0, 6).map(f => (
            <div key={f} className="field">
              <label className="field-label">{f.replace(/_/g, ' ')}</label>
              <input className="field-input"
                value={draft[f] || ''}
                onChange={e => setDraft({...draft, [f]: e.target.value})}
                placeholder={`Enter ${f.replace(/_/g, ' ')}`}
              />
            </div>
          ))}
          <Button type="submit">Create</Button>
        </form>
      </Modal>

      {loading ? <SkeletonRows rows={5} /> : data.length === 0 ? (
        <EmptyState icon={cfg.icon || '📋'} title={`No ${cfg.label || 'items'} yet`}
          description={`This module is API-ready. Create your first record to get started.`}
          action={<Button onClick={() => { setShowForm(true); setDraft({}); }}>+ Create</Button>}
        />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {columns.slice(0, 6).map(c => <th key={c}>{c.replace(/_/g, ' ')}</th>)}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data
                .filter(item => !search || JSON.stringify(item).toLowerCase().includes(search.toLowerCase()))
                .slice((page - 1) * 25, page * 25)
                .map((item, i) => (
                <tr key={item.id || i}>
                  {columns.slice(0, 6).map(c => (
                    <td key={c} style={{
                      fontWeight: c === columns[0] ? 600 : 400,
                      fontSize: '0.82rem',
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {renderCell(item[c])}
                    </td>
                  ))}
                  <td>
                    <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }}
                      onClick={() => setItemToDelete(item.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 25 && (
            <Pagination page={page} totalPages={Math.ceil(data.length / 25)} onPageChange={setPage} />
          )}
        </div>
      )}

      <Modal isOpen={!!itemToDelete} title="Delete?" description="This cannot be undone." onClose={() => setItemToDelete(null)}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="danger" onClick={() => handleDelete(itemToDelete)}>Delete</Button>
          <Button variant="secondary" onClick={() => setItemToDelete(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}

function renderCell(value) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? '✅' : '—';
  if (typeof value === 'object') return JSON.stringify(value).slice(0, 40);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    try { return new Date(value).toLocaleDateString(); } catch {}
  }
  if (typeof value === 'number') return value.toLocaleString();
  return String(value).slice(0, 80);
}
