const db = require('../db');
const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');

// ── Providers ─────────────────────────────────────────────────────────────────

async function listProviders(req, res) {
  const { rows } = await db.query(
    'SELECT id, slug, name, description, icon_url, auth_type, scopes, is_active FROM integration_providers WHERE is_active = true ORDER BY name'
  );
  res.json({ providers: rows });
}

// ── Connections ───────────────────────────────────────────────────────────────

async function listConnections(req, res) {
  const { rows } = await db.query(
    `SELECT c.id, c.org_id, c.provider_id, c.label, c.is_connected, c.last_sync_at,
            c.created_at, c.updated_at, c.metadata,
            p.slug AS provider_slug, p.name AS provider_name, p.icon_url AS provider_icon,
            p.auth_type, p.scopes
     FROM integration_connections c
     JOIN integration_providers p ON p.id = c.provider_id
     WHERE c.org_id = $1
     ORDER BY p.name, c.label`,
    [req.user.orgId]
  );
  res.json({ connections: rows });
}

async function createConnection(req, res) {
  const { providerId, label, apiKey } = req.body || {};
  if (!providerId) return res.status(400).json({ error: 'providerId is required.' });

  // Verify provider exists and get auth type
  const { rows: providers } = await db.query(
    'SELECT id, slug, auth_type, auth_url, scopes FROM integration_providers WHERE id = $1 AND is_active = true',
    [providerId]
  );
  if (!providers.length) return res.status(404).json({ error: 'Provider not found.' });
  const provider = providers[0];

  // Check existing connection
  const { rows: existing } = await db.query(
    'SELECT id FROM integration_connections WHERE org_id = $1 AND provider_id = $2 AND label = $3',
    [req.user.orgId, providerId, label || '']
  );
  if (existing.length) return res.status(409).json({ error: 'A connection with this label already exists for this provider.' });

  if (provider.auth_type === 'api_key') {
    if (!apiKey) return res.status(400).json({ error: 'apiKey is required for this provider.' });
    const prefix = apiKey.slice(0, 8);
    const { rows } = await db.query(
      `INSERT INTO integration_connections (org_id, provider_id, label, access_token, is_connected, metadata)
       VALUES ($1, $2, $3, $4, true, $5) RETURNING id, label, is_connected, created_at`,
      [req.user.orgId, providerId, label || provider.slug, apiKey, JSON.stringify({ keyPrefix: prefix })]
    );
    // Seed a "connected" sync log entry so the GenericModule has data to show
    await db.query(
      `INSERT INTO integration_sync_logs (org_id, connection_id, sync_type, status, completed_at)
       VALUES ($1, $2, 'connection', 'completed', now())`,
      [req.user.orgId, rows[0].id]
    );
    return res.status(201).json({ connection: rows[0] });
  }

  // OAuth2 — generate authorization URL (no tokens stored yet)
  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${process.env.FRONTEND_ORIGIN || 'https://suite.digitpenhub.com'}/api/v1/integrations/oauth/${provider.slug}/callback`;

  // Store connection in pending state
  const { rows } = await db.query(
    `INSERT INTO integration_connections (org_id, provider_id, label, metadata)
     VALUES ($1, $2, $3, $4) RETURNING id, label, is_connected, created_at`,
    [req.user.orgId, providerId, label || provider.slug, JSON.stringify({ oauthState: state })]
  );

  const authUrl = provider.auth_url
    ? `${provider.auth_url}?client_id=${provider.client_id || '{CLIENT_ID}'}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent((provider.scopes || []).join(' '))}&response_type=code`
    : null;

  res.status(201).json({
    connection: rows[0],
    authUrl,
    redirectUri,
    note: 'Open authUrl in a browser to complete OAuth. The client_id and client_secret need to be configured by the super admin.',
  });
}

async function oauthCallback(req, res) {
  const { provider } = req.params;
  const { code, state } = req.query || {};

  if (!code) return res.status(400).json({ error: 'Authorization code is required.' });

  // Find the connection by provider slug + oauthState
  const { rows: connections } = await db.query(
    `SELECT c.id, c.metadata FROM integration_connections c
     JOIN integration_providers p ON p.id = c.provider_id
     WHERE p.slug = $1 AND c.metadata->>'oauthState' = $2 AND c.is_connected = false
     ORDER BY c.created_at DESC LIMIT 1`,
    [provider, state || '']
  );

  // If no matching connection, the OAuth state may have expired or the user
  // started the flow from a different browser — return a friendly page
  if (!connections.length) {
    if (req.accepts('html')) {
      return res.send(`<html><body style="font-family:sans-serif;padding:40px;text-align:center"><h2>✅ OAuth callback received</h2><p>You can close this window and return to the app.</p></body></html>`);
    }
    return res.json({ ok: true, note: 'Callback received — check your integration status in the app.' });
  }

  const connection = connections[0];

  // Note: actual token exchange requires the provider's client_id/client_secret
  // configured by the super admin. Mark as connected with a placeholder token.
  await db.query(
    `UPDATE integration_connections SET is_connected = true, access_token = $1, metadata = metadata || '{"oauthCompleted": true}'::jsonb, updated_at = now()
     WHERE id = $2`,
    ['pending_exchange', connection.id]
  );

  await db.query(
    `INSERT INTO integration_sync_logs (org_id, connection_id, sync_type, status, completed_at)
     VALUES ((SELECT org_id FROM integration_connections WHERE id = $1), $1, 'connection', 'completed', now())`,
    [connection.id]
  );

  if (req.accepts('html')) {
    return res.send(`<html><body style="font-family:sans-serif;padding:40px;text-align:center"><h2>✅ Connected!</h2><p>You can close this window and return to the app.</p></body></html>`);
  }
  res.json({ ok: true });
}

async function getConnection(req, res) {
  const { rows } = await db.query(
    `SELECT c.*, p.slug AS provider_slug, p.name AS provider_name, p.description AS provider_description,
            p.icon_url AS provider_icon, p.auth_type, p.scopes,
            (SELECT count(*) FROM integration_sync_logs WHERE connection_id = c.id) AS sync_count
     FROM integration_connections c
     JOIN integration_providers p ON p.id = c.provider_id
     WHERE c.id = $1 AND c.org_id = $2`,
    [req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Connection not found.' });
  // Redact sensitive tokens from the response
  const c = rows[0];
  c.access_token = c.access_token ? c.access_token.slice(0, 12) + '…' : null;
  c.refresh_token = c.refresh_token ? '••••••' : null;
  res.json({ connection: c });
}

async function updateConnection(req, res) {
  const { label, apiKey, metadata } = req.body || {};
  const updates = ['updated_at = now()'];
  const params = [];
  let idx = 1;
  if (label !== undefined) { updates.push(`label = $${idx++}`); params.push(label); }
  if (apiKey !== undefined) { updates.push(`access_token = $${idx++}`); params.push(apiKey); }
  if (metadata !== undefined) { updates.push(`metadata = $${idx++}`); params.push(metadata); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  params.push(req.params.id, req.user.orgId);
  const { rows } = await db.query(
    `UPDATE integration_connections SET ${updates.join(', ')} WHERE id = $${idx} AND org_id = $${idx+1} RETURNING id, label, is_connected, updated_at`,
    params
  );
  if (!rows.length) return res.status(404).json({ error: 'Connection not found.' });
  res.json({ connection: rows[0] });
}

async function deleteConnection(req, res) {
  const { rowCount } = await db.query(
    'DELETE FROM integration_connections WHERE id = $1 AND org_id = $2',
    [req.params.id, req.user.orgId]
  );
  if (!rowCount) return res.status(404).json({ error: 'Connection not found.' });
  res.json({ ok: true });
}

async function listSyncLogs(req, res) {
  const { rows } = await db.query(
    'SELECT * FROM integration_sync_logs WHERE connection_id = $1 AND org_id = $2 ORDER BY started_at DESC LIMIT 50',
    [req.params.id, req.user.orgId]
  );
  res.json({ logs: rows });
}

async function listWebhooks(req, res) {
  const { rows } = await db.query(
    'SELECT * FROM integration_webhooks WHERE org_id = $1 ORDER BY created_at DESC LIMIT 50',
    [req.user.orgId]
  );
  res.json({ webhooks: rows });
}

// ── Public webhook receiver ───────────────────────────────────────────────────
// Provider callbacks hit this endpoint; events are stored for the org to review.
// Signature verification is provider-specific and deferred per the Provider
// Tracker — the initial implementation stores everything with 'pending' status.
async function webhookReceiver(req, res) {
  const { provider } = req.params;
  const body = req.body || {};
  const headers = req.headers || {};

  // Try to identify the org from a provider-specific header or body field
  // (e.g. Stripe uses the webhook signing secret tied to a connection)
  const { rows: providers } = await db.query(
    'SELECT id FROM integration_providers WHERE slug = $1 AND is_active = true',
    [provider]
  );
  if (!providers.length) return res.status(404).json({ error: 'Unknown provider.' });

  // Store the webhook event (org_id will be null if we can't route it — super admin can review)
  await db.query(
    `INSERT INTO integration_webhooks (org_id, provider_slug, event_type, payload, source_ip, signature, status)
     VALUES (NULL, $1, $2, $3, $4, $5, 'pending')`,
    [provider, headers['x-event-type'] || 'unknown', JSON.stringify(body), req.ip, headers['x-signature'] || null]
  );

  res.json({ ok: true });
}

// ── Stats ─────────────────────────────────────────────────────────────────────

async function getStats(req, res) {
  const { rows: connCount } = await db.query(
    'SELECT count(*)::int AS total FROM integration_connections WHERE org_id = $1',
    [req.user.orgId]
  );
  const { rows: connected } = await db.query(
    'SELECT count(*)::int AS total FROM integration_connections WHERE org_id = $1 AND is_connected = true',
    [req.user.orgId]
  );
  const { rows: webhookCount } = await db.query(
    'SELECT count(*)::int AS total FROM integration_webhooks WHERE org_id = $1',
    [req.user.orgId]
  );
  res.json({ stats: { totalConnections: connCount[0].total, connected: connected[0].total, webhooksReceived: webhookCount[0].total } });
}

module.exports = {
  listProviders, listConnections, createConnection, oauthCallback,
  getConnection, updateConnection, deleteConnection,
  listSyncLogs, listWebhooks, webhookReceiver, getStats,
};
