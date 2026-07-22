const db = require('../db');
const WebhookDeliveryService = require('../services/WebhookDeliveryService');

async function list(req, res) {
  const { rows } = await db.query(
    `SELECT id, name, url, event_types, is_active, retry_count, timeout_ms,
            last_sent_at, last_status, last_error, created_at, updated_at
     FROM outgoing_webhooks WHERE org_id = $1 ORDER BY created_at DESC`,
    [req.user.orgId]
  );
  res.json({ webhooks: rows });
}

async function getById(req, res) {
  const { rows } = await db.query(
    `SELECT * FROM outgoing_webhooks WHERE id = $1 AND org_id = $2`,
    [req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Webhook not found.' });
  const wh = rows[0];
  // Don't send the secret in responses
  wh.secret = wh.secret ? wh.secret.slice(0, 8) + '…' : null;
  res.json({ webhook: wh });
}

async function create(req, res) {
  const { name, url, eventTypes, retryCount, timeoutMs } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name is required.' });
  if (!url?.trim()) return res.status(400).json({ error: 'url is required.' });
  if (!eventTypes || !Array.isArray(eventTypes) || eventTypes.length === 0) {
    return res.status(400).json({ error: 'eventTypes must be a non-empty array.' });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'url must be a valid URL.' });
  }

  const { rows } = await db.query(
    `INSERT INTO outgoing_webhooks (org_id, name, url, event_types, retry_count, timeout_ms)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, url, event_types, is_active, retry_count, timeout_ms, secret, created_at`,
    [req.user.orgId, name.trim(), url.trim(), eventTypes, retryCount ?? 3, timeoutMs ?? 5000]
  );

  res.status(201).json({ webhook: rows[0] });
}

async function update(req, res) {
  const { id } = req.params;
  const { name, url, eventTypes, isActive, retryCount, timeoutMs } = req.body || {};

  const updates = ['updated_at = NOW()'];
  const vals = [];
  let i = 1;

  if (name !== undefined)       { updates.push(`name = $${i++}`);        vals.push(name.trim()); }
  if (url !== undefined)        { updates.push(`url = $${i++}`);         vals.push(url.trim()); }
  if (eventTypes !== undefined)  { updates.push(`event_types = $${i++}`); vals.push(eventTypes); }
  if (isActive !== undefined)   { updates.push(`is_active = $${i++}`);   vals.push(isActive); }
  if (retryCount !== undefined) { updates.push(`retry_count = $${i++}`); vals.push(retryCount); }
  if (timeoutMs !== undefined)  { updates.push(`timeout_ms = $${i++}`);  vals.push(timeoutMs); }

  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });

  vals.push(id, req.user.orgId);
  const { rows } = await db.query(
    `UPDATE outgoing_webhooks SET ${updates.join(', ')} WHERE id = $${i} AND org_id = $${i + 1} RETURNING *`,
    vals
  );
  if (!rows.length) return res.status(404).json({ error: 'Webhook not found.' });

  const wh = rows[0];
  wh.secret = wh.secret ? wh.secret.slice(0, 8) + '…' : null;
  res.json({ webhook: wh });
}

async function remove(req, res) {
  const { rowCount } = await db.query(
    `DELETE FROM outgoing_webhooks WHERE id = $1 AND org_id = $2`,
    [req.params.id, req.user.orgId]
  );
  if (!rowCount) return res.status(404).json({ error: 'Webhook not found.' });
  res.json({ ok: true });
}

async function regenerateSecret(req, res) {
  const { rows } = await db.query(
    `UPDATE outgoing_webhooks SET secret = gen_random_uuid()::text, updated_at = NOW()
     WHERE id = $1 AND org_id = $2
     RETURNING id, secret`,
    [req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Webhook not found.' });
  res.json({ secret: rows[0].secret });
}

async function listDeliveries(req, res) {
  const { limit = 50, offset = 0 } = req.query;
  const { rows } = await db.query(
    `SELECT d.* FROM outgoing_webhook_deliveries d
     JOIN outgoing_webhooks w ON w.id = d.webhook_id
     WHERE d.webhook_id = $1 AND w.org_id = $2
     ORDER BY d.created_at DESC
     LIMIT $3 OFFSET $4`,
    [req.params.id, req.user.orgId, limit, offset]
  );
  res.json({ deliveries: rows });
}

async function retryDelivery(req, res) {
  const { deliveryId } = req.params;
  const { rows } = await db.query(
    `SELECT d.id, d.event_type, d.payload, d.attempt, d.max_attempts,
            w.id AS webhook_id, w.url, w.secret, w.timeout_ms, w.org_id
     FROM outgoing_webhook_deliveries d
     JOIN outgoing_webhooks w ON w.id = d.webhook_id
     WHERE d.id = $1 AND w.org_id = $2`,
    [deliveryId, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Delivery not found.' });

  const delivery = rows[0];
  await WebhookDeliveryService._deliver(
    { id: delivery.webhook_id, url: delivery.url, secret: delivery.secret, retry_count: delivery.max_attempts, timeout_ms: delivery.timeout_ms },
    delivery.event_type,
    delivery.payload
  );

  res.json({ ok: true });
}

module.exports = { list, getById, create, update, remove, regenerateSecret, listDeliveries, retryDelivery };
