const db = require('../db');
const { logAdminAction } = require('./adminController');

async function listFlags(req, res) {
  const { rows } = await db.query(
    `SELECT f.*,
       (SELECT COUNT(*) FROM org_feature_overrides o WHERE o.flag_key = f.key) AS override_count
     FROM feature_flags f ORDER BY f.name ASC`
  );
  res.json({ flags: rows });
}

async function createFlag(req, res) {
  const { key, name, description } = req.body || {};
  if (!key?.trim() || !name?.trim()) {
    return res.status(400).json({ error: 'key and name are required.' });
  }
  const slug = key.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const { rows } = await db.query(
    `INSERT INTO feature_flags (key, name, description) VALUES ($1,$2,$3) RETURNING *`,
    [slug, name.trim(), description || null]
  );
  await logAdminAction(req, 'feature_flag.create', { key: slug, name: name.trim() });
  res.status(201).json({ flag: rows[0] });
}

async function toggleGlobal(req, res) {
  const { key } = req.params;
  const { enabled } = req.body || {};
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'enabled (boolean) is required.' });
  }
  const { rows } = await db.query(
    `UPDATE feature_flags SET is_global_enabled = $1, updated_at = NOW() WHERE key = $2 RETURNING *`,
    [enabled, key]
  );
  if (!rows.length) return res.status(404).json({ error: 'Flag not found.' });
  await logAdminAction(req, 'feature_flag.toggle_global', { key, enabled });
  res.json({ flag: rows[0] });
}

async function deleteFlag(req, res) {
  const { key } = req.params;
  const { rowCount } = await db.query(`DELETE FROM feature_flags WHERE key = $1`, [key]);
  if (!rowCount) return res.status(404).json({ error: 'Flag not found.' });
  await logAdminAction(req, 'feature_flag.delete', { key });
  res.json({ ok: true });
}

// Per-org overrides — lets super admin force a flag on/off for one org
// regardless of the global setting or the org's plan.
async function listOrgOverrides(req, res) {
  const { key } = req.params;
  const { rows } = await db.query(
    `SELECT o.*, org.full_name AS org_name
     FROM org_feature_overrides o
     JOIN organizations org ON org.id = o.org_id
     WHERE o.flag_key = $1 ORDER BY o.created_at DESC`,
    [key]
  );
  res.json({ overrides: rows });
}

async function setOrgOverride(req, res) {
  const { key } = req.params;
  const { orgId, enabled } = req.body || {};
  if (!orgId || typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'orgId and enabled (boolean) are required.' });
  }
  const { rows } = await db.query(
    `INSERT INTO org_feature_overrides (org_id, flag_key, enabled)
     VALUES ($1,$2,$3)
     ON CONFLICT (org_id, flag_key) DO UPDATE SET enabled = EXCLUDED.enabled
     RETURNING *`,
    [orgId, key, enabled]
  );
  await logAdminAction(req, 'feature_flag.set_org_override', { key, orgId, enabled });
  res.status(201).json({ override: rows[0] });
}

async function deleteOrgOverride(req, res) {
  const { key, orgId } = req.params;
  await db.query(
    `DELETE FROM org_feature_overrides WHERE flag_key = $1 AND org_id = $2`,
    [key, orgId]
  );
  await logAdminAction(req, 'feature_flag.remove_org_override', { key, orgId });
  res.json({ ok: true });
}

module.exports = {
  listFlags, createFlag, toggleGlobal, deleteFlag,
  listOrgOverrides, setOrgOverride, deleteOrgOverride,
};
