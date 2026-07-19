const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const abTestingController = require('../controllers/abTestingController');

const router = express.Router();
const checkAccess = [requireAuth, requireModuleAccess('creative-a-b-testing-studio')];

// ==================== PUBLIC TRAFFIC API ====================
// These are public endpoints triggered by landing pages or client-side split testing libraries
router.get('/public/route/:id', abTestingController.routeTraffic);
router.post('/public/conversion/:id/:variationId', abTestingController.recordConversion);

// ==================== PROTECTED ADMIN API ====================
// Experiments CRUD
router.get('/experiments', checkAccess, abTestingController.listExperiments);
router.get('/experiments/:id', checkAccess, abTestingController.getExperiment);
router.post('/experiments', checkAccess, abTestingController.createExperiment);
router.put('/experiments/:id', checkAccess, abTestingController.updateExperiment);
router.delete('/experiments/:id', checkAccess, abTestingController.deleteExperiment);

// Variations CRUD
router.post('/experiments/:experimentId/variations', checkAccess, abTestingController.createVariation);
router.put('/experiments/:experimentId/variations/:id', checkAccess, abTestingController.updateVariation);
router.delete('/experiments/:experimentId/variations/:id', checkAccess, abTestingController.deleteVariation);

// Statistical Analytics Report
router.get('/experiments/:id/analytics', checkAccess, abTestingController.getAnalytics);

module.exports = router;
