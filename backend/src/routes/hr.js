const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  listDepartments, createDepartment, updateDepartment, deleteDepartment,
  listEmployees, createEmployee, updateEmployee, deleteEmployee,
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

router.get('/employees', listEmployees);
router.post('/employees', createEmployee);
router.put('/employees/:id', updateEmployee);
router.delete('/employees/:id', deleteEmployee);

router.get('/leave', listLeaveRequests);
router.post('/leave', createLeaveRequest);
router.patch('/leave/:id/review', reviewLeaveRequest);
router.delete('/leave/:id', deleteLeaveRequest);

router.get('/payroll', listPayrollRuns);
router.get('/payroll/:id', getPayrollRun);
router.post('/payroll', createPayrollRun);
router.put('/payroll/:runId/entries/:entryId', updatePayrollEntry);
router.post('/payroll/:id/process', processPayrollRun);
router.delete('/payroll/:id', deletePayrollRun);

module.exports = router;
