'use client'
import KanbanBoard from '../ui/KanbanBoard';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { SkeletonRows } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import SearchInput from '../ui/SearchInput';
import Pagination from '../ui/Pagination';
import ConfirmDialog from '../ui/ConfirmDialog';
import Modal from '../ui/Modal';
import Tooltip from '../ui/Tooltip';
import CustomFieldValues from '../ui/CustomFieldValues';
import { useHotkey, useSearchHotkey } from '../../lib/hotkeys';

const CRM_PAGE_SIZE = 10;
const STAGES = ['new', 'contacted', 'proposal_sent', 'won', 'lost'];

export default function CRMModule({ goHome, showToast }) {
  const [crmLoaded, setCrmLoaded] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactCounts, setContactCounts] = useState({});
  const [showContactForm, setShowContactForm] = useState(false);
  const [newContact, setNewContact] = useState({ fullName: '', company: '', email: '', phone: '', stage: 'new', valueNgn: '' });
  const [editingContactId, setEditingContactId] = useState(null);
  const [editContactDraft, setEditContactDraft] = useState({ fullName: '', company: '', email: '', phone: '', valueNgn: '' });
  const [crmQuery, setCrmQuery] = useState('');
  const [crmStageFilter, setCrmStageFilter] = useState('all');
  const [crmSort, setCrmSort] = useState({ key: 'last_touch_at', dir: 'desc' });
  const [crmPage, setCrmPage] = useState(1);
  const [crmSelected, setCrmSelected] = useState([]);
  const [crmConfirmDelete, setCrmConfirmDelete] = useState(null);
  const [crmDeleting, setCrmDeleting] = useState(false);
  const [crmDetailContact, setCrmDetailContact] = useState(null);
  const [crmDetailNotes, setCrmDetailNotes] = useState([]);
  const [crmDetailTasks, setCrmDetailTasks] = useState([]);
  const [crmDetailLoaded, setCrmDetailLoaded] = useState(false);
  const [crmNewNote, setCrmNewNote] = useState('');
  const [crmNewTask, setCrmNewTask] = useState({ title: '', dueDate: '' });
  const [crmFieldDefs, setCrmFieldDefs] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [crmTagInput, setCrmTagInput] = useState('');
  const [crmImporting, setCrmImporting] = useState(false);

  useSearchHotkey();
  useHotkey('n', () => { setShowContactForm(true); });

  useEffect(() => { if (!crmLoaded) loadCrm().catch((e) => console.error(e)); }, []);

  async function loadCrm() {
    const data = await apiFetch('/api/v1/crm/contacts');
    setContacts(data.contacts || []);
    setContactCounts(data.counts || {});
    setCrmLoaded(true);
  }

  async function handleAddContact(e) {
    e.preventDefault();
    if (!newContact.fullName.trim()) return;
    await apiFetch('/api/v1/crm/contacts', {
      method: 'POST',
      body: JSON.stringify({
        fullName: newContact.fullName,
        company: newContact.company,
        email: newContact.email,
        phone: newContact.phone,
        stage: newContact.stage,
        valueNgn: Number(newContact.valueNgn) || 0,
      }),
    });
    setNewContact({ fullName: '', company: '', email: '', phone: '', stage: 'new', valueNgn: '' });
    setShowContactForm(false);
    showToast('Contact added.');
    await loadCrm();
  }

  async function handleStageChange(contactId, stage) {
    await apiFetch(`/api/v1/crm/contacts/${contactId}`, { method: 'PATCH', body: JSON.stringify({ stage }) });
    await loadCrm();
  }

  function startEditContact(c) {
    setEditingContactId(c.id);
    setEditContactDraft({
      fullName: c.full_name,
      company: c.company || '',
      email: c.email || '',
      phone: c.phone || '',
      valueNgn: c.value_ngn,
    });
  }

  async function handleSaveContact(e) {
    e.preventDefault();
    await apiFetch(`/api/v1/crm/contacts/${editingContactId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fullName: editContactDraft.fullName,
        company: editContactDraft.company,
        email: editContactDraft.email,
        phone: editContactDraft.phone,
        valueNgn: Number(editContactDraft.valueNgn) || 0,
      }),
    });
    setEditingContactId(null);
    await loadCrm();
  }

  async function handleDeleteContact(id) {
    setCrmConfirmDelete({ id });
  }

  async function confirmCrmDelete() {
    if (!crmConfirmDelete) return;
    setCrmDeleting(true);
    try {
      if (crmConfirmDelete.bulk) {
        await Promise.all(crmSelected.map((id) => apiFetch(`/api/v1/crm/contacts/${id}`, { method: 'DELETE' })));
        showToast(`${crmSelected.length} contact${crmSelected.length === 1 ? '' : 's'} deleted.`);
        setCrmSelected([]);
      } else {
        await apiFetch(`/api/v1/crm/contacts/${crmConfirmDelete.id}`, { method: 'DELETE' });
        showToast('Contact deleted.');
      }
      await loadCrm();
    } finally {
      setCrmDeleting(false);
      setCrmConfirmDelete(null);
    }
  }

  function toggleCrmSelect(id) {
    setCrmSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function handleCrmSort(key) {
    setCrmSort((prev) => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  }

  function handleCrmImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCrmImporting(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const lines = String(reader.result).split(/\r?\n/).filter(Boolean);
        const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
        const rows = lines.slice(1).map((line) => {
          const cells = line.split(',');
          const obj = {};
          header.forEach((h, i) => { obj[h] = (cells[i] || '').trim(); });
          return { fullName: obj.fullname || obj.name, email: obj.email, phone: obj.phone, company: obj.company };
        });
        const data = await apiFetch('/api/v1/crm/contacts/import', { method: 'POST', body: JSON.stringify({ contacts: rows }) });
        if (data.error) { showToast(data.error); return; }
        showToast(`Imported ${data.imported}, skipped ${data.duplicate} duplicates, ${data.invalid} invalid.`);
        await loadCrm();
      } finally {
        setCrmImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  function exportCrmCsv(rows) {
    const header = ['Full name', 'Company', 'Email', 'Phone', 'Stage', 'Value (NGN)', 'Last touch'];
    const csvRows = rows.map((c) => [c.full_name, c.company || '', c.email || '', c.phone || '', c.stage, c.value_ngn, c.last_touch_at]
      .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
    const csv = [header.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `crm-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function openCrmDetail(contact) {
  async function loadFieldDefs() {
    try {
      const data = await apiFetch("/api/v1/crm/custom-fields?recordType=crm_contact");
      setCrmFieldDefs(data.fields || []);
    } catch (err) { console.error("Failed to load custom fields:", err); }
  }
    loadFieldDefs();
    setCrmDetailContact(contact);
    setCrmDetailLoaded(false);
    const [n, t] = await Promise.all([
      apiFetch(`/api/v1/crm/contacts/${contact.id}/notes`),
      apiFetch(`/api/v1/crm/contacts/${contact.id}/tasks`),
    ]);
    setCrmDetailNotes(n.notes || []);
    setCrmDetailTasks(t.tasks || []);
    setCrmDetailLoaded(true);
  }

  async function handleAddCrmNote(e) {
    e.preventDefault();
    if (!crmNewNote.trim() || !crmDetailContact) return;
    const data = await apiFetch(`/api/v1/crm/contacts/${crmDetailContact.id}/notes`, { method: 'POST', body: JSON.stringify({ body: crmNewNote.trim() }) });
    if (data.error) { showToast(data.error); return; }
    setCrmDetailNotes((prev) => [data.note, ...prev]);
    setCrmNewNote('');
  }

  async function handleDeleteCrmNote(noteId) {
    if (!crmDetailContact) return;
    await apiFetch(`/api/v1/crm/contacts/${crmDetailContact.id}/notes/${noteId}`, { method: 'DELETE' });
    setCrmDetailNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  async function handleAddCrmTask(e) {
    e.preventDefault();
    if (!crmNewTask.title.trim() || !crmDetailContact) return;
    const data = await apiFetch(`/api/v1/crm/contacts/${crmDetailContact.id}/tasks`, { method: 'POST', body: JSON.stringify(crmNewTask) });
    if (data.error) { showToast(data.error); return; }
    setCrmDetailTasks((prev) => [...prev, data.task]);
    setCrmNewTask({ title: '', dueDate: '' });
  }

  async function handleToggleCrmTask(task) {
    if (!crmDetailContact) return;
    const data = await apiFetch(`/api/v1/crm/contacts/${crmDetailContact.id}/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify({ status: task.status === 'done' ? 'open' : 'done' }) });
    if (data.task) setCrmDetailTasks((prev) => prev.map((t) => t.id === task.id ? data.task : t));
  }

  async function handleDeleteCrmTask(taskId) {
    if (!crmDetailContact) return;
    await apiFetch(`/api/v1/crm/contacts/${crmDetailContact.id}/tasks/${taskId}`, { method: 'DELETE' });
    setCrmDetailTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  async function handleAddCrmTag(e) {
    e.preventDefault();
    if (!crmTagInput.trim() || !crmDetailContact) return;
    const nextTags = Array.from(new Set([...(crmDetailContact.tags || []), crmTagInput.trim()]));
    const data = await apiFetch(`/api/v1/crm/contacts/${crmDetailContact.id}`, { method: 'PATCH', body: JSON.stringify({ tags: nextTags }) });
    if (data.contact) {
      setCrmDetailContact(data.contact);
      setContacts((prev) => prev.map((c) => c.id === data.contact.id ? data.contact : c));
    }
    setCrmTagInput('');
  }

  async function handleRemoveCrmTag(tag) {
    if (!crmDetailContact) return;
    const nextTags = (crmDetailContact.tags || []).filter((t) => t !== tag);
    const data = await apiFetch(`/api/v1/crm/contacts/${crmDetailContact.id}`, { method: 'PATCH', body: JSON.stringify({ tags: nextTags }) });
    if (data.contact) {
      setCrmDetailContact(data.contact);
      setContacts((prev) => prev.map((c) => c.id === data.contact.id ? data.contact : c));
    }
  }

  const crmFilteredSorted = useMemo(() => {
    const q = crmQuery.trim().toLowerCase();
    let rows = contacts.filter((c) => {
      if (crmStageFilter !== 'all' && c.stage !== crmStageFilter) return false;
      if (!q) return true;
      return [c.full_name, c.company, c.email, c.phone].some((f) => (f || '').toLowerCase().includes(q));
    });
    const { key, dir } = crmSort;
    rows = [...rows].sort((a, b) => {
      let av = a[key], bv = b[key];
      if (key === 'value_ngn') { av = Number(av) || 0; bv = Number(bv) || 0; }
      else if (key === 'last_touch_at') { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
      else { av = (av || '').toString().toLowerCase(); bv = (bv || '').toString().toLowerCase(); }
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [contacts, crmQuery, crmStageFilter, crmSort]);

  const crmPageCount = Math.max(1, Math.ceil(crmFilteredSorted.length / CRM_PAGE_SIZE));
  const crmPageRows = crmFilteredSorted.slice((crmPage - 1) * CRM_PAGE_SIZE, crmPage * CRM_PAGE_SIZE);

  useEffect(() => { setCrmPage(1); }, [crmQuery, crmStageFilter]);
  useEffect(() => { if (crmPage > crmPageCount) setCrmPage(crmPageCount); }, [crmPageCount]);

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <div><h1>CRM</h1><p className="module-sub">Contacts and deals in one pipeline. Part of Marketing.</p></div>
        <Button onClick={() => setShowContactForm((v) => !v)}>+ Add contact</Button>
      </div>

      {showContactForm && (
        <Card style={{ marginBottom: 18 }}>
          <form onSubmit={handleAddContact} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="field" style={{ marginBottom: 0, flex: '1 1 160px' }}>
              <label className="field-label">Full name</label>
              <input className="field-input" value={newContact.fullName} onChange={(e) => setNewContact({ ...newContact, fullName: e.target.value })} required autoFocus />
            </div>
            <div className="field" style={{ marginBottom: 0, flex: '1 1 150px' }}>
              <label className="field-label">Company</label>
              <input className="field-input" value={newContact.company} onChange={(e) => setNewContact({ ...newContact, company: e.target.value })} />
            </div>
            <div className="field" style={{ marginBottom: 0, flex: '1 1 170px' }}>
              <label className="field-label">Email</label>
              <input className="field-input" type="email" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} />
            </div>
            <div className="field" style={{ marginBottom: 0, flex: '1 1 140px' }}>
              <label className="field-label">Phone</label>
              <input className="field-input" value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} />
            </div>
            <div className="field" style={{ marginBottom: 0, flex: '0 1 150px' }}>
              <label className="field-label">Stage</label>
              <select className="field-select" value={newContact.stage} onChange={(e) => setNewContact({ ...newContact, stage: e.target.value })}>
                {STAGES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0, flex: '0 1 130px' }}>
              <label className="field-label">Value (₦)</label>
              <input className="field-input" type="number" min="0" value={newContact.valueNgn} onChange={(e) => setNewContact({ ...newContact, valueNgn: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="submit">Save contact</Button>
              <Button type="button" variant="secondary" onClick={() => setShowContactForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="stage-strip">
        <div className="stage-card"><div className="num">{contactCounts.new || 0}</div><div className="lbl">New</div></div>
        <div className="stage-card"><div className="num">{contactCounts.contacted || 0}</div><div className="lbl">Contacted</div></div>
        <div className="stage-card"><div className="num">{contactCounts.proposal_sent || 0}</div><div className="lbl">Proposal sent</div></div>
        <div className="stage-card"><div className="num">{contactCounts.won || 0}</div><div className="lbl">Won</div></div>
      </div>

      {crmLoaded && contacts.length > 0 && (
        <div className="toolbar-row" style={{ marginTop: 18 }}>
          <SearchInput value={crmQuery} onChange={(e) => setCrmQuery(e.target.value)} placeholder="Search contacts by name, company, email, phone…" />
          <select className="toolbar-select" value={crmStageFilter} onChange={(e) => setCrmStageFilter(e.target.value)}>
            <option value="all">All stages</option>
            {STAGES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
          </select>
          <Tooltip label="Export the current view to CSV">
            <Button variant="secondary" size="sm" onClick={() => exportCrmCsv(crmFilteredSorted)}>Export CSV</Button>
          </Tooltip>
          <Tooltip label="Import contacts from a CSV file (columns: fullName, email, phone, company)">
          <Tooltip label="Switch between list and kanban view">
            <Button variant="secondary" size="sm" onClick={() => setViewMode(viewMode === "list" ? "kanban" : "list")}>
              {viewMode === "list" ? "Kanban Board" : "List View"}
            </Button>
          </Tooltip>
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
              {crmImporting ? 'Importing…' : 'Import CSV'}
              <input type="file" accept=".csv,text/csv" onChange={handleCrmImportFile} disabled={crmImporting} style={{ display: 'none' }} />
            </label>
          </Tooltip>
        </div>
      )}

      {crmSelected.length > 0 && (
        <div className="bulk-bar">
          <span>{crmSelected.length} contact{crmSelected.length === 1 ? '' : 's'} selected</span>
          <div className="bulk-bar-actions">
            <Button variant="danger" size="sm" onClick={() => setCrmConfirmDelete({ bulk: true })}>Delete selected</Button>
            <Button variant="ghost" size="sm" onClick={() => setCrmSelected([])}>Clear</Button>
          </div>
        </div>
      )}

      {!crmLoaded ? (
        <Card><SkeletonRows rows={5} /></Card>
      ) : contacts.length === 0 ? (
        <Card>
          <EmptyState
            icon="👤"
            title="No contacts yet"
            description="Add your first contact to start tracking deals through your pipeline."
            action={<Button onClick={() => setShowContactForm(true)}>+ Add contact</Button>}
          />
        </Card>
      ) : crmFilteredSorted.length === 0 ? (
        <Card>
          <EmptyState
            icon="🔍"
            title="No matching contacts"
            description="Try a different search term or clear the stage filter."
            action={<Button variant="secondary" onClick={() => { setCrmQuery(''); setCrmStageFilter('all'); }}>Clear filters</Button>}
          />
        </Card>
      ) : viewMode === "kanban" ? (
        <KanbanBoard contacts={crmFilteredSorted} onRefresh={loadCrm} showToast={showToast} />
      ) : (
        <>
        <div className="table-wrap">
          <table className="contacts">
              <thead>
                <tr>
                  <th style={{ width: 32 }}>
                    <input
                      type="checkbox"
                      className="row-checkbox"
                      checked={crmPageRows.length > 0 && crmPageRows.every((c) => crmSelected.includes(c.id))}
                      onChange={(e) => {
                        const ids = crmPageRows.map((c) => c.id);
                        setCrmSelected((prev) => e.target.checked ? Array.from(new Set([...prev, ...ids])) : prev.filter((id) => !ids.includes(id)));
                      }}
                      aria-label="Select all on this page"
                    />
                  </th>
                  {[
                    { key: 'full_name', label: 'Contact' },
                    { key: 'company', label: 'Company' },
                    { key: 'stage', label: 'Stage' },
                    { key: 'value_ngn', label: 'Value' },
                    { key: 'last_touch_at', label: 'Last touch' },
                  ].map((col) => (
                    <th key={col.key}>
                      <span className={["th-sort", crmSort.key === col.key ? 'active' : ''].join(' ')} onClick={() => handleCrmSort(col.key)}>
                        {col.label}
                        <span className="sort-caret">{crmSort.key === col.key ? (crmSort.dir === 'asc' ? '▲' : '▼') : '▲▼'}</span>
                      </span>
                    </th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {crmPageRows.map((c) => editingContactId === c.id ? (
                  <tr key={c.id}>
                    <td colSpan={7}>
                      <form onSubmit={handleSaveContact} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: '4px 0' }}>
                        <input className="field-input" value={editContactDraft.fullName} onChange={(e) => setEditContactDraft({ ...editContactDraft, fullName: e.target.value })} placeholder="Full name" required autoFocus style={{ flex: '1 1 130px', fontSize: 13, padding: '6px 8px' }} />
                        <input className="field-input" value={editContactDraft.company} onChange={(e) => setEditContactDraft({ ...editContactDraft, company: e.target.value })} placeholder="Company" style={{ flex: '1 1 130px', fontSize: 13, padding: '6px 8px' }} />
                        <input className="field-input" value={editContactDraft.email} onChange={(e) => setEditContactDraft({ ...editContactDraft, email: e.target.value })} placeholder="Email" style={{ flex: '1 1 130px', fontSize: 13, padding: '6px 8px' }} />
                        <input className="field-input" value={editContactDraft.phone} onChange={(e) => setEditContactDraft({ ...editContactDraft, phone: e.target.value })} placeholder="Phone" style={{ flex: '1 1 110px', fontSize: 13, padding: '6px 8px' }} />
                        <input className="field-input" type="number" min="0" value={editContactDraft.valueNgn} onChange={(e) => setEditContactDraft({ ...editContactDraft, valueNgn: e.target.value })} placeholder="Value" style={{ flex: '0 1 100px', fontSize: 13, padding: '6px 8px' }} />
                        <Button type="submit" size="sm">Save</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setEditingContactId(null)}>Cancel</Button>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={c.id}>
                    <td>
                      <input
                        type="checkbox"
                        className="row-checkbox"
                        checked={crmSelected.includes(c.id)}
                        onChange={() => toggleCrmSelect(c.id)}
                        aria-label={`Select ${c.full_name}`}
                      />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.full_name}</div>
                      {c.email && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email}</div>}
                      {c.tags?.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                          {c.tags.map((t) => <span key={t} className="ctag" style={{ fontSize: 11 }}>{t}</span>)}
                        </div>
                      )}
                    </td>
                    <td>{c.company || '—'}</td>
                    <td>
                      <select
                        className="field-select"
                        value={c.stage}
                        onChange={(e) => handleStageChange(c.id, e.target.value)}
                        style={{ fontSize: 12, padding: '4px 8px', width: 'auto' }}
                      >
                        {STAGES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
                      </select>
                    </td>
                    <td>₦{Number(c.value_ngn).toLocaleString()}</td>
                    <td>{new Date(c.last_touch_at).toLocaleDateString()}</td>
                    <td>
                      <Tooltip label="Notes, tasks & tags">
                        <button className="ctag" onClick={() => openCrmDetail(c)} aria-label="Details">Details</button>
                      </Tooltip>
                      <Tooltip label="Edit contact">
                        <button className="ctag" onClick={() => startEditContact(c)} aria-label="Edit">Edit</button>
                      </Tooltip>
                      <Tooltip label="Delete contact">
                        <button className="ctag danger" onClick={() => handleDeleteContact(c.id)} aria-label="Delete">Delete</button>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={crmPage} pageCount={crmPageCount} total={crmFilteredSorted.length} pageSize={CRM_PAGE_SIZE} onPageChange={setCrmPage} />
        </>
      )}

      <ConfirmDialog
        isOpen={!!crmConfirmDelete}
        onClose={() => setCrmConfirmDelete(null)}
        onConfirm={confirmCrmDelete}
        danger
        loading={crmDeleting}
        title={crmConfirmDelete?.bulk ? `Delete ${crmSelected.length} contacts?` : 'Delete this contact?'}
        description="This cannot be undone."
        confirmLabel="Delete"
      />

      <Modal isOpen={!!crmDetailContact} onClose={() => setCrmDetailContact(null)} title={crmDetailContact?.full_name} description="Notes, tasks & tags" wide>
        {crmDetailContact && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <h4 style={{ marginBottom: 8 }}>Tags</h4>
              <form onSubmit={handleAddCrmTag} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input className="field-input" placeholder="Add a tag…" value={crmTagInput} onChange={(e) => setCrmTagInput(e.target.value)} />
                <Button type="submit" size="sm">Add</Button>
              </form>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                {(crmDetailContact.tags || []).map((t) => (
                  <span key={t} className="ctag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {t}
                    <button type="button" onClick={() => handleRemoveCrmTag(t)} aria-label={`Remove ${t}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}>×</button>
                  </span>
                ))}
                {(crmDetailContact.tags || []).length === 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No tags yet.</span>}
              </div>

              <h4 style={{ marginBottom: 8 }}>Tasks</h4>
          <div style={{ marginTop: 24 }}>
            <CustomFieldValues
              recordType="crm_contact"
              orgId={crmDetailContact.org_id}
              contactId={crmDetailContact.id}
              fieldDefs={crmFieldDefs}
              values={crmDetailContact.customFields || {}}
              onValuesChange={(newValues) => setCrmDetailContact((prev) => ({ ...prev, customFields: newValues }))}
              readOnly={false}
            />
          </div>
              <form onSubmit={handleAddCrmTask} style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <input className="field-input" placeholder="New task…" value={crmNewTask.title} onChange={(e) => setCrmNewTask((t) => ({ ...t, title: e.target.value }))} style={{ flex: '1 1 140px' }} />
                <input className="field-input" type="date" value={crmNewTask.dueDate} onChange={(e) => setCrmNewTask((t) => ({ ...t, dueDate: e.target.value }))} style={{ flex: '0 1 140px' }} />
                <Button type="submit" size="sm">Add</Button>
              </form>
              {!crmDetailLoaded ? <SkeletonRows rows={2} /> : crmDetailTasks.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No tasks yet.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {crmDetailTasks.map((t) => (
                    <li key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <input type="checkbox" checked={t.status === 'done'} onChange={() => handleToggleCrmTask(t)} />
                      <span style={{ flex: 1, textDecoration: t.status === 'done' ? 'line-through' : 'none', color: t.status === 'done' ? 'var(--text-muted)' : 'inherit' }}>{t.title}</span>
                      {t.due_date && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(t.due_date).toLocaleDateString()}</span>}
                      <button className="ctag danger" onClick={() => handleDeleteCrmTask(t.id)} aria-label="Delete task">×</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 style={{ marginBottom: 8 }}>Notes</h4>
              <form onSubmit={handleAddCrmNote} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <textarea className="field-input" placeholder="Add a note…" value={crmNewNote} onChange={(e) => setCrmNewNote(e.target.value)} style={{ flex: 1, minHeight: 60 }} />
                <Button type="submit" size="sm">Add</Button>
              </form>
              {!crmDetailLoaded ? <SkeletonRows rows={2} /> : crmDetailNotes.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No notes yet.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {crmDetailNotes.map((n) => (
                    <li key={n.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{n.body}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                        <span>{n.author_name || 'You'} · {new Date(n.created_at).toLocaleString()}</span>
                        <button className="ctag danger" onClick={() => handleDeleteCrmNote(n.id)} aria-label="Delete note">Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
