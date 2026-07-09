const db = require('../db');

async function listTemplates(req, res) {
  const { category, q } = req.query;
  const conditions = [];
  const values = [];
  let idx = 1;
  if (category) { conditions.push(`category = $${idx++}`); values.push(category); }
  if (q && q.trim()) { conditions.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`); values.push(`%${q.trim()}%`); idx++; }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await db.query(
    `SELECT id, category, name, description, subject, sort_order
     FROM email_templates ${where} ORDER BY category, sort_order, name`,
    values
  );
  res.json({ templates: rows });
}

async function listCategories(req, res) {
  const { rows } = await db.query(
    `SELECT category, COUNT(*) AS count FROM email_templates GROUP BY category ORDER BY category`
  );
  res.json({ categories: rows });
}

async function getTemplate(req, res) {
  const { rows } = await db.query(`SELECT * FROM email_templates WHERE id = $1`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Template not found.' });
  res.json({ template: rows[0] });
}

// Creates a new email campaign pre-populated from a template
async function useTemplate(req, res) {
  const { rows: tRows } = await db.query(`SELECT * FROM email_templates WHERE id = $1`, [req.params.id]);
  if (!tRows.length) return res.status(404).json({ error: 'Template not found.' });
  const template = tRows[0];
  const { rows } = await db.query(
    `INSERT INTO email_campaigns (org_id, subject, body_html, status)
     VALUES ($1, $2, $3, 'draft') RETURNING *`,
    [req.user.orgId, template.subject, template.body_html]
  );
  res.status(201).json({ campaign: rows[0] });
}

module.exports = { listTemplates, listCategories, getTemplate, useTemplate };
