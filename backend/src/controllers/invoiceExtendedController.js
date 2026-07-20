const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');

exports.createPaymentLink = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM invoices WHERE id = $1 AND org_id = $2`, [req.params.id, req.user.orgId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Invoice not found' });
  const ref = 'pay_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  await db.query(
    `UPDATE invoices SET payment_link = $1 WHERE id = $2 RETURNING *`,
    [`https://pay.digitpenhub.com/invoice/${rows[0].invoice_number}/${ref}`, req.params.id]
  );
  await db.query(
    `INSERT INTO invoice_payment_attempts (invoice_id, method, status, reference) VALUES ($1,'link','pending',$2)`,
    [req.params.id, ref]
  );
  const { rows: updated } = await db.query(`SELECT * FROM invoices WHERE id = $1`, [req.params.id]);
  res.json({ invoice: updated[0], paymentUrl: updated[0].payment_link });
});

exports.getPaymentHistory = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT ipa.* FROM invoice_payment_attempts ipa
     JOIN invoices i ON i.id = ipa.invoice_id
     WHERE ipa.invoice_id = $1 AND i.org_id = $2
     ORDER BY ipa.created_at DESC`, [req.params.id, req.user.orgId]
  );
  res.json({ payments: rows });
});

exports.createRecurring = asyncHandler(async (req, res) => {
  const { clientName, clientEmail, description, amount, frequency, nextDate, endDate } = req.body;
  if (!clientName || !description || !amount || !frequency || !nextDate)
    return res.status(400).json({ error: 'clientName, description, amount, frequency, nextDate required' });
  const { rows } = await db.query(
    `INSERT INTO invoice_recurring (org_id, client_name, client_email, description, amount, frequency, next_date, end_date, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [req.user.orgId, clientName, clientEmail || null, description, amount, frequency, nextDate, endDate || null, req.user.id]
  );
  res.status(201).json({ recurring: rows[0] });
});

exports.listRecurring = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM invoice_recurring WHERE org_id = $1 ORDER BY next_date ASC', [req.user.orgId]
  );
  res.json({ recurring: rows });
});

exports.sendInvoiceEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  const { rows } = await db.query(
    `UPDATE invoices SET sent_to_email = $1, sent_at = NOW(), status = 'sent' WHERE id = $2 AND org_id = $3 RETURNING *`,
    [email, req.params.id, req.user.orgId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Invoice not found' });
  res.json({ invoice: rows[0], message: `Invoice sent to ${email}` });
});
