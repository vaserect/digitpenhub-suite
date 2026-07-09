const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const conditions = ['org_id = $1'];
  const params = [req.user.orgId];
  let idx = 2;
  if (status) { conditions.push(`status = $${idx++}`); params.push(status); }
  const { rows } = await db.query(
    `SELECT * FROM marketplace_payouts WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
    params
  );
  res.json({ payouts: rows });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { vendorId, amount, fee, periodStart, periodEnd } = req.body || {};
  if (!vendorId || !amount) return res.status(400).json({ error: 'vendorId and amount are required.' });
  const net = (parseFloat(amount) - parseFloat(fee || 0)).toFixed(2);
  const { rows } = await db.query(
    `INSERT INTO marketplace_payouts (org_id, vendor_id, amount, fee, net_amount, period_start, period_end)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [req.user.orgId, vendorId, amount, fee || 0, net, periodStart || null, periodEnd || null]
  );
  res.status(201).json({ payout: rows[0] });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!['pending', 'processing', 'paid', 'failed'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  const { rows } = await db.query(
    `UPDATE marketplace_payouts SET status = $1, paid_at = CASE WHEN $1 = 'paid' THEN now() ELSE NULL END WHERE id = $2 AND org_id = $3 RETURNING *`,
    [status, req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ payout: rows[0] });
}));

const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
router.post('/bulk-delete', bulkDeleteHandler('marketplace_payouts'));
router.get('/export', async (req, res) => { const { rows } = await db.query('SELECT id, vendor_id, amount, fee, net_amount, status, created_at FROM marketplace_payouts WHERE org_id = $1 ORDER BY created_at DESC', [req.user.orgId]); sendCsv(res, 'marketplace_payouts.csv', rows, autoColumns(rows)); });
router.get('/stats', async (req, res) => { const { rows } = await db.query("SELECT count(*)::int AS total, COALESCE(sum(amount),0)::numeric AS total_amount, COALESCE(sum(net_amount),0)::numeric AS total_net FROM marketplace_payouts WHERE org_id = $1", [req.user.orgId]); res.json({ stats: rows[0] }); });

module.exports = router;
