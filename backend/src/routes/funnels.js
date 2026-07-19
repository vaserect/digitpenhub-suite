const express = require('express');
const router = express.Router();
const funnelsController = require('../controllers/funnelsController');

// Templates (must be before /:id routes to avoid conflicts)
router.get('/templates/list', funnelsController.listTemplates);
router.post('/templates/:templateId/create', funnelsController.createFromTemplate);

// Funnel CRUD operations
router.get('/', funnelsController.listFunnels);
router.post('/', funnelsController.createFunnel);
router.get('/:id', funnelsController.getFunnel);
router.put('/:id', funnelsController.updateFunnel);
router.delete('/:id', funnelsController.deleteFunnel);

// Funnel publishing
router.post('/:id/publish', funnelsController.publishFunnel);

// Funnel steps management
router.post('/:id/steps', funnelsController.createStep);
router.put('/:id/steps/:stepId', funnelsController.updateStep);
router.delete('/:id/steps/:stepId', funnelsController.deleteStep);
router.post('/:id/steps/reorder', funnelsController.reorderSteps);

// Analytics
router.get('/:id/analytics', funnelsController.getAnalytics);
router.post('/:id/analytics/events', funnelsController.trackEvent);
router.post('/:id/analytics/conversions', funnelsController.trackConversion);

// A/B Testing
router.post('/:id/ab-tests', funnelsController.createABTest);
router.post('/:id/ab-tests/:testId/start', funnelsController.startABTest);
router.post('/:id/ab-tests/:testId/stop', funnelsController.stopABTest);
router.get('/:id/ab-tests/:testId/results', funnelsController.getABTestResults);

module.exports = router;
module.exports.router = router;