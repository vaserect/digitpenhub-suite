const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const ugcAggregatorController = require('../controllers/ugcAggregatorController');

const router = express.Router();
const checkAccess = [requireAuth, requireModuleAccess('ugc-creator-content-aggregator')];

// ==================== PUBLIC TELEMETRY API ====================
// Widget script reports clicks/impressions externally
router.post('/public/telemetry/:orgId', ugcAggregatorController.recordTelemetry);

// ==================== PROTECTED ADMIN API ====================
// Feeds management
router.get('/feeds', checkAccess, ugcAggregatorController.listFeeds);
router.get('/feeds/:id', checkAccess, ugcAggregatorController.getFeed);
router.post('/feeds', checkAccess, ugcAggregatorController.createFeed);
router.put('/feeds/:id', checkAccess, ugcAggregatorController.updateFeed);
router.delete('/feeds/:id', checkAccess, ugcAggregatorController.deleteFeed);

// Curation Queue Posts
router.get('/posts', checkAccess, ugcAggregatorController.listPosts);
router.put('/posts/:id/approve', checkAccess, ugcAggregatorController.approvePost);
router.put('/posts/:id/reject', checkAccess, ugcAggregatorController.rejectPost);
router.put('/posts/:id/shoppable', checkAccess, ugcAggregatorController.tagShoppableProduct);
router.put('/posts/:id/pin', checkAccess, ugcAggregatorController.togglePinPost);

// Sync trigger
router.post('/feeds/:id/sync', checkAccess, ugcAggregatorController.syncFeed);

// Embed Code & Stats
router.get('/embed', checkAccess, ugcAggregatorController.getEmbedCode);
router.get('/analytics', checkAccess, ugcAggregatorController.getAnalytics);

module.exports = router;
