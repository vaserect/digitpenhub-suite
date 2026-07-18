const express = require('express');
const router = express.Router();
const affiliateController = require('../controllers/affiliateController');
const { requireAuth: authenticate } = require('../middleware/auth');

// ============================================================================
// AFFILIATE MANAGEMENT ROUTES
// ============================================================================

/**
 * @route   POST /api/affiliates
 * @desc    Create a new affiliate
 * @access  Private
 */
router.post('/', authenticate, affiliateController.createAffiliate);

/**
 * @route   GET /api/affiliates
 * @desc    List all affiliates with filters
 * @access  Private
 */
router.get('/', authenticate, affiliateController.listAffiliates);

/**
 * @route   GET /api/affiliates/analytics
 * @desc    Get overall affiliate analytics
 * @access  Private
 */
router.get('/analytics', authenticate, affiliateController.getAnalytics);

/**
 * @route   GET /api/affiliates/top-performers
 * @desc    Get top performing affiliates
 * @access  Private
 */
router.get('/top-performers', authenticate, affiliateController.getTopPerformers);

/**
 * @route   GET /api/affiliates/export
 * @desc    Export affiliate report
 * @access  Private
 */
router.get('/export', authenticate, affiliateController.exportReport);

/**
 * @route   GET /api/affiliates/:id
 * @desc    Get single affiliate details
 * @access  Private
 */
router.get('/:id', authenticate, affiliateController.getAffiliate);

/**
 * @route   PUT /api/affiliates/:id
 * @desc    Update affiliate details
 * @access  Private
 */
router.put('/:id', authenticate, affiliateController.updateAffiliate);

/**
 * @route   DELETE /api/affiliates/:id
 * @desc    Delete an affiliate
 * @access  Private
 */
router.delete('/:id', authenticate, affiliateController.deleteAffiliate);

/**
 * @route   POST /api/affiliates/:id/approve
 * @desc    Approve a pending affiliate
 * @access  Private
 */
router.post('/:id/approve', authenticate, affiliateController.approveAffiliate);

/**
 * @route   POST /api/affiliates/:id/pause
 * @desc    Pause an affiliate
 * @access  Private
 */
router.post('/:id/pause', authenticate, affiliateController.pauseAffiliate);

/**
 * @route   POST /api/affiliates/:id/resume
 * @desc    Resume a paused affiliate
 * @access  Private
 */
router.post('/:id/resume', authenticate, affiliateController.resumeAffiliate);

/**
 * @route   POST /api/affiliates/:id/fraud-check
 * @desc    Run fraud detection for an affiliate
 * @access  Private
 */
router.post('/:id/fraud-check', authenticate, affiliateController.runFraudCheck);

// ============================================================================
// TRACKING LINKS ROUTES
// ============================================================================

/**
 * @route   POST /api/affiliates/:id/links
 * @desc    Create a tracking link for an affiliate
 * @access  Private
 */
router.post('/:id/links', authenticate, affiliateController.createTrackingLink);

/**
 * @route   GET /api/affiliates/:id/links
 * @desc    List tracking links for an affiliate
 * @access  Private
 */
router.get('/:id/links', authenticate, affiliateController.listTrackingLinks);

/**
 * @route   PUT /api/affiliates/links/:linkId
 * @desc    Update a tracking link
 * @access  Private
 */
router.put('/links/:linkId', authenticate, affiliateController.updateTrackingLink);

/**
 * @route   DELETE /api/affiliates/links/:linkId
 * @desc    Delete a tracking link
 * @access  Private
 */
router.delete('/links/:linkId', authenticate, affiliateController.deleteTrackingLink);

// ============================================================================
// CLICK TRACKING ROUTES
// ============================================================================

/**
 * @route   GET /api/affiliates/:id/clicks
 * @desc    Get click history for an affiliate
 * @access  Private
 */
router.get('/:id/clicks', authenticate, affiliateController.getClickHistory);

// ============================================================================
// CONVERSIONS ROUTES
// ============================================================================

/**
 * @route   POST /api/affiliates/conversions
 * @desc    Record a new conversion
 * @access  Private
 */
router.post('/conversions', authenticate, affiliateController.recordConversion);

/**
 * @route   GET /api/affiliates/:id/conversions
 * @desc    Get conversions for an affiliate
 * @access  Private
 */
router.get('/:id/conversions', authenticate, affiliateController.getAffiliateConversions);

/**
 * @route   GET /api/affiliates/conversions/:id
 * @desc    Get conversion details
 * @access  Private
 */
router.get('/conversions/:id', authenticate, affiliateController.getConversionDetails);

/**
 * @route   PUT /api/affiliates/conversions/:id
 * @desc    Update conversion status (approve/reject)
 * @access  Private
 */
router.put('/conversions/:id', authenticate, affiliateController.updateConversionStatus);

// ============================================================================
// PERFORMANCE & ANALYTICS ROUTES
// ============================================================================

/**
 * @route   GET /api/affiliates/:id/performance
 * @desc    Get performance stats for an affiliate
 * @access  Private
 */
router.get('/:id/performance', authenticate, affiliateController.getPerformanceStats);

// ============================================================================
// PAYOUTS ROUTES
// ============================================================================

/**
 * @route   POST /api/affiliates/payouts/batches
 * @desc    Create a payout batch
 * @access  Private
 */
router.post('/payouts/batches', authenticate, affiliateController.createPayoutBatch);

/**
 * @route   GET /api/affiliates/payouts/batches
 * @desc    List payout batches
 * @access  Private
 */
router.get('/payouts/batches', authenticate, affiliateController.listPayoutBatches);

/**
 * @route   GET /api/affiliates/payouts/batches/:id
 * @desc    Get payout batch details
 * @access  Private
 */
router.get('/payouts/batches/:id', authenticate, affiliateController.getPayoutBatch);

/**
 * @route   POST /api/affiliates/payouts/batches/:id/process
 * @desc    Process a payout batch
 * @access  Private
 */
router.post('/payouts/batches/:id/process', authenticate, affiliateController.processPayoutBatch);

/**
 * @route   GET /api/affiliates/:id/payouts
 * @desc    Get payout history for an affiliate
 * @access  Private
 */
router.get('/:id/payouts', authenticate, affiliateController.getPayoutHistory);

// ============================================================================
// MARKETING MATERIALS ROUTES
// ============================================================================

/**
 * @route   POST /api/affiliates/materials
 * @desc    Upload a marketing material
 * @access  Private
 */
router.post('/materials', authenticate, affiliateController.uploadMaterial);

/**
 * @route   GET /api/affiliates/materials
 * @desc    List marketing materials
 * @access  Private
 */
router.get('/materials', authenticate, affiliateController.listMaterials);

/**
 * @route   GET /api/affiliates/materials/:id
 * @desc    Get material details
 * @access  Private
 */
router.get('/materials/:id', authenticate, affiliateController.getMaterial);

/**
 * @route   POST /api/affiliates/materials/:id/download
 * @desc    Track material download
 * @access  Private
 */
router.post('/materials/:id/download', authenticate, affiliateController.trackDownload);

/**
 * @route   DELETE /api/affiliates/materials/:id
 * @desc    Delete a marketing material
 * @access  Private
 */
router.delete('/materials/:id', authenticate, affiliateController.deleteMaterial);

// ============================================================================
// FRAUD DETECTION ROUTES
// ============================================================================

/**
 * @route   GET /api/affiliates/fraud-alerts
 * @desc    List fraud alerts
 * @access  Private
 */
router.get('/fraud-alerts', authenticate, affiliateController.listFraudAlerts);

/**
 * @route   POST /api/affiliates/fraud-alerts/:id/resolve
 * @desc    Resolve a fraud alert
 * @access  Private
 */
router.post('/fraud-alerts/:id/resolve', authenticate, affiliateController.resolveFraudAlert);

// ============================================================================
// PUBLIC TRACKING ROUTE (No Authentication)
// ============================================================================

/**
 * @route   GET /api/track/:linkCode
 * @desc    Public tracking endpoint - redirects to destination URL
 * @access  Public
 */
router.get('/track/:linkCode', affiliateController.trackClick);

module.exports = router;