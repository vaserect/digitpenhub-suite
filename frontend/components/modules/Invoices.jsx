'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/api';
import { getInvoiceStarterTemplates } from '../../lib/starterTemplates';
import Button from '../ui/Button';
import Card, { CardHeader } from '../ui/Card';
import Badge from '../ui/Badge';
import { SkeletonRows } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import SearchInput from '../ui/SearchInput';
import Tooltip from '../ui/Tooltip';
import { Menu, MenuItem, MenuSeparator } from '../ui/Menu';
import Pagination from '../ui/Pagination';
import ConfirmDialog from '../ui/ConfirmDialog';
import StarterTemplateModal from '../ui/StarterTemplateModal';

function InvoiceStatusBadge({ status }) {
  const labels = {
    draft: { text: 'Draft', color: '#F5B041', bg: 'rgba(245, 176, 65, 0.16)' },
    sent: { text: 'Sent', color: '#4D93FF', bg: 'rgba(77, 147, 255, 0.14)' },
    paid: { text: 'Paid', color: '#4ADE80', bg: 'rgba(74, 222, 128, 0.16)' },
  };
  const badge = labels[status] || labels.draft;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, color: badge.color, background: badge.bg, textTransform: 'uppercase' }}>
      {badge.text}
    </span>
  );
}

function createBlankInvoiceDraft() {
  return { invoiceNumber: '', clientId: '', status: 'draft', issueDate: '', dueDate: '', subtotal: '', taxRate: '', total: '', notes: '' };
}

function createBlankInvoiceItem() {
  return { description: '', quantity: '1', unitPrice: '', amount: '' };
}

function syncInvoiceTotals(items, invoiceDraft) {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const taxRate = Number(invoiceDraft.taxRate) || 0;
  return {
    ...invoiceDraft,
    subtotal: subtotal.toFixed(2),
    total: (subtotal + subtotal * (taxRate / 100)).toFixed(2),
  };
}

export default function InvoicesModule({ goHome, showToast }) {
  const router = useRouter();
  const INVOICE_PAGE_SIZE = 10;

  const [invoiceClients, setInvoiceClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoaded, setInvoicesLoaded] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', company: '', address: '' });
  const [newInvoice, setNewInvoice] = useState(createBlankInvoiceDraft());
  const [invoiceItems, setInvoiceItems] = useState([createBlankInvoiceItem()]);
  const [editingClientId, setEditingClientId] = useState(null);
  const [editClientDraft, setEditClientDraft] = useState({ name: '', email: '', phone: '', company: '', address: '' });
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [editInvoiceDraft, setEditInvoiceDraft] = useState(createBlankInvoiceDraft());
  const [editInvoiceItems, setEditInvoiceItems] = useState([createBlankInvoiceItem()]);
  const [invoiceFilter, setInvoiceFilter] = useState('all');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceFormError, setInvoiceFormError] = useState('');
  const [invoiceLoadError, setInvoiceLoadError] = useState('');
  const [invoiceSort, setInvoiceSort] = useState({ key: 'issue_date', dir: 'desc' });
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoiceSelected, setInvoiceSelected] = useState([]);
  const [invoiceConfirmDelete, setInvoiceConfirmDelete] = useState(null);
  const [invoiceDeleting, setInvoiceDeleting] = useState(false);
  const [clientConfirmDelete, setClientConfirmDelete] = useState(null);
  const [clientDeleting, setClientDeleting] = useState(false);
  const [invoiceTemplateOpen, setInvoiceTemplateOpen] = useState(false);

  const invoiceStarterTemplates = useMemo(() => getInvoiceStarterTemplates(), []);

  async function loadInvoices() {
    try {
      const [clientsRes, invoicesRes] = await Promise.all([
        apiFetch('/api/v1/invoices/clients'),
        apiFetch('/api/v1/invoices'),
      ]);
      setInvoiceClients(clientsRes.clients || []);
      setInvoices(invoicesRes.invoices || []);
      setInvoicesLoaded(true);
      setInvoiceLoadError('');
    } catch (err) {
      setInvoiceLoadError(err.message || 'Unable to load invoices.');
      setInvoicesLoaded(true);
    }
  }

  const invoiceSummary = useMemo(() => {
    const totalAmount = invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
    const paid = invoices.filter((invoice) => invoice.status === 'paid').length;
    const sent = invoices.filter((invoice) => invoice.status === 'sent').length;
    const overdue = invoices.filter((invoice) => {
      if (invoice.status === 'paid') return false;
      if (!invoice.due_date) return false;
      return new Date(invoice.due_date) < new Date();
    }).length;
    return { totalAmount, paid, sent, overdue };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const query = invoiceSearch.trim().toLowerCase();
    let rows = invoices.filter((invoice) => {
      const matchesFilter = invoiceFilter === 'all' || invoice.status === invoiceFilter;
      const haystack = `${invoice.invoice_number || ''} ${invoice.client_name || ''} ${invoice.client_company || ''}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      return matchesFilter && matchesQuery;
    });
    const { key, dir } = invoiceSort;
    rows = [...rows].sort((a, b) => {
      let av = a[key], bv = b[key];
      if (key === 'total') { av = Number(av) || 0; bv = Number(bv) || 0; }
      else if (key === 'issue_date' || key === 'due_date') { av = av ? new Date(av).getTime() : 0; bv = bv ? new Date(bv).getTime() : 0; }
      else { av = (av || '').toString().toLowerCase(); bv = (bv || '').toString().toLowerCase(); }
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [invoices, invoiceFilter, invoiceSearch, invoiceSort]);

  const invoicePageCount = Math.max(1, Math.ceil(filteredInvoices.length / INVOICE_PAGE_SIZE));
  const invoicePageRows = filteredInvoices.slice((invoicePage - 1) * INVOICE_PAGE_SIZE, invoicePage * INVOICE_PAGE_SIZE);

  useEffect(() => { setInvoicePage(1); }, [invoiceSearch, invoiceFilter]);
  useEffect(() => { if (invoicePage > invoicePageCount) setInvoicePage(invoicePageCount); }, [invoicePageCount]);

  function handleInvoiceSort(key) {
    setInvoiceSort((prev) => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  }

  function toggleInvoiceSelect(id) {
    setInvoiceSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function exportInvoicesCsv(rows) {
    const header = ['Invoice #', 'Client', 'Status', 'Issue date', 'Due date', 'Total'];
    const csvRows = rows.map((i) => [i.invoice_number, i.client_name || i.client_company || '', i.status, i.issue_date || '', i.due_date || '', i.total]
      .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
    const csv = [header.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCreateClient(e) {
    e.preventDefault();
    if (!newClient.name.trim()) return;
    await apiFetch('/api/v1/invoices/clients', {
      method: 'POST',
      body: JSON.stringify({
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone,
        company: newClient.company,
        address: newClient.address,
      }),
    });
    setNewClient({ name: '', email: '', phone: '', company: '', address: '' });
    setShowClientForm(false);
    await loadInvoices();
  }

  function startBlankInvoice() {
    setEditingInvoiceId(null);
    setInvoiceFormError('');
    setNewInvoice(createBlankInvoiceDraft());
    setInvoiceItems([createBlankInvoiceItem()]);
    setShowInvoiceForm(true);
  }

  function useInvoiceStarterTemplate(template) {
    const nextItems = template.items.map((item) => ({
      description: item.description,
      quantity: String(item.quantity),
      unitPrice: String(item.unitPrice),
      amount: (Number(item.quantity) * Number(item.unitPrice)).toFixed(2),
    }));
    setEditingInvoiceId(null);
    setInvoiceFormError('');
    setInvoiceItems(nextItems);
    setNewInvoice(
      syncInvoiceTotals(nextItems, {
        ...createBlankInvoiceDraft(),
        ...template.draft,
      })
    );
    setShowInvoiceForm(true);
    setInvoiceTemplateOpen(false);
    showToast('Template applied — finish the client and invoice number before saving.');
  }

  function handleNewInvoiceItemChange(index, field, value) {
    const nextRows = invoiceItems.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row));
    setInvoiceItems(nextRows);
    setNewInvoice((prev) => syncInvoiceTotals(nextRows, { ...prev, [field]: value }));
  }

  function handleEditInvoiceItemChange(index, field, value) {
    const nextRows = editInvoiceItems.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row));
    setEditInvoiceItems(nextRows);
    setEditInvoiceDraft((prev) => syncInvoiceTotals(nextRows, { ...prev, [field]: value }));
  }

  function addInvoiceItemRow() {
    setInvoiceItems((prev) => [...prev, createBlankInvoiceItem()]);
  }

  function addEditInvoiceItemRow() {
    setEditInvoiceItems((prev) => [...prev, createBlankInvoiceItem()]);
  }

  function removeInvoiceItemRow(index) {
    const nextRows = invoiceItems.filter((_, rowIndex) => rowIndex !== index);
    setInvoiceItems(nextRows.length ? nextRows : [createBlankInvoiceItem()]);
    setNewInvoice((prev) => syncInvoiceTotals(nextRows.length ? nextRows : [createBlankInvoiceItem()], prev));
  }

  function removeEditInvoiceItemRow(index) {
    const nextRows = editInvoiceItems.filter((_, rowIndex) => rowIndex !== index);
    setEditInvoiceItems(nextRows.length ? nextRows : [createBlankInvoiceItem()]);
    setEditInvoiceDraft((prev) => syncInvoiceTotals(nextRows.length ? nextRows : [createBlankInvoiceItem()], prev));
  }

  async function handleCreateInvoice(e) {
    e.preventDefault();
    setInvoiceFormError('');
    if (!newInvoice.invoiceNumber.trim()) {
      setInvoiceFormError('Invoice number is required.');
      return;
    }
    const payloadItems = invoiceItems
      .filter((item) => item.description.trim())
      .map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        amount: Number(item.amount) || (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
      }));
    if (!payloadItems.length) {
      setInvoiceFormError('Add at least one line item before saving.');
      return;
    }
    try {
      await apiFetch('/api/v1/invoices', {
        method: 'POST',
        body: JSON.stringify({
          invoiceNumber: newInvoice.invoiceNumber,
          clientId: newInvoice.clientId || null,
          status: newInvoice.status,
          issueDate: newInvoice.issueDate || null,
          dueDate: newInvoice.dueDate || null,
          subtotal: Number(newInvoice.subtotal) || 0,
          taxRate: Number(newInvoice.taxRate) || 0,
          total: Number(newInvoice.total) || 0,
          notes: newInvoice.notes,
          items: payloadItems,
        }),
      });
      setNewInvoice(createBlankInvoiceDraft());
      setInvoiceItems([createBlankInvoiceItem()]);
      setShowInvoiceForm(false);
      await loadInvoices();
    } catch (err) {
      setInvoiceFormError(err.message || 'Unable to save invoice.');
    }
  }

  function startEditClient(client) {
    setEditingClientId(client.id);
    setEditClientDraft({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      company: client.company || '',
      address: client.address || '',
    });
  }

  async function handleSaveClient(e) {
    e.preventDefault();
    await apiFetch(`/api/v1/invoices/clients/${editingClientId}`, {
      method: 'PATCH',
      body: JSON.stringify(editClientDraft),
    });
    setEditingClientId(null);
    await loadInvoices();
  }

  function handleDeleteClient(id) {
    setClientConfirmDelete({ id });
  }

  async function confirmClientDelete() {
    if (!clientConfirmDelete) return;
    setClientDeleting(true);
    try {
      await apiFetch(`/api/v1/invoices/clients/${clientConfirmDelete.id}`, { method: 'DELETE' });
      showToast('Client deleted.');
      await loadInvoices();
    } finally {
      setClientDeleting(false);
      setClientConfirmDelete(null);
    }
  }

  async function startEditInvoice(invoice) {
    setEditingInvoiceId(invoice.id);
    setEditInvoiceDraft({
      invoiceNumber: invoice.invoice_number || '',
      clientId: invoice.client_id || '',
      status: invoice.status || 'draft',
      issueDate: invoice.issue_date ? new Date(invoice.issue_date).toISOString().slice(0, 10) : '',
      dueDate: invoice.due_date ? new Date(invoice.due_date).toISOString().slice(0, 10) : '',
      subtotal: invoice.subtotal || '',
      taxRate: invoice.tax_rate || '',
      total: invoice.total || '',
      notes: invoice.notes || '',
    });
    try {
      const data = await apiFetch(`/api/v1/invoices/${invoice.id}`);
      const items = data.invoice?.items?.length
        ? data.invoice.items.map((item) => ({
            description: item.description || '',
            quantity: String(item.quantity || 1),
            unitPrice: String(item.unit_price || 0),
            amount: String(item.amount || 0),
          }))
        : [createBlankInvoiceItem()];
      setEditInvoiceItems(items);
      setEditInvoiceDraft((prev) => syncInvoiceTotals(items, prev));
    } catch (err) {
      setEditInvoiceItems([createBlankInvoiceItem()]);
    }
  }

  async function handleSaveInvoice(e) {
    e.preventDefault();
    setInvoiceFormError('');
    if (!editInvoiceDraft.invoiceNumber.trim()) {
      setInvoiceFormError('Invoice number is required.');
      return;
    }
    const payloadItems = editInvoiceItems
      .filter((item) => item.description.trim())
      .map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        amount: Number(item.amount) || (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
      }));
    if (!payloadItems.length) {
      setInvoiceFormError('Add at least one line item before saving.');
      return;
    }
    try {
      await apiFetch(`/api/v1/invoices/${editingInvoiceId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          invoiceNumber: editInvoiceDraft.invoiceNumber,
          clientId: editInvoiceDraft.clientId || null,
          status: editInvoiceDraft.status,
          issueDate: editInvoiceDraft.issueDate || null,
          dueDate: editInvoiceDraft.dueDate || null,
          subtotal: Number(editInvoiceDraft.subtotal) || 0,
          taxRate: Number(editInvoiceDraft.taxRate) || 0,
          total: Number(editInvoiceDraft.total) || 0,
          notes: editInvoiceDraft.notes,
          items: payloadItems,
        }),
      });
      setEditingInvoiceId(null);
      setEditInvoiceItems([{ description: '', quantity: '1', unitPrice: '', amount: '' }]);
      await loadInvoices();
    } catch (err) {
      setInvoiceFormError(err.message || 'Unable to save invoice.');
    }
  }

  function handleDeleteInvoice(id) {
    setInvoiceConfirmDelete({ id });
  }

  async function confirmInvoiceDelete() {
    if (!invoiceConfirmDelete) return;
    setInvoiceDeleting(true);
    try {
      if (invoiceConfirmDelete.bulk) {
        await Promise.all(invoiceSelected.map((id) => apiFetch(`/api/v1/invoices/${id}`, { method: 'DELETE' })));
        showToast(`${invoiceSelected.length} invoice${invoiceSelected.length === 1 ? '' : 's'} deleted.`);
        setInvoiceSelected([]);
      } else {
        await apiFetch(`/api/v1/invoices/${invoiceConfirmDelete.id}`, { method: 'DELETE' });
        showToast('Invoice deleted.');
      }
      await loadInvoices();
    } finally {
      setInvoiceDeleting(false);
      setInvoiceConfirmDelete(null);
    }
  }

  async function handleMarkInvoicePaid(id) {
    await apiFetch(`/api/v1/invoices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'paid' }),
    });
    await loadInvoices();
  }

  async function handleShareInvoice(id) {
    try {
      const data = await apiFetch(`/api/v1/invoices/${id}/share`, { method: 'POST' });
      const shareUrl = `${window.location.origin}/invoices/shared/${data.shareToken}`;
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }
      showToast('Share link copied to clipboard.');
    } catch (err) {
      showToast(err.message || 'Unable to create share link.');
    }
  }

  async function handleSendInvoice(id) {
    try {
      const data = await apiFetch(`/api/v1/invoices/${id}/send`, { method: 'POST' });
      if (data.error) { showToast(data.error); return; }
      await loadInvoices();
      showToast(`Invoice emailed to ${data.emailedTo}.`);
    } catch (err) {
      showToast(err.message || 'Unable to send invoice.');
    }
  }

  function handleDownloadInvoicePdf(id) {
    window.open(`/api/v1/invoices/${id}/pdf`, '_blank');
  }

  function copyInvoiceNumber(invoiceNumber) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(invoiceNumber);
      showToast('Invoice number copied.');
    }
  }

  return (
    <div className="panel">
      <button className="back-link" onClick={goHome}>← Workspace</button>
      <div className="module-head">
        <div><h1>Invoices</h1><p className="module-sub">Create clients and turn work into polished invoices in one place.</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={() => setShowClientForm((v) => !v)}>+ Add client</Button>
          <Button variant="secondary" onClick={() => setInvoiceTemplateOpen(true)}>Choose a template</Button>
          <Button onClick={() => { if (showInvoiceForm) setShowInvoiceForm(false); else startBlankInvoice(); }}>
            {showInvoiceForm ? 'Cancel' : 'Start from scratch'}
          </Button>
        </div>
      </div>

      {showClientForm && (
        <Card style={{ marginBottom: 18 }}>
          <form onSubmit={handleCreateClient} style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Client name</label>
              <input className="field-input" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} required autoFocus />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Email</label>
              <input className="field-input" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Phone</label>
              <input className="field-input" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Company</label>
              <input className="field-input" value={newClient.company} onChange={(e) => setNewClient({ ...newClient, company: e.target.value })} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Address</label>
              <input className="field-input" value={newClient.address} onChange={(e) => setNewClient({ ...newClient, address: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 8, alignSelf: 'end' }}>
              <Button type="submit">Save client</Button>
              <Button type="button" variant="ghost" onClick={() => setShowClientForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {showInvoiceForm && (
        <Card style={{ marginBottom: 18 }}>
          <form onSubmit={handleCreateInvoice} style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            {invoiceFormError ? <div className="form-banner-error">{invoiceFormError}</div> : null}
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Invoice number</label>
              <input className="field-input" value={newInvoice.invoiceNumber} onChange={(e) => setNewInvoice({ ...newInvoice, invoiceNumber: e.target.value })} required autoFocus />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Client</label>
              <select className="field-select" value={newInvoice.clientId} onChange={(e) => setNewInvoice({ ...newInvoice, clientId: e.target.value })}>
                <option value="">Select client</option>
                {invoiceClients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Status</label>
              <select className="field-select" value={newInvoice.status} onChange={(e) => setNewInvoice({ ...newInvoice, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Issue date</label>
              <input className="field-input" type="date" value={newInvoice.issueDate} onChange={(e) => setNewInvoice({ ...newInvoice, issueDate: e.target.value })} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Due date</label>
              <input className="field-input" type="date" value={newInvoice.dueDate} onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Tax rate (%)</label>
              <input className="field-input" type="number" min="0" value={newInvoice.taxRate} onChange={(e) => {
                const value = e.target.value;
                setNewInvoice((prev) => syncInvoiceTotals(invoiceItems, { ...prev, taxRate: value }));
              }} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Subtotal</label>
              <input className="field-input" type="number" min="0" value={newInvoice.subtotal} readOnly />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Total</label>
              <input className="field-input" type="number" min="0" value={newInvoice.total} readOnly />
            </div>
            <div className="field" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
              <label className="field-label">Notes</label>
              <input className="field-input" value={newInvoice.notes} onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong>Line items</strong>
                <Button type="button" variant="secondary" size="sm" onClick={addInvoiceItemRow}>+ Add line</Button>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {invoiceItems.map((item, index) => (
                  <div key={index} style={{ display: 'grid', gap: 8, gridTemplateColumns: '2fr 1fr 1fr 1fr auto', alignItems: 'end' }}>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label className="field-label">Description</label>
                      <input className="field-input" value={item.description} onChange={(e) => handleNewInvoiceItemChange(index, 'description', e.target.value)} />
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label className="field-label">Qty</label>
                      <input className="field-input" type="number" min="1" value={item.quantity} onChange={(e) => handleNewInvoiceItemChange(index, 'quantity', e.target.value)} />
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label className="field-label">Unit price</label>
                      <input className="field-input" type="number" min="0" value={item.unitPrice} onChange={(e) => handleNewInvoiceItemChange(index, 'unitPrice', e.target.value)} />
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label className="field-label">Line total</label>
                      <input className="field-input" type="number" min="0" value={item.amount} readOnly />
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeInvoiceItemRow(index)}>Remove</Button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignSelf: 'end' }}>
              <Button type="submit">Save invoice</Button>
              <Button type="button" variant="ghost" onClick={() => setShowInvoiceForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="stage-strip">
        <div className="stage-card"><div className="num">{invoiceClients.length}</div><div className="lbl">Clients</div></div>
        <div className="stage-card"><div className="num">{invoices.filter((invoice) => invoice.status === 'draft').length}</div><div className="lbl">Drafts</div></div>
        <div className="stage-card"><div className="num">{invoiceSummary.sent}</div><div className="lbl">Sent</div></div>
        <div className="stage-card"><div className="num">{invoiceSummary.paid}</div><div className="lbl">Paid</div></div>
        <div className="stage-card"><div className="num">{invoiceSummary.overdue}</div><div className="lbl">Overdue</div></div>
      </div>

      <Card className="hero-card" style={{ marginBottom: 18 }}>
        <CardHeader title="Billing overview" subtitle="Keep cash flow visible from one screen." action={<Badge variant="active">Live billing</Badge>} />
        <div className="hero-grid">
          <div>
            <p className="hero-copy">Track active clients, unpaid invoices, and revenue health without leaving the suite.</p>
          </div>
          <div className="hero-metrics">
            <div><strong>₦{invoiceSummary.totalAmount.toLocaleString()}</strong><span>Value in invoices</span></div>
            <div><strong>{invoiceSummary.paid}</strong><span>Paid invoices</span></div>
            <div><strong>{invoiceSummary.overdue}</strong><span>Overdue</span></div>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 18 }}>
        <h3 style={{ marginTop: 0, marginBottom: 10 }}>Clients</h3>
        {invoiceClients.length === 0 ? (
          <EmptyState
            icon="🧾"
            title="No clients yet"
            description="Add your first client to start billing them."
            action={<Button onClick={() => setShowClientForm(true)}>+ Add client</Button>}
          />
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {invoiceClients.map((client) => (
              <div key={client.id} className="card" style={{ padding: 12 }}>
                {editingClientId === client.id ? (
                  <form onSubmit={handleSaveClient} style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                    <input className="field-input" value={editClientDraft.name} onChange={(e) => setEditClientDraft({ ...editClientDraft, name: e.target.value })} placeholder="Name" required />
                    <input className="field-input" value={editClientDraft.email} onChange={(e) => setEditClientDraft({ ...editClientDraft, email: e.target.value })} placeholder="Email" />
                    <input className="field-input" value={editClientDraft.phone} onChange={(e) => setEditClientDraft({ ...editClientDraft, phone: e.target.value })} placeholder="Phone" />
                    <input className="field-input" value={editClientDraft.company} onChange={(e) => setEditClientDraft({ ...editClientDraft, company: e.target.value })} placeholder="Company" />
                    <input className="field-input" value={editClientDraft.address} onChange={(e) => setEditClientDraft({ ...editClientDraft, address: e.target.value })} placeholder="Address" />
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Button type="submit" size="sm">Save</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditingClientId(null)}>Cancel</Button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{client.name}</div>
                      <div className="panel-sub" style={{ marginTop: 3 }}>{client.company || 'Individual'} • {client.email || 'No email'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Tooltip label="Edit client">
                        <button className="ctag" onClick={() => startEditClient(client)} aria-label="Edit">Edit</button>
                      </Tooltip>
                      <Tooltip label="Delete client">
                        <button className="ctag danger" onClick={() => handleDeleteClient(client.id)} aria-label="Delete">Delete</button>
                      </Tooltip>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {invoicesLoaded && invoices.length > 0 && (
        <div className="toolbar-row" style={{ marginTop: 4 }}>
          <SearchInput value={invoiceSearch} onChange={(e) => setInvoiceSearch(e.target.value)} placeholder="Search by invoice number, client, or company…" />
          <select className="toolbar-select" value={invoiceFilter} onChange={(e) => setInvoiceFilter(e.target.value)}>
            <option value="all">All invoices ({invoices.length})</option>
            <option value="draft">Draft ({invoices.filter((i) => i.status === 'draft').length})</option>
            <option value="sent">Sent ({invoices.filter((i) => i.status === 'sent').length})</option>
            <option value="paid">Paid ({invoices.filter((i) => i.status === 'paid').length})</option>
          </select>
          <Tooltip label="Export the current view to CSV">
            <Button variant="secondary" size="sm" onClick={() => exportInvoicesCsv(filteredInvoices)}>Export CSV</Button>
          </Tooltip>
        </div>
      )}

      {invoiceSelected.length > 0 && (
        <div className="bulk-bar">
          <span>{invoiceSelected.length} invoice{invoiceSelected.length === 1 ? '' : 's'} selected</span>
          <div className="bulk-bar-actions">
            <Button variant="danger" size="sm" onClick={() => setInvoiceConfirmDelete({ bulk: true })}>Delete selected</Button>
            <Button variant="ghost" size="sm" onClick={() => setInvoiceSelected([])}>Clear</Button>
          </div>
        </div>
      )}

      {!invoicesLoaded ? (
        <Card><SkeletonRows rows={5} /></Card>
      ) : invoiceLoadError ? (
        <Card><EmptyState icon="⚠️" title="Couldn't load invoices" description={invoiceLoadError} /></Card>
      ) : invoices.length === 0 ? (
        <Card>
          <EmptyState
            icon="🧾"
            title="No invoices yet"
            description="Start with a blank invoice or choose a starter billing structure."
            action={(
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button onClick={startBlankInvoice}>Start from scratch</Button>
                <Button variant="secondary" onClick={() => setInvoiceTemplateOpen(true)}>Choose a template</Button>
              </div>
            )}
          />
        </Card>
      ) : filteredInvoices.length === 0 ? (
        <Card>
          <EmptyState
            icon="🔍"
            title="No matching invoices"
            description="Try a different search term or switch the status filter."
            action={<Button variant="secondary" onClick={() => { setInvoiceSearch(''); setInvoiceFilter('all'); }}>Clear filters</Button>}
          />
        </Card>
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
                      checked={invoicePageRows.length > 0 && invoicePageRows.every((i) => invoiceSelected.includes(i.id))}
                      onChange={(e) => {
                        const ids = invoicePageRows.map((i) => i.id);
                        setInvoiceSelected((prev) => e.target.checked ? Array.from(new Set([...prev, ...ids])) : prev.filter((id) => !ids.includes(id)));
                      }}
                      aria-label="Select all on this page"
                    />
                  </th>
                  {[
                    { key: 'invoice_number', label: 'Invoice' },
                    { key: 'client_name', label: 'Client' },
                    { key: 'status', label: 'Status' },
                    { key: 'issue_date', label: 'Issued' },
                    { key: 'due_date', label: 'Due' },
                    { key: 'total', label: 'Total' },
                  ].map((col) => (
                    <th key={col.key}>
                      <span className={["th-sort", invoiceSort.key === col.key ? 'active' : ''].join(' ')} onClick={() => handleInvoiceSort(col.key)}>
                        {col.label}
                        <span className="sort-caret">{invoiceSort.key === col.key ? (invoiceSort.dir === 'asc' ? '▲' : '▼') : '▲▼'}</span>
                      </span>
                    </th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoicePageRows.map((invoice) => editingInvoiceId === invoice.id ? (
                  <tr key={invoice.id}>
                    <td colSpan={8}>
                      <form onSubmit={handleSaveInvoice} style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', padding: '4px 0' }}>
                        {invoiceFormError ? <div className="form-banner-error">{invoiceFormError}</div> : null}
                        <input className="field-input" value={editInvoiceDraft.invoiceNumber} onChange={(e) => setEditInvoiceDraft({ ...editInvoiceDraft, invoiceNumber: e.target.value })} placeholder="Invoice number" required />
                        <select className="field-select" value={editInvoiceDraft.clientId} onChange={(e) => setEditInvoiceDraft({ ...editInvoiceDraft, clientId: e.target.value })}>
                          <option value="">Select client</option>
                          {invoiceClients.map((client) => (<option key={client.id} value={client.id}>{client.name}</option>))}
                        </select>
                        <select className="field-select" value={editInvoiceDraft.status} onChange={(e) => setEditInvoiceDraft({ ...editInvoiceDraft, status: e.target.value })}>
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="paid">Paid</option>
                        </select>
                        <input className="field-input" type="date" value={editInvoiceDraft.issueDate} onChange={(e) => setEditInvoiceDraft({ ...editInvoiceDraft, issueDate: e.target.value })} />
                        <input className="field-input" type="date" value={editInvoiceDraft.dueDate} onChange={(e) => setEditInvoiceDraft({ ...editInvoiceDraft, dueDate: e.target.value })} />
                        <input className="field-input" type="number" min="0" value={editInvoiceDraft.taxRate} onChange={(e) => setEditInvoiceDraft((prev) => syncInvoiceTotals(editInvoiceItems, { ...prev, taxRate: e.target.value }))} />
                        <input className="field-input" type="number" min="0" value={editInvoiceDraft.subtotal} readOnly />
                        <input className="field-input" type="number" min="0" value={editInvoiceDraft.total} readOnly />
                        <input className="field-input" value={editInvoiceDraft.notes} onChange={(e) => setEditInvoiceDraft({ ...editInvoiceDraft, notes: e.target.value })} placeholder="Notes" />
                        <div style={{ gridColumn: '1 / -1' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <strong>Line items</strong>
                            <Button type="button" variant="secondary" size="sm" onClick={addEditInvoiceItemRow}>+ Add line</Button>
                          </div>
                          <div style={{ display: 'grid', gap: 8 }}>
                            {editInvoiceItems.map((item, index) => (
                              <div key={index} style={{ display: 'grid', gap: 8, gridTemplateColumns: '2fr 1fr 1fr 1fr auto', alignItems: 'end' }}>
                                <div className="field" style={{ marginBottom: 0 }}>
                                  <label className="field-label">Description</label>
                                  <input className="field-input" value={item.description} onChange={(e) => handleEditInvoiceItemChange(index, 'description', e.target.value)} />
                                </div>
                                <div className="field" style={{ marginBottom: 0 }}>
                                  <label className="field-label">Qty</label>
                                  <input className="field-input" type="number" min="1" value={item.quantity} onChange={(e) => handleEditInvoiceItemChange(index, 'quantity', e.target.value)} />
                                </div>
                                <div className="field" style={{ marginBottom: 0 }}>
                                  <label className="field-label">Unit price</label>
                                  <input className="field-input" type="number" min="0" value={item.unitPrice} onChange={(e) => handleEditInvoiceItemChange(index, 'unitPrice', e.target.value)} />
                                </div>
                                <div className="field" style={{ marginBottom: 0 }}>
                                  <label className="field-label">Line total</label>
                                  <input className="field-input" type="number" min="0" value={item.amount} readOnly />
                                </div>
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeEditInvoiceItemRow(index)}>Remove</Button>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', gridColumn: '1 / -1' }}>
                          <Button type="submit" size="sm">Save</Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setEditingInvoiceId(null)}>Cancel</Button>
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={invoice.id}>
                    <td>
                      <input
                        type="checkbox"
                        className="row-checkbox"
                        checked={invoiceSelected.includes(invoice.id)}
                        onChange={() => toggleInvoiceSelect(invoice.id)}
                        aria-label={`Select ${invoice.invoice_number}`}
                      />
                    </td>
                    <td>{invoice.invoice_number}</td>
                    <td>{invoice.client_name || invoice.client_company || '—'}</td>
                    <td><InvoiceStatusBadge status={invoice.status} /></td>
                    <td>{invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : '—'}</td>
                    <td>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}</td>
                    <td>₦{Number(invoice.total).toLocaleString()}</td>
                    <td style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <Button size="sm" variant="secondary" onClick={() => router.push(`/invoices/${invoice.id}`)}>Open</Button>
                      <Menu
                        align="right"
                        trigger={(toggle, isOpen) => (
                          <button type="button" className="ctag" onClick={toggle} aria-label="More actions" aria-expanded={isOpen}>⋯</button>
                        )}
                      >
                        {(close) => (
                          <>
                            <MenuItem onClick={() => { startEditInvoice(invoice); close(); }}>Edit</MenuItem>
                            {invoice.status === 'draft' && (
                              <MenuItem onClick={() => { handleSendInvoice(invoice.id); close(); }}>Send</MenuItem>
                            )}
                            {invoice.status !== 'paid' && (
                              <MenuItem onClick={() => { handleMarkInvoicePaid(invoice.id); close(); }}>Mark paid</MenuItem>
                            )}
                            <MenuItem onClick={() => { handleDownloadInvoicePdf(invoice.id); close(); }}>Download PDF</MenuItem>
                            <MenuItem onClick={() => { handleShareInvoice(invoice.id); close(); }}>Share link</MenuItem>
                            <MenuItem onClick={() => { copyInvoiceNumber(invoice.invoice_number); close(); }}>Copy #</MenuItem>
                            <MenuSeparator />
                            <MenuItem danger onClick={() => { handleDeleteInvoice(invoice.id); close(); }}>Delete</MenuItem>
                          </>
                        )}
                      </Menu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={invoicePage} pageCount={invoicePageCount} total={filteredInvoices.length} pageSize={INVOICE_PAGE_SIZE} onPageChange={setInvoicePage} />
        </>
      )}

      <ConfirmDialog
        isOpen={!!invoiceConfirmDelete}
        onClose={() => setInvoiceConfirmDelete(null)}
        onConfirm={confirmInvoiceDelete}
        danger
        loading={invoiceDeleting}
        title={invoiceConfirmDelete?.bulk ? `Delete ${invoiceSelected.length} invoices?` : 'Delete this invoice?'}
        description="This cannot be undone."
        confirmLabel="Delete"
      />

      <ConfirmDialog
        isOpen={!!clientConfirmDelete}
        onClose={() => setClientConfirmDelete(null)}
        onConfirm={confirmClientDelete}
        danger
        loading={clientDeleting}
        title="Delete this client?"
        description="This cannot be undone."
        confirmLabel="Delete"
      />
      <StarterTemplateModal
        isOpen={invoiceTemplateOpen}
        onClose={() => setInvoiceTemplateOpen(false)}
        title="Choose an invoice template"
        description="Pick a useful billing structure, then adjust the client, invoice number, and pricing."
        templates={invoiceStarterTemplates}
        onUse={useInvoiceStarterTemplate}
      />
    </div>
  );
}
