const db = require('../db');

async function listPalettes(req, res) {
  const { rows } = await db.query(
    `SELECT * FROM color_palettes WHERE org_id=$1 ORDER BY created_at DESC`, [req.user.orgId]);
  res.json({ palettes: rows });
}

async function createPalette(req, res) {
  const { name, colors, tags } = req.body || {};
  if (!name?.trim() || !Array.isArray(colors) || colors.length === 0) return res.status(400).json({ error: 'name and colors required.' });
  const { rows } = await db.query(
    `INSERT INTO color_palettes (org_id,name,colors,tags) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.orgId, name.trim(), JSON.stringify(colors), JSON.stringify(tags||[])]
  );
  res.status(201).json({ palette: rows[0] });
}

async function updatePalette(req, res) {
  const { id } = req.params;
  const { name, colors, tags } = req.body || {};
  const { rows } = await db.query(
    `UPDATE color_palettes SET name=COALESCE($3,name), colors=COALESCE($4,colors), tags=COALESCE($5,tags)
     WHERE id=$1 AND org_id=$2 RETURNING *`,
    [id, req.user.orgId, name||null, colors ? JSON.stringify(colors) : null, tags ? JSON.stringify(tags) : null]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ palette: rows[0] });
}

async function deletePalette(req, res) {
  await db.query(`DELETE FROM color_palettes WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

module.exports = { listPalettes, createPalette, updatePalette, deletePalette };
