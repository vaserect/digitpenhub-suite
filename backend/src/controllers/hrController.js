const db = require('../db');
const { sendCsv, autoColumns } = require('../utils/csv');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const bulkDeleteEmployees = bulkDeleteHandler('employees');

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ── Departments ───────────────────────────────────────────────────────────────

async function listDepartments(req, res) {
  const { rows } = await db.query(
    `SELECT d.id, d.name, d.created_at,
            COUNT(e.id) FILTER (WHERE e.status = 'active') AS employee_count
     FROM departments d
     LEFT JOIN employees e ON e.department_id = d.id AND e.org_id = d.org_id
     WHERE d.org_id = $1
     GROUP BY d.id
     ORDER BY d.name`,
    [req.user.orgId]
  );
  res.json({ departments: rows });
}

async function createDepartment(req, res) {
  const { name } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name is required.' });
  const { rows } = await db.query(
    `INSERT INTO departments (org_id, name) VALUES ($1, $2) RETURNING *`,
    [req.user.orgId, name.trim()]
  );
  res.status(201).json({ department: rows[0] });
}

async function updateDepartment(req, res) {
  const { id } = req.params;
  const { name } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name is required.' });
  const { rows } = await db.query(
    `UPDATE departments SET name = $1 WHERE id = $2 AND org_id = $3 RETURNING *`,
    [name.trim(), id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Department not found.' });
  res.json({ department: rows[0] });
}

async function deleteDepartment(req, res) {
  const { id } = req.params;
  await db.query(`UPDATE employees SET department_id = NULL WHERE department_id = $1 AND org_id = $2`, [id, req.user.orgId]);
  const { rowCount } = await db.query(`DELETE FROM departments WHERE id = $1 AND org_id = $2`, [id, req.user.orgId]);
  if (!rowCount) return res.status(404).json({ error: 'Department not found.' });
  res.json({ ok: true });
}

// ── Employees ─────────────────────────────────────────────────────────────────

async function listEmployees(req, res) {
  const status = req.query.status || '';
  const { rows } = await db.query(
    `SELECT e.id, e.full_name, e.email, e.phone, e.job_title, e.employment_type,
            e.start_date, e.salary_ngn, e.status, e.notes, e.created_at, e.updated_at,
            d.id AS department_id, d.name AS department_name
     FROM employees e
     LEFT JOIN departments d ON d.id = e.department_id
     WHERE e.org_id = $1 AND ($2 = '' OR e.status = $2)
     ORDER BY e.full_name`,
    [req.user.orgId, status]
  );
  res.json({ employees: rows });
}

async function exportEmployees(req, res) {
  const { rows } = await db.query(
    `SELECT e.id, e.full_name, e.email, e.phone, e.job_title, e.employment_type,
            e.start_date, e.salary_ngn, e.status, e.notes, e.created_at, e.updated_at,
            d.name AS department_name
     FROM employees e
     LEFT JOIN departments d ON d.id = e.department_id
     WHERE e.org_id = $1
     ORDER BY e.full_name`,
    [req.user.orgId]
  );
  sendCsv(res, 'employees.csv', rows, autoColumns(rows));
}

async function createEmployee(req, res) {
  const { fullName, email, phone, jobTitle, departmentId, employmentType, startDate, salaryNgn, notes } = req.body || {};
  if (!fullName?.trim()) return res.status(400).json({ error: 'fullName is required.' });

  const { rows } = await db.query(
    `INSERT INTO employees (org_id, full_name, email, phone, job_title, department_id, employment_type, start_date, salary_ngn, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [req.user.orgId, fullName.trim(), email || null, phone || null, jobTitle || null, departmentId || null, employmentType || 'full-time', startDate || null, Number(salaryNgn) || 0, notes || null]
  );
  res.status(201).json({ employee: rows[0] });
}

async function updateEmployee(req, res) {
  const { id } = req.params;
  const { fullName, email, phone, jobTitle, departmentId, employmentType, startDate, salaryNgn, status, notes } = req.body || {};

  const existing = await db.query(`SELECT id FROM employees WHERE id = $1 AND org_id = $2`, [id, req.user.orgId]);
  if (!existing.rows.length) return res.status(404).json({ error: 'Employee not found.' });

  const updates = []; const values = []; let idx = 1;
  if (fullName !== undefined)       { updates.push(`full_name = $${idx++}`);        values.push(fullName.trim()); }
  if (email !== undefined)          { updates.push(`email = $${idx++}`);            values.push(email || null); }
  if (phone !== undefined)          { updates.push(`phone = $${idx++}`);            values.push(phone || null); }
  if (jobTitle !== undefined)       { updates.push(`job_title = $${idx++}`);        values.push(jobTitle || null); }
  if (departmentId !== undefined)   { updates.push(`department_id = $${idx++}`);    values.push(departmentId || null); }
  if (employmentType !== undefined) { updates.push(`employment_type = $${idx++}`);  values.push(employmentType); }
  if (startDate !== undefined)      { updates.push(`start_date = $${idx++}`);       values.push(startDate || null); }
  if (salaryNgn !== undefined)      { updates.push(`salary_ngn = $${idx++}`);       values.push(Number(salaryNgn) || 0); }
  if (status !== undefined)         { updates.push(`status = $${idx++}`);           values.push(status); }
  if (notes !== undefined)          { updates.push(`notes = $${idx++}`);            values.push(notes || null); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });

  updates.push(`updated_at = now()`);
  values.push(id, req.user.orgId);
  const { rows } = await db.query(
    `UPDATE employees SET ${updates.join(', ')} WHERE id = $${idx} AND org_id = $${idx + 1} RETURNING *`,
    values
  );
  res.json({ employee: rows[0] });
}

async function deleteEmployee(req, res) {
  const { id } = req.params;
  const { rowCount } = await db.query(`DELETE FROM employees WHERE id = $1 AND org_id = $2`, [id, req.user.orgId]);
  if (!rowCount) return res.status(404).json({ error: 'Employee not found.' });
  res.json({ ok: true });
}

// ── Leave ─────────────────────────────────────────────────────────────────────

async function listLeaveRequests(req, res) {
  const status = req.query.status || '';
  const { rows } = await db.query(
    `SELECT lr.id, lr.leave_type, lr.start_date, lr.end_date, lr.reason, lr.status, lr.reviewer_notes, lr.created_at,
            e.id AS employee_id, e.full_name AS employee_name
     FROM leave_requests lr
     JOIN employees e ON e.id = lr.employee_id
     WHERE lr.org_id = $1 AND ($2 = '' OR lr.status = $2)
     ORDER BY lr.created_at DESC`,
    [req.user.orgId, status]
  );
  res.json({ requests: rows });
}

async function createLeaveRequest(req, res) {
  const { employeeId, leaveType, startDate, endDate, reason } = req.body || {};
  if (!employeeId || !startDate || !endDate) return res.status(400).json({ error: 'employeeId, startDate, and endDate are required.' });

  const empRes = await db.query(`SELECT id FROM employees WHERE id = $1 AND org_id = $2`, [employeeId, req.user.orgId]);
  if (!empRes.rows.length) return res.status(404).json({ error: 'Employee not found.' });

  const { rows } = await db.query(
    `INSERT INTO leave_requests (org_id, employee_id, leave_type, start_date, end_date, reason)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.orgId, employeeId, leaveType || 'annual', startDate, endDate, reason || null]
  );
  res.status(201).json({ request: rows[0] });
}

async function reviewLeaveRequest(req, res) {
  const { id } = req.params;
  const { status, reviewerNotes } = req.body || {};
  if (!['approved','rejected'].includes(status)) return res.status(400).json({ error: 'status must be approved or rejected.' });

  const { rows } = await db.query(
    `UPDATE leave_requests SET status = $1, reviewer_notes = $2
     WHERE id = $3 AND org_id = $4 RETURNING *`,
    [status, reviewerNotes || null, id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Leave request not found.' });

  if (status === 'approved') {
    await db.query(`UPDATE employees SET status = 'on-leave' WHERE id = $1 AND org_id = $2`, [rows[0].employee_id, req.user.orgId]);
  }
  res.json({ request: rows[0] });
}

async function deleteLeaveRequest(req, res) {
  const { id } = req.params;
  const { rowCount } = await db.query(`DELETE FROM leave_requests WHERE id = $1 AND org_id = $2 AND status = 'pending'`, [id, req.user.orgId]);
  if (!rowCount) return res.status(404).json({ error: 'Pending leave request not found.' });
  res.json({ ok: true });
}

// ── Payroll ───────────────────────────────────────────────────────────────────

async function listPayrollRuns(req, res) {
  const { rows } = await db.query(
    `SELECT pr.id, pr.period_month, pr.period_year, pr.status, pr.total_gross_ngn, pr.total_net_ngn,
            pr.notes, pr.created_at, pr.processed_at,
            COUNT(pe.id) AS entry_count
     FROM payroll_runs pr
     LEFT JOIN payroll_entries pe ON pe.payroll_run_id = pr.id
     WHERE pr.org_id = $1
     GROUP BY pr.id
     ORDER BY pr.period_year DESC, pr.period_month DESC`,
    [req.user.orgId]
  );
  res.json({ runs: rows });
}

async function getPayrollRun(req, res) {
  const { id } = req.params;
  const runRes = await db.query(`SELECT * FROM payroll_runs WHERE id = $1 AND org_id = $2`, [id, req.user.orgId]);
  if (!runRes.rows.length) return res.status(404).json({ error: 'Payroll run not found.' });

  const entriesRes = await db.query(
    `SELECT pe.id, pe.gross_ngn, pe.deductions_ngn, pe.net_ngn, pe.notes,
            e.id AS employee_id, e.full_name, e.job_title, e.department_id,
            d.name AS department_name
     FROM payroll_entries pe
     JOIN employees e ON e.id = pe.employee_id
     LEFT JOIN departments d ON d.id = e.department_id
     WHERE pe.payroll_run_id = $1
     ORDER BY e.full_name`,
    [id]
  );
  res.json({ run: runRes.rows[0], entries: entriesRes.rows });
}

async function createPayrollRun(req, res) {
  const { month, year } = req.body || {};
  const m = Number(month);
  const y = Number(year);
  if (!m || !y || m < 1 || m > 12) return res.status(400).json({ error: 'Valid month (1-12) and year are required.' });

  // Get all active employees
  const empRes = await db.query(
    `SELECT id, salary_ngn FROM employees WHERE org_id = $1 AND status = 'active'`,
    [req.user.orgId]
  );
  if (!empRes.rows.length) return res.status(400).json({ error: 'No active employees found.' });

  const totalGross = empRes.rows.reduce((sum, e) => sum + Number(e.salary_ngn), 0);

  let runRow;
  try {
    const { rows } = await db.query(
      `INSERT INTO payroll_runs (org_id, period_month, period_year, total_gross_ngn, total_net_ngn)
       VALUES ($1,$2,$3,$4,$4) RETURNING *`,
      [req.user.orgId, m, y, totalGross]
    );
    runRow = rows[0];
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: `A payroll run for ${MONTHS[m - 1]} ${y} already exists.` });
    throw err;
  }

  // Create entries for each active employee
  for (const emp of empRes.rows) {
    await db.query(
      `INSERT INTO payroll_entries (payroll_run_id, employee_id, gross_ngn, deductions_ngn)
       VALUES ($1, $2, $3, 0)`,
      [runRow.id, emp.id, Number(emp.salary_ngn)]
    );
  }

  res.status(201).json({ run: runRow });
}

async function updatePayrollEntry(req, res) {
  const { runId, entryId } = req.params;
  const { grossNgn, deductionsNgn, notes } = req.body || {};

  const runRes = await db.query(`SELECT id, status FROM payroll_runs WHERE id = $1 AND org_id = $2`, [runId, req.user.orgId]);
  if (!runRes.rows.length) return res.status(404).json({ error: 'Payroll run not found.' });
  if (runRes.rows[0].status === 'processed') return res.status(400).json({ error: 'Cannot edit a processed payroll run.' });

  const updates = []; const values = []; let idx = 1;
  if (grossNgn !== undefined)      { updates.push(`gross_ngn = $${idx++}`);      values.push(Number(grossNgn)); }
  if (deductionsNgn !== undefined) { updates.push(`deductions_ngn = $${idx++}`); values.push(Number(deductionsNgn)); }
  if (notes !== undefined)         { updates.push(`notes = $${idx++}`);          values.push(notes || null); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });

  values.push(entryId, runId);
  const { rows } = await db.query(
    `UPDATE payroll_entries SET ${updates.join(', ')} WHERE id = $${idx} AND payroll_run_id = $${idx + 1} RETURNING *`,
    values
  );
  if (!rows.length) return res.status(404).json({ error: 'Entry not found.' });

  // Recalculate run totals
  await db.query(
    `UPDATE payroll_runs SET
       total_gross_ngn = (SELECT COALESCE(SUM(gross_ngn),0) FROM payroll_entries WHERE payroll_run_id = $1),
       total_net_ngn   = (SELECT COALESCE(SUM(net_ngn),0)   FROM payroll_entries WHERE payroll_run_id = $1)
     WHERE id = $1`,
    [runId]
  );

  res.json({ entry: rows[0] });
}

async function processPayrollRun(req, res) {
  const { id } = req.params;
  const { rows } = await db.query(
    `UPDATE payroll_runs SET status = 'processed', processed_at = now() WHERE id = $1 AND org_id = $2 AND status = 'draft' RETURNING *`,
    [id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Draft payroll run not found.' });
  res.json({ run: rows[0] });
}

async function deletePayrollRun(req, res) {
  const { id } = req.params;
  const { rowCount } = await db.query(
    `DELETE FROM payroll_runs WHERE id = $1 AND org_id = $2 AND status = 'draft'`,
    [id, req.user.orgId]
  );
  if (!rowCount) return res.status(404).json({ error: 'Draft payroll run not found.' });
  res.json({ ok: true });
}

async function getHrStats(req, res) {
  const [empStats, leaveStats, payrollStats] = await Promise.all([
    db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'active')     AS active,
         COUNT(*) FILTER (WHERE status = 'on-leave')   AS on_leave,
         COUNT(*) FILTER (WHERE status = 'terminated') AS terminated,
         COALESCE(SUM(salary_ngn) FILTER (WHERE status = 'active'), 0) AS monthly_payroll
       FROM employees WHERE org_id = $1`,
      [req.user.orgId]
    ),
    db.query(
      `SELECT COUNT(*) FILTER (WHERE status = 'pending') AS pending FROM leave_requests WHERE org_id = $1`,
      [req.user.orgId]
    ),
    db.query(
      `SELECT COALESCE(SUM(total_net_ngn), 0) AS paid_this_year
       FROM payroll_runs WHERE org_id = $1 AND status = 'processed' AND period_year = EXTRACT(YEAR FROM now())`,
      [req.user.orgId]
    ),
  ]);

  res.json({
    employees: {
      active:      Number(empStats.rows[0].active),
      onLeave:     Number(empStats.rows[0].on_leave),
      terminated:  Number(empStats.rows[0].terminated),
      monthlyPayroll: Number(empStats.rows[0].monthly_payroll),
    },
    pendingLeave: Number(leaveStats.rows[0].pending),
    paidThisYear: Number(payrollStats.rows[0].paid_this_year),
  });
}

module.exports = {
  listDepartments, createDepartment, updateDepartment, deleteDepartment,
  listEmployees, exportEmployees, createEmployee, updateEmployee, deleteEmployee, bulkDeleteEmployees,
  listLeaveRequests, createLeaveRequest, reviewLeaveRequest, deleteLeaveRequest,
  listPayrollRuns, getPayrollRun, createPayrollRun, updatePayrollEntry, processPayrollRun, deletePayrollRun,
  getHrStats,
};
