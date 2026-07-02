const db = require('../db');

async function listFunnels(req, res) {
  const { rows } = await db.query(
    `SELECT f.id, f.name, f.description, f.status, f.created_at, f.updated_at,
            COUNT(fs.id) AS step_count
     FROM funnels f
     LEFT JOIN funnel_steps fs ON fs.funnel_id = f.id
     WHERE f.org_id = $1
     GROUP BY f.id
     ORDER BY f.updated_at DESC`,
    [req.user.orgId]
  );
  res.json({ funnels: rows });
}

async function getFunnel(req, res) {
  const { id } = req.params;

  const funnelRes = await db.query(
    `SELECT * FROM funnels WHERE id = $1 AND org_id = $2`,
    [id, req.user.orgId]
  );
  if (!funnelRes.rows.length) return res.status(404).json({ error: 'Funnel not found.' });

  const stepsRes = await db.query(
    `SELECT fs.id, fs.step_order, fs.step_type, fs.page_id,
            p.slug AS page_slug, p.title AS page_title, p.status AS page_status
     FROM funnel_steps fs
     JOIN pages p ON p.id = fs.page_id
     WHERE fs.funnel_id = $1
     ORDER BY fs.step_order`,
    [id]
  );

  res.json({ funnel: funnelRes.rows[0], steps: stepsRes.rows });
}

async function createFunnel(req, res) {
  const { name, description } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required.' });

  const { rows } = await db.query(
    `INSERT INTO funnels (org_id, name, description) VALUES ($1, $2, $3) RETURNING *`,
    [req.user.orgId, name.trim(), description || null]
  );
  res.status(201).json({ funnel: rows[0] });
}

async function updateFunnel(req, res) {
  const { id } = req.params;
  const { name, description, status } = req.body || {};

  const existing = await db.query(`SELECT id FROM funnels WHERE id = $1 AND org_id = $2`, [id, req.user.orgId]);
  if (!existing.rows.length) return res.status(404).json({ error: 'Funnel not found.' });

  const updates = [];
  const values = [];
  let idx = 1;

  if (name !== undefined)        { updates.push(`name = $${idx++}`);        values.push(name.trim()); }
  if (description !== undefined) { updates.push(`description = $${idx++}`); values.push(description || null); }
  if (status !== undefined && ['draft','published'].includes(status)) {
    updates.push(`status = $${idx++}`);
    values.push(status);
  }

  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });

  updates.push(`updated_at = now()`);
  values.push(id, req.user.orgId);

  const { rows } = await db.query(
    `UPDATE funnels SET ${updates.join(', ')} WHERE id = $${idx} AND org_id = $${idx + 1} RETURNING *`,
    values
  );
  res.json({ funnel: rows[0] });
}

async function deleteFunnel(req, res) {
  const { id } = req.params;
  const { rowCount } = await db.query(`DELETE FROM funnels WHERE id = $1 AND org_id = $2`, [id, req.user.orgId]);
  if (!rowCount) return res.status(404).json({ error: 'Funnel not found.' });
  res.json({ ok: true });
}

async function addStep(req, res) {
  const { id } = req.params;
  const { pageId, stepType } = req.body || {};
  if (!pageId) return res.status(400).json({ error: 'pageId is required.' });

  const funnelRes = await db.query(`SELECT id FROM funnels WHERE id = $1 AND org_id = $2`, [id, req.user.orgId]);
  if (!funnelRes.rows.length) return res.status(404).json({ error: 'Funnel not found.' });

  const pageRes = await db.query(`SELECT id FROM pages WHERE id = $1 AND org_id = $2`, [pageId, req.user.orgId]);
  if (!pageRes.rows.length) return res.status(404).json({ error: 'Page not found.' });

  const maxOrderRes = await db.query(`SELECT COALESCE(MAX(step_order), -1) AS max_order FROM funnel_steps WHERE funnel_id = $1`, [id]);
  const nextOrder = Number(maxOrderRes.rows[0].max_order) + 1;

  const validType = ['page','optin','upsell','downsell','thankyou'].includes(stepType) ? stepType : 'page';

  const { rows } = await db.query(
    `INSERT INTO funnel_steps (funnel_id, page_id, step_order, step_type) VALUES ($1,$2,$3,$4) RETURNING *`,
    [id, pageId, nextOrder, validType]
  );
  res.status(201).json({ step: rows[0] });
}

async function removeStep(req, res) {
  const { id, stepId } = req.params;

  const funnelRes = await db.query(`SELECT id FROM funnels WHERE id = $1 AND org_id = $2`, [id, req.user.orgId]);
  if (!funnelRes.rows.length) return res.status(404).json({ error: 'Funnel not found.' });

  const { rowCount } = await db.query(`DELETE FROM funnel_steps WHERE id = $1 AND funnel_id = $2`, [stepId, id]);
  if (!rowCount) return res.status(404).json({ error: 'Step not found.' });

  // Compact ordering after removal
  await db.query(
    `UPDATE funnel_steps SET step_order = sub.rn - 1
     FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY step_order) AS rn FROM funnel_steps WHERE funnel_id = $1) sub
     WHERE funnel_steps.id = sub.id`,
    [id]
  );

  res.json({ ok: true });
}

async function reorderSteps(req, res) {
  const { id } = req.params;
  const { orderedIds } = req.body || {};
  if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds must be an array.' });

  const funnelRes = await db.query(`SELECT id FROM funnels WHERE id = $1 AND org_id = $2`, [id, req.user.orgId]);
  if (!funnelRes.rows.length) return res.status(404).json({ error: 'Funnel not found.' });

  for (let i = 0; i < orderedIds.length; i++) {
    await db.query(`UPDATE funnel_steps SET step_order = $1 WHERE id = $2 AND funnel_id = $3`, [i, orderedIds[i], id]);
  }

  res.json({ ok: true });
}

module.exports = { listFunnels, getFunnel, createFunnel, updateFunnel, deleteFunnel, addStep, removeStep, reorderSteps };
