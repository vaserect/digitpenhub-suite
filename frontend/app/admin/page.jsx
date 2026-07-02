'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

const fmt = (n) => Number(n).toLocaleString();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const toInputDate = (d) => d ? new Date(d).toISOString().slice(0, 10) : '';

async function apiFetch(path, opts = {}) {
  const res = await fetch(path, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...opts });
  return res.json();
}

// ── Primitive UI ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = '#3b82f6' }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 22px', minWidth: 160 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748b', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: '1.7rem', fontWeight: 800, color, lineHeight: 1, fontFamily: "'Sora', sans-serif" }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

function Badge({ label, color = '#d1fae5', text = '#065f46' }) {
  return <span style={{ padding: '2px 9px', borderRadius: 20, background: color, color: text, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</span>;
}

function TH({ children }) {
  return <th style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#94a3b8', whiteSpace: 'nowrap' }}>{children}</th>;
}
function TD({ children, mono }) {
  return <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', fontSize: 13, fontFamily: mono ? 'monospace' : undefined, color: mono ? '#64748b' : undefined, verticalAlign: 'middle' }}>{children}</td>;
}

function ActionBtn({ onClick, color = '#dc2626', border = '#f87171', children, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: `1px solid ${border}`, background: 'transparent', color, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: disabled ? 0.5 : 1 }}>
      {children}
    </button>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 560, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.2)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontFamily: "'Sora', sans-serif", fontSize: '1rem' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94a3b8', lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Label({ children }) {
  return <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: 5, marginTop: 14 }}>{children}</label>;
}

function Input({ value, onChange, placeholder, type = 'text', style: extra }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', ...extra }} />
  );
}

function Select({ value, onChange, children }) {
  return (
    <select value={value} onChange={onChange}
      style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' }}>
      {children}
    </select>
  );
}

function PrimaryBtn({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.7 : 1, fontFamily: 'inherit' }}>
      {children}
    </button>
  );
}

function planBadgeProps(slug) {
  if (!slug) return { color: '#f1f5f9', text: '#475569' };
  if (slug === 'free') return { color: '#f1f5f9', text: '#475569' };
  if (slug === 'starter') return { color: '#dbeafe', text: '#1e40af' };
  if (slug === 'growth') return { color: '#d1fae5', text: '#065f46' };
  if (slug === 'business') return { color: '#ede9fe', text: '#5b21b6' };
  return { color: '#dbeafe', text: '#1e40af' };
}

// ── Org Detail Modal ─────────────────────────────────────────────────────────

function OrgDetailModal({ orgId, plans, onClose, onUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subModal, setSubModal] = useState(false);
  const [subPlanId, setSubPlanId] = useState('');
  const [subStart, setSubStart] = useState('');
  const [subEnd, setSubEnd] = useState('');
  const [subWorking, setSubWorking] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspending, setSuspending] = useState(false);

  useEffect(() => {
    apiFetch(`/api/v1/admin/orgs/${orgId}`)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [orgId]);

  async function handleOverrideSub() {
    if (!subPlanId) return;
    setSubWorking(true);
    await apiFetch(`/api/v1/admin/orgs/${orgId}/subscription`, {
      method: 'POST',
      body: JSON.stringify({ planId: subPlanId, periodStart: subStart || undefined, periodEnd: subEnd || undefined }),
    });
    setSubWorking(false);
    setSubModal(false);
    const fresh = await apiFetch(`/api/v1/admin/orgs/${orgId}`);
    setData(fresh);
    onUpdated();
  }

  async function handleSuspend(suspend) {
    setSuspending(true);
    await apiFetch(`/api/v1/admin/orgs/${orgId}/suspend`, {
      method: 'PATCH',
      body: JSON.stringify({ suspend, reason: suspendReason }),
    });
    setSuspending(false);
    setSuspendReason('');
    const fresh = await apiFetch(`/api/v1/admin/orgs/${orgId}`);
    setData(fresh);
    onUpdated();
  }

  if (loading || !data) {
    return (
      <Modal title="Organization detail" onClose={onClose}>
        <p style={{ color: '#94a3b8', fontSize: 13 }}>Loading…</p>
      </Modal>
    );
  }

  const { org, members, payments } = data;

  return (
    <Modal title={org.name} onClose={onClose}>
      {/* Meta */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <Badge label={org.plan_name || 'No plan'} {...planBadgeProps(org.plan_slug)} />
        {org.is_suspended ? <Badge label="Suspended" color="#fee2e2" text="#991b1b" /> : <Badge label="Active" color="#d1fae5" text="#065f46" />}
        <span style={{ fontSize: 12, color: '#94a3b8' }}>Created {fmtDate(org.created_at)}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18, fontSize: 13 }}>
        <div><span style={{ color: '#94a3b8' }}>ID: </span><span style={{ fontFamily: 'monospace', fontSize: 11 }}>{org.id}</span></div>
        <div><span style={{ color: '#94a3b8' }}>Sub status: </span>{org.sub_status || '—'}</div>
        <div><span style={{ color: '#94a3b8' }}>Period start: </span>{fmtDate(org.current_period_start)}</div>
        <div><span style={{ color: '#94a3b8' }}>Period end: </span>{fmtDate(org.current_period_end)}</div>
      </div>

      {/* Actions row */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
        <PrimaryBtn onClick={() => { setSubPlanId(org.plan_id || ''); setSubStart(toInputDate(org.current_period_start)); setSubEnd(toInputDate(org.current_period_end)); setSubModal(true); }}>
          Override subscription
        </PrimaryBtn>
        {org.is_suspended ? (
          <ActionBtn color="#16a34a" border="#22c55e" disabled={suspending} onClick={() => handleSuspend(false)}>
            {suspending ? 'Reinstating…' : 'Reinstate'}
          </ActionBtn>
        ) : (
          <ActionBtn disabled={suspending} onClick={() => handleSuspend(true)}>
            {suspending ? 'Suspending…' : 'Suspend org'}
          </ActionBtn>
        )}
      </div>
      {!org.is_suspended && (
        <div style={{ marginBottom: 22 }}>
          <Input value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} placeholder="Suspension reason (optional)" />
        </div>
      )}

      {/* Members */}
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Members ({members.length})</div>
      <div style={{ overflowX: 'auto', marginBottom: 22, border: '1px solid #f1f5f9', borderRadius: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Name', 'Email', 'Role', 'Joined'].map((h) => <TH key={h}>{h}</TH>)}
          </tr></thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <TD><div style={{ fontWeight: 600 }}>{m.full_name}</div>{m.is_super_admin && <Badge label="Super admin" color="#ede9fe" text="#6d28d9" />}</TD>
                <TD mono>{m.email}</TD>
                <TD><Badge label={m.role} color={m.role === 'owner' ? '#fef9c3' : '#f1f5f9'} text={m.role === 'owner' ? '#92400e' : '#475569'} /></TD>
                <TD>{fmtDate(m.created_at)}</TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment history */}
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Payment history ({payments.length})</div>
      {payments.length === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: 13 }}>No payments yet.</p>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #f1f5f9', borderRadius: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {['Plan', 'Amount', 'Status', 'Date'].map((h) => <TH key={h}>{h}</TH>)}
            </tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <TD>{p.plan_name}</TD>
                  <TD>₦{fmt(p.amount_ngn)}</TD>
                  <TD><Badge label={p.status} color={p.status === 'successful' ? '#d1fae5' : p.status === 'failed' ? '#fee2e2' : '#fef9c3'} text={p.status === 'successful' ? '#065f46' : p.status === 'failed' ? '#991b1b' : '#92400e'} /></TD>
                  <TD>{fmtDate(p.created_at)}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sub override inner modal */}
      {subModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <h3 style={{ margin: '0 0 4px', fontFamily: "'Sora', sans-serif", fontSize: '1rem' }}>Override subscription</h3>
            <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 16px' }}>Force this org onto any plan, with optional custom dates. Leave dates blank to use today / never expires.</p>
            <Label>Plan</Label>
            <Select value={subPlanId} onChange={(e) => setSubPlanId(e.target.value)}>
              <option value="">Select plan…</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.price_ngn === 0 ? 'Free' : `₦${fmt(p.price_ngn)}/mo`}</option>)}
            </Select>
            <Label>Period start</Label>
            <Input type="date" value={subStart} onChange={(e) => setSubStart(e.target.value)} />
            <Label>Period end (blank = never expires)</Label>
            <Input type="date" value={subEnd} onChange={(e) => setSubEnd(e.target.value)} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
              <button onClick={() => setSubModal(false)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'transparent', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <PrimaryBtn onClick={handleOverrideSub} disabled={!subPlanId || subWorking}>{subWorking ? 'Saving…' : 'Apply override'}</PrimaryBtn>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Plan form modal ───────────────────────────────────────────────────────────

function PlanFormModal({ plan, onClose, onSaved }) {
  const isNew = !plan;
  const [slug, setSlug] = useState(plan?.slug || '');
  const [name, setName] = useState(plan?.name || '');
  const [price, setPrice] = useState(plan?.price_ngn ?? '');
  const [maxUsers, setMaxUsers] = useState(plan?.max_users ?? '');
  const [featuresText, setFeaturesText] = useState(
    Array.isArray(plan?.features) ? plan.features.join('\n') : (typeof plan?.features === 'string' ? JSON.parse(plan.features || '[]').join('\n') : '')
  );
  const [sortOrder, setSortOrder] = useState(plan?.sort_order ?? '');
  const [isActive, setIsActive] = useState(plan?.is_active !== false);
  const [working, setWorking] = useState(false);
  const [err, setErr] = useState('');

  async function handleSave() {
    setErr('');
    if (!name) { setErr('Name is required.'); return; }
    if (isNew && !slug) { setErr('Slug is required.'); return; }
    setWorking(true);
    const body = {
      name,
      priceNgn: Number(price) || 0,
      maxUsers: Number(maxUsers) || 1,
      features: featuresText.split('\n').map((s) => s.trim()).filter(Boolean),
      sortOrder: Number(sortOrder) || 0,
      isActive,
    };
    if (isNew) body.slug = slug;
    const url = isNew ? '/api/v1/admin/plans' : `/api/v1/admin/plans/${plan.id}`;
    const method = isNew ? 'POST' : 'PATCH';
    const data = await apiFetch(url, { method, body: JSON.stringify(body) });
    setWorking(false);
    if (data.error) { setErr(data.error); return; }
    onSaved();
  }

  return (
    <Modal title={isNew ? 'Create plan' : `Edit plan — ${plan.name}`} onClose={onClose}>
      {err && <p style={{ color: '#dc2626', fontSize: 13, margin: '0 0 12px' }}>{err}</p>}
      {isNew && (
        <>
          <Label>Slug (unique, lowercase, no spaces)</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder="e.g. enterprise" />
        </>
      )}
      <Label>Display name</Label>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Enterprise" />
      <Label>Monthly price (₦ NGN, 0 = free)</Label>
      <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
      <Label>Max users (999 = unlimited)</Label>
      <Input type="number" value={maxUsers} onChange={(e) => setMaxUsers(e.target.value)} placeholder="999" />
      <Label>Features (one per line)</Label>
      <textarea value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} rows={5}
        style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
        placeholder="Up to 5 users&#10;Unlimited invoices&#10;Priority support" />
      <Label>Sort order</Label>
      <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="0" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
        <input type="checkbox" id="is-active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ width: 16, height: 16 }} />
        <label htmlFor="is-active" style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Active (visible to customers)</label>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
        <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'transparent', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
        <PrimaryBtn onClick={handleSave} disabled={working}>{working ? 'Saving…' : isNew ? 'Create plan' : 'Save changes'}</PrimaryBtn>
      </div>
    </Modal>
  );
}

// ── Delete user confirm modal ─────────────────────────────────────────────────

function DeleteUserModal({ user, onClose, onDeleted }) {
  const [working, setWorking] = useState(false);

  async function handleDelete() {
    setWorking(true);
    await apiFetch(`/api/v1/admin/users/${user.id}`, { method: 'DELETE' });
    setWorking(false);
    onDeleted();
  }

  return (
    <Modal title="Delete user" onClose={onClose}>
      <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 18px' }}>
        Permanently remove <strong>{user.full_name}</strong> ({user.email}) from <strong>{user.org_name}</strong>? This cannot be undone.
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'transparent', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
        <button onClick={handleDelete} disabled={working}
          style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, cursor: working ? 'not-allowed' : 'pointer', opacity: working ? 0.7 : 1, fontFamily: 'inherit' }}>
          {working ? 'Deleting…' : 'Delete user'}
        </button>
      </div>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isContentAdmin, setIsContentAdmin] = useState(false);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('orgs');

  // Content (editorial)
  const [content, setContent] = useState([]);
  const [contentDraft, setContentDraft] = useState({});
  const [contentSaving, setContentSaving] = useState(null); // content_key currently saving

  // Admins (role management)
  const [admins, setAdmins] = useState([]);
  const [adminEmailSearch, setAdminEmailSearch] = useState('');
  const [adminSearchResult, setAdminSearchResult] = useState(null);
  const [adminSearchErr, setAdminSearchErr] = useState('');
  const [adminWorking, setAdminWorking] = useState(null);

  // Audit log
  const [auditEntries, setAuditEntries] = useState([]);

  // Orgs
  const [orgs, setOrgs] = useState([]);
  const [orgSearch, setOrgSearch] = useState('');
  const [orgTotal, setOrgTotal] = useState(0);
  const [orgDetail, setOrgDetail] = useState(null); // orgId string

  // Users
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userTotal, setUserTotal] = useState(0);
  const [deleteUserModal, setDeleteUserModal] = useState(null); // user object
  const [togglingUser, setTogglingUser] = useState(null); // userId

  // Plans
  const [plans, setPlans] = useState([]);
  const [planModal, setPlanModal] = useState(false);  // false | 'new' | plan object
  const [allPlans, setAllPlans] = useState([]); // for subscription override dropdown

  // Payments
  const [payments, setPayments] = useState([]);
  const [payTotal, setPayTotal] = useState(0);

  useEffect(() => {
    apiFetch('/api/v1/admin/me')
      .then((d) => {
        if (!d.isSuperAdmin && !d.isContentAdmin) { router.replace('/'); return; }
        setIsSuperAdmin(!!d.isSuperAdmin);
        setIsContentAdmin(!!d.isContentAdmin);
        setReady(true);
        if (d.isSuperAdmin) {
          setTab('orgs');
          loadStats();
          loadOrgs('');
          loadAllPlans();
        } else {
          // Content-editor-only admins land straight on the one tab they can use.
          setTab('content');
          loadContent();
        }
      })
      .catch(() => router.replace('/'));
  }, []);

  function loadContent() {
    apiFetch('/api/v1/admin/content').then((d) => {
      setContent(d.content || []);
      const draft = {};
      for (const row of d.content || []) draft[row.content_key] = row.content_value;
      setContentDraft(draft);
    }).catch(() => {});
  }

  async function saveContent(key) {
    setContentSaving(key);
    try {
      await apiFetch(`/api/v1/admin/content/${encodeURIComponent(key)}`, {
        method: 'PATCH',
        body: JSON.stringify({ value: contentDraft[key] ?? '' }),
      });
      loadContent();
    } finally {
      setContentSaving(null);
    }
  }

  function loadAdmins() {
    apiFetch('/api/v1/admin/admins').then((d) => setAdmins(d.admins || [])).catch(() => {});
  }

  async function findAdminByEmail() {
    setAdminSearchErr(''); setAdminSearchResult(null);
    try {
      const d = await apiFetch(`/api/v1/admin/admins/find?email=${encodeURIComponent(adminEmailSearch.trim())}`);
      setAdminSearchResult(d.user);
    } catch (err) {
      setAdminSearchErr(err.message || 'No user found with that email.');
    }
  }

  async function setRole(userId, patch) {
    setAdminWorking(userId);
    try {
      await apiFetch(`/api/v1/admin/admins/${userId}`, { method: 'PATCH', body: JSON.stringify(patch) });
      loadAdmins();
      if (adminSearchResult?.id === userId) setAdminSearchResult((r) => ({ ...r, ...patch, is_super_admin: patch.isSuperAdmin ?? r.is_super_admin, is_content_admin: patch.isContentAdmin ?? r.is_content_admin }));
    } finally {
      setAdminWorking(null);
    }
  }

  function loadAuditLog() {
    apiFetch('/api/v1/admin/audit-log?limit=150').then((d) => setAuditEntries(d.entries || [])).catch(() => {});
  }

  function loadStats() {
    apiFetch('/api/v1/admin/stats').then(setStats).catch(() => {});
  }

  function loadAllPlans() {
    apiFetch('/api/v1/admin/plans').then((d) => setAllPlans(d.plans || [])).catch(() => {});
  }

  const loadOrgs = useCallback((search) => {
    apiFetch(`/api/v1/admin/orgs?search=${encodeURIComponent(search)}&limit=50`)
      .then((d) => { setOrgs(d.orgs || []); setOrgTotal(d.total || 0); })
      .catch(() => {});
  }, []);

  const loadUsers = useCallback((search) => {
    apiFetch(`/api/v1/admin/users?search=${encodeURIComponent(search)}&limit=50`)
      .then((d) => { setUsers(d.users || []); setUserTotal(d.total || 0); })
      .catch(() => {});
  }, []);

  function loadPlans() {
    apiFetch('/api/v1/admin/plans').then((d) => { setPlans(d.plans || []); setAllPlans(d.plans || []); }).catch(() => {});
  }

  const loadPayments = useCallback(() => {
    apiFetch('/api/v1/admin/payments?limit=50')
      .then((d) => { setPayments(d.payments || []); setPayTotal(d.total || 0); })
      .catch(() => {});
  }, []);

  function switchTab(t) {
    setTab(t);
    if (t === 'users' && users.length === 0) loadUsers('');
    if (t === 'plans' && plans.length === 0) loadPlans();
    if (t === 'payments' && payments.length === 0) loadPayments();
    if (t === 'content' && content.length === 0) loadContent();
    if (t === 'admins' && admins.length === 0) loadAdmins();
    if (t === 'audit' && auditEntries.length === 0) loadAuditLog();
  }

  async function toggleSuperAdmin(user) {
    setTogglingUser(user.id);
    await apiFetch(`/api/v1/admin/users/${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isSuperAdmin: !user.is_super_admin }),
    });
    setTogglingUser(null);
    loadUsers(userSearch);
  }

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
        <p style={{ color: '#64748b' }}>Checking access…</p>
      </div>
    );
  }

  const tabs = isSuperAdmin
    ? ['orgs', 'users', 'plans', 'payments', 'content', 'admins', 'audit']
    : ['content'];
  const tabLabels = { orgs: 'Organizations', users: 'Users', plans: 'Plans', payments: 'Revenue', content: 'Content', admins: 'Admins', audit: 'Audit Log' };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ background: '#0f172a', padding: '0 28px', display: 'flex', alignItems: 'center', gap: 24, height: 56 }}>
        <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#fff', letterSpacing: '-0.02em' }}>
          Digitpen Hub <span style={{ color: '#38bdf8' }}>Admin</span>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => { loadStats(); loadOrgs(orgSearch); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>↻ Refresh</button>
        <a href="/" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>← Back to app</a>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>

        {/* Stat cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
            <StatCard label="Organizations" value={fmt(stats.orgs.total)} sub={stats.orgs.suspended > 0 ? `${stats.orgs.suspended} suspended` : 'None suspended'} color="#6366f1" />
            <StatCard label="Total users" value={fmt(stats.users)} color="#3b82f6" />
            <StatCard label="Paid subscriptions" value={fmt(stats.subscriptions.paid)} sub={`${fmt(stats.subscriptions.free)} on free plan`} color="#22c55e" />
            <StatCard label="Total revenue" value={`₦${fmt(stats.revenue.totalNgn)}`} sub={`${fmt(stats.revenue.paymentsCount)} payments`} color="#f59e0b" />
          </div>
        )}

        {/* Tab strip */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#e2e8f0', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {tabs.map((t) => (
            <button key={t} onClick={() => switchTab(t)}
              style={{ padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#0f172a' : '#64748b',
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,.10)' : 'none', fontFamily: 'inherit' }}>
              {tabLabels[t]}
            </button>
          ))}
        </div>

        {/* ── Organizations ── */}
        {tab === 'orgs' && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 700 }}>Organizations <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: 13 }}>({fmt(orgTotal)})</span></div>
              <input
                placeholder="Search by name or slug…"
                value={orgSearch}
                onChange={(e) => { setOrgSearch(e.target.value); loadOrgs(e.target.value); }}
                style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', fontSize: 13, width: 260, fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  {['Organization', 'Owner', 'Plan', 'Users', 'Period ends', 'Status', ''].map((h) => <TH key={h}>{h}</TH>)}
                </tr></thead>
                <tbody>
                  {orgs.map((org) => (
                    <tr key={org.id} style={{ background: org.is_suspended ? '#fff7ed' : undefined, cursor: 'pointer' }}
                      onClick={() => setOrgDetail(org.id)}>
                      <TD>
                        <div style={{ fontWeight: 600 }}>{org.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Created {fmtDate(org.created_at)}</div>
                      </TD>
                      <TD>
                        <div>{org.owner_name || '—'}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{org.owner_email || ''}</div>
                      </TD>
                      <TD>{org.plan_name ? <Badge label={org.plan_name} {...planBadgeProps(org.plan_slug)} /> : '—'}</TD>
                      <TD>{fmt(org.user_count)}</TD>
                      <TD>{fmtDate(org.current_period_end)}</TD>
                      <TD>{org.is_suspended ? <Badge label="Suspended" color="#fee2e2" text="#991b1b" /> : <Badge label="Active" />}</TD>
                      <TD>
                        <span style={{ fontSize: 12, color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer' }}
                          onClick={(e) => { e.stopPropagation(); setOrgDetail(org.id); }}>Details →</span>
                      </TD>
                    </tr>
                  ))}
                  {orgs.length === 0 && <tr><td colSpan={7} style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No organizations found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Users ── */}
        {tab === 'users' && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 700 }}>Users <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: 13 }}>({fmt(userTotal)})</span></div>
              <input
                placeholder="Search by name or email…"
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); loadUsers(e.target.value); }}
                style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', fontSize: 13, width: 260, fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  {['Name', 'Email', 'Organization', 'Role', 'Joined', 'Actions'].map((h) => <TH key={h}>{h}</TH>)}
                </tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <TD>
                        <div style={{ fontWeight: 600 }}>{u.full_name}</div>
                        {u.is_super_admin && <Badge label="Super admin" color="#ede9fe" text="#6d28d9" />}
                      </TD>
                      <TD mono>{u.email}</TD>
                      <TD>
                        <span style={{ cursor: 'pointer', color: '#3b82f6', textDecoration: 'underline', fontSize: 13 }}
                          onClick={() => { switchTab('orgs'); setTimeout(() => setOrgDetail(u.org_id), 50); }}>
                          {u.org_name}
                        </span>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>ID: {u.org_id?.slice(0, 8)}…</div>
                      </TD>
                      <TD><Badge label={u.role} color={u.role === 'owner' ? '#fef9c3' : '#f1f5f9'} text={u.role === 'owner' ? '#92400e' : '#475569'} /></TD>
                      <TD>{fmtDate(u.created_at)}</TD>
                      <TD>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <ActionBtn
                            color={u.is_super_admin ? '#92400e' : '#6d28d9'}
                            border={u.is_super_admin ? '#f59e0b' : '#a78bfa'}
                            disabled={togglingUser === u.id}
                            onClick={() => toggleSuperAdmin(u)}>
                            {u.is_super_admin ? 'Demote' : 'Make admin'}
                          </ActionBtn>
                          <ActionBtn onClick={() => setDeleteUserModal(u)}>Delete</ActionBtn>
                        </div>
                      </TD>
                    </tr>
                  ))}
                  {users.length === 0 && <tr><td colSpan={6} style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No users found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Plans ── */}
        {tab === 'plans' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <PrimaryBtn onClick={() => setPlanModal('new')}>+ New plan</PrimaryBtn>
            </div>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', fontWeight: 700 }}>Plans</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>
                    {['Name', 'Slug', 'Price / mo', 'Max users', 'Orgs on plan', 'Status', 'Order', ''].map((h) => <TH key={h}>{h}</TH>)}
                  </tr></thead>
                  <tbody>
                    {plans.map((p) => (
                      <tr key={p.id}>
                        <TD><div style={{ fontWeight: 600 }}>{p.name}</div></TD>
                        <TD mono>{p.slug}</TD>
                        <TD>{p.price_ngn === 0 ? 'Free' : `₦${fmt(p.price_ngn)}`}</TD>
                        <TD>{p.max_users >= 999 ? 'Unlimited' : p.max_users}</TD>
                        <TD>{fmt(p.org_count)}</TD>
                        <TD>{p.is_active ? <Badge label="Active" /> : <Badge label="Inactive" color="#f1f5f9" text="#64748b" />}</TD>
                        <TD>{p.sort_order}</TD>
                        <TD>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <ActionBtn color="#1e40af" border="#93c5fd" onClick={() => setPlanModal(p)}>Edit</ActionBtn>
                            <ActionBtn
                              color={p.is_active ? '#92400e' : '#065f46'}
                              border={p.is_active ? '#f59e0b' : '#22c55e'}
                              onClick={async () => {
                                await apiFetch(`/api/v1/admin/plans/${p.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !p.is_active }) });
                                loadPlans();
                              }}>
                              {p.is_active ? 'Deactivate' : 'Activate'}
                            </ActionBtn>
                          </div>
                        </TD>
                      </tr>
                    ))}
                    {plans.length === 0 && <tr><td colSpan={8} style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No plans found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Payments ── */}
        {tab === 'payments' && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', fontWeight: 700 }}>
              Revenue <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: 13 }}>({fmt(payTotal)} payments)</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  {['Organization', 'Plan', 'Amount', 'Months', 'Status', 'Reference', 'Date'].map((h) => <TH key={h}>{h}</TH>)}
                </tr></thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <TD>
                        <span style={{ cursor: 'pointer', color: '#3b82f6', textDecoration: 'underline' }}
                          onClick={() => { switchTab('orgs'); setTimeout(() => setOrgDetail(p.org_id), 50); }}>
                          {p.org_name}
                        </span>
                      </TD>
                      <TD>{p.plan_name}</TD>
                      <TD>₦{fmt(p.amount_ngn)}</TD>
                      <TD>{p.period_months}</TD>
                      <TD>
                        <Badge
                          label={p.status}
                          color={p.status === 'successful' ? '#d1fae5' : p.status === 'failed' ? '#fee2e2' : '#fef9c3'}
                          text={p.status === 'successful' ? '#065f46' : p.status === 'failed' ? '#991b1b' : '#92400e'}
                        />
                      </TD>
                      <TD mono>{p.tx_ref}</TD>
                      <TD>{fmtDate(p.created_at)}</TD>
                    </tr>
                  ))}
                  {payments.length === 0 && <tr><td colSpan={7} style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No payments yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Content (editorial) ── */}
        {tab === 'content' && (
          <div>
            {['homepage', 'footer'].map((section) => {
              const rows = content.filter((c) => c.section === section);
              if (!rows.length) return null;
              return (
                <div key={section} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 18 }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, textTransform: 'capitalize' }}>{section}</div>
                  <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {rows.map((row) => (
                      <div key={row.content_key}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                          {row.label} <span style={{ fontWeight: 400, color: '#cbd5e1' }}>({row.content_key})</span>
                        </label>
                        {row.content_type === 'html' || (contentDraft[row.content_key] || '').length > 90 ? (
                          <textarea
                            value={contentDraft[row.content_key] ?? ''}
                            onChange={(e) => setContentDraft((d) => ({ ...d, [row.content_key]: e.target.value }))}
                            rows={3}
                            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                          />
                        ) : (
                          <input
                            value={contentDraft[row.content_key] ?? ''}
                            onChange={(e) => setContentDraft((d) => ({ ...d, [row.content_key]: e.target.value }))}
                            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}
                          />
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                          <button
                            onClick={() => saveContent(row.content_key)}
                            disabled={contentSaving === row.content_key || contentDraft[row.content_key] === row.content_value}
                            style={{ padding: '5px 14px', borderRadius: 7, border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: (contentSaving === row.content_key || contentDraft[row.content_key] === row.content_value) ? 0.5 : 1 }}
                          >
                            {contentSaving === row.content_key ? 'Saving…' : 'Save'}
                          </button>
                          {row.updated_at && <span style={{ fontSize: 11, color: '#94a3b8' }}>Last updated {fmtDate(row.updated_at)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {content.length === 0 && (
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 28, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading content…</div>
            )}
          </div>
        )}

        {/* ── Admins (role management, super-admin only) ── */}
        {tab === 'admins' && isSuperAdmin && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Grant admin access</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  placeholder="user@email.com"
                  value={adminEmailSearch}
                  onChange={(e) => setAdminEmailSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && findAdminByEmail()}
                  style={{ flex: 1, maxWidth: 320, border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', fontSize: 13, fontFamily: 'inherit' }}
                />
                <button onClick={findAdminByEmail} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Find</button>
              </div>
              {adminSearchErr && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 8 }}>{adminSearchErr}</div>}
              {adminSearchResult && (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{adminSearchResult.full_name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{adminSearchResult.email}</div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!adminSearchResult.is_content_admin} disabled={adminWorking === adminSearchResult.id} onChange={(e) => setRole(adminSearchResult.id, { isContentAdmin: e.target.checked })} />
                    Content editor
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!adminSearchResult.is_super_admin} disabled={adminWorking === adminSearchResult.id} onChange={(e) => setRole(adminSearchResult.id, { isSuperAdmin: e.target.checked })} />
                    Super admin
                  </label>
                </div>
              )}
            </div>
            <div style={{ padding: '16px 20px', fontWeight: 700 }}>Current admins <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: 13 }}>({fmt(admins.length)})</span></div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Name', 'Email', 'Content editor', 'Super admin', ''].map((h) => <TH key={h}>{h}</TH>)}</tr></thead>
                <tbody>
                  {admins.map((a) => (
                    <tr key={a.id}>
                      <TD>{a.full_name}</TD>
                      <TD>{a.email}</TD>
                      <TD>{a.is_content_admin ? <Badge label="Yes" /> : '—'}</TD>
                      <TD>{a.is_super_admin ? <Badge label="Yes" color="#ede9fe" text="#5b21b6" /> : '—'}</TD>
                      <TD>
                        <button
                          disabled={adminWorking === a.id}
                          onClick={() => setRole(a.id, { isSuperAdmin: false, isContentAdmin: false })}
                          style={{ fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}
                        >Revoke all admin access</button>
                      </TD>
                    </tr>
                  ))}
                  {admins.length === 0 && <tr><td colSpan={5} style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No admins found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Audit log (super-admin only) ── */}
        {tab === 'audit' && isSuperAdmin && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', fontWeight: 700 }}>
              Recent admin activity <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: 13 }}>(last {fmt(auditEntries.length)})</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['When', 'Who', 'Action', 'Details'].map((h) => <TH key={h}>{h}</TH>)}</tr></thead>
                <tbody>
                  {auditEntries.map((e) => (
                    <tr key={e.id}>
                      <TD>{fmtDate(e.created_at)}</TD>
                      <TD>{e.user_name || e.user_email || '—'}</TD>
                      <TD mono>{e.action}</TD>
                      <TD><span style={{ fontSize: 11, color: '#94a3b8' }}>{e.meta ? JSON.stringify(e.meta) : ''}</span></TD>
                    </tr>
                  ))}
                  {auditEntries.length === 0 && <tr><td colSpan={4} style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No activity logged yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}

      {orgDetail && (
        <OrgDetailModal
          orgId={orgDetail}
          plans={allPlans}
          onClose={() => setOrgDetail(null)}
          onUpdated={() => { loadOrgs(orgSearch); loadStats(); }}
        />
      )}

      {planModal && (
        <PlanFormModal
          plan={planModal === 'new' ? null : planModal}
          onClose={() => setPlanModal(false)}
          onSaved={() => { setPlanModal(false); loadPlans(); }}
        />
      )}

      {deleteUserModal && (
        <DeleteUserModal
          user={deleteUserModal}
          onClose={() => setDeleteUserModal(null)}
          onDeleted={() => { setDeleteUserModal(null); loadUsers(userSearch); loadStats(); }}
        />
      )}
    </div>
  );
}
