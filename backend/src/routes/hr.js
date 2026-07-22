const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');
const { requireHrAccess, requireSensitiveDataAccess, requirePayrollAccess } = require('../middleware/hrAuth');
const {
  listDepartments, createDepartment, updateDepartment, deleteDepartment,
  listEmployees, exportEmployees, createEmployee, updateEmployee, deleteEmployee, bulkDeleteEmployees,
  listLeaveRequests, createLeaveRequest, reviewLeaveRequest, deleteLeaveRequest,
  listPayrollRuns, getPayrollRun, createPayrollRun, updatePayrollEntry, processPayrollRun, deletePayrollRun,
  getHrStats,
} = require('../controllers/hrController');

const router = Router();
router.use(requireAuth);

// Rate limiting for HR operations (100 requests per hour)
const hrLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: 'Too many HR requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for sensitive operations (50 requests per hour)
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: 'Too many requests to sensitive HR data. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stats endpoint - requires HR access
router.get('/stats', requireHrAccess, getHrStats);

// Department endpoints - requires HR access
router.get('/departments', requireHrAccess, listDepartments);
router.post('/departments', requireHrAccess, createDepartment);
router.put('/departments/:id', requireHrAccess, updateDepartment);
router.delete('/departments/:id', requireHrAccess, deleteDepartment);
router.get('/departments/export', requireHrAccess, sensitiveLimiter, async (req, res) => { 
  const { sendCsv, autoColumns } = require('../utils/csv'); 
  const db = require('../db'); 
  const { logHrAction } = require('../middleware/hrAuth');
  const { rows } = await db.query('SELECT * FROM departments WHERE org_id = $1 ORDER BY name', [req.user.orgId]); 
  await logHrAction(req.user.id, req.user.orgId, 'hr.departments.export', 'department', null, req, 'success', { count: rows.length });
  sendCsv(res, 'departments.csv', rows, autoColumns(rows)); 
});
router.post('/departments/bulk-delete', requireHrAccess, async (req, res) => { 
  const db = require('../db'); 
  const { logHrAction } = require('../middleware/hrAuth');
  const { ids } = req.body || {}; 
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids required.' }); 
  await db.query('UPDATE employees SET department_id=NULL WHERE department_id=ANY($1) AND org_id=$2', [ids, req.user.orgId]); 
  const { rowCount } = await db.query('DELETE FROM departments WHERE id=ANY($1) AND org_id=$2', [ids, req.user.orgId]); 
  await logHrAction(req.user.id, req.user.orgId, 'hr.departments.bulk_delete', 'department', null, req, 'success', { count: rowCount });
  res.json({ deleted: rowCount }); 
});

// Employee endpoints - list requires HR access, others require sensitive data access
router.get('/employees', hrLimiter, listEmployees); // Authorization handled in controller
router.get('/employees/export', requireSensitiveDataAccess, sensitiveLimiter, exportEmployees);
router.post('/employees/bulk-delete', requireHrAccess, bulkDeleteEmployees);
router.post('/employees', requireHrAccess, createEmployee);
router.put('/employees/:id', requireHrAccess, updateEmployee); // Salary change auth in controller
router.delete('/employees/:id', requireHrAccess, deleteEmployee);

// Leave request endpoints - requires HR access
router.get('/leave', requireHrAccess, listLeaveRequests);
router.post('/leave', requireHrAccess, createLeaveRequest);
router.patch('/leave/:id/review', requireHrAccess, reviewLeaveRequest);
router.delete('/leave/:id', requireHrAccess, deleteLeaveRequest);
router.get('/leave/export', requireHrAccess, sensitiveLimiter, async (req, res) => { 
  const { sendCsv, autoColumns } = require('../utils/csv'); 
  const db = require('../db'); 
  const { logHrAction } = require('../middleware/hrAuth');
  const { rows } = await db.query('SELECT lr.*,e.full_name AS employee_name FROM leave_requests lr LEFT JOIN employees e ON e.id=lr.employee_id WHERE lr.org_id=$1 ORDER BY lr.created_at DESC', [req.user.orgId]); 
  await logHrAction(req.user.id, req.user.orgId, 'hr.leave.export', 'leave_request', null, req, 'success', { count: rows.length });
  sendCsv(res, 'leave_requests.csv', rows, autoColumns(rows)); 
});
router.post('/leave/bulk-delete', requireHrAccess, async (req, res) => { 
  const db = require('../db'); 
  const { bulkDeleteHandler } = require('../utils/bulkDelete'); 
  const { logHrAction } = require('../middleware/hrAuth');
  const result = await bulkDeleteHandler('leave_requests')(req, res);
  if (result) {
    await logHrAction(req.user.id, req.user.orgId, 'hr.leave.bulk_delete', 'leave_request', null, req, 'success', { count: result.deleted });
  }
});

// Payroll endpoints - requires payroll access (HR or Finance)
router.get('/payroll', requirePayrollAccess, sensitiveLimiter, listPayrollRuns);
router.get('/payroll/:id', requirePayrollAccess, sensitiveLimiter, getPayrollRun);
router.post('/payroll', requirePayrollAccess, createPayrollRun);
router.put('/payroll/:runId/entries/:entryId', requirePayrollAccess, updatePayrollEntry);
router.post('/payroll/:id/process', requirePayrollAccess, processPayrollRun);
router.delete('/payroll/:id', requirePayrollAccess, deletePayrollRun);

// ── Org Chart ────────────────────────────────────────────────────────────────
router.get('/org-chart', asyncHandler(async (req, res) => {
  const { rows: depts } = await db.query(
    `SELECT d.*, e.full_name AS head_name
     FROM departments d LEFT JOIN employees e ON e.id = d.head_id
     WHERE d.org_id = $1 ORDER BY d.name`,
    [req.user.orgId]
  );
  const { rows: employees } = await db.query(
    `SELECT id, full_name, job_title, department_id, manager_id, photo_url
     FROM employees WHERE org_id = $1 ORDER BY full_name`,
    [req.user.orgId]
  );
  const orgTree = depts.map(d => ({
    ...d,
    head: employees.find(e => e.id === d.head_id) || null,
    members: employees.filter(e => e.department_id === d.id),
  }));
  res.json({ departments: orgTree, unassigned: employees.filter(e => !e.department_id) });
}));

// ── Leave Balances ────────────────────────────────────────────────────────────
router.get('/leave-balances', asyncHandler(async (req, res) => {
  const { employeeId, year } = req.query;
  const conditions = ['lb.org_id = $1'];
  const params = [req.user.orgId]; let idx = 2;
  if (employeeId) { conditions.push(`lb.employee_id = $${idx++}`); params.push(employeeId); }
  if (year) { conditions.push(`lb.year = $${idx++}`); params.push(parseInt(year)); }
  const { rows } = await db.query(
    `SELECT lb.*, e.full_name FROM hr_leave_balances lb
     LEFT JOIN employees e ON e.id = lb.employee_id
     WHERE ${conditions.join(' AND ')} ORDER BY e.full_name, lb.leave_type`,
    params
  );
  res.json({ balances: rows });
}));

router.post('/leave-balances', asyncHandler(async (req, res) => {
  const { employeeId, leaveType, totalDays } = req.body || {};
  if (!employeeId || !leaveType || !totalDays) return res.status(400).json({ error: 'employeeId, leaveType, totalDays required.' });
  const { rows } = await db.query(
    `INSERT INTO hr_leave_balances (org_id, employee_id, leave_type, total_days)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.orgId, employeeId, leaveType, totalDays]
  );
  res.status(201).json({ balance: rows[0] });
}));

router.patch('/leave-requests/:id/approve', asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!['approved','rejected'].includes(status)) return res.status(400).json({ error: 'status must be approved or rejected.' });
  const { rows } = await db.query(
    `UPDATE leave_requests SET status = $1, reviewed_by = $2, reviewed_at = now() WHERE id = $3 AND org_id = $4 RETURNING *`,
    [status, req.user.id, req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Leave request not found.' });
  if (status === 'approved') {
    const lr = rows[0];
    await db.query(
      `INSERT INTO hr_leave_balances (org_id, employee_id, leave_type, total_days, used_days, year)
       VALUES ($1,$2,$3,0,$4,EXTRACT(YEAR FROM $5::date))
       ON CONFLICT (employee_id, leave_type, year)
       DO UPDATE SET used_days = hr_leave_balances.used_days + $4`,
      [req.user.orgId, lr.employee_id, lr.leave_type, lr.days, lr.start_date]
    );
  }
  res.json({ leaveRequest: rows[0] });
}));

// ── Onboarding ────────────────────────────────────────────────────────────────
router.get('/onboarding-tasks', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM hr_onboarding_tasks WHERE org_id = $1 ORDER BY sort_order`,
    [req.user.orgId]
  );
  res.json({ tasks: rows });
}));

router.post('/onboarding-tasks', asyncHandler(async (req, res) => {
  const { name, description, isRequired } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required.' });
  const { rows } = await db.query(
    `INSERT INTO hr_onboarding_tasks (org_id, name, description, is_required) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.orgId, name, description || null, isRequired !== false]
  );
  res.status(201).json({ task: rows[0] });
}));

router.post('/onboarding/assign/:employeeId', asyncHandler(async (req, res) => {
  const { rows: tasks } = await db.query(
    `SELECT id FROM hr_onboarding_tasks WHERE org_id = $1`, [req.user.orgId]);
  for (const t of tasks) {
    await db.query(
      `INSERT INTO hr_onboarding_checklists (org_id, employee_id, task_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
      [req.user.orgId, req.params.employeeId, t.id]
    );
  }
  res.json({ ok: true });
}));

router.patch('/onboarding/:employeeId/:taskId', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `UPDATE hr_onboarding_checklists SET completed = true, completed_at = now()
     WHERE employee_id = $1 AND task_id = $2 RETURNING *`,
    [req.params.employeeId, req.params.taskId]
  );
  res.json({ checklist: rows[0] });
}));

router.get('/onboarding/:employeeId', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT c.*, t.name, t.description, t.is_required FROM hr_onboarding_checklists c
     JOIN hr_onboarding_tasks t ON t.id = c.task_id
     WHERE c.employee_id = $1 ORDER BY t.sort_order`,
    [req.params.employeeId]
  );
  res.json({ checklist: rows });
}));

// ── Performance Reviews ──────────────────────────────────────────────────────
router.get('/reviews', asyncHandler(async (req, res) => {
  const { status, employeeId } = req.query;
  const conditions = ['r.org_id = $1'];
  const params = [req.user.orgId]; let idx = 2;
  if (status) { conditions.push(`r.status = $${idx++}`); params.push(status); }
  if (employeeId) { conditions.push(`r.employee_id = $${idx++}`); params.push(employeeId); }
  const { rows } = await db.query(
    `SELECT r.*, e.full_name AS employee_name, rev.full_name AS reviewer_name
     FROM hr_performance_reviews r
     LEFT JOIN employees e ON e.id = r.employee_id
     LEFT JOIN employees rev ON rev.id = r.reviewer_id
     WHERE ${conditions.join(' AND ')} ORDER BY r.created_at DESC`,
    params
  );
  res.json({ reviews: rows });
}));

router.post('/reviews', asyncHandler(async (req, res) => {
  const { employeeId, reviewerId, period, dueAt } = req.body || {};
  if (!employeeId || !reviewerId || !period) return res.status(400).json({ error: 'employeeId, reviewerId, period required.' });
  const { rows } = await db.query(
    `INSERT INTO hr_performance_reviews (org_id, employee_id, reviewer_id, period, due_at)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.orgId, employeeId, reviewerId, period, dueAt || null]
  );
  res.status(201).json({ review: rows[0] });
}));

router.put('/reviews/:id', asyncHandler(async (req, res) => {
  const { rating, summary, goals, achievements, improvements, status } = req.body || {};
  const { rows } = await db.query(
    `UPDATE hr_performance_reviews SET rating=$1, summary=$2, goals=$3, achievements=$4,
     improvements=$5, status=$6, submitted_at=CASE WHEN $6='submitted' THEN now() ELSE submitted_at END,
     updated_at=now() WHERE id=$7 AND org_id=$8 RETURNING *`,
    [rating, summary, goals, achievements, improvements, status || 'draft', req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ review: rows[0] });
}));

module.exports = router;