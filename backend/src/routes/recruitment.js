const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  getStats,
  listJobs, createJob, updateJob, deleteJob,
  listApplicants, exportApplicants, createApplicant, updateApplicant, deleteApplicant,
} = require('../controllers/recruitmentController');

const router = Router();
router.use(requireAuth);

router.get('/stats', getStats);

router.get('/jobs', listJobs);
router.post('/jobs', createJob);
router.put('/jobs/:id', updateJob);
router.delete('/jobs/:id', deleteJob);

router.get('/applicants', listApplicants);
router.get('/applicants/export', exportApplicants);
router.post('/applicants', createApplicant);
router.put('/applicants/:id', updateApplicant);
router.delete('/applicants/:id', deleteApplicant);

module.exports = router;
