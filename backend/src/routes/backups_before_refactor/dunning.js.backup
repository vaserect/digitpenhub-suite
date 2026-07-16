const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

// ── Dunning templates ─────────────────────────────────────────────────────────
router.get('/templates', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM dunning_templates WHERE org_id = $1 OR (org_id IS NULL AND is_default = true)
     ORDER BY org_id NULLS LAST, name`,
    [req.user.orgId]
  );
  res.json({ templates: rows });
}));

router.post('/templates', asyncHandler(async (req, res) => {
  const { name, schedule, maxRetries } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'Template name is required.' });
  const { rows } = await db.query(
    `INSERT INTO dunning_templates (org_id, name, schedule, max_retries) VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.user.orgId, name.trim(), JSON.stringify(schedule || []), maxRetries || 3]
  );
  res.status(201).json({ template: rows[0] });
}));

// ── Active dunning cycles ─────────────────────────────────────────────────────
router.get('/cycles', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const conditions = ['org_id = $1'];
  const params = [req.user.orgId];
  let idx = 2;
  if (status) { conditions.push(`status = $${idx++}`); params.push(status); }
  const { rows } = await db.query(
    `SELECT dc.*
     FROM dunning_cycles dc
     WHERE ${conditions.join(' AND ')}
     ORDER BY dc.started_at DESC`,
    params
  );
  // Optionally attach subscription info per cycle
  for (const cycle of rows) {
    if (cycle.subscription_id) {
      const { rows: sub } = await db.query(
        `SELECT p.name AS plan_name, p.price_ngn FROM subscriptions s
         JOIN plans p ON p.id = s.plan_id WHERE s.id = $1`,
        [cycle.subscription_id]
      );
      if (sub.length) {
        cycle.plan_name = sub[0].plan_name;
        cycle.price_ngn = sub[0].price_ngn;
      }
    }
    const { rows: actions } = await db.query(
      `SELECT action_type, executed_at, success FROM dunning_actions WHERE cycle_id = $1 ORDER BY executed_at`,
      [cycle.id]
    );
    cycle.actions = actions;
  }
  res.json({ cycles: rows });
}));

// ── Manually trigger a dunning cycle for a subscription ───────────────────────
router.post('/trigger', asyncHandler(async (req, res) => {
  const { subscriptionId, amountDue } = req.body || {};
  if (!subscriptionId) return res.status(400).json({ error: 'subscriptionId is required.' });

  // Verify subscription belongs to org
  const { rows: sub } = await db.query(
    `SELECT * FROM subscriptions WHERE id = $1 AND org_id = $2`,
    [subscriptionId, req.user.orgId]
  );
  if (!sub.length) return res.status(404).json({ error: 'Subscription not found.' });

  // Check for existing unresolved cycle
  const { rows: existing } = await db.query(
    `SELECT id FROM dunning_cycles WHERE org_id = $1 AND subscription_id = $2 AND status NOT IN ('resolved','suspended')`,
    [req.user.orgId, subscriptionId]
  );
  if (existing.length) return res.status(409).json({ error: 'An active dunning cycle already exists for this subscription.' });

  const { rows } = await db.query(
    `INSERT INTO dunning_cycles (org_id, subscription_id, amount_due, next_action_at)
     VALUES ($1, $2, $3, now() + interval '3 days') RETURNING *`,
    [req.user.orgId, subscriptionId, amountDue || 0]
  );

  // Log the initial action
  await db.query(
    `INSERT INTO dunning_actions (cycle_id, action_type, detail)
     VALUES ($1, 'email_reminder', 'Dunning cycle started — first payment reminder will be sent in 3 days.')`,
    [rows[0].id]
  );

  res.status(201).json({ cycle: rows[0] });
}));

// ── Resolve a dunning cycle ───────────────────────────────────────────────────
router.post('/cycles/:id/resolve', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `UPDATE dunning_cycles SET status = 'resolved', resolved_at = now(), next_action_at = NULL
     WHERE id = $1 AND org_id = $2 RETURNING *`,
    [req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Cycle not found.' });
  await db.query(
    `INSERT INTO dunning_actions (cycle_id, action_type, detail) VALUES ($1, 'resolved', 'Payment received — dunning cycle closed.')`,
    [rows[0].id]
  );
  res.json({ cycle: rows[0] });
}));

// ── Dunning action history for a cycle ────────────────────────────────────────
router.get('/cycles/:id/actions', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM dunning_actions WHERE cycle_id = $1 ORDER BY executed_at ASC`,
    [req.params.id]
  );
  res.json({ actions: rows });
}));

// Delete template
router.delete('/templates/:id', asyncHandler(async (req, res) => {
  const { rowCount } = await db.query(
    `DELETE FROM dunning_templates WHERE id = $1 AND org_id = $2`,
    [req.params.id, req.user.orgId]
  );
  if (!rowCount) return res.status(404).json({ error: 'Template not found.' });
  res.json({ ok: true });
}));

const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
router.post('/templates/bulk-delete', bulkDeleteHandler('dunning_templates'));
router.get('/templates/export', async (req, res) => { const { rows } = await db.query("SELECT id, name, max_retries, schedule, created_at FROM dunning_templates WHERE org_id = $1 ORDER BY name", [req.user.orgId]); sendCsv(res, 'dunning_templates.csv', rows, autoColumns(rows)); });
router.get('/templates/stats', async (req, res) => { const { rows } = await db.query("SELECT count(*)::int AS total FROM dunning_templates WHERE org_id = $1", [req.user.orgId]); res.json({ stats: rows[0] }); });
router.post('/cycles/bulk-delete', bulkDeleteHandler('dunning_cycles'));
router.get('/cycles/export', async (req, res) => { const { rows } = await db.query("SELECT id, subscription_id, amount_due, status, started_at FROM dunning_cycles WHERE org_id = $1 ORDER BY started_at DESC", [req.user.orgId]); sendCsv(res, 'dunning_cycles.csv', rows, autoColumns(rows)); });
router.get('/cycles/stats', async (req, res) => { const { rows } = await db.query("SELECT count(*)::int AS total, count(*) FILTER (WHERE status='active')::int AS active FROM dunning_cycles WHERE org_id = $1", [req.user.orgId]); res.json({ stats: rows[0] }); });

module.exports = router;
