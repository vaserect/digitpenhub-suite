const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

// ── Feature flags ─────────────────────────────────────────────────────────────

// List all flags for the current org (includes whether user sees each as enabled)
router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT f.*, fo.enabled AS override_enabled
     FROM feature_flags f
     LEFT JOIN feature_flag_overrides fo ON fo.flag_id = f.id AND fo.user_id = $2
     WHERE f.org_id = $1
     ORDER BY f.key`,
    [req.user.orgId, req.user.id]
  );
  // Compute effective state for the current user
  const flags = rows.map((r) => {
    const effective = r.override_enabled !== null
      ? r.override_enabled
      : r.rollout_pct >= 100 ? true
      : r.rollout_pct <= 0 ? false
      : r.enabled && (hashUserId(req.user.id, r.key) % 100 < r.rollout_pct);
    return { ...r, effective };
  });
  res.json({ flags });
}));

// Create or update a flag
router.put('/:key', asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { name, description, enabled, rolloutPct } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required.' });

  const { rows } = await db.query(
    `INSERT INTO feature_flags (org_id, key, name, description, enabled, rollout_pct)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (org_id, key)
     DO UPDATE SET name = $3, description = COALESCE($4, feature_flags.description),
                   enabled = $5, rollout_pct = $6, updated_at = now()
     RETURNING *`,
    [req.user.orgId, key, name, description || null,
     enabled !== undefined ? enabled : false,
     rolloutPct !== undefined ? rolloutPct : 100]
  );
  res.json({ flag: rows[0] });
}));

// Delete a flag
router.delete('/:key', asyncHandler(async (req, res) => {
  const { rowCount } = await db.query(
    `DELETE FROM feature_flags WHERE org_id = $1 AND key = $2`,
    [req.user.orgId, req.params.key]
  );
  if (!rowCount) return res.status(404).json({ error: 'Flag not found.' });
  res.json({ ok: true });
}));

// ── User overrides ────────────────────────────────────────────────────────────

router.put('/:key/overrides/:userId', asyncHandler(async (req, res) => {
  const { enabled } = req.body || {};
  const { rows } = await db.query(
    `INSERT INTO feature_flag_overrides (flag_id, user_id, enabled)
     SELECT id, $3, $4 FROM feature_flags WHERE org_id = $1 AND key = $2
     ON CONFLICT (flag_id, user_id)
     DO UPDATE SET enabled = $4
     RETURNING *`,
    [req.user.orgId, req.params.key, req.params.userId, enabled === true]
  );
  if (!rows.length) return res.status(404).json({ error: 'Flag not found.' });
  res.json({ override: rows[0] });
}));

router.delete('/:key/overrides/:userId', asyncHandler(async (req, res) => {
  await db.query(
    `DELETE FROM feature_flag_overrides WHERE flag_id = (SELECT id FROM feature_flags WHERE org_id = $1 AND key = $2) AND user_id = $3`,
    [req.user.orgId, req.params.key, req.params.userId]
  );
  res.json({ ok: true });
}));

// ── Experiments ───────────────────────────────────────────────────────────────

router.get('/experiments', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT e.*, json_agg(json_build_object('id', ev.id, 'name', ev.name, 'traffic_pct', ev.traffic_pct, 'is_control', ev.is_control, 'config_json', ev.config_json)) AS variants
     FROM experiments e
     LEFT JOIN experiment_variants ev ON ev.experiment_id = e.id
     WHERE e.org_id = $1
     GROUP BY e.id ORDER BY e.created_at DESC`,
    [req.user.orgId]
  );
  res.json({ experiments: rows });
}));

router.post('/experiments', asyncHandler(async (req, res) => {
  const { name, description, flagKey, status, startAt, endAt, variants } = req.body || {};
  if (!name || !flagKey) return res.status(400).json({ error: 'name and flagKey are required.' });

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO experiments (org_id, name, description, flag_key, status, start_at, end_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.orgId, name, description || null, flagKey, status || 'draft', startAt || null, endAt || null]
    );
    const experiment = rows[0];

    if (Array.isArray(variants)) {
      for (const v of variants) {
        await client.query(
          `INSERT INTO experiment_variants (experiment_id, name, traffic_pct, is_control, config_json)
           VALUES ($1, $2, $3, $4, $5)`,
          [experiment.id, v.name, v.trafficPct || 25, v.isControl || false, JSON.stringify(v.config || {})]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ experiment });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

// Check which variant the current user is assigned to
router.get('/experiments/:id/variant', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT variant_id FROM experiment_assignments
     WHERE experiment_id = $1 AND user_id = $2`,
    [req.params.id, req.user.id]
  );
  if (rows.length) {
    const { rows: variant } = await db.query(
      `SELECT * FROM experiment_variants WHERE id = $1`,
      [rows[0].variant_id]
    );
    return res.json({ variant: variant[0] || null });
  }

  // Assign user to a variant (deterministic based on user ID)
  const { rows: experiment } = await db.query(
    `SELECT * FROM experiments WHERE id = $1 AND org_id = $2`,
    [req.params.id, req.user.orgId]
  );
  if (!experiment.length || experiment[0].status !== 'running') {
    return res.json({ variant: null });
  }

  const { rows: variants } = await db.query(
    `SELECT * FROM experiment_variants WHERE experiment_id = $1 ORDER BY traffic_pct DESC`,
    [req.params.id]
  );
  if (!variants.length) return res.json({ variant: null });

  const hash = hashUserId(req.user.id, req.params.id) % 100;
  let cumulative = 0;
  let chosen = variants[0];
  for (const v of variants) {
    cumulative += v.traffic_pct;
    if (hash < cumulative) { chosen = v; break; }
  }

  await db.query(
    `INSERT INTO experiment_assignments (experiment_id, user_id, variant_id)
     VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
    [req.params.id, req.user.id, chosen.id]
  );

  res.json({ variant: chosen });
}));

// Track an experiment event
router.post('/experiments/:id/events', asyncHandler(async (req, res) => {
  const { variantId, eventType, eventValue } = req.body || {};
  if (!variantId || !eventType) return res.status(400).json({ error: 'variantId and eventType are required.' });

  await db.query(
    `INSERT INTO experiment_events (experiment_id, variant_id, user_id, event_type, event_value)
     VALUES ($1, $2, $3, $4, $5)`,
    [req.params.id, variantId, req.user.id, eventType, eventValue || null]
  );
  res.status(201).json({ ok: true });
}));

// Update experiment status
router.patch('/experiments/:id', asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!['draft', 'running', 'paused', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  const { rows } = await db.query(
    `UPDATE experiments SET status = $1, updated_at = now() WHERE id = $2 AND org_id = $3 RETURNING *`,
    [status, req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Experiment not found.' });
  res.json({ experiment: rows[0] });
}));

// ── System flags (super admin only) ──────────────────────────────────────────

router.get('/system', asyncHandler(async (req, res) => {
  if (!req.user.isSuperAdmin) return res.status(403).json({ error: 'Super admin access required.' });
  const { rows } = await db.query('SELECT * FROM system_feature_flags ORDER BY key');
  res.json({ flags: rows });
}));

// ── Hash helper (deterministic user bucketing) ────────────────────────────────
function hashUserId(userId, salt) {
  let hash = 0;
  const str = String(userId) + ':' + String(salt);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

module.exports = router;
