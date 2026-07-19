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
  const { rows } = await db.query('SELECT * FROM lead_forms WHERE org_id = $1', [req.user.orgId]);
  sendCsv(res, 'forms.csv', rows, autoColumns(rows));
});
router.post('/bulk-delete', bulkDeleteHandler('lead_forms'));

router.get('/forms', listForms);
router.post('/forms', createForm);
router.get('/forms/:id', getForm);
router.patch('/forms/:id', updateForm);
router.delete('/forms/:id', deleteForm);

router.get('/submissions', listSubmissions);
router.patch('/submissions/:id', updateSubmission);
router.delete('/submissions/:id', deleteSubmission);

module.exports = router;

// Extended functionality
const ext = require('../controllers/leadsControllerExtensions');

// Popups
router.get('/popups', ext.listPopups);
router.post('/popups', ext.createPopup);
router.get('/popups/:id', ext.getPopup);
router.patch('/popups/:id', ext.updatePopup);
router.delete('/popups/:id', ext.deletePopup);

// A/B Testing Variants
router.get('/forms/:formId/variants', ext.listVariants);
router.post('/forms/:formId/variants', ext.createVariant);
router.patch('/variants/:id', ext.updateVariant);
router.delete('/variants/:id', ext.deleteVariant);

// Analytics
router.get('/analytics/top-forms', ext.getTopPerformingForms);
router.get('/forms/:formId/analytics', ext.getFormAnalytics);
router.get('/forms/:formId/analytics/variants', ext.getVariantPerformance);
router.get('/forms/:formId/analytics/funnel', ext.getConversionFunnel);
router.post('/forms/:formId/track', ext.trackFormEvent);

// Lead Scoring
router.get('/scoring-rules', ext.listScoringRules);
router.post('/scoring-rules', ext.createScoringRule);
router.patch('/scoring-rules/:id', ext.updateScoringRule);
router.delete('/scoring-rules/:id', ext.deleteScoringRule);
router.post('/submissions/:id/calculate-score', ext.calculateScore);

// Lead Assignment & Follow-up
router.post('/submissions/:id/assign', ext.assignLead);
router.post('/submissions/:id/follow-up', ext.setFollowUp);
router.get('/follow-ups', ext.getFollowUpReminders);

// Bulk Operations
router.post('/submissions/bulk-status', ext.bulkUpdateStatus);
router.post('/submissions/bulk-assign', ext.bulkAssign);

// Webhooks
router.get('/webhooks', ext.listWebhooks);
router.post('/webhooks', ext.createWebhook);
router.patch('/webhooks/:id', ext.updateWebhook);
router.delete('/webhooks/:id', ext.deleteWebhook);
