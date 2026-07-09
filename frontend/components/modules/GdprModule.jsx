'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';
import Badge from '../ui/Badge';

export default function GdprModule({ goHome }) {
  const [requests, setRequests] = useState([]);
  const [consent, setConsent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('requests');
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ requesterEmail: '', requestType: 'access', details: '' });
  const [showConsentForm, setShowConsentForm] = useState(false);
  const [consentDraft, setConsentDraft] = useState({ subjectType: 'contact', subjectId: '', purpose: '', granted: true });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, c] = await Promise.all([
        apiFetch('/api/v1/gdpr/requests'),
        apiFetch('/api/v1/gdpr/consent'),
      ]);
      setRequests(r.requests || []);
      setConsent(c.consent || []);
    } catch { toast.error('Failed to load GDPR data'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createRequest(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/gdpr/requests', { method: 'POST', body: JSON.stringify(draft) });
      toast.success('Request submitted');
      setShowForm(false);
      setDraft({ requesterEmail: '', requestType: 'access', details: '' });
      load();
    } catch (err) { toast.error(err.message); }
  }

  async function updateStatus(id, status) {
    try {
      await apiFetch(`/api/v1/gdpr/requests/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      toast.success(`Request ${status}`);
      load();
    } catch { toast.error('Failed to update'); }
  }

  async function createConsent(e) {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/gdpr/consent', { method: 'POST', body: JSON.stringify(consentDraft) });
      toast.success('Consent recorded');
      setShowConsentForm(false);
      setConsentDraft({ subjectType: 'contact', subjectId: '', purpose: '', granted: true });
      load();
    } catch (err) { toast.error(err.message); }
  }

  const typeLabels = {
    access: '🔍 Access',
    rectification: '✏️ Rectification',
    erasure: '🗑 Erasure',
    portability: '📦 Portability',
    restrict: '⏸ Restrict',
  };

  const statusColors = { pending: 'var(--warning)', processing: 'var(--primary)', completed: 'var(--success)', rejected: 'var(--danger)' };

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <div>
          <h1>GDPR &amp; Consent Management</h1>
          <p className="module-sub">Manage data subject requests and consent records.</p>
        </div>
      </div>

      <div className="invoice-tabs" style={{ marginBottom: 16 }}>
        <button className={`invoice-tab${tab === 'requests' ? ' active' : ''}`} onClick={() => setTab('requests')}>Requests</button>
        <button className={`invoice-tab${tab === 'consent' ? ' active' : ''}`} onClick={() => setTab('consent')}>Consent Records</button>
      </div>

      {tab === 'requests' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button onClick={() => setShowForm(true)}>+ New Request</Button>
          </div>

          <Modal isOpen={showForm} title="New GDPR Request" onClose={() => setShowForm(false)}>
            <form onSubmit={createRequest}>
              <div className="field">
                <label className="field-label">Requester email *</label>
                <input className="field-input" type="email" value={draft.requesterEmail} onChange={(e) => setDraft({ ...draft, requesterEmail: e.target.value })} required />
              </div>
              <div className="field">
                <label className="field-label">Request type *</label>
                <select className="field-input" value={draft.requestType} onChange={(e) => setDraft({ ...draft, requestType: e.target.value })}>
                  {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field-label">Details</label>
                <textarea className="field-input" value={draft.details} onChange={(e) => setDraft({ ...draft, details: e.target.value })} rows={3} />
              </div>
              <Button type="submit">Submit Request</Button>
            </form>
          </Modal>

          {loading ? <SkeletonRows rows={4} /> : requests.length === 0 ? (
            <EmptyState icon="🛡️" title="No GDPR requests yet" description="Manage data subject requests for access, erasure, portability, and more." action={<Button onClick={() => setShowForm(true)}>+ New Request</Button>} />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Email</th><th>Type</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td>{r.requester_email}</td>
                      <td>{typeLabels[r.request_type] || r.request_type}</td>
                      <td><span style={{ color: statusColors[r.status], fontWeight: 600 }}>{r.status}</span></td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {r.status === 'pending' && <Button variant="ghost" size="sm" onClick={() => updateStatus(r.id, 'processing')}>Process</Button>}
                          {r.status === 'processing' && <><Button variant="ghost" size="sm" onClick={() => updateStatus(r.id, 'completed')}>Complete</Button><Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }} onClick={() => updateStatus(r.id, 'rejected')}>Reject</Button></>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'consent' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button onClick={() => setShowConsentForm(true)}>+ Record Consent</Button>
          </div>

          <Modal isOpen={showConsentForm} title="Record Consent" onClose={() => setShowConsentForm(false)}>
            <form onSubmit={createConsent}>
              <div className="field">
                <label className="field-label">Subject type</label>
                <select className="field-input" value={consentDraft.subjectType} onChange={(e) => setConsentDraft({ ...consentDraft, subjectType: e.target.value })}>
                  <option value="contact">Contact</option>
                  <option value="user">User</option>
                  <option value="lead">Lead</option>
                </select>
              </div>
              <div className="field">
                <label className="field-label">Subject ID</label>
                <input className="field-input" value={consentDraft.subjectId} onChange={(e) => setConsentDraft({ ...consentDraft, subjectId: e.target.value })} required />
              </div>
              <div className="field">
                <label className="field-label">Purpose</label>
                <input className="field-input" value={consentDraft.purpose} onChange={(e) => setConsentDraft({ ...consentDraft, purpose: e.target.value })} placeholder="e.g. email marketing" required />
              </div>
              <div className="field">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={consentDraft.granted} onChange={(e) => setConsentDraft({ ...consentDraft, granted: e.target.checked })} />
                  Granted
                </label>
              </div>
              <Button type="submit">Record</Button>
            </form>
          </Modal>

          {loading ? <SkeletonRows rows={4} /> : consent.length === 0 ? (
            <EmptyState icon="📋" title="No consent records yet" description="Record consent given by contacts, users, or leads." action={<Button onClick={() => setShowConsentForm(true)}>+ Record Consent</Button>} />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Purpose</th><th>Subject</th><th>Status</th><th>Given</th><th>Expires</th></tr></thead>
                <tbody>
                  {consent.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.purpose}</td>
                      <td style={{ fontSize: '0.8rem' }}>{c.subject_type}:{c.subject_id}</td>
                      <td><Badge variant={c.granted ? 'success' : 'danger'}>{c.granted ? 'Granted' : 'Withdrawn'}</Badge></td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(c.granted_at).toLocaleDateString()}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
