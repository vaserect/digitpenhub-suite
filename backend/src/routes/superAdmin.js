const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/superAdmin');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

// ── Add-On Marketplace (super admin) ──────────────────────────────────────────
const ADDON_ROUTER = Router();
ADDON_ROUTER.use(requireAuth);
ADDON_ROUTER.use(requireSuperAdmin);

// Create Add-on
ADDON_ROUTER.post('/', asyncHandler(async (req, res) => {
  const { name, shortDesc, fullDesc, category, iconUrl, embedType, embedPayload, embedPermissions, pricingModel, priceNgn, stripePriceId, revenueSharePct, referralUrl, visiblePlans, visibleOrgs, isFeatured } = req.body || {};
  if (!name?.trim() || !shortDesc || !category || !embedType || !embedPayload) {
    return res.status(400).json({ error: 'name, shortDesc, category, embedType, and embedPayload are required.' });
  }
  const { rows } = await db.query(
    `INSERT INTO addon_products (name, short_desc, full_desc, category, icon_url, embed_type, embed_payload, embed_permissions, pricing_model, price_ngn, stripe_price_id, revenue_share_pct, referral_url, visible_plans, visible_orgs, is_featured, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
    [name.trim(), shortDesc, fullDesc || null, category, iconUrl || null, embedType, embedPayload, embedPermissions || [],
     pricingModel || 'free', priceNgn || null, stripePriceId || null, revenueSharePct || null, referralUrl || null,
     visiblePlans || [], visibleOrgs || [], isFeatured || false, req.user.id]
  );
  res.status(201).json({ addon: rows[0] });
}));

// List Add-ons
ADDON_ROUTER.get('/', asyncHandler(async (req, res) => {
  const { status, category } = req.query;
  const conditions = ['1 = 1'];
  const params = [];
  let idx = 1;
  if (status) { conditions.push(`status = $${idx++}`); params.push(status); }
  if (category) { conditions.push(`category = $${idx++}`); params.push(category); }
  const { rows } = await db.query(`SELECT * FROM addon_products WHERE ${conditions.join(' AND ')} ORDER BY sort_order, name`, params);
  res.json({ addons: rows });
}));

// Get single Add-on
ADDON_ROUTER.get('/:id', asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM addon_products WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ addon: rows[0] });
}));

// Update Add-on
ADDON_ROUTER.put('/:id', asyncHandler(async (req, res) => {
  const { name, shortDesc, fullDesc, category, iconUrl, embedType, embedPayload, embedPermissions, pricingModel, priceNgn, stripePriceId, revenueSharePct, referralUrl, visiblePlans, visibleOrgs, sortOrder, isFeatured, status } = req.body || {};
  const updates = ['updated_at = now()'];
  const params = [];
  let idx = 1;
  if (name !== undefined) { updates.push(`name = $${idx++}`); params.push(name); }
  if (shortDesc !== undefined) { updates.push(`short_desc = $${idx++}`); params.push(shortDesc); }
  if (fullDesc !== undefined) { updates.push(`full_desc = $${idx++}`); params.push(fullDesc); }
  if (category !== undefined) { updates.push(`category = $${idx++}`); params.push(category); }
  if (iconUrl !== undefined) { updates.push(`icon_url = $${idx++}`); params.push(iconUrl); }
  if (embedType !== undefined) { updates.push(`embed_type = $${idx++}`); params.push(embedType); }
  if (embedPayload !== undefined) { updates.push(`embed_payload = $${idx++}`); params.push(embedPayload); }
  if (embedPermissions !== undefined) { updates.push(`embed_permissions = $${idx++}`); params.push(embedPermissions); }
  if (pricingModel !== undefined) { updates.push(`pricing_model = $${idx++}`); params.push(pricingModel); }
  if (priceNgn !== undefined) { updates.push(`price_ngn = $${idx++}`); params.push(priceNgn); }
  if (stripePriceId !== undefined) { updates.push(`stripe_price_id = $${idx++}`); params.push(stripePriceId); }
  if (revenueSharePct !== undefined) { updates.push(`revenue_share_pct = $${idx++}`); params.push(revenueSharePct); }
  if (referralUrl !== undefined) { updates.push(`referral_url = $${idx++}`); params.push(referralUrl); }
  if (visiblePlans !== undefined) { updates.push(`visible_plans = $${idx++}`); params.push(visiblePlans); }
  if (visibleOrgs !== undefined) { updates.push(`visible_orgs = $${idx++}`); params.push(visibleOrgs); }
  if (sortOrder !== undefined) { updates.push(`sort_order = $${idx++}`); params.push(sortOrder); }
  if (isFeatured !== undefined) { updates.push(`is_featured = $${idx++}`); params.push(isFeatured); }
  // Status transitions: draft→in_review→published, or any→disabled
  if (status !== undefined) {
    const { rows: current } = await db.query('SELECT status FROM addon_products WHERE id = $1', [req.params.id]);
    if (current.length) {
      const validTransitions = {
        draft: ['in_review'],
        in_review: ['published', 'draft'],
        published: ['disabled'],
        disabled: ['draft'],
      };
      const allowed = validTransitions[current[0].status] || [];
      if (!allowed.includes(status)) {
        return res.status(400).json({ error: `Cannot transition from ${current[0].status} to ${status}. Allowed: ${allowed.join(', ') || 'none'}.` });
      }
    }
    updates.push(`status = $${idx++}`);
    params.push(status);
  }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  params.push(req.params.id);
  const { rows } = await db.query(`UPDATE addon_products SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, params);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ addon: rows[0] });
}));

// Delete Add-on
ADDON_ROUTER.delete('/:id', asyncHandler(async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM addon_products WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Not found.' });
  res.json({ ok: true });
}));

// Add-on usage analytics
ADDON_ROUTER.get('/:id/stats', asyncHandler(async (req, res) => {
  try {
    const { rows: enabledOrgs } = await db.query(
      'SELECT count(*) AS c FROM addon_enablements WHERE addon_id = $1 AND enabled = true',
      [req.params.id]
    );
    res.json({
      enables: 0, clicks: 0, views: 0,
      activeOrgs: parseInt(enabledOrgs[0]?.c || 0),
    });
  } catch (e) {
    res.json({ enables: 0, clicks: 0, views: 0, activeOrgs: 0 });
  }
}));

// ── Workspace-facing: list available Add-ons ──────────────────────────────────
const WORKSPACE_ROUTER = Router();
WORKSPACE_ROUTER.use(requireAuth);

WORKSPACE_ROUTER.get('/available', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, name, short_desc, icon_url, embed_type, pricing_model, price_ngn, category, is_featured
     FROM addon_products WHERE status = 'published'
       AND (visible_plans = '{}' OR $1 = ANY(visible_plans))
       AND (visible_orgs = '{}' OR $2 = ANY(visible_orgs::text::uuid[]))
     ORDER BY is_featured DESC, sort_order, name`,
    [req.user.orgPlan?.slug || '', req.user.orgId]
  );
  // Check which are already enabled
  const { rows: enabled } = await db.query('SELECT addon_id FROM addon_enablements WHERE org_id = $1 AND enabled = true', [req.user.orgId]);
  const enabledIds = new Set(enabled.map(e => e.addon_id));
  for (const a of rows) { a.enabled = enabledIds.has(a.id); }
  res.json({ addons: rows });
}));

// Toggle enablement
WORKSPACE_ROUTER.post('/:id/toggle', asyncHandler(async (req, res) => {
  const { rows: existing } = await db.query(
    `INSERT INTO addon_enablements (org_id, addon_id) VALUES ($1, $2)
     ON CONFLICT (org_id, addon_id) DO UPDATE SET enabled = NOT addon_enablements.enabled
     RETURNING enabled`,
    [req.user.orgId, req.params.id]
  );
  const enabled = existing[0]?.enabled;
  await db.query(
    `INSERT INTO addon_usage_events (addon_id, org_id, event_type) VALUES ($1, $2, $3)`,
    [req.params.id, req.user.orgId, enabled ? 'enable' : 'disable']
  );
  res.json({ enabled });
}));

// ── System Health (super admin) ───────────────────────────────────────────────
const HEALTH_ROUTER = Router();
HEALTH_ROUTER.use(requireAuth);
HEALTH_ROUTER.use(requireSuperAdmin);

function healthReducer(metric, warn) {
  return { metric, status: warn ? 'warning' : 'ok', value: metric };
}

HEALTH_ROUTER.get('/', asyncHandler(async (req, res) => {
  try {
    const dbPool = await db.query("SELECT count(*) AS used FROM pg_stat_activity WHERE state = 'active'");
    const dbConfig = await db.query('SHOW max_connections');
    const dbUsage = ((parseInt(dbPool.rows[0]?.used || 0) / parseInt(dbConfig.rows[0]?.max_connections || 100)) * 100).toFixed(1);
    res.json({ status: 'healthy', database: { poolUsage: `${dbUsage}%` } });
  } catch (e) {
    res.status(503).json({ status: 'error', message: e.message });
  }
}));

module.exports = { router, ADDON_ROUTER, HEALTH_ROUTER, WORKSPACE_ROUTER };
