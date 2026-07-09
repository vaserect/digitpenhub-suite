const { Router } = require('express');
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

// The actual key is returned once at creation time — never stored in plaintext.
// key_hash is SHA-256 of the full key; key_prefix is the first 8 chars for
// UI identification.
function generateApiKey() {
  const raw = `dph_${crypto.randomBytes(32).toString('hex')}`;
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const prefix = raw.substring(0, 8) + '...';
  return { raw, hash, prefix };
}

router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, name, key_prefix, scopes, expires_at, last_used_at, created_at
     FROM api_keys WHERE org_id = $1 AND revoked_at IS NULL
     ORDER BY created_at DESC`,
    [req.user.orgId]
  );
  res.json({ keys: rows });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { name, scopes } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'API key name is required.' });

  const { raw, hash, prefix } = generateApiKey();
  const { rows } = await db.query(
    `INSERT INTO api_keys (org_id, name, key_prefix, key_hash, scopes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, key_prefix, scopes, created_at`,
    [req.user.orgId, name.trim(), prefix, hash,
     JSON.stringify(Array.isArray(scopes) ? scopes : ['read']), req.user.id]
  );
  res.status(201).json({ key: rows[0], rawKey: raw });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const { rowCount } = await db.query(
    `UPDATE api_keys SET revoked_at = now() WHERE id = $1 AND org_id = $2 AND revoked_at IS NULL`,
    [req.params.id, req.user.orgId]
  );
  if (!rowCount) return res.status(404).json({ error: 'Key not found.' });
  res.json({ ok: true });
}));

// ── Webhook endpoints ─────────────────────────────────────────────────────────

router.get('/webhooks', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, name, url, events, is_active, last_sent_at, last_error, created_at
     FROM webhook_endpoints WHERE org_id = $1 ORDER BY created_at DESC`,
    [req.user.orgId]
  );
  res.json({ webhooks: rows });
}));

router.post('/webhooks', asyncHandler(async (req, res) => {
  const { name, url, events } = req.body || {};
  if (!name?.trim() || !url) return res.status(400).json({ error: 'name and url are required.' });

  const secret = crypto.randomBytes(16).toString('hex');
  const { rows } = await db.query(
    `INSERT INTO webhook_endpoints (org_id, name, url, events, secret)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, name, url, events, is_active, created_at`,
    [req.user.orgId, name.trim(), url, events || [], secret]
  );
  res.status(201).json({ webhook: rows[0], secret });
}));

router.patch('/webhooks/:id', asyncHandler(async (req, res) => {
  const { name, url, events, isActive } = req.body || {};
  const updates = [];
  const params = [];
  let idx = 1;
  if (name !== undefined) { updates.push(`name = $${idx++}`); params.push(name); }
  if (url !== undefined) { updates.push(`url = $${idx++}`); params.push(url); }
  if (events !== undefined) { updates.push(`events = $${idx++}`); params.push(events); }
  if (isActive !== undefined) { updates.push(`is_active = $${idx++}`); params.push(isActive); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });

  params.push(req.params.id, req.user.orgId);
  const { rows } = await db.query(
    `UPDATE webhook_endpoints SET ${updates.join(', ')} WHERE id = $${idx} AND org_id = $${idx + 1} RETURNING id, name, url, events, is_active`,
    params
  );
  if (!rows.length) return res.status(404).json({ error: 'Webhook not found.' });
  res.json({ webhook: rows[0] });
}));

router.delete('/webhooks/:id', asyncHandler(async (req, res) => {
  const { rowCount } = await db.query(
    `DELETE FROM webhook_endpoints WHERE id = $1 AND org_id = $2`,
    [req.params.id, req.user.orgId]
  );
  if (!rowCount) return res.status(404).json({ error: 'Webhook not found.' });
  res.json({ ok: true });
}));

// ── Webhook delivery log ──────────────────────────────────────────────────────

router.get('/webhooks/:id/deliveries', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM webhook_deliveries WHERE endpoint_id = $1
     ORDER BY created_at DESC LIMIT 50`,
    [req.params.id]
  );
  res.json({ deliveries: rows });
}));

module.exports = router;
