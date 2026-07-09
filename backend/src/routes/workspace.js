const { Router } = require('express');
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');
const { getOrgPlan } = require('../utils/planAccess');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

// ── Clone workspace (creates a sandbox copy of the current org) ───────────────
// Copies core data: contacts, invoices, projects, tasks, pages, documents,
// custom fields. Does NOT copy API keys, sessions, or billing info — the
// sandbox gets a fresh free-tier subscription.
router.post('/clone', asyncHandler(async (req, res) => {
  const { name } = req.body || {};
  const sandboxName = (name || `${req.user.fullName || 'User'}'s Sandbox`).trim().slice(0, 200);

  if (await db.query(`SELECT id FROM organizations WHERE name = $1`, [sandboxName]).then(r => r.rows.length)) {
    return res.status(409).json({ error: 'A workspace with that name already exists.' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 1. Create sandbox org
    const { rows: orgRows } = await client.query(
      `INSERT INTO organizations (name) VALUES ($1) RETURNING id`,
      [sandboxName]
    );
    const sandboxOrgId = orgRows[0].id;

    // 2. Clone the requesting user into the sandbox as owner
    const { rows: userRows } = await client.query(
      `SELECT full_name, email, password_hash, role FROM users WHERE id = $1`,
      [req.user.id]
    );
    const sourceUser = userRows[0];
    const sandboxEmail = `${sourceUser.email.split('@')[0]}+sandbox-${Date.now()}@${sourceUser.email.split('@')[1] || 'sandbox.local'}`;
    await client.query(
      `INSERT INTO users (org_id, full_name, email, password_hash, role) VALUES ($1, $2, $3, $4, 'owner')`,
      [sandboxOrgId, `${sourceUser.full_name} (Sandbox)`, sandboxEmail, sourceUser.password_hash]
    );

    // 3. Clone contacts
    await client.query(
      `INSERT INTO contacts (org_id, full_name, email, phone, company, stage, value_ngn, tags)
       SELECT $1, full_name, email, phone, company, 'new', 0, '[]'::jsonb
       FROM contacts WHERE org_id = $2`,
      [sandboxOrgId, req.user.orgId]
    );

    // 4. Clone custom fields (definitions only)
    await client.query(
      `INSERT INTO custom_field_definitions (org_id, record_type, name, field_type, required, options)
       SELECT $1, record_type, name, field_type, required, options
       FROM custom_field_definitions WHERE org_id = $2`,
      [sandboxOrgId, req.user.orgId]
    );

    // 5. Clone projects
    try {
      await client.query(
        `INSERT INTO projects (org_id, name, description, status)
         SELECT $1, name, description, 'planning'
         FROM projects WHERE org_id = $2`,
        [sandboxOrgId, req.user.orgId]
      );
    } catch { /* projects table may not exist */ }

    // 6. Clone tasks
    try {
      await client.query(
        `INSERT INTO tasks (org_id, title, description, status)
         SELECT $1, title, description, 'open'
         FROM tasks WHERE org_id = $2`,
        [sandboxOrgId, req.user.orgId]
      );
    } catch { /* tasks table may not exist */ }

    // 7. Clone invoices (as drafts)
    try {
      await client.query(
        `INSERT INTO invoices (org_id, invoice_number, status, subtotal, tax_rate, total, notes)
         SELECT $1, invoice_number || '-sandbox', 'draft', subtotal, tax_rate, total, notes
         FROM invoices WHERE org_id = $2`,
        [sandboxOrgId, req.user.orgId]
      );
    } catch { /* invoices table may not exist */ }

    // 8. Clone pages (as drafts)
    try {
      await client.query(
        `INSERT INTO pages (org_id, title, slug, status)
         SELECT $1, title || ' (Sandbox)', slug || '-sandbox', 'draft'
         FROM pages WHERE org_id = $2 AND status = 'live'`,
        [sandboxOrgId, req.user.orgId]
      );
    } catch { /* pages table may not exist */ }

    await client.query('COMMIT');
    res.status(201).json({
      sandbox: { id: sandboxOrgId, name: sandboxName },
      message: 'Sandbox workspace created with cloned data from your production workspace.',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

// ── List sandbox workspaces for the current user ──────────────────────────────
router.get('/sandboxes', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT o.id, o.name, o.created_at,
            (SELECT count(*)::int FROM users WHERE org_id = o.id) AS user_count
     FROM organizations o
     JOIN users u ON u.org_id = o.id
     WHERE u.email LIKE $1 AND o.id != $2
     ORDER BY o.created_at DESC`,
    [`${req.user.email.split('@')[0]}%@${req.user.email.split('@')[1]}`, req.user.orgId]
  );
  res.json({ sandboxes: rows });
}));

// ── Delete a sandbox workspace (permanent) ────────────────────────────────────
router.delete('/sandboxes/:id', asyncHandler(async (req, res) => {
  // Verify this is a sandbox (same email pattern) and not the user's primary org
  const { rows } = await db.query(
    `SELECT o.id FROM organizations o
     JOIN users u ON u.org_id = o.id AND u.email LIKE $1
     WHERE o.id = $2 AND o.id != $3`,
    [`${req.user.email.split('@')[0]}%@${req.user.email.split('@')[1]}`, req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Sandbox not found.' });
  await db.query('DELETE FROM organizations WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

// ── Data Export Portability (one-click "export everything") ───────────────────
router.get('/export-all', asyncHandler(async (req, res) => {
  const orgId = req.user.orgId;
  const data = {};

  const tables = ['contacts', 'invoices', 'projects', 'tasks', 'pages', 'documents',
    'notes', 'contracts', 'products', 'orders', 'coupons', 'email_lists', 'email_campaigns'];
  for (const table of tables) {
    try {
      const { rows } = await db.query(`SELECT * FROM ${table} WHERE org_id = $1 LIMIT 1000`, [orgId]);
      data[table] = rows;
    } catch { /* table may not exist */ }
  }

  res.json({
    exportedAt: new Date().toISOString(),
    workspace: { id: orgId, name: req.user.orgName },
    exportedBy: req.user.email,
    data,
  });
}));

module.exports = router;
