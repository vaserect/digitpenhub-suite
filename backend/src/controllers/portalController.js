const db = require('../db');

// ── Public (no auth) ──────────────────────────────────────────────────────────

async function getPortalByToken(req, res) {
  const { token } = req.params;

  const clientRes = await db.query(
    `SELECT ic.id, ic.name, ic.company, ic.email, ic.org_id,
            o.name AS org_name
     FROM invoice_clients ic
     JOIN organizations o ON o.id = ic.org_id
     WHERE ic.portal_token = $1`,
    [token]
  );
  if (!clientRes.rows.length) return res.status(404).json({ error: 'Portal not found or link has been revoked.' });

  const client = clientRes.rows[0];

  const invoicesRes = await db.query(
    `SELECT id, invoice_number, status, issue_date, due_date,
            subtotal, tax_rate, total, notes
     FROM invoices
     WHERE client_id = $1 AND org_id = $2
     ORDER BY issue_date DESC, created_at DESC`,
    [client.id, client.org_id]
  );

  const invoiceIds = invoicesRes.rows.map((i) => i.id);
  let itemRows = [];
  if (invoiceIds.length > 0) {
    const itemsRes = await db.query(
      `SELECT invoice_id, description, quantity, unit_price, amount
       FROM invoice_items WHERE invoice_id = ANY($1) ORDER BY id`,
      [invoiceIds]
    );
    itemRows = itemsRes.rows;
  }

  const itemsByInvoice = {};
  itemRows.forEach((item) => {
    (itemsByInvoice[item.invoice_id] ||= []).push(item);
  });

  const invoices = invoicesRes.rows.map((i) => ({
    ...i,
    subtotal: Number(i.subtotal),
    total:    Number(i.total),
    items:    (itemsByInvoice[i.id] || []).map((it) => ({
      description: it.description,
      quantity:    Number(it.quantity),
      unit_price:  Number(it.unit_price),
      amount:      Number(it.amount),
    })),
  }));

  res.json({
    client: { name: client.name, company: client.company, email: client.email },
    org:    { name: client.org_name },
    invoices,
  });
}

// ── Private (auth required) ───────────────────────────────────────────────────

async function listPortalClients(req, res) {
  const { rows } = await db.query(
    `SELECT ic.id, ic.name, ic.company, ic.email, ic.portal_token,
            COUNT(i.id)::int                                                     AS invoice_count,
            COALESCE(SUM(i.total), 0)                                            AS total_billed,
            COALESCE(SUM(i.total) FILTER (WHERE i.status = 'paid'), 0)          AS total_paid,
            COALESCE(SUM(i.total) FILTER (WHERE i.status = 'pending'), 0)       AS total_pending,
            MAX(i.issue_date)                                                    AS last_invoice_date
     FROM invoice_clients ic
     LEFT JOIN invoices i ON i.client_id = ic.id AND i.org_id = ic.org_id
     WHERE ic.org_id = $1
     GROUP BY ic.id
     ORDER BY ic.name`,
    [req.user.orgId]
  );
  res.json({
    clients: rows.map((r) => ({
      ...r,
      total_billed:  Number(r.total_billed),
      total_paid:    Number(r.total_paid),
      total_pending: Number(r.total_pending),
    })),
  });
}

async function generatePortalToken(req, res) {
  const { id } = req.params;
  const { rows } = await db.query(
    `UPDATE invoice_clients
     SET portal_token = gen_random_uuid()
     WHERE id = $1 AND org_id = $2
     RETURNING portal_token`,
    [id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Client not found.' });
  res.json({ portal_token: rows[0].portal_token });
}

async function revokePortalToken(req, res) {
  const { id } = req.params;
  const { rowCount } = await db.query(
    `UPDATE invoice_clients SET portal_token = NULL WHERE id = $1 AND org_id = $2`,
    [id, req.user.orgId]
  );
  if (!rowCount) return res.status(404).json({ error: 'Client not found.' });
  res.json({ ok: true });
}

module.exports = { getPortalByToken, listPortalClients, generatePortalToken, revokePortalToken };
