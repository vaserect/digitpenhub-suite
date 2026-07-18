/**
 * Review Management Routes
 * 
 * Maps business review operations, request logging, settings management,
 * and public client-side feedback submission routes.
 */

const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const c = require('../controllers/reviewsController');

const router = Router();

// ── Public Routes (Widget & Guest Feedback Submission) ──────────
router.get('/embed', c.getEmbedReviews);
router.get('/feedback/settings/:orgId', c.getPublicFeedbackSettings);
router.post('/feedback', c.submitPublicFeedback);

// ── Private Protected Routes (Authentication Required) ──────────
router.use(requireAuth);
router.use(requireModuleAccess('review-management'));

// Reviews Feed & Statistics
router.get('/', c.listReviews);
router.get('/stats', c.getStats);
router.post('/:id/reply', c.addReply);
router.delete('/:id/reply', c.deleteReply);

// Configuration Settings
router.get('/settings', c.getSettings);
router.put('/settings', c.updateSettings);

// Review Requests Distribution
router.post('/request', c.sendRequest);
router.get('/requests', c.listRequests);

// Development Mock Data Seeder
router.post('/seed', c.seedMockData);

module.exports = router;
