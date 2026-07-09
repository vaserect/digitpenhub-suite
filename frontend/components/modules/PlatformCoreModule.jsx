'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import Badge from '../ui/Badge';
import { SkeletonRows } from '../ui/Skeleton';

export default function PlatformCoreModule({ goHome }) {
  const [tab, setTab] = useState('fields');
  const [fields, setFields] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(null);
  const [fieldDraft, setFieldDraft] = useState({ recordType: 'contact', name: '', type: 'text', required: false });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [f, i, n] = await Promise.all([
        apiFetch('/api/v1/custom-fields/contact'),
        apiFetch('/api/v1/inbox'),
        apiFetch('/api/v1/notifications'),
      ]);
      setFields(f.fields || []);
      setInbox(i.messages || i.conversations || i.inbox || []);
      setNotifications(n.notifications || []);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createField(e) {
    e.preventDefault();
    try {
      await apiFetch(`/api/v1/custom-fields/${fieldDraft.recordType}`, { method: 'POST', body: JSON.stringify(fieldDraft) });
      toast.success('Custom field created');
      setShowForm(null); setFieldDraft({ recordType: 'contact', name: '', type: 'text', required: false }); load();
    } catch (err) { toast.error(err.message); }
  }

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head"><h1>Platform Core</h1><p className="module-sub">Custom fields, unified inbox, notifications, permissions, and more.</p></div>
      <div className="invoice-tabs" style={{ marginBottom: 16 }}>
        {[{ k: 'fields', l: 'Custom Fields' }, { k: 'inbox', l: 'Inbox' }, { k: 'notifs', l: 'Notifications' }].map(t => (
          <button key={t.k} className={`invoice-tab${tab===t.k?' active':''}`} onClick={() => setTab(t.k)}>{t.l}</button>
        ))}
      </div>
      {loading ? <SkeletonRows rows={4} /> : (
        <>
          {tab === 'fields' && (
            <>
              <Button onClick={() => setShowForm('field')}>+ New Field</Button>
              <Modal isOpen={showForm === 'field'} title="Add Custom Field" onClose={() => setShowForm(null)}>
                <form onSubmit={createField}>
                  <div className="field"><label className="field-label">Record Type</label>
                    <select className="field-input" value={fieldDraft.recordType} onChange={e => setFieldDraft({...fieldDraft,recordType:e.target.value})}>
                      <option value="contact">Contact</option><option value="invoice">Invoice</option><option value="deal">Deal</option><option value="lead">Lead</option><option value="product">Product</option>
                    </select>
                  </div>
                  <div className="field"><label className="field-label">Name</label><input className="field-input" value={fieldDraft.name} onChange={e => setFieldDraft({...fieldDraft,name:e.target.value})} required /></div>
                  <div className="field"><label className="field-label">Type</label>
                    <select className="field-input" value={fieldDraft.type} onChange={e => setFieldDraft({...fieldDraft,type:e.target.value})}>
                      <option value="text">Text</option><option value="number">Number</option><option value="date">Date</option><option value="select">Dropdown</option><option value="checkbox">Checkbox</option>
                    </select>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <input type="checkbox" checked={fieldDraft.required} onChange={e => setFieldDraft({...fieldDraft,required:e.target.checked})} /> Required
                  </label>
                  <Button type="submit">Create</Button>
                </form>
              </Modal>
              {fields.length === 0 ? <EmptyState icon="🏷️" title="No custom fields yet" action={<Button onClick={() => setShowForm('field')}>+ New Field</Button>} /> : (
                <div className="table-wrap"><table className="data-table">
                  <thead><tr><th>Name</th><th>Type</th><th>Required</th></tr></thead>
                  <tbody>{fields.map(f => (
                    <tr key={f.id}><td style={{ fontWeight: 600 }}>{f.name}</td><td><Badge variant="neutral">{f.field_type || f.type}</Badge></td><td>{f.required ? '✅' : '—'}</td></tr>
                  ))}</tbody>
                </table></div>
              )}
            </>
          )}
          {tab === 'inbox' && (
            inbox.length === 0 ? <EmptyState icon="📨" title="Inbox empty" description="Messages from email, SMS, WhatsApp, and chat appear here." /> : (
              <div style={{ display: 'grid', gap: 8 }}>{inbox.map((m, i) => (
                <div key={m.id || i} className="card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{m.subject || m.from || 'Message'}</div><div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{m.preview || m.body?.slice(0, 80) || ''}</div></div>
                  <Badge variant={m.channel || 'neutral'}>{m.channel || 'email'}</Badge>
                </div>
              ))}</div>
            )
          )}
          {tab === 'notifs' && (
            notifications.length === 0 ? <EmptyState icon="🔔" title="No notifications yet" /> : (
              <div style={{ display: 'grid', gap: 6 }}>{notifications.map((n, i) => (
                <div key={n.id || i} className="card" style={{ padding: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.read_at ? 'var(--border)' : 'var(--primary)' }} />
                  <div style={{ flex: 1, fontSize: '0.85rem' }}>{n.title || n.message}</div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}</span>
                </div>
              ))}</div>
            )
          )}
        </>
      )}
    </div>
  );
}
