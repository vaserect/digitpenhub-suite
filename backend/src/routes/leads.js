const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');
const {
  listForms, createForm, getForm, updateForm, deleteForm,
  getPublicForm, submitForm,
  listSubmissions, updateSubmission, deleteSubmission,
  getStats,
} = require('../controllers/leadsController');

const router = Router();

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions. Please try again later.' },
});

// Public — no auth
router.get('/forms/:id/public', getPublicForm);
router.post('/forms/:id/submit', submitLimiter, submitForm);

// Protected
router.use(requireAuth);

router.get('/', (req, res) => res.json({ ok: true, message: 'Use /api/v1/leads/forms for form management' }));
router.get('/stats', getStats);
router.get('/export', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM forms WHERE org_id = $1', [req.user.orgId]);
  sendCsv(res, 'forms.csv', rows, autoColumns(rows));
});
router.post('/bulk-delete', bulkDeleteHandler('forms'));

router.get('/forms', listForms);
router.post('/forms', createForm);
router.get('/forms/:id', getForm);
router.patch('/forms/:id', updateForm);
router.delete('/forms/:id', deleteForm);

router.get('/submissions', listSubmissions);
router.patch('/submissions/:id', updateSubmission);
router.delete('/submissions/:id', deleteSubmission);

module.exports = router;
