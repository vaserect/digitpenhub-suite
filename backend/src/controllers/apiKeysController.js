const db = require('../db');
const crypto = require('crypto');
const { asyncHandler } = require('../utils/asyncHandler');

function generateApiKey() {
  const key = crypto.randomBytes(32).toString('hex');
  const prefix = key.substring(0, 8);
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  return { key, prefix, hash };
}

exports.getAll = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const result = await db.query(
    'SELECT id, name, key_prefix, scopes, expires_at, last_used_at, revoked_at, created_at FROM api_keys WHERE org_id = $1 ORDER BY created_at DESC',
    [orgId]
  );
  res.json(result.rows);
});

exports.getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query(
    'SELECT id, name, key_prefix, scopes, expires_at, last_used_at, revoked_at, created_at FROM api_keys WHERE id = $1 AND org_id = $2',
    [id, orgId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'API key not found' });
  res.json(result.rows[0]);
});

exports.create = asyncHandler(async (req, res) => {
  const { orgId, id: userId } = req.user;
  const { name, scopes, expiresAt } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  
  const { key, prefix, hash } = generateApiKey();
  const result = await db.query(
    'INSERT INTO api_keys (org_id, name, key_prefix, key_hash, scopes, expires_at, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, key_prefix, scopes, expires_at, created_at',
    [orgId, name, prefix, hash, scopes ? JSON.stringify(scopes) : '["read"]', expiresAt || null, userId]
  );
  res.status(201).json({ ...result.rows[0], key, warning: 'Save this key securely. It will not be shown again.' });
});

exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const { name, scopes } = req.body;
  const result = await db.query(
    'UPDATE api_keys SET name = COALESCE($1, name), scopes = COALESCE($2, scopes) WHERE id = $3 AND org_id = $4 RETURNING *',
    [name, scopes ? JSON.stringify(scopes) : null, id, orgId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'API key not found' });
  res.json(result.rows[0]);
});

exports.revoke = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query(
    'UPDATE api_keys SET revoked_at = NOW() WHERE id = $1 AND org_id = $2 AND revoked_at IS NULL RETURNING id',
    [id, orgId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'API key not found or already revoked' });
  res.json({ message: 'API key revoked successfully', id: result.rows[0].id });
});

exports.delete = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;
  const result = await db.query('DELETE FROM api_keys WHERE id = $1 AND org_id = $2 RETURNING id', [id, orgId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'API key not found' });
  res.json({ message: 'API key deleted successfully', id: result.rows[0].id });
});
