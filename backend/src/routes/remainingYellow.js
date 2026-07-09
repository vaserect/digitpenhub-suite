const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

// ── Live Chat (public: track, protected: read) ────────────────────────────────
router.post('/chat/track', asyncHandler(async (req, res) => {
  const { orgId, visitorId, message, direction } = req.body || {};
  if (!orgId || !visitorId || !message) return res.status(400).json({ error: 'orgId, visitorId, and message required.' });
  await db.query(
    `INSERT INTO live_chat_messages (org_id, visitor_id, message, direction) VALUES ($1,$2,$3,$4)`,
    [orgId, visitorId, message, direction || 'visitor']
  );
  res.json({ ok: true });
}));

router.use(requireAuth);

router.get('/chat', asyncHandler(async (req, res) => {
  const { visitorId, since } = req.query;
  const conditions = ['org_id = $1'];
  const params = [req.user.orgId];
  let idx = 2;
  if (visitorId) { conditions.push(`visitor_id = $${idx++}`); params.push(visitorId); }
  if (since) { conditions.push(`created_at > $${idx++}`); params.push(since); }
  const { rows } = await db.query(`SELECT * FROM live_chat_messages WHERE ${conditions.join(' AND ')} ORDER BY created_at ASC`, params);
  res.json({ messages: rows });
}));

router.post('/chat/send', asyncHandler(async (req, res) => {
  const { visitorId, message } = req.body || {};
  if (!visitorId || !message) return res.status(400).json({ error: 'visitorId and message required.' });
  const { rows } = await db.query(
    `INSERT INTO live_chat_messages (org_id, visitor_id, message, direction, agent_id) VALUES ($1,$2,$3,'agent',$4) RETURNING *`,
    [req.user.orgId, visitorId, message, req.user.id]
  );
  res.json({ message: rows[0] });
}));

// ── NPS/CSAT ──────────────────────────────────────────────────────────────────
router.post('/nps', asyncHandler(async (req, res) => {
  const { score, comment, source, respondentEmail } = req.body || {};
  if (score === undefined || score < 0 || score > 10) return res.status(400).json({ error: 'score must be 0-10.' });
  const { rows } = await db.query(
    `INSERT INTO nps_surveys (org_id, score, comment, source, respondent_email) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.orgId, score, comment || null, source || null, respondentEmail || null]
  );
  res.status(201).json({ survey: rows[0] });
}));

router.get('/nps', asyncHandler(async (req, res) => {
  const { rows } = await db.query(`SELECT * FROM nps_surveys WHERE org_id = $1 ORDER BY created_at DESC`, [req.user.orgId]);
  // Calculate stats
  const total = rows.length;
  const promoters = rows.filter(r => r.score >= 9).length;
  const detractors = rows.filter(r => r.score <= 6).length;
  const nps = total ? Math.round(((promoters - detractors) / total) * 100) : 0;
  res.json({ surveys: rows, stats: { total, promoters, detractors, nps } });
}));

// ── Customer Health Score ─────────────────────────────────────────────────────
router.get('/health', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM customer_health_scores WHERE org_id = $1 ORDER BY score DESC`, [req.user.orgId]
  );
  res.json({ scores: rows });
}));

router.put('/health/:customerId', asyncHandler(async (req, res) => {
  const { score, factors } = req.body || {};
  if (score === undefined) return res.status(400).json({ error: 'score is required.' });
  const { rows } = await db.query(
    `INSERT INTO customer_health_scores (org_id, customer_id, score, factors)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (org_id, customer_id) DO UPDATE SET score=$3, factors=$4, calculated_at=now()
     RETURNING *`,
    [req.user.orgId, req.params.customerId, score, JSON.stringify(factors || {})]
  );
  res.json({ score: rows[0] });
}));

// ── Usage-Based Billing ───────────────────────────────────────────────────────
router.post('/usage', asyncHandler(async (req, res) => {
  const { metric, quantity } = req.body || {};
  if (!metric || quantity === undefined) return res.status(400).json({ error: 'metric and quantity required.' });
  const { rows } = await db.query(
    `INSERT INTO usage_records (org_id, metric, quantity) VALUES ($1,$2,$3) RETURNING *`,
    [req.user.orgId, metric, quantity]
  );
  res.status(201).json({ record: rows[0] });
}));

router.get('/usage', asyncHandler(async (req, res) => {
  const { metric, from, to } = req.query;
  const conditions = ['org_id = $1'];
  const params = [req.user.orgId];
  let idx = 2;
  if (metric) { conditions.push(`metric = $${idx++}`); params.push(metric); }
  if (from) { conditions.push(`recorded_at >= $${idx++}`); params.push(from); }
  if (to) { conditions.push(`recorded_at <= $${idx++}`); params.push(to); }
  const { rows } = await db.query(`SELECT * FROM usage_records WHERE ${conditions.join(' AND ')} ORDER BY recorded_at DESC`, params);
  res.json({ records: rows });
}));

// ── Revenue Recognition ───────────────────────────────────────────────────────
router.get('/revenue', asyncHandler(async (req, res) => {
  const { from, to, status } = req.query;
  const conditions = ['org_id = $1'];
  const params = [req.user.orgId];
  let idx = 2;
  if (from) { conditions.push(`recognized_at >= $${idx++}`); params.push(from); }
  if (to) { conditions.push(`recognized_at <= $${idx++}`); params.push(to); }
  if (status) { conditions.push(`status = $${idx++}`); params.push(status); }
  const { rows } = await db.query(`SELECT * FROM revenue_schedules WHERE ${conditions.join(' AND ')} ORDER BY recognized_at`, params);
  res.json({ schedules: rows });
}));

router.post('/revenue', asyncHandler(async (req, res) => {
  const { subscriptionId, amount, recognizedAt } = req.body || {};
  if (!amount || !recognizedAt) return res.status(400).json({ error: 'amount and recognizedAt required.' });
  const { rows } = await db.query(
    `INSERT INTO revenue_schedules (org_id, subscription_id, amount, recognized_at) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.orgId, subscriptionId || null, amount, recognizedAt]
  );
  res.status(201).json({ schedule: rows[0] });
}));

// ── Subscription Self-Service ─────────────────────────────────────────────────
router.post('/subscription/pause', asyncHandler(async (req, res) => {
  const { resumeAt } = req.body || {};
  const { rows } = await db.query(
    `UPDATE subscriptions SET paused_at = now(), resume_at = $1 WHERE org_id = $2 RETURNING *`,
    [resumeAt || null, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'No subscription found.' });
  res.json({ subscription: rows[0] });
}));

router.post('/subscription/resume', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `UPDATE subscriptions SET paused_at = NULL, resume_at = NULL WHERE org_id = $1 RETURNING *`,
    [req.user.orgId]
  );
  res.json({ subscription: rows[0] });
}));

// ── Compliance Evidence Dashboard ─────────────────────────────────────────────
router.get('/compliance/:standard', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM compliance_evidence WHERE org_id = $1 AND standard = $2 ORDER BY control_id`,
    [req.user.orgId, req.params.standard]
  );
  res.json({ evidence: rows });
}));

router.put('/compliance/:standard/:controlId', asyncHandler(async (req, res) => {
  const { status, evidence, expiresAt } = req.body || {};
  const { rows } = await db.query(
    `INSERT INTO compliance_evidence (org_id, standard, control_id, status, evidence, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (org_id, standard, control_id)
     DO UPDATE SET status=$4, evidence=$5, expires_at=$6
     RETURNING *`,
    [req.user.orgId, req.params.standard, req.params.controlId, status || 'pending',
     JSON.stringify(evidence || {}), expiresAt || null]
  );
  res.json({ evidence: rows[0] });
}));

// ── Data Residency ────────────────────────────────────────────────────────────
router.get('/residency', asyncHandler(async (req, res) => {
  const { rows } = await db.query(`SELECT data_residency_region, byok_enabled, byok_key_arn FROM organizations WHERE id = $1`, [req.user.orgId]);
  res.json({ settings: rows[0] });
}));

router.patch('/residency', asyncHandler(async (req, res) => {
  const { region, byokEnabled, byokKeyArn } = req.body || {};
  const updates = [];
  const params = [];
  let idx = 1;
  if (region) { updates.push(`data_residency_region = $${idx++}`); params.push(region); }
  if (byokEnabled !== undefined) { updates.push(`byok_enabled = $${idx++}`); params.push(byokEnabled); }
  if (byokKeyArn !== undefined) { updates.push(`byok_key_arn = $${idx++}`); params.push(byokKeyArn); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  params.push(req.user.orgId);
  await db.query(`UPDATE organizations SET ${updates.join(', ')} WHERE id = $${idx}`, params);
  res.json({ ok: true });
}));

// ── Developer Apps ────────────────────────────────────────────────────────────
router.get('/apps', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, name, description, redirect_uris, client_id, is_public, created_at FROM developer_apps WHERE org_id = $1 ORDER BY name`,
    [req.user.orgId]
  );
  res.json({ apps: rows });
}));

router.post('/apps', asyncHandler(async (req, res) => {
  const { name, description, redirectUris, isPublic } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required.' });
  const { rows } = await db.query(
    `INSERT INTO developer_apps (org_id, name, description, redirect_uris, is_public) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, client_id, client_secret, created_at`,
    [req.user.orgId, name, description || null, redirectUris || [], isPublic || false]
  );
  res.status(201).json({ app: rows[0] });
}));

router.delete('/apps/:id', asyncHandler(async (req, res) => {
  await db.query(`DELETE FROM developer_apps WHERE id = $1 AND org_id = $2`,
    [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}));

// ── Warranty Registration ─────────────────────────────────────────────────────
router.get('/warranties', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM warranty_registrations WHERE org_id = $1 ORDER BY registered_at DESC`, [req.user.orgId]);
  res.json({ registrations: rows });
}));

router.post('/warranties', asyncHandler(async (req, res) => {
  const { productId, customerName, customerEmail, purchaseDate, serialNumber } = req.body || {};
  if (!productId || !customerName || !customerEmail) return res.status(400).json({ error: 'productId, customerName, customerEmail required.' });
  const { rows } = await db.query(
    `INSERT INTO warranty_registrations (org_id, product_id, customer_name, customer_email, purchase_date, serial_number)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.orgId, productId, customerName, customerEmail, purchaseDate || null, serialNumber || null]
  );
  res.status(201).json({ registration: rows[0] });
}));

// ── Marketplace Disputes ──────────────────────────────────────────────────────
router.get('/disputes', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const conditions = ['org_id = $1'];
  const params = [req.user.orgId];
  let idx = 2;
  if (status) { conditions.push(`status = $${idx++}`); params.push(status); }
  const { rows } = await db.query(`SELECT * FROM marketplace_disputes WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`, params);
  res.json({ disputes: rows });
}));

router.post('/disputes', asyncHandler(async (req, res) => {
  const { orderId, raisedBy, reason } = req.body || {};
  if (!orderId || !raisedBy || !reason) return res.status(400).json({ error: 'orderId, raisedBy, and reason required.' });
  const { rows } = await db.query(
    `INSERT INTO marketplace_disputes (org_id, order_id, raised_by, reason) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.orgId, orderId, raisedBy, reason]
  );
  res.status(201).json({ dispute: rows[0] });
}));

router.patch('/disputes/:id', asyncHandler(async (req, res) => {
  const { status, resolution } = req.body || {};
  const { rows } = await db.query(
    `UPDATE marketplace_disputes SET status = $1, resolution = COALESCE($2, resolution), resolved_at = CASE WHEN $1 IN ('resolved','dismissed') THEN now() ELSE NULL END
     WHERE id = $3 AND org_id = $4 RETURNING *`,
    [status || 'resolved', resolution || null, req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ dispute: rows[0] });
}));

module.exports = router;
