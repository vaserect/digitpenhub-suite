const db = require('../db');

const REPORT_QUERIES = {
  revenue: (orgId) => db.query(
    `SELECT DATE_TRUNC('month', created_at) AS period, SUM(total)::numeric AS amount, COUNT(*)::int AS count
     FROM invoices WHERE org_id=$1 AND status='paid' GROUP BY 1 ORDER BY 1 DESC LIMIT 12`, [orgId]
  ),
  expenses: (orgId) => db.query(
    `SELECT DATE_TRUNC('month', expense_date) AS period, SUM(amount)::numeric AS amount, COUNT(*)::int AS count
     FROM expenses WHERE org_id=$1 GROUP BY 1 ORDER BY 1 DESC LIMIT 12`, [orgId]
  ),
  leads: (orgId) => db.query(
    `SELECT status, COUNT(*)::int AS count FROM leads WHERE org_id=$1 GROUP BY status ORDER BY count DESC`, [orgId]
  ),
  customers: (orgId) => db.query(
    `SELECT DATE_TRUNC('month', created_at) AS period, COUNT(*)::int AS count
     FROM customers WHERE org_id=$1 GROUP BY 1 ORDER BY 1 DESC LIMIT 12`, [orgId]
  ),
  orders: (orgId) => db.query(
    `SELECT status, COUNT(*)::int AS count, COALESCE(SUM(total),0)::numeric AS total FROM orders WHERE org_id=$1 GROUP BY status`, [orgId]
  ),
  inventory: (orgId) => db.query(
    `SELECT category, COUNT(*)::int AS count, SUM(stock_qty)::int AS total_stock, SUM(stock_qty*price)::numeric AS value
     FROM inventory_products WHERE org_id=$1 GROUP BY category ORDER BY value DESC LIMIT 20`, [orgId]
  ),
  helpdesk: (orgId) => db.query(
    `SELECT status, priority, COUNT(*)::int AS count FROM helpdesk_tickets WHERE org_id=$1 GROUP BY status, priority ORDER BY status, priority`, [orgId]
  ),
  tasks: (orgId) => db.query(
    `SELECT status, COUNT(*)::int AS count FROM task_items WHERE org_id=$1 GROUP BY status`, [orgId]
  ),
};

async function listReports(req, res) {
  const { rows } = await db.query(`SELECT * FROM saved_reports WHERE org_id=$1 ORDER BY created_at DESC`, [req.user.orgId]);
  res.json({ reports: rows });
}

async function createReport(req, res) {
  const { name, description, module, config } = req.body || {};
  if (!name?.trim())   return res.status(400).json({ error: 'name required' });
  if (!module?.trim()) return res.status(400).json({ error: 'module required' });
  const { rows } = await db.query(
    `INSERT INTO saved_reports (org_id,name,description,module,config) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.orgId, name.trim(), description||null, module.trim(), JSON.stringify(config||{})]
  );
  res.status(201).json({ report: rows[0] });
}

async function runReport(req, res) {
  const { id } = req.params;
  const { rows } = await db.query(`SELECT * FROM saved_reports WHERE id=$1 AND org_id=$2`, [id, req.user.orgId]);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  const report = rows[0];
  const queryFn = REPORT_QUERIES[report.module];
  let data = [];
  if (queryFn) {
    const result = await queryFn(req.user.orgId).catch(() => ({ rows: [] }));
    data = result.rows;
  }
  await db.query(`UPDATE saved_reports SET last_run_at=NOW(), run_count=run_count+1 WHERE id=$1`, [id]);
  res.json({ report, data });
}

async function deleteReport(req, res) {
  await db.query(`DELETE FROM saved_reports WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function runAdhoc(req, res) {
  const { module } = req.params;
  const queryFn = REPORT_QUERIES[module];
  if (!queryFn) return res.status(400).json({ error: `Unknown module: ${module}` });
  const result = await queryFn(req.user.orgId).catch(() => ({ rows: [] }));
  res.json({ data: result.rows, module });
}

async function listModules(req, res) {
  res.json({ modules: Object.keys(REPORT_QUERIES).map((k) => ({ key: k, label: k.charAt(0).toUpperCase() + k.slice(1) })) });
}

module.exports = { listReports, createReport, runReport, deleteReport, runAdhoc, listModules };
