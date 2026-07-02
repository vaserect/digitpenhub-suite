const db = require('../db');
const { notify } = require('../utils/notify');

function normalizeItems(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      description: item.description || '',
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      amount: Number(item.amount) || (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
    }))
    .filter((item) => item.description.trim());
}

function calculateTotals(items, providedSubtotal, providedTaxRate, providedTotal) {
  const lineSubtotal = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const subtotal = providedSubtotal !== undefined && providedSubtotal !== null && providedSubtotal !== ''
    ? Number(providedSubtotal)
    : lineSubtotal;
  const taxRate = providedTaxRate !== undefined && providedTaxRate !== null && providedTaxRate !== ''
    ? Number(providedTaxRate)
    : 0;
  const total = providedTotal !== undefined && providedTotal !== null && providedTotal !== ''
    ? Number(providedTotal)
    : subtotal + (subtotal * taxRate / 100);
  return { subtotal, taxRate, total };
}

function normalizeInvoiceStatus(status) {
  return ['draft', 'sent', 'paid'].includes(status) ? status : 'draft';
}

function normalizeInvoiceDate(value) {
  if (value === undefined || value === null || value === '') return new Date().toISOString().slice(0, 10);
  return value;
}

async function listClients(req, res) {
  const { rows } = await db.query(
    `SELECT id, name, email, phone, company, address, created_at
     FROM invoice_clients
     WHERE org_id = $1
     ORDER BY created_at DESC`,
    [req.user.orgId]
  );
  res.json({ clients: rows });
}

async function createClient(req, res) {
  const { name, email, phone, company, address } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required.' });

  const { rows } = await db.query(
    `INSERT INTO invoice_clients (org_id, name, email, phone, company, address)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id, name, email, phone, company, address, created_at`,
    [req.user.orgId, name, email || null, phone || null, company || null, address || null]
  );

  res.status(201).json({ client: rows[0] });
}

async function updateClient(req, res) {
  const { id } = req.params;
  const { name, email, phone, company, address } = req.body || {};

  const { rows } = await db.query(
    `UPDATE invoice_clients
     SET name = COALESCE($1, name),
         email = COALESCE($2, email),
         phone = COALESCE($3, phone),
         company = COALESCE($4, company),
         address = COALESCE($5, address),
         updated_at = now()
     WHERE id = $6 AND org_id = $7
     RETURNING id, name, email, phone, company, address, created_at`,
    [name || null, email || null, phone || null, company || null, address || null, id, req.user.orgId]
  );

  if (!rows.length) return res.status(404).json({ error: 'Client not found.' });
  res.json({ client: rows[0] });
}

async function deleteClient(req, res) {
  const { id } = req.params;
  const { rows } = await db.query(
    `DELETE FROM invoice_clients WHERE id = $1 AND org_id = $2 RETURNING id`,
    [id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Client not found.' });
  res.json({ ok: true });
}

async function listInvoices(req, res) {
  const { rows } = await db.query(
    `SELECT i.id, i.invoice_number, i.status, i.issue_date, i.due_date, i.subtotal, i.tax_rate, i.total,
            c.id AS client_id, c.name AS client_name, c.company AS client_company
     FROM invoices i
     LEFT JOIN invoice_clients c ON c.id = i.client_id
     WHERE i.org_id = $1
     ORDER BY i.created_at DESC`,
    [req.user.orgId]
  );

  res.json({ invoices: rows });
}

async function createInvoice(req, res) {
  const { clientId, invoiceNumber, status, issueDate, dueDate, subtotal, taxRate, total, notes, items } = req.body || {};
  if (!invoiceNumber || !String(invoiceNumber).trim()) return res.status(400).json({ error: 'invoiceNumber is required.' });

  const normalizedItems = normalizeItems(items);
  if (!normalizedItems.length) {
    return res.status(400).json({ error: 'At least one invoice line item is required.' });
  }
  const totals = calculateTotals(normalizedItems, subtotal, taxRate, total);
  const normalizedStatus = normalizeInvoiceStatus(status);
  const normalizedIssueDate = normalizeInvoiceDate(issueDate);

  const { rows } = await db.query(
    `INSERT INTO invoices (org_id, client_id, invoice_number, status, issue_date, due_date, subtotal, tax_rate, total, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING id, invoice_number, status, issue_date, due_date, subtotal, tax_rate, total, notes`,
    [req.user.orgId, clientId || null, invoiceNumber, normalizedStatus, normalizedIssueDate, dueDate || null, totals.subtotal, totals.taxRate, totals.total, notes || null]
  );

  const invoice = rows[0];
  if (normalizedItems.length) {
    for (const item of normalizedItems) {
      await db.query(
        `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount)
         VALUES ($1,$2,$3,$4,$5)`,
        [invoice.id, item.description, item.quantity, item.unitPrice, item.amount]
      );
    }
  }

  res.status(201).json({ invoice });
}

async function getInvoice(req, res) {
  const { id } = req.params;
  const invoiceResult = await db.query(
    `SELECT i.id, i.invoice_number, i.status, i.issue_date, i.due_date, i.subtotal, i.tax_rate, i.total, i.notes, i.share_token,
            c.id AS client_id, c.name AS client_name, c.company AS client_company
     FROM invoices i
     LEFT JOIN invoice_clients c ON c.id = i.client_id
     WHERE i.id = $1 AND i.org_id = $2`,
    [id, req.user.orgId]
  );

  if (!invoiceResult.rows.length) return res.status(404).json({ error: 'Invoice not found.' });

  const itemsResult = await db.query(
    `SELECT id, description, quantity, unit_price, amount FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at`,
    [id]
  );

  res.json({ invoice: { ...invoiceResult.rows[0], items: itemsResult.rows } });
}

async function getPublicInvoice(req, res) {
  const { token } = req.params;
  const invoiceResult = await db.query(
    `SELECT i.id, i.invoice_number, i.status, i.issue_date, i.due_date, i.subtotal, i.tax_rate, i.total, i.notes,
            c.id AS client_id, c.name AS client_name, c.company AS client_company
     FROM invoices i
     LEFT JOIN invoice_clients c ON c.id = i.client_id
     WHERE i.share_token = $1`,
    [token]
  );

  if (!invoiceResult.rows.length) return res.status(404).json({ error: 'Invoice not found.' });

  const invoice = invoiceResult.rows[0];
  const itemsResult = await db.query(
    `SELECT id, description, quantity, unit_price, amount FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at`,
    [invoice.id]
  );

  res.json({ invoice: { ...invoice, items: itemsResult.rows } });
}

async function shareInvoice(req, res) {
  const { id } = req.params;
  const tokenResult = await db.query(
    `SELECT share_token FROM invoices WHERE id = $1 AND org_id = $2`,
    [id, req.user.orgId]
  );

  if (!tokenResult.rows.length) return res.status(404).json({ error: 'Invoice not found.' });

  let { share_token: shareToken } = tokenResult.rows[0];
  if (!shareToken) {
    const { rows } = await db.query(
      `UPDATE invoices SET share_token = gen_random_uuid(), updated_at = now() WHERE id = $1 AND org_id = $2 RETURNING share_token`,
      [id, req.user.orgId]
    );
    shareToken = rows[0].share_token;
  }

  res.json({ shareToken });
}

async function updateInvoice(req, res) {
  const { id } = req.params;
  const { clientId, invoiceNumber, status, issueDate, notes, dueDate, subtotal, taxRate, total, items } = req.body || {};
  if (invoiceNumber !== undefined && (!invoiceNumber || !String(invoiceNumber).trim())) {
    return res.status(400).json({ error: 'invoiceNumber is required.' });
  }
  const hasStatus = Object.prototype.hasOwnProperty.call(req.body || {}, 'status');
  const hasIssueDate = Object.prototype.hasOwnProperty.call(req.body || {}, 'issueDate');
  const normalizedStatus = hasStatus ? normalizeInvoiceStatus(status) : null;
  const normalizedIssueDate = hasIssueDate ? normalizeInvoiceDate(issueDate) : null;

  const { rows } = await db.query(
    `UPDATE invoices
     SET client_id = COALESCE($1, client_id),
         invoice_number = COALESCE($2, invoice_number),
         status = COALESCE($3, status),
         issue_date = COALESCE($4, issue_date),
         due_date = COALESCE($5, due_date),
         subtotal = COALESCE($6, subtotal),
         tax_rate = COALESCE($7, tax_rate),
         total = COALESCE($8, total),
         notes = COALESCE($9, notes),
         updated_at = now()
     WHERE id = $10 AND org_id = $11
     RETURNING id, invoice_number, status, issue_date, due_date, subtotal, tax_rate, total, notes`,
    [clientId || null, invoiceNumber || null, normalizedStatus || null, normalizedIssueDate, dueDate || null, subtotal ?? null, taxRate ?? null, total ?? null, notes || null, id, req.user.orgId]
  );

  if (!rows.length) return res.status(404).json({ error: 'Invoice not found.' });

  if (normalizedStatus === 'paid') {
    notify(req.user.orgId, {
      type: 'invoice_paid',
      title: 'Invoice marked as paid',
      body: `Invoice ${rows[0].invoice_number} has been marked as paid.`,
      link: null,
      email: true,
    });
  } else if (normalizedStatus === 'sent') {
    notify(req.user.orgId, {
      type: 'invoice_sent',
      title: 'Invoice sent to client',
      body: `Invoice ${rows[0].invoice_number} has been sent.`,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'items')) {
    await db.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);
    const normalizedItems = normalizeItems(items);
    if (normalizedItems.length) {
      for (const item of normalizedItems) {
        await db.query(
          `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount)
           VALUES ($1,$2,$3,$4,$5)`,
          [id, item.description, item.quantity, item.unitPrice, item.amount]
        );
      }
    }
  }

  const itemsResult = await db.query(
    `SELECT id, description, quantity, unit_price, amount FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at`,
    [id]
  );

  res.json({ invoice: { ...rows[0], items: itemsResult.rows } });
}

async function deleteInvoice(req, res) {
  const { id } = req.params;
  const { rows } = await db.query(
    `DELETE FROM invoices WHERE id = $1 AND org_id = $2 RETURNING id`,
    [id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Invoice not found.' });
  res.json({ ok: true });
}

module.exports = {
  listClients,
  createClient,
  updateClient,
  deleteClient,
  listInvoices,
  createInvoice,
  getInvoice,
  getPublicInvoice,
  shareInvoice,
  updateInvoice,
  deleteInvoice,
};
