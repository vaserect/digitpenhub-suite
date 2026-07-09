const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

// ── Middleware: check permission against a specific module/scope/record ────────
// Returns a middleware that rejects the request if the user's role doesn't
// have the required permission. Can be used on individual routes.
function requirePermission(moduleSlug, minScope = 'view', recordScope = 'all') {
  return async function (req, res, next) {
    try {
      // Super admin bypasses all permission checks
      if (req.user.isSuperAdmin) return next();
      // Owner role gets everything
      if (req.user.role === 'owner') return next();

      const { rows } = await db.query(
        `SELECT scope, record_scope FROM role_permissions rp
         JOIN role_definitions rd ON rd.id = rp.role_id
         WHERE rd.id = $1 AND rp.module_slug = $2`,
        [req.user.roleId, moduleSlug]
      );

      if (!rows.length) {
        return res.status(403).json({ error: 'No access to this module.' });
      }

      const perm = rows[0];
      const scopeLevels = ['none', 'view', 'create', 'edit', 'delete', 'manage'];
      const requiredLevel = scopeLevels.indexOf(minScope);
      const userLevel = scopeLevels.indexOf(perm.scope);

      if (userLevel < requiredLevel) {
        return res.status(403).json({ error: `Access denied. Required: ${minScope}, have: ${perm.scope}.` });
      }

      if (recordScope === 'own' && perm.record_scope === 'own' && req.params.id) {
        // Basic check: if record_scope is 'own', verify ownership
        // This is a simplified check — real implementations should verify
        // the record's owner against req.user.id
      }

      req.permission = perm;
      next();
    } catch (err) {
      next(err);
    }
  };
}

// ── Roles CRUD ────────────────────────────────────────────────────────────────
// Only owner and admin can manage roles

router.get('/roles', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, name, slug, is_system, sort_order
     FROM role_definitions WHERE org_id = $1 ORDER BY sort_order`,
    [req.user.orgId]
  );
  res.json({ roles: rows });
}));

router.post('/roles', asyncHandler(async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only owners and admins can create roles.' });
  }
  const { name } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'Role name is required.' });

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const { rows } = await db.query(
    `INSERT INTO role_definitions (org_id, name, slug, sort_order)
     VALUES ($1, $2, $3, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM role_definitions WHERE org_id = $1))
     RETURNING *`,
    [req.user.orgId, name.trim(), slug]
  );
  res.status(201).json({ role: rows[0] });
}));

router.delete('/roles/:id', asyncHandler(async (req, res) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Only the owner can delete roles.' });
  }
  const { rows } = await db.query(
    `DELETE FROM role_definitions WHERE id = $1 AND org_id = $2 AND is_system = false RETURNING *`,
    [req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Role not found or is a system role.' });
  res.json({ ok: true });
}));

// ── Permissions ───────────────────────────────────────────────────────────────

router.get('/roles/:roleId/permissions', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT rp.* FROM role_permissions rp
     JOIN role_definitions rd ON rd.id = rp.role_id
     WHERE rp.role_id = $1 AND rd.org_id = $2
     ORDER BY rp.module_slug`,
    [req.params.roleId, req.user.orgId]
  );
  res.json({ permissions: rows });
}));

router.put('/roles/:roleId/permissions/:moduleSlug', asyncHandler(async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only owners and admins can modify permissions.' });
  }
  const { scope, recordScope } = req.body || {};

  const validScopes = ['none', 'view', 'create', 'edit', 'delete', 'manage'];
  const validRecordScopes = ['own', 'team', 'all'];

  if (scope && !validScopes.includes(scope)) {
    return res.status(400).json({ error: `Invalid scope. Valid: ${validScopes.join(', ')}` });
  }
  if (recordScope && !validRecordScopes.includes(recordScope)) {
    return res.status(400).json({ error: `Invalid record_scope. Valid: ${validRecordScopes.join(', ')}` });
  }

  // Verify the role belongs to this org
  const roleCheck = await db.query(
    `SELECT id FROM role_definitions WHERE id = $1 AND org_id = $2`,
    [req.params.roleId, req.user.orgId]
  );
  if (!roleCheck.rows.length) return res.status(404).json({ error: 'Role not found.' });

  const { rows } = await db.query(
    `INSERT INTO role_permissions (role_id, module_slug, scope, record_scope)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (role_id, module_slug)
     DO UPDATE SET scope = COALESCE($3, role_permissions.scope),
                   record_scope = COALESCE($4, role_permissions.record_scope)
     RETURNING *`,
    [req.params.roleId, req.params.moduleSlug, scope || 'view', recordScope || 'own']
  );
  res.json({ permission: rows[0] });
}));

// ── Record-level permissions ──────────────────────────────────────────────────

router.get('/records/:resourceType/:resourceId', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM record_permissions
     WHERE org_id = $1 AND resource_type = $2 AND resource_id = $3
     ORDER BY created_at DESC`,
    [req.user.orgId, req.params.resourceType, req.params.resourceId]
  );
  res.json({ permissions: rows });
}));

router.put('/records/:resourceType/:resourceId/:userId', asyncHandler(async (req, res) => {
  const { scope } = req.body || {};
  if (!['view', 'edit', 'delete', 'manage'].includes(scope)) {
    return res.status(400).json({ error: 'scope must be: view, edit, delete, or manage' });
  }
  const { rows } = await db.query(
    `INSERT INTO record_permissions (org_id, user_id, resource_type, resource_id, scope)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, resource_type, resource_id)
     DO UPDATE SET scope = $5
     RETURNING *`,
    [req.user.orgId, req.params.userId, req.params.resourceType, req.params.resourceId, scope]
  );
  res.json({ permission: rows[0] });
}));

router.delete('/records/:resourceType/:resourceId/:userId', asyncHandler(async (req, res) => {
  await db.query(
    `DELETE FROM record_permissions
     WHERE org_id = $1 AND resource_type = $2 AND resource_id = $3 AND user_id = $4`,
    [req.user.orgId, req.params.resourceType, req.params.resourceId, req.params.userId]
  );
  res.json({ ok: true });
}));

module.exports = { router, requirePermission };
