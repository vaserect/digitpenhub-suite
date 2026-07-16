const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');
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

module.exports = router;