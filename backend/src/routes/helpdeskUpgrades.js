const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

// ── SLA Management ────────────────────────────────────────────────────────────
router.get('/slas', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM helpdesk_slas WHERE org_id = $1 ORDER BY
     array_position(ARRAY['urgent','high','medium','low'], priority)`,
    [req.user.orgId]
  );
  res.json({ slas: rows });
}));

router.post('/slas', asyncHandler(async (req, res) => {
  const { name, priority, responseHours, resolutionHours, escalateAfterHours, escalateToRole, isDefault } = req.body || {};
  if (!name || !priority || !responseHours || !resolutionHours) {
    return res.status(400).json({ error: 'name, priority, responseHours, resolutionHours required.' });
  }
  const { rows } = await db.query(
    `INSERT INTO helpdesk_slas (org_id, name, priority, response_hours, resolution_hours, escalate_after_hours, escalate_to_role, is_default)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (org_id, priority) DO UPDATE SET name=$2, response_hours=$4, resolution_hours=$5, escalate_after_hours=$6, escalate_to_role=$7
     RETURNING *`,
    [req.user.orgId, name, priority, responseHours, resolutionHours, escalateAfterHours || null, escalateToRole || null, isDefault || false]
  );
  res.status(201).json({ sla: rows[0] });
}));

router.delete('/slas/:id', asyncHandler(async (req, res) => {
  await db.query(`DELETE FROM helpdesk_slas WHERE id = $1 AND org_id = $2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}));

// ── Track ticket response time ────────────────────────────────────────────────
router.post('/tickets/:id/responded', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `UPDATE helpdesk_tickets SET first_response_at = COALESCE(first_response_at, now()) WHERE id = $1 AND org_id = $2 RETURNING *`,
    [req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Ticket not found.' });
  res.json({ ticket: rows[0] });
}));

router.post('/tickets/:id/resolve', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `UPDATE helpdesk_tickets SET resolution_at = now(), status = 'resolved' WHERE id = $1 AND org_id = $2 RETURNING *`,
    [req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Ticket not found.' });
  res.json({ ticket: rows[0] });
}));

// ── Escalations ───────────────────────────────────────────────────────────────
router.get('/escalations', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const conditions = ['e.org_id = $1'];
  const params = [req.user.orgId]; let idx = 2;
  if (status === 'open') { conditions.push(`e.resolved_at IS NULL`); }
  if (status === 'resolved') { conditions.push(`e.resolved_at IS NOT NULL`); }
  const { rows } = await db.query(
    `SELECT e.*, t.subject, t.ticket_number FROM helpdesk_escalations e
     LEFT JOIN helpdesk_tickets t ON t.id = e.ticket_id
     WHERE ${conditions.join(' AND ')} ORDER BY e.escalated_at DESC`,
    params
  );
  res.json({ escalations: rows });
}));

router.post('/tickets/:id/escalate', asyncHandler(async (req, res) => {
  const { note } = req.body || {};
  const { rows } = await db.query(
    `INSERT INTO helpdesk_escalations (org_id, ticket_id, escalation_type, escalated_by, note)
     VALUES ($1, $2, 'custom', $3, $4) RETURNING *`,
    [req.user.orgId, req.params.id, req.user.id, note || null]
  );
  await db.query(`UPDATE helpdesk_tickets SET status = 'escalated' WHERE id = $1`, [req.params.id]);
  res.status(201).json({ escalation: rows[0] });
}));

router.post('/escalations/:id/resolve', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `UPDATE helpdesk_escalations SET resolved_at = now() WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Escalation not found.' });
  res.json({ escalation: rows[0] });
}));

// ── SLA status for dashboard ──────────────────────────────────────────────────
router.get('/sla-status', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT
       count(*) AS total,
       sum(CASE WHEN first_response_at IS NULL AND created_at < now() - interval '4 hours' THEN 1 ELSE 0 END) AS response_breached,
       sum(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) AS urgent,
       sum(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) AS high
     FROM helpdesk_tickets WHERE org_id = $1 AND status NOT IN ('resolved','closed')`,
    [req.user.orgId]
  );
  res.json({ status: rows[0] });
}));

module.exports = router;
