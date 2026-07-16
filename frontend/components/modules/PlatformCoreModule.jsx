'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import Badge from '../ui/Badge';
import { SkeletonRows } from '../ui/Skeleton';
import SearchInput from '../ui/SearchInput';
import Pagination from '../ui/Pagination';

const TABS = [
  { k:'fields', l:'Custom Fields', icon:'🏷️' },
  { k:'inbox', l:'Unified Inbox', icon:'📨' },
  { k:'notifs', l:'Notifications', icon:'🔔' },
  { k:'approvals', l:'Approvals', icon:'✅' },
  { k:'activity', l:'Activity Feed', icon:'📋' },
  { k:'calendar', l:'Content Calendar', icon:'📅' },
  { k:'legal', l:'Legal Templates', icon:'⚖️' },
  { k:'api-keys', l:'API Keys', icon:'🔑' },
  { k:'vuln', l:'Vulnerability', icon:'🛡️' },
  { k:'incidents', l:'Incidents', icon:'🚨' },
];

export default function PlatformCoreModule({ goHome }) {
  const [tab, setTab] = useState('fields');
  const [loading, setLoading] = useState(true);

  // ── Custom Fields ──
  const [fields, setFields] = useState([]);
  const [showForm, setShowForm] = useState(null);
  const [fieldDraft, setFieldDraft] = useState({ recordType:'contact', name:'', type:'text', required:false });

  // ── Inbox ──
  const [inbox, setInbox] = useState([]);
  const [showInboxDetail, setShowInboxDetail] = useState(null);

  // ── Notifications ──
  const [notifications, setNotifications] = useState([]);

  // ── Approvals ──
  const [approvals, setApprovals] = useState([]);
  const [approvalTemplates, setApprovalTemplates] = useState([]);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [approvalDraft, setApprovalDraft] = useState({ resourceType:'', resourceId:'', title:'', templateId:'' });
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateDraft, setTemplateDraft] = useState({ name:'', description:'', resourceType:'', steps:'approver1' });
  const [selectedApproval, setSelectedApproval] = useState(null);

  // ── Activity Feed ──
  const [activities, setActivities] = useState([]);
  const [activityTotal, setActivityTotal] = useState(0);

  // ── Content Calendar ──
  const [calendarItems, setCalendarItems] = useState([]);
  const [showCalendarForm, setShowCalendarForm] = useState(false);
  const [calendarDraft, setCalendarDraft] = useState({ title:'', channel:'blog', scheduledAt:'' });

  // ── Legal Templates ──
  const [legalTemplates, setLegalTemplates] = useState([]);
  const [showLegalForm, setShowLegalForm] = useState(false);
  const [legalDraft, setLegalDraft] = useState({ name:'', type:'nda', content:'' });

  // ── API Keys ──
  const [apiKeys, setApiKeys] = useState([]);
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyRevealed, setNewKeyRevealed] = useState('');

  // ── Vulnerability ──
  const [vulnScans, setVulnScans] = useState([]);
  const [runningScan, setRunningScan] = useState(false);

  // ── Incidents ──
  const [incidents, setIncidents] = useState([]);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentDraft, setIncidentDraft] = useState({ title:'', severity:'medium', description:'' });
  const [runbooks, setRunbooks] = useState([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [f, i, n, a, at, ac, atot, cal, lt, ak, vs, inc, rb] = await Promise.all([
        apiFetch('/api/v1/custom-fields/contact').catch(() => { console.error('Failed to load custom fields'); return null; }),
        apiFetch('/api/v1/inbox').catch(() => { console.error('Failed to load inbox'); return null; }),
        apiFetch('/api/v1/notifications').catch(() => { console.error('Failed to load notifications'); return null; }),
        apiFetch('/api/v1/approvals/requests').catch(() => { console.error('Failed to load approval requests'); return null; }),
        apiFetch('/api/v1/approvals/templates').catch(() => { console.error('Failed to load approval templates'); return null; }),
        apiFetch('/api/v1/platform/activity?limit=30').catch(() => { console.error('Failed to load activity feed'); return null; }),
        apiFetch('/api/v1/platform/activity?limit=1').catch(() => { console.error('Failed to load activity feed (compact)'); return null; }),
        apiFetch('/api/v1/platform/calendar').catch(() => { console.error('Failed to load calendar'); return null; }),
        apiFetch('/api/v1/platform/legal-templates').catch(() => { console.error('Failed to load legal templates'); return null; }),
        apiFetch('/api/v1/api-keys').catch(() => { console.error('Failed to load API keys'); return null; }),
        apiFetch('/api/v1/platform/vuln-scans').catch(() => { console.error('Failed to load vulnerability scans'); return null; }),
        apiFetch('/api/v1/platform/incidents').catch(() => { console.error('Failed to load incidents'); return null; }),
        apiFetch('/api/v1/platform/runbooks').catch(() => { console.error('Failed to load runbooks'); return null; }),
      ]);
      setFields(f?.fields || []);
      setInbox(i?.messages || i?.conversations || i?.inbox || []);
      setNotifications(n?.notifications || []);
      setApprovals(a?.requests || []);
      setApprovalTemplates(at?.templates || []);
      setActivities(ac?.activities || []);
      setActivityTotal(atot?.total || 0);
      setCalendarItems(cal?.items || []);
      setLegalTemplates(lt?.templates || []);
      setApiKeys(ak?.keys || []);
      setVulnScans(vs?.scans || []);
      setIncidents(inc?.incidents || []);
      setRunbooks(rb?.runbooks || []);
    } catch (e) { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Custom Field handlers ──
  async function createField(e) {
    e.preventDefault();
    try {
      await apiFetch(`/api/v1/custom-fields/${fieldDraft.recordType}`, { method:'POST', body:JSON.stringify(fieldDraft) });
      toast.success('Custom field created');
      setShowForm(null); setFieldDraft({ recordType:'contact', name:'', type:'text', required:false }); loadAll();
    } catch (err) { toast.error(err.message); }
  }

  // ── Approval handlers ──
  async function createApprovalTemplate(e) {
    e.preventDefault();
    try {
      const stepsArray = templateDraft.steps.split('\n').filter(Boolean).map((s, i) => ({ order: i + 1, type: s.trim().toLowerCase() === 'all' ? 'all' : 'any' }));
      if (!stepsArray.length) return toast.error('Add at least one step');
      await apiFetch('/api/v1/approvals/templates', { method:'POST', body:JSON.stringify({
        name: templateDraft.name, description: templateDraft.description,
        resourceType: templateDraft.resourceType, steps: stepsArray,
      })});
      setShowTemplateForm(false); setTemplateDraft({ name:'', description:'', resourceType:'', steps:'approver1' });
      toast.success('Approval template created'); loadAll();
    } catch (err) { toast.error(err.message); }
  }

  async function submitApproval(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/approvals/requests', { method:'POST', body:JSON.stringify(approvalDraft) });
      setShowApprovalForm(false); setApprovalDraft({ resourceType:'', resourceId:'', title:'', templateId:'' });
      toast.success('Approval request submitted'); loadAll();
    } catch (err) { toast.error(err.message); }
  }

  async function handleApprovalAction(reqId, action) {
    try {
      await apiFetch(`/api/v1/approvals/requests/${reqId}/action`, { method:'POST', body:JSON.stringify({ action, comment:'' }) });
      toast.success(action === 'approve' ? 'Approved!' : 'Rejected');
      loadAll();
    } catch (err) { toast.error(err.message); }
  }

  // ── Calendar handlers ──
  async function createCalendarItem(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/platform/calendar', { method:'POST', body:JSON.stringify(calendarDraft) });
      setShowCalendarForm(false); setCalendarDraft({ title:'', channel:'blog', scheduledAt:'' });
      toast.success('Content scheduled'); loadAll();
    } catch (err) { toast.error(err.message); }
  }

  // ── Legal template handlers ──
  async function createLegalTemplate(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/platform/legal-templates', { method:'POST', body:JSON.stringify(legalDraft) });
      setShowLegalForm(false); setLegalDraft({ name:'', type:'nda', content:'' });
      toast.success('Legal template created'); loadAll();
    } catch (err) { toast.error(err.message); }
  }

  // ── API Key handlers ──
  async function createApiKey(e) {
    e.preventDefault();
    try {
      const r = await apiFetch('/api/v1/api-keys', { method:'POST', body:JSON.stringify({ name: newKeyName, scopes: ['read'] }) });
      setNewKeyRevealed(r.rawKey);
      setNewKeyName('');
      toast.success('API key created — copy it now, it won\'t be shown again');
      loadAll();
    } catch (err) { toast.error(err.message); }
  }

  // ── Vulnerability scan handlers ──
  async function runVulnScan() {
    setRunningScan(true);
    try {
      const r = await apiFetch('/api/v1/platform/vuln-scans', { method:'POST', body:JSON.stringify({ scanType:'dependency' }) });
      setVulnScans(prev => [{ ...r.scan, findings: r.findings }, ...prev]);
      const crit = r.findings?.filter(f => f.severity === 'critical').length || 0;
      toast.success(`Scan complete — found ${r.findings?.length || 0} issues (${crit} critical)`);
    } catch (err) { toast.error(err.message); }
    setRunningScan(false);
  }

  // ── Incident handlers ──
  async function createIncident(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/platform/incidents', { method:'POST', body:JSON.stringify(incidentDraft) });
      setShowIncidentForm(false); setIncidentDraft({ title:'', severity:'medium', description:'' });
      toast.success('Incident logged'); loadAll();
    } catch (err) { toast.error(err.message); }
  }

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <div><h1>Platform Core</h1><p className="module-sub">Cross-module infrastructure: custom fields, inbox, approvals, activity feed, API keys, security tools, and more.</p></div>
      </div>

      <div className="invoice-tabs" style={{ marginBottom:16, flexWrap:'wrap' }}>
        {TABS.map(t => (
          <button key={t.k} className={`invoice-tab${tab===t.k?' active':''}`} onClick={() => setTab(t.k)}>{t.icon} {t.l}</button>
        ))}
      </div>

      {loading ? <SkeletonRows rows={8} /> : (
        <>
          {/* ═══ CUSTOM FIELDS ═══ */}
          {tab === 'fields' && <CustomFieldsTab fields={fields} showForm={showForm} setShowForm={setShowForm}
            fieldDraft={fieldDraft} setFieldDraft={setFieldDraft} onCreate={createField} />}

          {/* ═══ INBOX ═══ */}
          {tab === 'inbox' && <InboxTab inbox={inbox} showInboxDetail={showInboxDetail} setShowInboxDetail={setShowInboxDetail} loadAll={loadAll} />}

          {/* ═══ NOTIFICATIONS ═══ */}
          {tab === 'notifs' && <NotificationsTab notifications={notifications} setNotifications={setNotifications} />}

          {/* ═══ APPROVALS ═══ */}
          {tab === 'approvals' && <ApprovalsTab approvals={approvals} templates={approvalTemplates}
            showApprovalForm={showApprovalForm} setShowApprovalForm={setShowApprovalForm} approvalDraft={approvalDraft} setApprovalDraft={setApprovalDraft}
            onSubmit={submitApproval} showTemplateForm={showTemplateForm} setShowTemplateForm={setShowTemplateForm}
            templateDraft={templateDraft} setTemplateDraft={setTemplateDraft} onCreateTemplate={createApprovalTemplate}
            onAction={handleApprovalAction} selectedApproval={selectedApproval} setSelectedApproval={setSelectedApproval} />}

          {/* ═══ ACTIVITY FEED ═══ */}
          {tab === 'activity' && <ActivityTab activities={activities} total={activityTotal} />}

          {/* ═══ CONTENT CALENDAR ═══ */}
          {tab === 'calendar' && <CalendarTab items={calendarItems} showForm={showCalendarForm} setShowForm={setShowCalendarForm}
            draft={calendarDraft} setDraft={setCalendarDraft} onCreate={createCalendarItem} />}

          {/* ═══ LEGAL TEMPLATES ═══ */}
          {tab === 'legal' && <LegalTemplatesTab templates={legalTemplates} showForm={showLegalForm} setShowForm={setShowLegalForm}
            draft={legalDraft} setDraft={setLegalDraft} onCreate={createLegalTemplate} />}

          {/* ═══ API KEYS ═══ */}
          {tab === 'api-keys' && <ApiKeysTab keys={apiKeys} showForm={showApiKeyForm} setShowForm={setShowApiKeyForm}
            newKeyName={newKeyName} setNewKeyName={setNewKeyName} onCreate={createApiKey} newKeyRevealed={newKeyRevealed} setNewKeyRevealed={setNewKeyRevealed} />}

          {/* ═══ VULNERABILITY ═══ */}
          {tab === 'vuln' && <VulnTab scans={vulnScans} runningScan={runningScan} onRunScan={runVulnScan} />}

          {/* ═══ INCIDENTS ═══ */}
          {tab === 'incidents' && <IncidentsTab incidents={incidents} runbooks={runbooks}
            showForm={showIncidentForm} setShowForm={setShowIncidentForm}
            draft={incidentDraft} setDraft={setIncidentDraft} onCreate={createIncident} />}
        </>
      )}
    </div>
  );
}

// ── Sub-tab components ────────────────────────────────────────────────────────

function CustomFieldsTab({ fields, showForm, setShowForm, fieldDraft, setFieldDraft, onCreate }) {
  return (<>
    <Button onClick={() => setShowForm('field')}>+ New Field</Button>
    <Modal isOpen={showForm === 'field'} title="Add Custom Field" onClose={() => setShowForm(null)}>
      <form onSubmit={onCreate}>
        <div className="field"><label className="field-label">Record Type</label>
          <select className="field-input" value={fieldDraft.recordType} onChange={e => setFieldDraft({...fieldDraft,recordType:e.target.value})}>
            <option value="contact">Contact</option><option value="invoice">Invoice</option><option value="deal">Deal</option><option value="lead">Lead</option><option value="product">Product</option>
          </select></div>
        <div className="field"><label className="field-label">Name</label><input className="field-input" value={fieldDraft.name} onChange={e => setFieldDraft({...fieldDraft,name:e.target.value})} required /></div>
        <div className="field"><label className="field-label">Type</label>
          <select className="field-input" value={fieldDraft.type} onChange={e => setFieldDraft({...fieldDraft,type:e.target.value})}>
            <option value="text">Text</option><option value="number">Number</option><option value="date">Date</option><option value="select">Dropdown</option><option value="checkbox">Checkbox</option>
          </select></div>
        <label style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
          <input type="checkbox" checked={fieldDraft.required} onChange={e => setFieldDraft({...fieldDraft,required:e.target.checked})} /> Required
        </label>
        <Button type="submit">Create</Button>
      </form>
    </Modal>
    {fields.length === 0 ? <EmptyState icon="🏷️" title="No custom fields yet" action={<Button onClick={() => setShowForm('field')}>+ New Field</Button>} /> : (
      <div className="table-wrap"><table className="data-table">
        <thead><tr><th>Name</th><th>Record Type</th><th>Type</th><th>Required</th></tr></thead>
        <tbody>{fields.map(f => (
          <tr key={f.id}><td style={{fontWeight:600}}>{f.name}</td><td>{f.record_type || '—'}</td><td><Badge variant="neutral">{f.field_type || f.type}</Badge></td><td>{f.required ? '✅' : '—'}</td></tr>
        ))}</tbody>
      </table></div>
    )}
  </>);
}

function InboxTab({ inbox, showInboxDetail, setShowInboxDetail, loadAll }) {
  return inbox.length === 0
    ? <EmptyState icon="📨" title="Inbox empty" description="Messages from email, SMS, WhatsApp, and chat appear here." />
    : <div style={{display:'grid',gap:8}}>{inbox.map((m,i) => (
      <div key={m.id||i} className="card" style={{padding:12,display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'}} onClick={() => setShowInboxDetail(m)}>
        <div><div style={{fontWeight:600,fontSize:'0.88rem'}}>{m.subject||m.from||'Message'}</div>
          <div style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>{m.preview||m.body?.slice(0,80)||''}</div></div>
        <Badge variant={m.channel||'neutral'}>{m.channel||'email'}</Badge>
      </div>
    ))}</div>;
}

function NotificationsTab({ notifications, setNotifications }) {
  const [preferences, setPreferences] = useState({ notifyEmail: true, notifyInapp: true, digestFreq: 'realtime' });
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  useEffect(() => {
    apiFetch('/api/v1/inbox/preferences')
      .then((data) => {
        setPreferences({
          notifyEmail: data.preferences?.notify_email !== false,
          notifyInapp: data.preferences?.notify_inapp !== false,
          digestFreq: data.preferences?.digest_freq || 'realtime',
        });
      })
      .catch((e) => console.error(e))
      .finally(() => setLoadingPrefs(false));
  }, []);

  async function handleSavePref(key, val) {
    const nextPrefs = { ...preferences, [key]: val };
    setPreferences(nextPrefs);
    try {
      await apiFetch('/api/v1/inbox/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          notifyEmail: nextPrefs.notifyEmail,
          notifyInapp: nextPrefs.notifyInapp,
          digestFreq: nextPrefs.digestFreq
        }),
      });
      toast.success('Notification preferences updated.');
    } catch (err) {
      toast.error('Failed to save preference');
    }
  }

  async function handleMarkRead(id) {
    try {
      await apiFetch(`/api/v1/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      toast.success('Notification marked as read.');
    } catch {
      toast.error('Failed to mark as read');
    }
  }

  async function handleMarkAllRead() {
    try {
      await apiFetch('/api/v1/notifications/mark-all-read', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
      toast.success('All notifications marked as read.');
    } catch {
      toast.error('Failed to mark all as read');
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'start' }}>
      {/* Settings Panel */}
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700 }}>Notification Settings</h3>
        {loadingPrefs ? (
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading preferences…</p>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={preferences.notifyEmail}
                onChange={(e) => handleSavePref('notifyEmail', e.target.checked)}
              />
              Send email alerts
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={preferences.notifyInapp}
                onChange={(e) => handleSavePref('notifyInapp', e.target.checked)}
              />
              Show in-app notifications
            </label>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label" style={{ fontSize: 12 }}>Email Digest Frequency</label>
              <select
                className="field-input"
                style={{ fontSize: 12.5 }}
                value={preferences.digestFreq}
                onChange={(e) => handleSavePref('digestFreq', e.target.value)}
              >
                <option value="realtime">Realtime</option>
                <option value="daily">Daily digest</option>
                <option value="weekly">Weekly digest</option>
                <option value="never">Never send</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* History Panel */}
      <div style={{ gridColumn: 'span 2' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Alerts & History ({notifications.length})</h3>
          {notifications.some(n => !n.read_at) && (
            <button className="ctag" onClick={handleMarkAllRead}>Mark all as read</button>
          )}
        </div>

        {notifications.length === 0 ? (
          <EmptyState icon="🔔" title="No notifications yet" description="Any system warnings, billing status updates, or portal messages will show up here." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifications.map((n, i) => (
              <div key={n.id || i} className="card" style={{ padding: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: n.read_at ? 'transparent' : 'var(--primary)',
                    border: n.read_at ? '1px solid var(--border)' : 'none',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: n.read_at ? 400 : 600, color: 'var(--text)' }}>
                    {n.title || n.message}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                  </div>
                </div>
                {!n.read_at && (
                  <button className="ctag" onClick={() => handleMarkRead(n.id)}>Mark read</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ApprovalsTab({ approvals, templates, showApprovalForm, setShowApprovalForm, approvalDraft, setApprovalDraft, onSubmit, showTemplateForm, setShowTemplateForm, templateDraft, setTemplateDraft, onCreateTemplate, onAction, selectedApproval, setSelectedApproval }) {
  return (<>
    <div style={{display:'flex',gap:8,marginBottom:14}}>
      <Button onClick={() => setShowTemplateForm(v=>!v)}>{showTemplateForm?'Cancel':'+ New Template'}</Button>
      <Button variant="secondary" onClick={() => setShowApprovalForm(v=>!v)}>{showApprovalForm?'Cancel':'+ New Request'}</Button>
    </div>

    {showTemplateForm && (
      <form onSubmit={onCreateTemplate} style={{display:'grid',gap:10,gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',marginBottom:16}}>
        <div className="field" style={{marginBottom:0}}>
          <label className="field-label">Template Name *</label>
          <input className="field-input" value={templateDraft.name} onChange={e => setTemplateDraft({...templateDraft,name:e.target.value})} required />
        </div>
        <div className="field" style={{marginBottom:0}}>
          <label className="field-label">Resource Type</label>
          <select className="field-input" value={templateDraft.resourceType} onChange={e => setTemplateDraft({...templateDraft,resourceType:e.target.value})}>
            <option value="expense">Expense</option><option value="publish">Publish</option><option value="contract">Contract</option>
            <option value="leave">Leave</option><option value="purchase">Purchase Order</option>
          </select>
        </div>
        <div className="field" style={{marginBottom:0}}>
          <label className="field-label">Description</label>
          <input className="field-input" value={templateDraft.description} onChange={e => setTemplateDraft({...templateDraft,description:e.target.value})} />
        </div>
        <div className="field" style={{marginBottom:0,gridColumn:'1/-1'}}>
          <label className="field-label">Approval Steps (one per line: "any" or "all")</label>
          <textarea className="field-input" rows={3} value={templateDraft.steps} onChange={e => setTemplateDraft({...templateDraft,steps:e.target.value})} placeholder="any&#10;all&#10;any" />
        </div>
        <Button type="submit">Create Template</Button>
      </form>
    )}

    {showApprovalForm && (
      <form onSubmit={onSubmit} style={{display:'grid',gap:10,gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',marginBottom:16}}>
        <div className="field" style={{marginBottom:0}}>
          <label className="field-label">Title *</label>
          <input className="field-input" value={approvalDraft.title} onChange={e => setApprovalDraft({...approvalDraft,title:e.target.value})} required />
        </div>
        <div className="field" style={{marginBottom:0}}>
          <label className="field-label">Resource Type</label>
          <select className="field-input" value={approvalDraft.resourceType} onChange={e => setApprovalDraft({...approvalDraft,resourceType:e.target.value})}>
            <option value="expense">Expense</option><option value="publish">Publish</option><option value="contract">Contract</option>
          </select>
        </div>
        <div className="field" style={{marginBottom:0}}>
          <label className="field-label">Resource ID</label>
          <input className="field-input" value={approvalDraft.resourceId} onChange={e => setApprovalDraft({...approvalDraft,resourceId:e.target.value})} />
        </div>
        <div className="field" style={{marginBottom:0}}>
          <label className="field-label">Approval Template</label>
          <select className="field-input" value={approvalDraft.templateId} onChange={e => setApprovalDraft({...approvalDraft,templateId:e.target.value})}>
            <option value="">Select template</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <Button type="submit">Submit Request</Button>
      </form>
    )}

    <div style={{display:'grid',gap:8}}>
      {approvals.map(a => (
        <div key={a.id} className="card" style={{padding:12}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
            <div>
              <div style={{fontWeight:600,fontSize:'0.88rem'}}>{a.title}</div>
              <div style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>{a.resource_type} · {new Date(a.submitted_at).toLocaleDateString()}</div>
            </div>
            <Badge variant={a.status==='approved'?'success':a.status==='rejected'?'danger':a.status==='pending'?'warning':'neutral'}>{a.status}</Badge>
          </div>
          {(a.status === 'pending') && (
            <div style={{display:'flex',gap:8,marginTop:6}}>
              <Button size="sm" variant="secondary" onClick={() => onAction(a.id,'approve')}>✓ Approve</Button>
              <Button size="sm" variant="danger" onClick={() => onAction(a.id,'reject')}>✕ Reject</Button>
            </div>
          )}
        </div>
      ))}
      {approvals.length === 0 && <EmptyState icon="✅" title="No approval requests yet" description="Submit or configure an approval template to get started." />}
    </div>
  </>);
}

function ActivityTab({ activities, total }) {
  return (<>
    <p style={{fontSize:'0.82rem',color:'var(--text-muted)',marginBottom:12}}>{total} total activities</p>
    {activities.length === 0 ? <EmptyState icon="📋" title="No activity yet" description="Cross-module activity feed shows actions across all modules." /> : (
      <div style={{display:'grid',gap:6}}>
        {activities.map(a => (
          <div key={a.id} className="card" style={{padding:'8px 12px',display:'flex',gap:10,alignItems:'center'}}>
            <div style={{width:28,height:28,borderRadius:'50%',background:'var(--surface-muted)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',fontWeight:600}}>
              {a.full_name?.[0]||'?'}
            </div>
            <div style={{flex:1,fontSize:'0.82rem'}}>
              <strong>{a.full_name||'System'}</strong> {a.summary}
            </div>
            <span style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>{new Date(a.created_at).toLocaleString()}</span>
          </div>
        ))}
      </div>
    )}
  </>);
}

function CalendarTab({ items, showForm, setShowForm, draft, setDraft, onCreate }) {
  return (<>
    <div style={{display:'flex',gap:8,marginBottom:14}}>
      <Button onClick={() => setShowForm(v=>!v)}>{showForm?'Cancel':'+ Schedule Content'}</Button>
    </div>
    {showForm && (
      <form onSubmit={onCreate} style={{display:'grid',gap:10,gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',marginBottom:16}}>
        <div className="field" style={{marginBottom:0}}>
          <label className="field-label">Title *</label>
          <input className="field-input" value={draft.title} onChange={e => setDraft({...draft,title:e.target.value})} required />
        </div>
        <div className="field" style={{marginBottom:0}}>
          <label className="field-label">Channel</label>
          <select className="field-input" value={draft.channel} onChange={e => setDraft({...draft,channel:e.target.value})}>
            <option value="blog">Blog</option><option value="email">Email</option><option value="social">Social Media</option><option value="sms">SMS</option>
          </select>
        </div>
        <div className="field" style={{marginBottom:0}}>
          <label className="field-label">Scheduled Date</label>
          <input className="field-input" type="datetime-local" value={draft.scheduledAt} onChange={e => setDraft({...draft,scheduledAt:e.target.value})} />
        </div>
        <Button type="submit" style={{alignSelf:'end'}}>Schedule</Button>
      </form>
    )}
    {items.length === 0
      ? <EmptyState icon="📅" title="No content scheduled" description="Plan your content across blog, email, and social channels." />
      : <div style={{display:'grid',gap:6}}>{items.map(item => (
        <div key={item.id} className="card" style={{padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontWeight:600,fontSize:'0.85rem'}}>{item.title}</div>
            <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>
              <Badge variant="neutral">{item.channel}</Badge>
              {item.scheduled_at && <span style={{marginLeft:8}}>{new Date(item.scheduled_at).toLocaleString()}</span>}
            </div>
          </div>
          <Badge variant={item.status === 'published' ? 'success' : 'warning'}>{item.status || 'draft'}</Badge>
        </div>
      ))}</div>}
  </>);
}

function LegalTemplatesTab({ templates, showForm, setShowForm, draft, setDraft, onCreate }) {
  return (<>
    <Button onClick={() => setShowForm(v=>!v)}>{showForm?'Cancel':'+ New Legal Template'}</Button>
    {showForm && (
      <form onSubmit={onCreate} style={{display:'grid',gap:10,gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',marginBottom:16}}>
        <div className="field" style={{marginBottom:0}}>
          <label className="field-label">Name *</label>
          <input className="field-input" value={draft.name} onChange={e => setDraft({...draft,name:e.target.value})} required />
        </div>
        <div className="field" style={{marginBottom:0}}>
          <label className="field-label">Type</label>
          <select className="field-input" value={draft.type} onChange={e => setDraft({...draft,type:e.target.value})}>
            <option value="nda">NDA</option><option value="contract">Contract</option><option value="tos">Terms of Service</option>
            <option value="privacy">Privacy Policy</option><option value="employment">Employment Agreement</option>
          </select>
        </div>
        <div className="field" style={{marginBottom:0,gridColumn:'1/-1'}}>
          <label className="field-label">Content (supports {`{{placeholder}}`} variables)</label>
          <textarea className="field-input" rows={8} value={draft.content} onChange={e => setDraft({...draft,content:e.target.value})} required style={{fontFamily:'monospace'}} />
        </div>
        <Button type="submit">Save Template</Button>
      </form>
    )}
    {templates.length === 0
      ? <EmptyState icon="⚖️" title="No legal templates yet" description="Create reusable legal documents with placeholder variables for names, dates, and amounts." />
      : <div style={{display:'grid',gap:6}}>{templates.map(t => (
        <div key={t.id} className="card" style={{padding:'10px 14px'}}>
          <div style={{fontWeight:600,fontSize:'0.85rem'}}>{t.name}</div>
          <div style={{display:'flex',gap:8,fontSize:'0.78rem',color:'var(--text-muted)',marginTop:4}}>
            <Badge variant="neutral">{t.type}</Badge>
            {t.placeholder_keys?.length > 0 && <span>Placeholders: {t.placeholder_keys.join(', ')}</span>}
          </div>
        </div>
      ))}</div>}
  </>);
}

function ApiKeysTab({ keys, showForm, setShowForm, newKeyName, setNewKeyName, onCreate, newKeyRevealed, setNewKeyRevealed }) {
  return (<>
    <Button onClick={() => setShowForm(v=>!v)}>{showForm?'Cancel':'+ Generate API Key'}</Button>
    {showForm && (
      <form onSubmit={onCreate} style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16,alignItems:'flex-end'}}>
        <div className="field" style={{marginBottom:0,flex:'1 1 240px'}}>
          <label className="field-label">Key Name</label>
          <input className="field-input" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="e.g. Production API" required />
        </div>
        <Button type="submit">Generate</Button>
      </form>
    )}
    {newKeyRevealed && (
      <div className="card" style={{padding:12,marginBottom:14,border:'2px solid var(--warning)'}}>
        <strong style={{color:'var(--warning)'}}>⚠️ Save this key — it won't be shown again:</strong>
        <div style={{fontFamily:'monospace',padding:'8px 10px',background:'var(--surface-muted)',borderRadius:6,marginTop:6,fontSize:'0.82rem',wordBreak:'break-all',userSelect:'all'}}>{newKeyRevealed}</div>
      </div>
    )}
    {keys.length === 0
      ? <EmptyState icon="🔑" title="No API keys" description="Generate API keys to integrate the platform's API with your external tools." />
      : <div className="table-wrap"><table className="data-table">
        <thead><tr><th>Name</th><th>Prefix</th><th>Scopes</th><th>Last used</th><th>Created</th></tr></thead>
        <tbody>{keys.map(k => (
          <tr key={k.id}><td style={{fontWeight:600}}>{k.name}</td><td style={{fontFamily:'monospace',fontSize:'0.8rem'}}>{k.key_prefix}</td>
            <td>{(k.scopes||[]).join(', ')}</td>
            <td style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>{k.last_used_at?new Date(k.last_used_at).toLocaleDateString():'Never'}</td>
            <td style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>{new Date(k.created_at).toLocaleDateString()}</td>
          </tr>
        ))}</tbody>
      </table></div>}
  </>);
}

function VulnTab({ scans, runningScan, onRunScan }) {
  return (<>
    <div style={{display:'flex',gap:8,marginBottom:14,alignItems:'center'}}>
      <Button onClick={onRunScan} disabled={runningScan}>{runningScan ? 'Scanning…' : 'Run Dependency Scan'}</Button>
      {scans.length > 0 && <Badge variant={scans[0]?.findings?.some(f=>f.severity==='critical')?'danger':'success'}>
        {scans[0]?.findings?.filter(f=>f.status !== 'resolved').length||0} unresolved
      </Badge>}
    </div>
    {scans.length === 0
      ? <EmptyState icon="🛡️" title="No vulnerability scans yet" description="Run a scan to check your workspace dependencies for known CVEs." />
      : <div style={{display:'grid',gap:8}}>{scans.map(s => (
        <div key={s.id} className="card" style={{padding:12}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
            <span style={{fontWeight:600,fontSize:'0.85rem'}}>Scan: {s.scan_type}</span>
            <Badge variant={s.status === 'completed' ? 'success' : 'warning'}>{s.status}</Badge>
          </div>
          {s.findings?.length > 0 && <div style={{display:'flex',flexDirection:'column',gap:4,marginTop:4}}>
            {s.findings.map(f => (
              <div key={f.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 10px',background:'var(--surface-muted)',borderRadius:6,fontSize:'0.8rem'}}>
                <span>
                  <Badge variant={f.severity==='critical'?'danger':f.severity==='high'?'warning':'neutral'}>{f.severity}</Badge>
                  {' '}{f.title}{f.cve_id && <span style={{fontFamily:'monospace',marginLeft:6,color:'var(--text-muted)'}}>({f.cve_id})</span>}
                </span>
                <Badge variant={f.status==='resolved'?'success':'warning'}>{f.status||'open'}</Badge>
              </div>
            ))}
          </div>}
        </div>
      ))}</div>}
  </>);
}

function IncidentsTab({ incidents, runbooks, showForm, setShowForm, draft, setDraft, onCreate }) {
  return (<>
    <div style={{display:'flex',gap:8,marginBottom:14}}>
      <Button onClick={() => setShowForm(v=>!v)}>{showForm?'Cancel':'+ Log Incident'}</Button>
    </div>
    {showForm && (
      <form onSubmit={onCreate} style={{display:'grid',gap:10,gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',marginBottom:16}}>
        <div className="field" style={{marginBottom:0}}>
          <label className="field-label">Title *</label>
          <input className="field-input" value={draft.title} onChange={e => setDraft({...draft,title:e.target.value})} required />
        </div>
        <div className="field" style={{marginBottom:0}}>
          <label className="field-label">Severity</label>
          <select className="field-input" value={draft.severity} onChange={e => setDraft({...draft,severity:e.target.value})}>
            <option value="critical">Critical</option><option value="high">High</option>
            <option value="medium">Medium</option><option value="low">Low</option>
          </select>
        </div>
        <div className="field" style={{marginBottom:0,gridColumn:'1/-1'}}>
          <label className="field-label">Description</label>
          <textarea className="field-input" rows={3} value={draft.description} onChange={e => setDraft({...draft,description:e.target.value})} />
        </div>
        <Button type="submit">Log Incident</Button>
      </form>
    )}
    {incidents.length === 0
      ? <EmptyState icon="🚨" title="No incidents" description="Security incident response tracking with timeline and resolution workflow." />
      : <div style={{display:'grid',gap:8}}>{incidents.map(inc => (
        <div key={inc.id} className="card" style={{padding:12}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
            <div>
              <div style={{fontWeight:600,fontSize:'0.88rem'}}>{inc.title}</div>
              <div style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>
                {new Date(inc.detected_at).toLocaleString()} · {inc.description?.slice(0,80)}
              </div>
            </div>
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <Badge variant={inc.severity==='critical'?'danger':inc.severity==='high'?'warning':'neutral'}>{inc.severity}</Badge>
              <Badge variant={inc.status==='resolved'?'success':inc.status==='investigating'?'warning':'neutral'}>{inc.status}</Badge>
            </div>
          </div>
          {inc.timeline?.length > 0 && (
            <div style={{marginTop:8,borderLeft:'2px solid var(--border)',paddingLeft:12,display:'flex',flexDirection:'column',gap:3}}>
              {inc.timeline.map(t => (
                <div key={t.id} style={{fontSize:'0.78rem'}}>
                  <span style={{color:'var(--text-muted)'}}>{new Date(t.created_at).toLocaleTimeString()}</span>
                  {' '}{t.action}{t.note && <span style={{color:'var(--text-muted)'}}> — {t.note}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}</div>}
  </>);
}
