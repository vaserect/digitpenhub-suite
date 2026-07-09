const db = require('../db');

async function listTemplates(req, res) {
  const { category } = req.query;
  const conditions = [];
  const values = [];
  let idx = 1;
  if (category) { conditions.push(`ft.category = $${idx++}`); values.push(category); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await db.query(
    `SELECT ft.*, (SELECT count(*) FROM funnel_template_steps WHERE funnel_template_id = ft.id) AS step_count
     FROM funnel_templates ft ${where} ORDER BY ft.sort_order, ft.name`,
    values
  );
  res.json({ templates: rows });
}

async function listCategories(req, res) {
  const { rows } = await db.query(
    `SELECT category, count(*) AS count FROM funnel_templates GROUP BY category ORDER BY category`
  );
  res.json({ categories: rows });
}

async function getTemplate(req, res) {
  const { rows } = await db.query(`SELECT * FROM funnel_templates WHERE id = $1`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Template not found.' });
  const { rows: steps } = await db.query(
    `SELECT * FROM funnel_template_steps WHERE funnel_template_id = $1 ORDER BY step_order`,
    [req.params.id]
  );
  res.json({ template: rows[0], steps });
}

async function useTemplate(req, res) {
  const { rows: tRows } = await db.query(`SELECT * FROM funnel_templates WHERE id = $1`, [req.params.id]);
  if (!tRows.length) return res.status(404).json({ error: 'Template not found.' });
  const { rows: steps } = await db.query(
    `SELECT * FROM funnel_template_steps WHERE funnel_template_id = $1 ORDER BY step_order`,
    [req.params.id]
  );
  if (!steps.length) return res.status(400).json({ error: 'Funnel template has no steps.' });

  const prefix = req.body?.name || tRows[0].name;
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Create the funnel
    const { rows: funnelRows } = await client.query(
      `INSERT INTO funnels (org_id, name) VALUES ($1, $2) RETURNING *`,
      [req.user.orgId, prefix]
    );
    const funnel = funnelRows[0];

    // Create each step: look up page template, create page, add step
    for (const step of steps) {
      const { rows: ptRows } = await client.query(
        `SELECT id, blocks FROM page_templates WHERE name = $1`,
        [step.page_template_name]
      );
      if (!ptRows.length) {
        console.warn(`  ! Page template "${step.page_template_name}" not found, skipping step`);
        continue;
      }
      const pt = ptRows[0];
      const slug = `${prefix.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-step-${step.step_order}`;
      const blocks = typeof pt.blocks === 'string' ? pt.blocks : JSON.stringify(pt.blocks);

      const { rows: pageRows } = await client.query(
        `INSERT INTO pages (org_id, slug, title, blocks, status)
         VALUES ($1, $2, $3, $4::jsonb, 'draft') RETURNING *`,
        [req.user.orgId, slug, step.page_template_name, blocks]
      );

      await client.query(
        `INSERT INTO funnel_steps (funnel_id, page_id, step_order, step_type)
         VALUES ($1, $2, $3, $4)`,
        [funnel.id, pageRows[0].id, step.step_order, step.step_type]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ funnel });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { listTemplates, listCategories, getTemplate, useTemplate };
