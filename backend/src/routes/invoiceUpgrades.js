const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

// ── Set recurring frequency on an invoice ─────────────────────────────────────
router.patch('/:id/recurring', asyncHandler(async (req, res) => {
  const { frequency, endDate } = req.body || {};
  if (frequency && !['weekly','monthly','quarterly','yearly'].includes(frequency)) {
    return res.status(400).json({ error: 'frequency must be weekly, monthly, quarterly, or yearly' });
  }
  const { rows } = await db.query(
    `UPDATE invoices SET recurring_frequency = $1, recurring_end_date = $2, updated_at = now()
     WHERE id = $3 AND org_id = $4 RETURNING *`,
    [frequency || null, endDate || null, req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Invoice not found.' });
  res.json({ invoice: rows[0] });
}));

// ── Record payment ────────────────────────────────────────────────────────────
router.post('/:id/pay', asyncHandler(async (req, res) => {
  const { method, paidAt } = req.body || {};
  const { rows } = await db.query(
    `UPDATE invoices SET status = 'paid', payment_method = $1, paid_at = COALESCE($2, now()), updated_at = now()
     WHERE id = $3 AND org_id = $4 RETURNING *`,
    [method || 'manual', paidAt || null, req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Invoice not found.' });
  res.json({ invoice: rows[0] });
}));

// ── Mark as viewed ────────────────────────────────────────────────────────────
router.post('/:id/viewed', asyncHandler(async (req, res) => {
  await db.query(`UPDATE invoices SET viewed_at = COALESCE(viewed_at, now()) WHERE id = $1 AND org_id = $2`,
    [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}));

// ── Overdue invoices ─────────────────────────────────────────────────────────
router.get('/list-overdue', asyncHandler(async (req, res) => {
  const { days } = req.query;
  const daysOverdue = parseInt(days) || 1;
  const { rows } = await db.query(
    `SELECT i.*, ic.name AS client_name
     FROM invoices i JOIN invoice_clients ic ON ic.id = i.client_id
     WHERE i.org_id = $1 AND i.status = 'sent' AND i.due_date < now() - $2::interval
     ORDER BY i.due_date ASC`,
    [req.user.orgId, `${daysOverdue} days`]
  );
  res.json({ invoices: rows, count: rows.length });
}));

// ── Payment link generation ───────────────────────────────────────────────────
router.post('/:id/payment-link', asyncHandler(async (req, res) => {
  const { rows } = await db.query(`SELECT * FROM invoices WHERE id = $1 AND org_id = $2`, [req.params.id, req.user.orgId]);
  if (!rows.length) return res.status(404).json({ error: 'Invoice not found.' });
  const inv = rows[0];
  // Ensure share_token exists
  let token = inv.share_token;
  if (!token) {
    const crypto = require('crypto');
    token = crypto.randomUUID();
    await db.query(`UPDATE invoices SET share_token = $1 WHERE id = $2`, [token, req.params.id]);
  }
  const link = `${process.env.FRONTEND_ORIGIN || 'https://suite.digitpenhub.com'}/invoices/shared/${token}`;
  await db.query(`UPDATE invoices SET payment_link = $1, updated_at = now() WHERE id = $2`,
    [link, req.params.id]);
  res.json({ paymentLink: link, invoice: inv });
}));

module.exports = router;
