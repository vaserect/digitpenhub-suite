const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const controller = require('../controllers/heatmapsController');

const router = Router();

// Public: track session events
router.post('/track', controller.trackSession);

// Protected routes
router.use(requireAuth);

router.get('/', controller.getRecordings);
router.get('/pages', controller.getPages);
router.get('/heatmap', controller.getHeatmap);
router.get('/analytics', controller.getAnalytics);
router.get('/settings', controller.getSettings);
router.put('/settings', controller.updateSettings);
router.get('/:id', controller.getRecording);

module.exports = router;
