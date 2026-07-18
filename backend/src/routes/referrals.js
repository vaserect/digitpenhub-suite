const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const { requireAuth: authenticate } = require('../middleware/auth');

/**
 * Referral Program Routes - Enterprise Edition
 * 
 * Features:
 * - Multi-tier reward programs
 * - Tracking link generation
 * - Click and conversion tracking
 * - Automated reward processing
 * - Fraud detection
 * - Performance analytics
 * - Referrer profile management
 */

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

// Track click and redirect (public endpoint for referral links)
router.get('/track/:linkCode', referralController.trackClick);

// ============================================================================
// AUTHENTICATED ROUTES
// ============================================================================

router.use(authenticate);

// ============================================================================
// DASHBOARD & STATS
// ============================================================================

// GET /api/v1/referrals/stats - Get dashboard statistics
router.get('/stats', referralController.getStats);

// GET /api/v1/referrals/analytics - Get detailed analytics
router.get('/analytics', referralController.getAnalytics);

// ============================================================================
// REFERRAL PROGRAMS
// ============================================================================

// GET /api/v1/referrals/programs - List all programs
router.get('/programs', referralController.listPrograms);

// POST /api/v1/referrals/programs - Create new program
router.post('/programs', referralController.createProgram);

// GET /api/v1/referrals/programs/:id - Get program details
router.get('/programs/:id', referralController.getProgram);

// PUT /api/v1/referrals/programs/:id - Update program
router.put('/programs/:id', referralController.updateProgram);

// DELETE /api/v1/referrals/programs/:id - Delete program
router.delete('/programs/:id', referralController.deleteProgram);

// ============================================================================
// TRACKING LINKS
// ============================================================================

// POST /api/v1/referrals/links - Generate tracking link
router.post('/links', referralController.generateTrackingLink);

// GET /api/v1/referrals/links - List tracking links
router.get('/links', referralController.listTrackingLinks);

// PUT /api/v1/referrals/links/:linkId - Update tracking link
router.put('/links/:linkId', referralController.updateTrackingLink);

// ============================================================================
// CLICK ANALYTICS
// ============================================================================

// GET /api/v1/referrals/clicks/analytics - Get click analytics
router.get('/clicks/analytics', referralController.getClickAnalytics);

// ============================================================================
// REFERRALS
// ============================================================================

// GET /api/v1/referrals/referrals - List all referrals
router.get('/referrals', referralController.listReferrals);

// POST /api/v1/referrals/referrals - Create new referral
router.post('/referrals', referralController.createReferral);

// PUT /api/v1/referrals/referrals/:id - Update referral
router.put('/referrals/:id', referralController.updateReferral);

// DELETE /api/v1/referrals/referrals/:id - Delete referral
router.delete('/referrals/:id', referralController.deleteReferral);

// POST /api/v1/referrals/referrals/bulk-delete - Bulk delete referrals
router.post('/referrals/bulk-delete', referralController.bulkDeleteReferrals);

// POST /api/v1/referrals/referrals/:referralId/conversion - Track conversion
router.post('/referrals/:referralId/conversion', referralController.trackConversion);

// POST /api/v1/referrals/referrals/:referralId/approve - Approve conversion
router.post('/referrals/:referralId/approve', referralController.approveConversion);

// POST /api/v1/referrals/referrals/:referralId/reject - Reject referral
router.post('/referrals/:referralId/reject', referralController.rejectReferral);

// GET /api/v1/referrals/referrals/export - Export referrals to CSV
router.get('/referrals/export', referralController.exportReferrals);

// ============================================================================
// REWARDS
// ============================================================================

// GET /api/v1/referrals/rewards - List all rewards
router.get('/rewards', referralController.listRewards);

// POST /api/v1/referrals/rewards/:rewardId/approve - Approve reward
router.post('/rewards/:rewardId/approve', referralController.approveReward);

// POST /api/v1/referrals/rewards/:rewardId/paid - Mark reward as paid
router.post('/rewards/:rewardId/paid', referralController.markRewardPaid);

// POST /api/v1/referrals/rewards/batch-process - Process batch rewards
router.post('/rewards/batch-process', referralController.processBatchRewards);

// ============================================================================
// REFERRER PROFILES
// ============================================================================

// GET /api/v1/referrals/referrers/profile - Get referrer profile
router.get('/referrers/profile', referralController.getReferrerProfile);

// POST /api/v1/referrals/referrers/profile - Get or create referrer profile
router.post('/referrers/profile', referralController.getOrCreateReferrerProfile);

// GET /api/v1/referrals/referrers/top - Get top referrers
router.get('/referrers/top', referralController.getTopReferrers);

// PUT /api/v1/referrals/referrers/:email - Update referrer profile
router.put('/referrers/:email', referralController.updateReferrerProfile);

// ============================================================================
// FRAUD DETECTION
// ============================================================================

// POST /api/v1/referrals/fraud/detect - Run fraud detection
router.post('/fraud/detect', referralController.runFraudDetection);

// POST /api/v1/referrals/fraud/detect/:referralId - Run fraud detection for specific referral
router.post('/fraud/detect/:referralId', referralController.runFraudDetection);

// GET /api/v1/referrals/fraud/alerts - Get fraud alerts
router.get('/fraud/alerts', referralController.getFraudAlerts);

// POST /api/v1/referrals/fraud/alerts/:alertId/resolve - Resolve fraud alert
router.post('/fraud/alerts/:alertId/resolve', referralController.resolveAlert);

// ============================================================================
// LEGACY COMPATIBILITY (Keep old endpoints working)
// ============================================================================

// Legacy stats endpoint
router.get('/stats', referralController.getStats);

module.exports = router;