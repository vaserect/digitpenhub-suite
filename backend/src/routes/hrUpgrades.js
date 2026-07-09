const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

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
  // Build tree
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
  // Update balance if approved
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
