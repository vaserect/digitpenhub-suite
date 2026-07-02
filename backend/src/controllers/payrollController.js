const db = require('../db');

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS total_runs,
       COUNT(*) FILTER(WHERE status='draft')::int AS drafts,
       COUNT(*) FILTER(WHERE status='paid')::int AS paid_runs,
       COALESCE(SUM(total_net) FILTER(WHERE status='paid'),0) AS total_paid
     FROM payroll_runs WHERE org_id=$1`,
    [req.user.orgId]
  );
  res.json({ ...rows[0], totalPaid: Number(rows[0].total_paid) });
}

async function listRuns(req, res) {
  const { rows } = await db.query(
    `SELECT r.*, COUNT(i.id)::int AS employee_count
     FROM payroll_runs r LEFT JOIN payroll_items i ON i.run_id=r.id
     WHERE r.org_id=$1 GROUP BY r.id ORDER BY r.created_at DESC`,
    [req.user.orgId]
  );
  res.json({ runs: rows });
}

async function getRun(req, res) {
  const [runRes, itemsRes] = await Promise.all([
    db.query(`SELECT * FROM payroll_runs WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]),
    db.query(`SELECT * FROM payroll_items WHERE run_id=$1 ORDER BY employee_name`, [req.params.id]),
  ]);
  if (!runRes.rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ run: runRes.rows[0], items: itemsRes.rows });
}

async function createRun(req, res) {
  const { name, periodStart, periodEnd, notes } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  const { rows } = await db.query(
    `INSERT INTO payroll_runs (org_id,name,period_start,period_end,notes) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.orgId, name.trim(), periodStart, periodEnd, notes||null]
  );
  res.status(201).json({ run: rows[0] });
}

async function updateRun(req, res) {
  const { id } = req.params;
  const { name, status, notes, periodStart, periodEnd } = req.body || {};
  const updates=[]; const vals=[]; let i=1;
  if (name        !==undefined){updates.push(`name=$${i++}`);         vals.push(name.trim());}
  if (status      !==undefined){updates.push(`status=$${i++}`);       vals.push(status); if (status==='paid') { updates.push(`paid_at=NOW()`); }}
  if (notes       !==undefined){updates.push(`notes=$${i++}`);        vals.push(notes||null);}
  if (periodStart !==undefined){updates.push(`period_start=$${i++}`); vals.push(periodStart);}
  if (periodEnd   !==undefined){updates.push(`period_end=$${i++}`);   vals.push(periodEnd);}
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  updates.push('updated_at=NOW()');
  vals.push(id, req.user.orgId);
  const { rows } = await db.query(`UPDATE payroll_runs SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ run: rows[0] });
}

async function deleteRun(req, res) {
  await db.query(`DELETE FROM payroll_runs WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function addItem(req, res) {
  const { runId } = req.params;
  const { employeeName, employeeEmail, department, grossSalary, allowances, tax, pension, otherDeductions, bankName, accountNumber } = req.body || {};
  if (!employeeName?.trim()) return res.status(400).json({ error: 'employeeName required' });
  const gross  = Number(grossSalary)||0;
  const allw   = Number(allowances)||0;
  const t      = Number(tax)||0;
  const pen    = Number(pension)||0;
  const other  = Number(otherDeductions)||0;
  const netPay = gross + allw - t - pen - other;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const itemRes = await client.query(
      `INSERT INTO payroll_items (org_id,run_id,employee_name,employee_email,department,gross_salary,allowances,tax,pension,other_deductions,net_pay,bank_name,account_number)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [req.user.orgId, runId, employeeName.trim(), employeeEmail||null, department||null, gross, allw, t, pen, other, netPay, bankName||null, accountNumber||null]
    );
    await client.query(
      `UPDATE payroll_runs SET total_gross=total_gross+$1, total_deductions=total_deductions+$2, total_net=total_net+$3, updated_at=NOW() WHERE id=$4`,
      [gross+allw, t+pen+other, netPay, runId]
    );
    await client.query('COMMIT');
    res.status(201).json({ item: itemRes.rows[0] });
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}

async function removeItem(req, res) {
  const { runId, itemId } = req.params;
  const { rows } = await db.query(`DELETE FROM payroll_items WHERE id=$1 AND run_id=$2 RETURNING *`, [itemId, runId]);
  if (rows.length) {
    const r = rows[0];
    await db.query(
      `UPDATE payroll_runs SET total_gross=total_gross-$1, total_deductions=total_deductions-$2, total_net=total_net-$3, updated_at=NOW() WHERE id=$4`,
      [Number(r.gross_salary)+Number(r.allowances), Number(r.tax)+Number(r.pension)+Number(r.other_deductions), Number(r.net_pay), runId]
    );
  }
  res.json({ ok: true });
}

module.exports = { getStats, listRuns, getRun, createRun, updateRun, deleteRun, addItem, removeItem };
