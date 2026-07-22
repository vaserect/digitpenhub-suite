'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import Badge from '../ui/Badge';
import { SkeletonRows } from '../ui/Skeleton';
import Pagination from '../ui/Pagination';
import BulkActionBar from '../ui/BulkActionBar';
import { useSearchHotkey } from '../../lib/hotkeys';

const $ = (slug) => slug.replace(/-/g, ' ').replace(/\b\w/g, c=>c.toUpperCase());

const API_MAP = {
  'appointment-booking': '/api/v1/appointments', 'calendar': '/api/v1/calendar',
  'time-tracking': '/api/v1/time-tracking', 'notes': '/api/v1/notes',
  'asset-management': '/api/v1/assets', 'document-management': '/api/v1/documents',
  'brand-kit': '/api/v1/brand-kit', 'affiliate-system': '/api/v1/affiliates',
  'referral-program': '/api/v1/referrals', 'coupons': '/api/v1/coupons',
  'whatsapp-marketing': '/api/v1/whatsapp/contacts',
  'sms-marketing': '/api/v1/sms/contacts',
  'inventory': '/api/v1/inventory/products', 'pos': '/api/v1/pos/sessions',
  'recruitment': '/api/v1/recruitment/jobs', 'task-management': '/api/v1/tasks',
  'forms': '/api/v1/leads/forms', 'webhooks': '/api/v1/api-keys/webhooks',
  'permissions': '/api/v1/permissions/roles', 'segments': '/api/v1/segments',
  'subscriptions': '/api/v1/customer-subs', 'sso': '/api/v1/auth/sso/providers',
  'content-calendar': '/api/v1/platform/calendar',
  'cross-module-activity-feed': '/api/v1/platform/activity',
  'legal-templates': '/api/v1/platform/legal-templates',
  'communities': '/api/v1/community/communities', 'events': '/api/v1/community/events',
  'dedup': '/api/v1/dedup', 'master-data-management': '/api/v1/dedup',
  'grants': '/api/v1/community/grants', 'donations': '/api/v1/community/donations',
  'volunteers': '/api/v1/community/volunteers',
  'native-integrations': '/api/v1/integrations/connections',
  'integrations': '/api/v1/integrations/connections',
  'collaborative-editing': '/api/v1/collaborative-editing',
  'shared-documents': '/api/v1/collaborative-editing',
  'jobs': '/api/v1/community/jobs', 'ideas': '/api/v1/community/ideas',
  'skills': '/api/v1/community/skills', 'ambassadors': '/api/v1/community/ambassadors',
  'timezone-proposals': '/api/v1/community/timezone-proposals',
  // Module slug → actual API path mappings for routes that don't match their slug
  'qr-code-generator': '/api/v1/qr-codes',
  'digital-business-cards': '/api/v1/biz-cards',
  'link-in-bio': '/api/v1/link-in-bio',
  'review-management': '/api/v1/reviews',
  'survey-builder': '/api/v1/forms',
  'online-store-builder': '/api/v1/store-builder',
  'custom-fields-engine': '/api/v1/custom-fields',
  'global-search': '/api/v1/search',
  'digital-asset-management-dam': '/api/v1/dam',
  'approval-workflow-engine': '/api/v1/approvals',
  'unified-inbox': '/api/v1/inbox',
  'granular-role-based-permissions': '/api/v1/permissions',
  'feature-flags-ab-experimentation-engine': '/api/v1/feature-flags',
  'notification-center': '/api/v1/notifications',
  'public-api-webhooks-manager': '/api/v1/webhooks',
  'knowledge-graph-entity-relationship-mapping': '/api/v1/knowledge-graph',
  'master-data-management-deduplication-engine': '/api/v1/dedup',
  'client-portal': '/api/v1/portal',
  'membership-community-platform': '/api/v1/community',
  'api-keys': '/api/v1/api-keys',
  'payment-processing': '/api/v1/payments',
  'digital-asset-management': '/api/v1/dam',
};

const NO_API_SLUGS = new Set([
  'background-removal', 'basic-video-editor', 'resume-builder', 'flyer-builder',
  'graphic-design-editor', 'logo-maker', 'image-compression', 'image-converter',
  'file-converter', 'json-formatter', 'password-generator',
  'business-dashboard', 'power-bi-embed-analytics',
  // Platform Administration (tier 3) — no workspace-facing API exists
  'super-admin-panel', 'add-on-third-party-integration-marketplace-manager',
  'impersonation-support-tools', 'agency-reseller-white-label-mode',
  'vulnerability-scanning-dashboard', 'security-incident-response-runbook-tool',
  'in-app-feedback-widget', 'changelog-release-notes-automation',
]);

function guessApiPath(slug) {
  if (NO_API_SLUGS.has(slug)) return null;
  if (API_MAP[slug]) return API_MAP[slug];
  // Per-module CRUD — every module with a DB table has explicit endpoints
  return '/api/v1/module/' + slug;
}

function formatCell(v) {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? '✅' : '—';
  if (typeof v === 'object') return JSON.stringify(v).slice(0, 50);
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) {
    try { return new Date(v).toLocaleDateString(); } catch {}
  }
  if (typeof v === 'number') return v.toLocaleString();
  return String(v).slice(0, 100);
}

function isDate(s) { return /^\d{4}-\d{2}-\d{2}/.test(String(s)); }
function isUrl(s) { return String(s).startsWith('http'); }
function isEmail(s) { return String(s).includes('@'); }

export default function GenericModule({ moduleSlug, goHome, categories }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [draft, setDraft] = useState({});
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [columns, setColumns] = useState([]);
  const [apiBase, setApiBase] = useState('');

  useSearchHotkey();
  const [listKey, setListKey] = useState('');
  const [showDelete, setShowDelete] = useState(null);

  const mod = categories?.flatMap(c => c.modules || []).find(m => m.slug === moduleSlug);

  const cfg = useMemo(() => ({
    icon: mod?.icon || '🧩', label: mod?.name || $(moduleSlug),
  }), [mod, moduleSlug]);

  useEffect(() => {
    const base = guessApiPath(moduleSlug);
    setApiBase(base || '');
    setListKey(moduleSlug.endsWith('s') ? moduleSlug : moduleSlug + 's');
  }, [moduleSlug]);

  const load = useCallback(async () => {
    if (!apiBase) { setLoading(false); return; }
    setLoading(true);
    try {
      const r = await apiFetch(apiBase);
      const entries = Object.entries(r || {}).find(([,v]) => Array.isArray(v) && v.length > 0);
      const items = entries ? entries[1] : (Array.isArray(r) ? r : []);
      const c = items.length > 0 ? Object.keys(items[0]).filter(k =>
        !['id','org_id','password_hash','token','secret','deleted_at'].includes(k)
      ) : ['name','description','status','created_at'];
      setData(items.slice(0, 500));
      setColumns(c.slice(0, 8));
      setSelected([]);
      try {
        const s = await apiFetch(apiBase + '/stats');
        setStats(s.stats || s);
      } catch { /* stats optional */ }
    } catch { /* no data yet */ }
    setLoading(false);
  }, [apiBase]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(e) {
    e.preventDefault();
    try {
      const method = editItem ? 'PUT' : 'POST';
      const url = editItem ? `${apiBase}/${editItem.id}` : apiBase;
      const r = await apiFetch(url, { method, body: JSON.stringify(draft) });
      if (r.error) { toast.error(r.error); return; }
      toast.success(editItem ? 'Updated!' : 'Created!');
      setShowForm(false); setEditItem(null); setDraft({}); load();
    } catch (err) {
      const msg = err.message === 'Not found.'
        ? `This module isn't fully built yet — the data table API (${apiBase}) isn't available.`
        : err.message;
      toast.error(msg);
    }
  }

  async function handleDelete(id) {
    try {
      await apiFetch(`${apiBase}/${id}`, { method: 'DELETE' });
      toast.success('Deleted!', { action: { label: 'Undo', onClick: () => console.log('Undo not supported server-side') } });
      setShowDelete(null); load();
    } catch { toast.error('Failed to delete'); }
  }

  async function handleBulkDelete() {
    if (!selected.length) return;
    try {
      const r = await apiFetch(apiBase.replace(/\/[^/]+$/, '/bulk-delete') || `${apiBase}/bulk-delete`, {
        method: 'POST', body: JSON.stringify({ ids: selected })
      });
      toast.success(`Deleted ${r.deleted || selected.length} item(s)`);
      setSelected([]); load();
    } catch { toast.error('Bulk delete not available'); }
  }

  function handleExportCsv() {
    const cols = columns.concat(['id']);
    const header = cols.map(c => c.replace(/_/g, ' ')).join(',');
    const rows = data.filter(d => !search || JSON.stringify(d).toLowerCase().includes(search.toLowerCase())).map(d =>
      cols.map(c => {
        const v = d[c];
        const s = v === null || v === undefined ? '' : String(v);
        return s.includes(',') ? `"${s}"` : s;
      }).join(',')
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${moduleSlug}-export.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  }

  function openEdit(item) {
    const d = {};
    columns.forEach(c => { if (!['created_at','updated_at','deleted_at'].includes(c)) d[c] = item[c] || ''; });
    setDraft(d); setEditItem(item); setShowForm(true);
  }

  const formFields = columns.filter(c => !['created_at','updated_at','deleted_at','last_seen','last_login','viewed_at'].includes(c));
  const filtered = data.filter(d => !search || JSON.stringify(d).toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / 25);
  const paged = filtered.slice((page - 1) * 25, page * 25);

  return (
    <div className="panel" style={{ padding: '24px 0' }}>
      <button className="back-link" onClick={goHome}>← Workspace</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', marginBottom: 4 }}>{cfg.icon} {cfg.label}</h1>
          {mod?.description && <p className="module-sub" style={{ margin: 0 }}>{mod.description}</p>}
        </div>
      </div>

      {stats && Object.keys(stats).length > 0 && (
        <div className="stats-row">
          {Object.entries(stats).filter(([,v]) => typeof v === 'number' || typeof v === 'string').slice(0, 5).map(([k, v]) => (
            <div key={k} className="stat-card">
              <div className="stat-value">{typeof v === 'number' ? v.toLocaleString() : String(v).slice(0, 20)}</div>
              <div className="stat-label">{k.replace(/_/g, ' ')}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="form-input"
          placeholder={`Search ${cfg.label}…`} value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ flex: 1, maxWidth: 320, minWidth: 180 }}
        />
        <Button onClick={() => { setShowForm(true); setEditItem(null); setDraft({}); }}>+ New</Button>
        {data.length > 0 && <Button variant="secondary" onClick={handleExportCsv}>📥 CSV</Button>}
      </div>

      <Modal isOpen={showForm} title={editItem ? `Edit ${cfg.label}` : `New ${cfg.label}`} onClose={() => setShowForm(false)} size="md">
        <form onSubmit={handleSave}>
          {formFields.slice(0, 8).map(f => (
            <div key={f} className="field">
              <label className="field-label">{f.replace(/_/g, ' ')}</label>
              {String(draft[f] || '').length > 80 ? (
                <textarea className="field-input" rows={4}
                  value={draft[f] || ''}
                  onChange={e => setDraft({...draft, [f]: e.target.value})}
                />
              ) : isDate(draft[f]) || f.includes('date') || f.includes('at') ? (
                <input className="field-input" type={f.includes('time') ? 'datetime-local' : 'date'}
                  value={draft[f] ? String(draft[f]).slice(0, 10) : ''}
                  onChange={e => setDraft({...draft, [f]: e.target.value})}
                />
              ) : typeof draft[f] === 'number' || f.includes('amount') || f.includes('price') ? (
                <input className="field-input" type="number" step="0.01"
                  value={draft[f] || ''}
                  onChange={e => setDraft({...draft, [f]: parseFloat(e.target.value) || 0})}
                />
              ) : (
                <input className="field-input"
                  value={draft[f] || ''}
                  onChange={e => setDraft({...draft, [f]: e.target.value})}
                  placeholder={`Enter ${f.replace(/_/g, ' ')}`}
                />
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="submit">{editItem ? 'Update' : 'Create'}</Button>
            <Button variant="secondary" type="button" onClick={() => { setShowForm(false); setEditItem(null); }}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {loading ? <SkeletonRows rows={6} /> : !apiBase ? (
        <EmptyState icon={cfg.icon} title={cfg.label}
          description="This module doesn't have a backend API yet — it's coming in a future update."
        />
      ) : data.length === 0 ? (
        <EmptyState icon={cfg.icon} title={`No ${cfg.label} yet`}
          description="Create your first record to populate this module."
          action={<Button onClick={() => { setShowForm(true); setDraft({}); }}>+ Create</Button>}
        />
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}><input type="checkbox"
                    checked={selected.length > 0 && selected.length === paged.length}
                    onChange={e => setSelected(e.target.checked ? paged.map(d => d.id) : [])}
                  /></th>
                  {columns.slice(0, 6).map(c => <th key={c}>{c.replace(/_/g, ' ')}</th>)}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((item) => (
                  <tr key={item.id || Math.random()} style={{ cursor: 'pointer' }}
                    onClick={() => openEdit(item)}>
                    <td onClick={e => e.stopPropagation()}><input type="checkbox"
                      checked={selected.includes(item.id)}
                      onChange={e => setSelected(e.target.checked ? [...selected, item.id] : selected.filter(id => id !== item.id))}
                    /></td>
                    {columns.slice(0, 6).map(c => (
                      <td key={c} style={{
                        fontWeight: c === columns[0] ? 600 : 400,
                        fontSize: '0.82rem', maxWidth: 180,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {isEmail(item[c]) ? <a href={`mailto:${item[c]}`} style={{ color: 'var(--primary)' }}>{item[c]}</a>
                          : isUrl(item[c]) ? <a href={item[c]} target="_blank" style={{ color: 'var(--primary)' }}>🔗</a>
                          : formatCell(item[c])}
                      </td>
                    ))}
                    <td onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }}
                        onClick={() => setShowDelete(item.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <BulkActionBar
            selectedCount={selected.length}
            onClearSelection={() => setSelected([])}
            actions={[
              { label: `Delete ${selected.length}`, variant: 'danger',
                requiresConfirm: true, confirmTitle: `Delete ${selected.length} item(s)?`,
                confirmDescription: 'This cannot be undone.',
                onClick: handleBulkDelete },
            ]}
          />

          {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
        </>
      )}

      <Modal isOpen={!!showDelete} title="Delete?" description="This cannot be undone." onClose={() => setShowDelete(null)}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="danger" onClick={() => handleDelete(showDelete)}>Delete</Button>
          <Button variant="secondary" onClick={() => setShowDelete(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
