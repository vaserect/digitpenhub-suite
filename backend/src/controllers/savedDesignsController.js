const db = require('../db');

const VALID_TOOLS = new Set(['graphic-design-editor', 'flyer-builder', 'logo-maker']);

async function listDesigns(req, res) {
  const { tool } = req.query;
  if (!VALID_TOOLS.has(tool)) return res.status(400).json({ error: 'Invalid or missing tool.' });
  const { rows } = await db.query(
    `SELECT id, name, updated_at FROM saved_designs WHERE org_id=$1 AND tool=$2 ORDER BY updated_at DESC`,
    [req.user.orgId, tool]
  );
  res.json({ designs: rows });
}

async function getDesign(req, res) {
  const { rows } = await db.query(
    `SELECT * FROM saved_designs WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Design not found.' });
  res.json({ design: rows[0] });
}

async function createDesign(req, res) {
  const { tool, name, data } = req.body || {};
  if (!VALID_TOOLS.has(tool)) return res.status(400).json({ error: 'Invalid or missing tool.' });
  const { rows } = await db.query(
    `INSERT INTO saved_designs (org_id, tool, name, data) VALUES ($1,$2,$3,$4) RETURNING id, name, updated_at`,
    [req.user.orgId, tool, (name || 'Untitled design').trim() || 'Untitled design', JSON.stringify(data || {})]
  );
  res.status(201).json({ design: rows[0] });
}

async function updateDesign(req, res) {
  const { name, data } = req.body || {};
  const { rows } = await db.query(
    `UPDATE saved_designs SET name=COALESCE($1,name), data=COALESCE($2,data), updated_at=NOW()
     WHERE id=$3 AND org_id=$4 RETURNING id, name, updated_at`,
    [name ? name.trim() : null, data ? JSON.stringify(data) : null, req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Design not found.' });
  res.json({ design: rows[0] });
}

async function deleteDesign(req, res) {
  await db.query(`DELETE FROM saved_designs WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

module.exports = { listDesigns, getDesign, createDesign, updateDesign, deleteDesign };
