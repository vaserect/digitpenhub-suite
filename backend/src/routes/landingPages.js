const express = require('express');
const router = express.Router();
const landingPagesController = require('../controllers/landingPages/landingPagesController');
const { requireAuth } = require('../middleware/auth');

/**
 * Landing Pages Routes
 * Dedicated routes for conversion-focused landing pages
 */

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

/**
 * Get published landing page by slug (public access)
 * GET /api/v1/landing-pages/public/:slug
 */
router.get('/public/:slug', landingPagesController.getPublishedLandingPage);

/**
 * Track landing page conversion (public access)
 * POST /api/v1/landing-pages/public/:slug/convert
 */
router.post('/public/:slug/convert', landingPagesController.trackConversion);

// ============================================================================
// AUTHENTICATED ROUTES (Require authentication)
// ============================================================================

/**
 * Get all landing pages for the authenticated user's organization
 * GET /api/v1/landing-pages
 * Query params: limit, offset, status, search, sortBy, sortOrder
 */
router.get('/', requireAuth, landingPagesController.getLandingPages);

/**
 * Create a new landing page
 * POST /api/v1/landing-pages
 */
router.post('/', requireAuth, landingPagesController.createLandingPage);

/**
 * Get landing pages by template
 * GET /api/v1/landing-pages/template/:templateId
 */
router.get('/template/:templateId', requireAuth, landingPagesController.getLandingPagesByTemplate);

/**
 * Get a landing page by slug (authenticated)
 * GET /api/v1/landing-pages/slug/:slug
 */
router.get('/slug/:slug', requireAuth, landingPagesController.getLandingPageBySlug);

/**
 * Get a single landing page by ID
 * GET /api/v1/landing-pages/:id
 */
router.get('/:id', requireAuth, landingPagesController.getLandingPageById);

/**
 * Update a landing page
 * PUT /api/v1/landing-pages/:id
 */
router.put('/:id', requireAuth, landingPagesController.updateLandingPage);

/**
 * Delete a landing page
 * DELETE /api/v1/landing-pages/:id
 */
router.delete('/:id', requireAuth, landingPagesController.deleteLandingPage);

/**
 * Duplicate a landing page
 * POST /api/v1/landing-pages/:id/duplicate
 */
router.post('/:id/duplicate', requireAuth, landingPagesController.duplicateLandingPage);

/**
 * Publish a landing page
 * POST /api/v1/landing-pages/:id/publish
 */
router.post('/:id/publish', requireAuth, landingPagesController.publishLandingPage);

/**
 * Unpublish a landing page
 * POST /api/v1/landing-pages/:id/unpublish
 */
router.post('/:id/unpublish', requireAuth, landingPagesController.unpublishLandingPage);

/**
 * Get landing page analytics
 * GET /api/v1/landing-pages/:id/analytics
 * Query params: startDate, endDate
 */
router.get('/:id/analytics', requireAuth, landingPagesController.getLandingPageAnalytics);

/**
 * Get conversion funnel data
 * GET /api/v1/landing-pages/:id/funnel
 * Query params: startDate, endDate
 */
router.get('/:id/funnel', requireAuth, landingPagesController.getConversionFunnel);

/**
 * Create A/B test variant
 * POST /api/v1/landing-pages/:id/ab-test
 */
router.post('/:id/ab-test', requireAuth, landingPagesController.createABTestVariant);

module.exports = router;
