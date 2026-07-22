const InvoiceService = require('../services/invoicing/InvoiceService');
const { notify } = require('../utils/notify');
const { sendMail } = require('../utils/mailer');
const { renderInvoicePdf } = require('../utils/invoicePdf');
const logger = require('../utils/logger');

// ── Clients ─────────────────────────────────────────────────────────────────

async function listClients(req, res) {
  const clients = await InvoiceService.findAllClients(req.user.orgId);
  res.json({ clients });
}

async function createClient(req, res) {
  const { name, email, phone, company, address } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required.' });
  const client = await InvoiceService.createClient(req.body, req.user.orgId, req.user.id);
  res.status(201).json({ client });
}

async function updateClient(req, res) {
  const { id } = req.params;
  const client = await InvoiceService.updateClient(id, req.body, req.user.orgId, req.user.id);
  if (!client) return res.status(404).json({ error: 'Client not found.' });
  res.json({ client });
}

async function deleteClient(req, res) {
  const { id } = req.params;
  const deleted = await InvoiceService.deleteClient(id, req.user.orgId);
  if (!deleted) return res.status(404).json({ error: 'Client not found.' });
  res.json({ ok: true });
}

// ── Invoices ────────────────────────────────────────────────────────────────

async function listInvoices(req, res) {
  const invoices = await InvoiceService.findAllWithClients(req.user.orgId);
  res.json({ invoices });
}

async function createInvoice(req, res) {
  const { clientId, invoiceNumber, status, issueDate, dueDate, subtotal, taxRate, total, notes, items } = req.body || {};
  if (!invoiceNumber || !String(invoiceNumber).trim()) {
    return res.status(400).json({ error: 'invoiceNumber is required.' });
  }
  if (!items || !Array.isArray(items) || items.filter(i => i.description).length === 0) {
    return res.status(400).json({ error: 'At least one invoice line item is required.' });
  }

  const invoice = await InvoiceService.createWithItems(
    {
      client_id: clientId,
      invoice_number: invoiceNumber,
      status: status || 'draft',
      issue_date: issueDate,
      due_date: dueDate,
      subtotal,
      tax_rate: taxRate,
      total,
      notes,
    },
    items,
    req.user.orgId,
    req.user.id
  );

  res.status(201).json({ invoice });
}

async function getInvoice(req, res) {
  const { id } = req.params;
  const invoice = await InvoiceService.findByIdWithItems(id, req.user.orgId);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });
  res.json({ invoice });
}

async function getPublicInvoice(req, res) {
  const { token } = req.params;
  const invoice = await InvoiceService.findByShareToken(token);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });
  res.json({ invoice });
}

async function shareInvoice(req, res) {
  const { id } = req.params;
  const invoice = await InvoiceService.findById(id, req.user.orgId);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });

  // Generate share token if not set
  if (!invoice.share_token) {
    const { rows } = await require('../db').query(
      `UPDATE invoices SET share_token = gen_random_uuid(), updated_at = now() WHERE id = $1 AND org_id = $2 RETURNING share_token`,
      [id, req.user.orgId]
    );
    res.json({ shareToken: rows[0].share_token });
  } else {
    res.json({ shareToken: invoice.share_token });
  }
}

async function updateInvoice(req, res) {
  const { id } = req.params;
  const { clientId, invoiceNumber, status, issueDate, dueDate, subtotal, taxRate, total, notes, items } = req.body || {};

  // Validate client if provided
  if (clientId !== undefined) {
    const client = await InvoiceService.findClient(clientId, req.user.orgId);
    if (!client) return res.status(400).json({ error: 'Client not found.' });
  }

  const hasItems = Object.prototype.hasOwnProperty.call(req.body, 'items');

  // Use the service for the update — includes transactional safety
  const invoice = await InvoiceService.updateWithItems(
    id,
    {
      client_id: clientId,
      invoice_number: invoiceNumber,
      status,
      issue_date: issueDate,
      due_date: dueDate,
      subtotal,
      tax_rate: taxRate,
      total,
      notes,
    },
    hasItems ? items : undefined,
    req.user.orgId,
    req.user.id
  );

  if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });

  // Trigger notifications for status changes
  if (status === 'paid') {
    notify(req.user.orgId, {
      type: 'invoice_paid',
      title: 'Invoice marked as paid',
      body: `Invoice ${invoice.invoice_number} has been marked as paid.`,
      link: null,
      email: true,
    });
  } else if (status === 'sent') {
    notify(req.user.orgId, {
      type: 'invoice_sent',
      title: 'Invoice sent to client',
      body: `Invoice ${invoice.invoice_number} has been sent.`,
    });
  }

  res.json({ invoice });
}

async function deleteInvoice(req, res) {
  const { id } = req.params;
  const deleted = await InvoiceService.delete(id, req.user.orgId, req.user.id);
  if (!deleted) return res.status(404).json({ error: 'Invoice not found.' });
  res.json({ ok: true });
}

// ── PDF & Email ─────────────────────────────────────────────────────────────

async function getInvoicePdf(req, res) {
  const invoice = await InvoiceService.findByIdWithItems(req.params.id, req.user.orgId);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });

  const { rows } = await require('../db').query(
    `SELECT display_name, primary_color, sender_name, sender_email FROM org_branding WHERE org_id=$1`,
    [req.user.orgId]
  );
  const branding = rows[0] || null;
  const pdf = await renderInvoicePdf(invoice, branding);
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="invoice-${invoice.invoice_number}.pdf"` });
  res.send(pdf);
}

async function sendInvoiceEmail(req, res) {
  const invoice = await InvoiceService.findByIdWithItems(req.params.id, req.user.orgId);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });
  if (!invoice.client_email) return res.status(400).json({ error: 'This client has no email address on file.' });

  const { rows: brandingRows } = await require('../db').query(
    `SELECT display_name, primary_color, sender_name, sender_email FROM org_branding WHERE org_id=$1`,
    [req.user.orgId]
  );
  const branding = brandingRows[0] || null;
  const pdf = await renderInvoicePdf(invoice, branding);

  // Ensure share token exists
  if (!invoice.share_token) {
    const { rows } = await require('../db').query(
      `UPDATE invoices SET share_token = gen_random_uuid(), updated_at = now() WHERE id = $1 RETURNING share_token`,
      [invoice.id]
    );
    invoice.share_token = rows[0].share_token;
  }

  const viewUrl = `${process.env.FRONTEND_ORIGIN || ''}/invoices/shared/${invoice.share_token}`;
  const orgName = branding?.display_name || 'Your supplier';

  const result = await sendMail({
    to: invoice.client_email,
    subject: `Invoice ${invoice.invoice_number} from ${orgName}`,
    html: `<p>Hi ${invoice.client_name || ''},</p><p>Please find invoice <strong>${invoice.invoice_number}</strong> attached, totalling <strong>NGN ${Number(invoice.total).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</strong>${invoice.due_date ? ` (due ${new Date(invoice.due_date).toLocaleDateString()})` : ''}.</p><p>You can also view it online: <a href="${viewUrl}">${viewUrl}</a></p><p>Thank you,<br/>${orgName}</p>`,
    fromName: branding?.sender_name || branding?.display_name || 'DigitPen Hub',
    attachments: [{ filename: `invoice-${invoice.invoice_number}.pdf`, content: pdf }],
  });

  if (!result.ok) return res.status(502).json({ error: `Could not send email: ${result.error}` });

  // Mark as sent and notify
  await InvoiceService.update(invoice.id, { status: 'sent' }, req.user.orgId, req.user.id);
  notify(req.user.orgId, {
    type: 'invoice_sent',
    title: 'Invoice sent to client',
    body: `Invoice ${invoice.invoice_number} was emailed to ${invoice.client_email}.`,
  });

  res.json({ invoice: { ...invoice, status: 'sent' }, emailedTo: invoice.client_email });
}

module.exports = {
  listClients, createClient, updateClient, deleteClient,
  listInvoices, createInvoice, getInvoice, getPublicInvoice,
  shareInvoice, updateInvoice, deleteInvoice,
  getInvoicePdf, sendInvoiceEmail,
};
