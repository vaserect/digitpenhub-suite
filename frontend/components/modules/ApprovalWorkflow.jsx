'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import Badge from '../ui/Badge';
import { SkeletonRows } from '../ui/Skeleton';

const STATUS_COLORS = {
  pending: 'var(--warning)',
  approved: 'var(--success)',
  rejected: 'var(--danger)',
  cancelled: 'var(--text-muted)',
};

export default function ApprovalModule({ goHome }) {
  const [tab, setTab] = useState('pending');
  const [requests, setRequests] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showTplForm, setShowTplForm] = useState(false);
  const [tplDraft, setTplDraft] = useState({ name: '', resourceType: 'invoice', steps: [{ order: 0, type: 'any', approverUserIds: [], deadlineHours: 48 }] });
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [reqDraft, setReqDraft] = useState({ resourceType: 'invoice', resourceId: '', title: '', templateId: '' });

  async function load() {
    setLoading(true);
    try {
      const [r, t] = await Promise.all([
        apiFetch('/api/v1/approvals/requests'),
        apiFetch('/api/v1/approvals/templates'),
      ]);
      setRequests(r.requests || []);
      setTemplates(t.templates || []);
    } catch { toast.error('Failed to load approvals'); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = requests.filter((r) => tab === 'all' || r.status === tab);

  async function handleCreateTemplate(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/approvals/templates', {
        method: 'POST',
        body: JSON.stringify(tplDraft),
      });
      toast.success('Template created');
      setShowTplForm(false);
      load();
    } catch (err) { toast.error(err.message); }
  }

  async function handleSubmitRequest(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/approvals/requests', {
        method: 'POST',
        body: JSON.stringify(reqDraft),
      });
      toast.success('Approval request submitted');
      setShowNewRequest(false);
      setReqDraft({ resourceType: 'invoice', resourceId: '', title: '', templateId: '' });
      load();
    } catch (err) { toast.error(err.message); }
  }

  async function handleAction(requestId, action) {
    try {
      await apiFetch(`/api/v1/approvals/requests/${requestId}/action`, {
        method: 'POST',
        body: JSON.stringify({ action, comment: '' }),
      });
      toast.success(action === 'approve' ? 'Approved!' : 'Rejected.');
      setSelected(null);
      load();
    } catch (err) { toast.error(err.message); }
  }

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <div>
          <h1>Approval Workflow</h1>
          <p className="module-sub">Review and manage approval requests across invoices, expenses, contracts, and more.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={() => setShowNewRequest(true)}>+ New request</Button>
          <Button variant="secondary" onClick={() => setShowTplForm(true)}>Manage templates</Button>
        </div>
      </div>

      <div className="invoice-tabs" style={{ marginBottom: 20 }}>
        {['pending', 'approved', 'rejected', 'cancelled', 'all'].map((t) => (
          <button key={t} className={`invoice-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <SkeletonRows rows={4} /> : filtered.length === 0 ? (
        <EmptyState icon="✅" title="No requests" description={tab === 'pending' ? 'No pending approval requests.' : 'No requests match this filter.'} />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map((req) => (
            <div key={req.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelected(req)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{req.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {req.resource_type} · {new Date(req.submitted_at).toLocaleDateString()}
                  </div>
                </div>
                <Badge variant={req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'danger' : req.status === 'pending' ? 'warning' : 'neutral'}>
                  {req.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Detail Modal */}
      {selected && (
        <Modal isOpen title={selected.title} description={`${selected.resource_type} · submitted ${new Date(selected.submitted_at).toLocaleString()}`} onClose={() => setSelected(null)}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>Steps</div>
            {(selected.steps || []).map((step, i) => (
              <div key={step.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--surface-muted)', borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
                <span>Step {i + 1}: {step.step_type} approval</span>
                <span style={{ color: STATUS_COLORS[step.status] || 'var(--text-muted)', fontWeight: 600 }}>{step.status}</span>
              </div>
            ))}
          </div>
          {selected.status === 'pending' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => handleAction(selected.id, 'approve')}>Approve</Button>
              <Button variant="secondary" onClick={() => handleAction(selected.id, 'reject')}>Reject</Button>
            </div>
          )}
        </Modal>
      )}

      {/* New Template Modal */}
      <Modal isOpen={showTplForm} title="Create approval template" onClose={() => setShowTplForm(false)}>
        <form onSubmit={handleCreateTemplate}>
          <div className="field">
            <label className="field-label">Template name</label>
            <input className="field-input" value={tplDraft.name} onChange={(e) => setTplDraft({ ...tplDraft, name: e.target.value })} required />
          </div>
          <div className="field">
            <label className="field-label">Resource type</label>
            <select className="field-input" value={tplDraft.resourceType} onChange={(e) => setTplDraft({ ...tplDraft, resourceType: e.target.value })}>
              <option value="invoice">Invoice</option>
              <option value="expense">Expense</option>
              <option value="contract">Contract</option>
              <option value="page">Page publish</option>
            </select>
          </div>
          <div className="field">
            <label className="field-label">Steps</label>
            {tplDraft.steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                <select value={step.type} onChange={(e) => { const s = [...tplDraft.steps]; s[i].type = e.target.value; setTplDraft({ ...tplDraft, steps: s }); }}>
                  <option value="any">Any approver</option>
                  <option value="all">All approvers</option>
                </select>
                <input type="number" value={step.deadlineHours} onChange={(e) => { const s = [...tplDraft.steps]; s[i].deadlineHours = parseInt(e.target.value); setTplDraft({ ...tplDraft, steps: s }); }} style={{ width: 60 }} placeholder="Hours" />
              </div>
            ))}
            <button type="button" className="ctag" onClick={() => setTplDraft({ ...tplDraft, steps: [...tplDraft.steps, { order: tplDraft.steps.length, type: 'any', approverUserIds: [], deadlineHours: 48 }] })}>+ Add step</button>
          </div>
          <Button type="submit">Create template</Button>
        </form>
      </Modal>

      {/* New Request Modal */}
      <Modal isOpen={showNewRequest} title="New approval request" onClose={() => setShowNewRequest(false)}>
        <form onSubmit={handleSubmitRequest}>
          <div className="field">
            <label className="field-label">Title</label>
            <input className="field-input" value={reqDraft.title} onChange={(e) => setReqDraft({ ...reqDraft, title: e.target.value })} required />
          </div>
          <div className="field">
            <label className="field-label">Resource type</label>
            <select className="field-input" value={reqDraft.resourceType} onChange={(e) => setReqDraft({ ...reqDraft, resourceType: e.target.value })}>
              <option value="invoice">Invoice</option>
              <option value="expense">Expense</option>
              <option value="contract">Contract</option>
            </select>
          </div>
          <div className="field">
            <label className="field-label">Resource ID</label>
            <input className="field-input" value={reqDraft.resourceId} onChange={(e) => setReqDraft({ ...reqDraft, resourceId: e.target.value })} placeholder="Record ID" />
          </div>
          <div className="field">
            <label className="field-label">Template (optional)</label>
            <select className="field-input" value={reqDraft.templateId} onChange={(e) => setReqDraft({ ...reqDraft, templateId: e.target.value })}>
              <option value="">Manual steps</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <Button type="submit">Submit</Button>
        </form>
      </Modal>
    </div>
  );
}
