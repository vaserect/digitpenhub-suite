const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireHrAccess } = require('../middleware/hrAuth');
const {
  getStats,
  listJobs, createJob, updateJob, deleteJob,
  listApplicants, exportApplicants, createApplicant, updateApplicant, deleteApplicant, bulkDeleteApplicants,
} = require('../controllers/recruitmentController');

const router = Router();
router.use(requireAuth, requireHrAccess);

router.get('/stats', getStats);

router.get('/jobs', listJobs);
router.post('/jobs', createJob);
router.put('/jobs/:id', updateJob);
router.delete('/jobs/:id', deleteJob);

router.get('/applicants', listApplicants);
router.get('/applicants/export', exportApplicants);
router.post('/applicants/bulk-delete', bulkDeleteApplicants);
router.post('/applicants', createApplicant);
router.put('/applicants/:id', updateApplicant);
router.delete('/applicants/:id', deleteApplicant);

module.exports = router;
