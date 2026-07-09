const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  listDepartments, createDepartment, updateDepartment, deleteDepartment,
  listEmployees, exportEmployees, createEmployee, updateEmployee, deleteEmployee, bulkDeleteEmployees,
  listLeaveRequests, createLeaveRequest, reviewLeaveRequest, deleteLeaveRequest,
  listPayrollRuns, getPayrollRun, createPayrollRun, updatePayrollEntry, processPayrollRun, deletePayrollRun,
  getHrStats,
} = require('../controllers/hrController');

const router = Router();
router.use(requireAuth);

router.get('/stats', getHrStats);

router.get('/departments', listDepartments);
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);
router.get('/departments/export', async (req, res) => { const { sendCsv, autoColumns } = require('../utils/csv'); const db = require('../db'); const { rows } = await db.query('SELECT * FROM departments WHERE org_id = $1 ORDER BY name', [req.user.orgId]); sendCsv(res, 'departments.csv', rows, autoColumns(rows)); });
router.post('/departments/bulk-delete', async (req, res) => { const db = require('../db'); const { ids } = req.body || {}; if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids required.' }); await db.query('UPDATE employees SET department_id=NULL WHERE department_id=ANY($1) AND org_id=$2', [ids, req.user.orgId]); const { rowCount } = await db.query('DELETE FROM departments WHERE id=ANY($1) AND org_id=$2', [ids, req.user.orgId]); res.json({ deleted: rowCount }); });

router.get('/employees', listEmployees);
router.get('/employees/export', exportEmployees);
router.post('/employees/bulk-delete', bulkDeleteEmployees);
router.post('/employees', createEmployee);
router.put('/employees/:id', updateEmployee);
router.delete('/employees/:id', deleteEmployee);

router.get('/leave', listLeaveRequests);
router.post('/leave', createLeaveRequest);
router.patch('/leave/:id/review', reviewLeaveRequest);
router.delete('/leave/:id', deleteLeaveRequest);
router.get('/leave/export', async (req, res) => { const { sendCsv, autoColumns } = require('../utils/csv'); const db = require('../db'); const { rows } = await db.query('SELECT lr.*,e.full_name AS employee_name FROM leave_requests lr LEFT JOIN employees e ON e.id=lr.employee_id WHERE lr.org_id=$1 ORDER BY lr.created_at DESC', [req.user.orgId]); sendCsv(res, 'leave_requests.csv', rows, autoColumns(rows)); });
router.post('/leave/bulk-delete', async (req, res) => { const db = require('../db'); const { bulkDeleteHandler } = require('../utils/bulkDelete'); bulkDeleteHandler('leave_requests')(req, res); });

router.get('/payroll', listPayrollRuns);
router.get('/payroll/:id', getPayrollRun);
router.post('/payroll', createPayrollRun);
router.put('/payroll/:runId/entries/:entryId', updatePayrollEntry);
router.post('/payroll/:id/process', processPayrollRun);
router.delete('/payroll/:id', deletePayrollRun);

module.exports = router;
