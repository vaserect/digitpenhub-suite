const db = require('../db');

// Every meaningful admin write goes through this so there's a real audit
// trail of who changed what, reusing the same audit_log table auth actions
// already write to rather than building a parallel system.
async function logAdminAction(req, action, meta = {}) {
  try {
    await db.query(
      `INSERT INTO audit_log (user_id, action, ip_address, meta) VALUES ($1,$2,$3,$4)`,
      [req.user.id, action, req.ip || null, JSON.stringify(meta)]
    );
  } catch { /* logging must never break the actual request */ }
}

async function getMe(req, res) {
  res.json({
    isSuperAdmin: req.user.isSuperAdmin,
    isContentAdmin: req.user.isContentAdmin,
    user: { id: req.user.id, email: req.user.email, fullName: req.user.fullName },
  });
}

async function getStats(req, res) {
  const [orgs, users, subs, revenue] = await Promise.all([
    db.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE is_suspended) AS suspended FROM organizations`),
    db.query(`SELECT COUNT(*) AS total FROM users`),
    db.query(
      `SELECT
         COUNT(*) FILTER (WHERE p.slug != 'free') AS paid,
         COUNT(*) FILTER (WHERE p.slug = 'free')  AS free
       FROM subscriptions s JOIN plans p ON p.id = s.plan_id`
    ),
    db.query(
      `SELECT COALESCE(SUM(amount_ngn), 0) AS total_ngn, COUNT(*) AS count
       FROM payments WHERE status = 'successful'`
    ),
  ]);

  res.json({
    orgs: {
      total: Number(orgs.rows[0].total),
      suspended: Number(orgs.rows[0].suspended),
    },
    users: Number(users.rows[0].total),
    subscriptions: {
      paid: Number(subs.rows[0].paid),
      free: Number(subs.rows[0].free),
    },
    revenue: {
      totalNgn: Number(revenue.rows[0].total_ngn),
      paymentsCount: Number(revenue.rows[0].count),
    },
  });
}

// ── Organizations ────────────────────────────────────────────────────────────

async function listOrgs(req, res) {
  const search = (req.query.search || '').trim();
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;

  const { rows } = await db.query(
    `SELECT o.id, o.name, o.is_suspended, o.suspended_at, o.suspended_reason, o.created_at,
            (SELECT COUNT(*) FROM users WHERE org_id = o.id) AS user_count,
            p.id AS plan_id, p.name AS plan_name, p.slug AS plan_slug, s.status AS sub_status, s.current_period_end,
            (SELECT full_name FROM users WHERE org_id = o.id AND role = 'owner' LIMIT 1) AS owner_name,
            (SELECT email FROM users WHERE org_id = o.id AND role = 'owner' LIMIT 1) AS owner_email
     FROM organizations o
     LEFT JOIN subscriptions s ON s.org_id = o.id
     LEFT JOIN plans p ON p.id = s.plan_id
     WHERE ($1 = '' OR o.name ILIKE '%' || $1 || '%')
     ORDER BY o.created_at DESC
     LIMIT $2 OFFSET $3`,
    [search, limit, offset]
  );

  const countRow = await db.query(
    `SELECT COUNT(*) FROM organizations WHERE ($1 = '' OR name ILIKE '%' || $1 || '%')`,
    [search]
  );

  res.json({ orgs: rows, total: Number(countRow.rows[0].count) });
}

async function getOrg(req, res) {
  const { id } = req.params;

  const orgRes = await db.query(
    `SELECT o.id, o.name, o.is_suspended, o.suspended_at, o.suspended_reason, o.created_at,
            p.id AS plan_id, p.name AS plan_name, p.slug AS plan_slug,
            s.id AS sub_id, s.status AS sub_status, s.current_period_start, s.current_period_end
     FROM organizations o
     LEFT JOIN subscriptions s ON s.org_id = o.id
     LEFT JOIN plans p ON p.id = s.plan_id
     WHERE o.id = $1`,
    [id]
  );
  if (!orgRes.rows.length) return res.status(404).json({ error: 'Organization not found.' });

  const [members, payments] = await Promise.all([
    db.query(
      `SELECT id, full_name, email, role, is_super_admin, created_at
       FROM users WHERE org_id = $1 ORDER BY created_at ASC`,
      [id]
    ),
    db.query(
      `SELECT pay.id, pay.tx_ref, pay.flw_tx_id, pay.amount_ngn, pay.status,
              pay.period_months, pay.created_at, p.name AS plan_name
       FROM payments pay JOIN plans p ON p.id = pay.plan_id
       WHERE pay.org_id = $1 ORDER BY pay.created_at DESC LIMIT 20`,
      [id]
    ),
  ]);

  res.json({ org: orgRes.rows[0], members: members.rows, payments: payments.rows });
}

async function suspendOrg(req, res) {
  const { id } = req.params;
  const { suspend, reason } = req.body || {};

  const orgRes = await db.query(`SELECT id, is_suspended FROM organizations WHERE id = $1`, [id]);
  if (!orgRes.rows.length) return res.status(404).json({ error: 'Organization not found.' });

  if (suspend) {
    await db.query(
      `UPDATE organizations SET is_suspended = true, suspended_at = now(), suspended_reason = $1 WHERE id = $2`,
      [reason || null, id]
    );
  } else {
    await db.query(
      `UPDATE organizations SET is_suspended = false, suspended_at = null, suspended_reason = null WHERE id = $1`,
      [id]
    );
  }

  await logAdminAction(req, suspend ? 'org.suspend' : 'org.unsuspend', { orgId: id, reason });
  res.json({ ok: true, suspended: !!suspend });
}

async function overrideSubscription(req, res) {
  const { id } = req.params;
  const { planId, periodStart, periodEnd } = req.body || {};

  if (!planId) return res.status(400).json({ error: 'planId is required.' });

  const orgRes = await db.query(`SELECT id FROM organizations WHERE id = $1`, [id]);
  if (!orgRes.rows.length) return res.status(404).json({ error: 'Organization not found.' });

  const planRes = await db.query(`SELECT id, slug FROM plans WHERE id = $1`, [planId]);
  if (!planRes.rows.length) return res.status(404).json({ error: 'Plan not found.' });

  const start = periodStart ? new Date(periodStart) : new Date();
  const end = periodEnd ? new Date(periodEnd) : (planRes.rows[0].slug === 'free' ? null : null);

  await db.query(
    `INSERT INTO subscriptions (org_id, plan_id, status, current_period_start, current_period_end)
     VALUES ($1, $2, 'active', $3, $4)
     ON CONFLICT (org_id) DO UPDATE SET
       plan_id = EXCLUDED.plan_id,
       status  = 'active',
       current_period_start = EXCLUDED.current_period_start,
       current_period_end   = EXCLUDED.current_period_end,
       updated_at = now()`,
    [id, planId, start, end || null]
  );

  await logAdminAction(req, 'org.subscription_override', { orgId: id, planId });
  res.json({ ok: true });
}

// ── Users ────────────────────────────────────────────────────────────────────

async function listUsers(req, res) {
  const search = (req.query.search || '').trim();
  const orgId = req.query.orgId || '';
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;

  const { rows } = await db.query(
    `SELECT u.id, u.full_name, u.email, u.role, u.is_super_admin, u.created_at,
            o.id AS org_id, o.name AS org_name
     FROM users u
     JOIN organizations o ON o.id = u.org_id
     WHERE ($1 = '' OR u.full_name ILIKE '%' || $1 || '%' OR u.email ILIKE '%' || $1 || '%')
       AND ($2::uuid IS NULL OR u.org_id = $2::uuid)
     ORDER BY u.created_at DESC
     LIMIT $3 OFFSET $4`,
    [search, orgId || null, limit, offset]
  );

  const countRow = await db.query(
    `SELECT COUNT(*) FROM users u
     WHERE ($1 = '' OR u.full_name ILIKE '%' || $1 || '%' OR u.email ILIKE '%' || $1 || '%')
       AND ($2::uuid IS NULL OR u.org_id = $2::uuid)`,
    [search, orgId || null]
  );

  res.json({ users: rows, total: Number(countRow.rows[0].count) });
}

async function updateUser(req, res) {
  const { id } = req.params;
  const { isSuperAdmin, role } = req.body || {};

  const userRes = await db.query(`SELECT id, is_super_admin, role, org_id FROM users WHERE id = $1`, [id]);
  if (!userRes.rows.length) return res.status(404).json({ error: 'User not found.' });

  // Prevent revoking your own super-admin status
  if (userRes.rows[0].id === req.user.id && isSuperAdmin === false) {
    return res.status(400).json({ error: 'Cannot revoke your own super-admin status.' });
  }

  const updates = [];
  const values = [];
  let idx = 1;

  if (isSuperAdmin !== undefined) {
    updates.push(`is_super_admin = $${idx++}`);
    values.push(!!isSuperAdmin);
  }
  if (role !== undefined && ['owner', 'admin', 'member'].includes(role)) {
    updates.push(`role = $${idx++}`);
    values.push(role);
  }

  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });

  values.push(id);
  await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, values);

  await logAdminAction(req, 'user.update', { targetUserId: id, isSuperAdmin, role });
  res.json({ ok: true });
}

async function deleteUser(req, res) {
  const { id } = req.params;

  if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account.' });

  const userRes = await db.query(`SELECT id, is_super_admin FROM users WHERE id = $1`, [id]);
  if (!userRes.rows.length) return res.status(404).json({ error: 'User not found.' });
  if (userRes.rows[0].is_super_admin) return res.status(400).json({ error: 'Cannot delete another super-admin. Demote them first.' });

  await db.query(`DELETE FROM users WHERE id = $1`, [id]);
  await logAdminAction(req, 'user.delete', { targetUserId: id });
  res.json({ ok: true });
}

// ── Plans ────────────────────────────────────────────────────────────────────

async function listPlans(req, res) {
  const { rows } = await db.query(
    `SELECT id, slug, name, price_ngn, max_users, features, is_active, sort_order,
            (SELECT COUNT(*) FROM subscriptions WHERE plan_id = plans.id) AS org_count
     FROM plans ORDER BY sort_order`
  );
  res.json({ plans: rows });
}

async function createPlan(req, res) {
  const { slug, name, priceNgn, maxUsers, features, sortOrder } = req.body || {};
  if (!slug || !name) return res.status(400).json({ error: 'slug and name are required.' });

  const featureArr = Array.isArray(features) ? features : [];
  const { rows } = await db.query(
    `INSERT INTO plans (slug, name, price_ngn, max_users, features, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [slug, name, priceNgn || 0, maxUsers || 1, JSON.stringify(featureArr), sortOrder || 99]
  );
  await logAdminAction(req, 'plan.create', { slug, name });
  res.status(201).json({ plan: rows[0] });
}

async function updatePlan(req, res) {
  const { id } = req.params;
  const { name, priceNgn, maxUsers, features, isActive, sortOrder } = req.body || {};

  const planRes = await db.query(`SELECT id FROM plans WHERE id = $1`, [id]);
  if (!planRes.rows.length) return res.status(404).json({ error: 'Plan not found.' });

  const updates = [];
  const values = [];
  let idx = 1;

  if (name !== undefined)       { updates.push(`name = $${idx++}`);        values.push(name); }
  if (priceNgn !== undefined)   { updates.push(`price_ngn = $${idx++}`);   values.push(Number(priceNgn)); }
  if (maxUsers !== undefined)   { updates.push(`max_users = $${idx++}`);   values.push(Number(maxUsers)); }
  if (features !== undefined)   { updates.push(`features = $${idx++}`);    values.push(JSON.stringify(Array.isArray(features) ? features : [])); }
  if (isActive !== undefined)   { updates.push(`is_active = $${idx++}`);   values.push(!!isActive); }
  if (sortOrder !== undefined)  { updates.push(`sort_order = $${idx++}`);  values.push(Number(sortOrder)); }

  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });

  values.push(id);
  const { rows } = await db.query(
    `UPDATE plans SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  await logAdminAction(req, 'plan.update', { planId: id });
  res.json({ plan: rows[0] });
}

// ── Payments ─────────────────────────────────────────────────────────────────

async function listPayments(req, res) {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;

  const { rows } = await db.query(
    `SELECT pay.id, pay.tx_ref, pay.flw_tx_id, pay.amount_ngn, pay.status,
            pay.period_months, pay.created_at,
            p.name AS plan_name,
            o.id AS org_id, o.name AS org_name
     FROM payments pay
     JOIN plans p ON p.id = pay.plan_id
     JOIN organizations o ON o.id = pay.org_id
     ORDER BY pay.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const countRow = await db.query(`SELECT COUNT(*) FROM payments`);
  res.json({ payments: rows, total: Number(countRow.rows[0].count) });
}

// ── Site content (editorial) ────────────────────────────────────────────────
// Open to any admin (super_admin or content_admin) — editing marketing/
// homepage copy is exactly what the content-editor role exists for.

async function listContent(req, res) {
  const { section } = req.query;
  const { rows } = await db.query(
    section
      ? `SELECT * FROM site_content WHERE section = $1 ORDER BY sort_order, content_key`
      : `SELECT * FROM site_content ORDER BY section, sort_order, content_key`,
    section ? [section] : []
  );
  res.json({ content: rows });
}

async function updateContent(req, res) {
  const { key } = req.params;
  const { value } = req.body || {};
  if (value === undefined) return res.status(400).json({ error: 'value is required.' });
  const { rows } = await db.query(
    `UPDATE site_content SET content_value = $1, updated_by = $2, updated_at = now() WHERE content_key = $3 RETURNING *`,
    [value, req.user.id, key]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  await logAdminAction(req, 'content.update', { key, valuePreview: String(value).slice(0, 120) });
  res.json({ content: rows[0] });
}

// ── Admin role management (super_admin only — enforced at the route level) ──

async function listAdmins(req, res) {
  const { rows } = await db.query(
    `SELECT id, full_name, email, is_super_admin, is_content_admin FROM users
     WHERE is_super_admin = true OR is_content_admin = true ORDER BY full_name`
  );
  res.json({ admins: rows });
}

async function setAdminRole(req, res) {
  const { id } = req.params;
  const { isSuperAdmin, isContentAdmin } = req.body || {};
  const updates = []; const values = []; let idx = 1;
  if (isSuperAdmin !== undefined)   { updates.push(`is_super_admin = $${idx++}`);   values.push(!!isSuperAdmin); }
  if (isContentAdmin !== undefined) { updates.push(`is_content_admin = $${idx++}`); values.push(!!isContentAdmin); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  values.push(id);
  const { rows } = await db.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, full_name, email, is_super_admin, is_content_admin`,
    values
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found.' });
  await logAdminAction(req, 'admin.role_change', { targetUserId: id, isSuperAdmin, isContentAdmin });
  res.json({ user: rows[0] });
}

async function findAdminCandidate(req, res) {
  const email = (req.query.email || '').trim();
  if (!email) return res.status(400).json({ error: 'email query param required.' });
  const { rows } = await db.query(
    `SELECT id, full_name, email, is_super_admin, is_content_admin FROM users WHERE email = $1`,
    [email]
  );
  if (!rows.length) return res.status(404).json({ error: 'No user with that email.' });
  res.json({ user: rows[0] });
}

// ── Audit log ────────────────────────────────────────────────────────────────

async function listAuditLog(req, res) {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const { rows } = await db.query(
    `SELECT al.id, al.action, al.meta, al.ip_address, al.created_at,
            u.full_name AS user_name, u.email AS user_email
     FROM audit_log al
     LEFT JOIN users u ON u.id = al.user_id
     ORDER BY al.created_at DESC
     LIMIT $1`,
    [limit]
  );
  res.json({ entries: rows });
}

module.exports = {
  logAdminAction,
  getMe, getStats,
  listOrgs, getOrg, suspendOrg, overrideSubscription,
  listUsers, updateUser, deleteUser,
  listPlans, createPlan, updatePlan,
  listPayments,
  listContent, updateContent,
  listAdmins, setAdminRole, findAdminCandidate,
  listAuditLog,
};
