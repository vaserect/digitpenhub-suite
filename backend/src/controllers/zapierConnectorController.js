const db = require('../db');
const { asyncHandler } = require('../utils/asyncHandler');
const crypto = require('crypto');

exports.list = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, platform, label, is_active, last_triggered_at, error_count, created_at FROM zapier_connections WHERE org_id = $1 ORDER BY created_at DESC',
    [req.user.orgId]
  );
  res.json({ connections: rows });
});

exports.create = asyncHandler(async (req, res) => {
  const { platform, webhookUrl, label } = req.body;
  if (!platform || !webhookUrl) return res.status(400).json({ error: 'platform and webhookUrl are required' });
  const apiKey = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
  const { rows } = await db.query(
    `INSERT INTO zapier_connections (org_id, platform, webhook_url, api_key_hash, label)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, platform, label, is_active, created_at`,
    [req.user.orgId, platform, webhookUrl, hash, label || null]
  );
  res.status(201).json({ connection: rows[0], apiKey,
    warning: 'Save this API key. It will not be shown again.' });
});

exports.remove = asyncHandler(async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM zapier_connections WHERE id = $1 AND org_id = $2', [req.params.id, req.user.orgId]);
  if (!rowCount) return res.status(404).json({ error: 'Connection not found' });
  res.json({ ok: true });
});

exports.getDeliveries = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT zd.* FROM zapier_deliveries zd JOIN zapier_connections zc ON zc.id = zd.connection_id
     WHERE zd.connection_id = $1 AND zc.org_id = $2 ORDER BY zd.created_at DESC LIMIT 50`,
    [req.params.id, req.user.orgId]
  );
  res.json({ deliveries: rows });
});
