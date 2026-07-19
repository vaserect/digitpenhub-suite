const LandingPageService = require('../../services/landingPages/LandingPageService');

const landingPageService = new LandingPageService();

/**
 * Landing Pages Controller
 * Handles HTTP requests for conversion-focused landing pages
 */

/**
 * Get all landing pages for the authenticated user's organization
 * GET /api/v1/landing-pages
 */
exports.getLandingPages = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const options = {
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
      status: req.query.status || null,
      search: req.query.search || null,
      sortBy: req.query.sortBy || 'updated_at',
      sortOrder: req.query.sortOrder || 'DESC',
    };

    const result = await landingPageService.getLandingPages(orgId, options);

    res.json({
      success: true,
      data: result.pages,
      pagination: result.pagination,
      statusCounts: result.statusCounts,
    });
  } catch (error) {
    console.error('Error fetching landing pages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch landing pages',
      error: error.message,
    });
  }
};

/**
 * Get a single landing page by ID
 * GET /api/v1/landing-pages/:id
 */
exports.getLandingPageById = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const page = await landingPageService.getLandingPageById(parseInt(id), orgId);

    res.json({
      success: true,
      data: page,
    });
  } catch (error) {
    console.error('Error fetching landing page:', error);
    const statusCode = error.message === 'Landing page not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get a landing page by slug
 * GET /api/v1/landing-pages/slug/:slug
 */
exports.getLandingPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const orgId = req.user.org_id;

    const page = await landingPageService.getLandingPageBySlug(slug, orgId);

    res.json({
      success: true,
      data: page,
    });
  } catch (error) {
    console.error('Error fetching landing page by slug:', error);
    const statusCode = error.message === 'Landing page not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get a published landing page by slug (public access)
 * GET /api/v1/landing-pages/public/:slug
 */
exports.getPublishedLandingPage = async (req, res) => {
  try {
    const { slug } = req.params;

    const page = await landingPageService.getPublishedLandingPage(slug);

    // Track page view (will integrate with analytics later)
    // await analyticsService.trackPageView(page.id, req);

    res.json({
      success: true,
      data: page,
    });
  } catch (error) {
    console.error('Error fetching published landing page:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create a new landing page
 * POST /api/v1/landing-pages
 */
exports.createLandingPage = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.id;

    const page = await landingPageService.createLandingPage(orgId, userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Landing page created successfully',
      data: page,
    });
  } catch (error) {
    console.error('Error creating landing page:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create landing page',
      error: error.message,
    });
  }
};

/**
 * Update a landing page
 * PUT /api/v1/landing-pages/:id
 */
exports.updateLandingPage = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const page = await landingPageService.updateLandingPage(parseInt(id), orgId, req.body);

    res.json({
      success: true,
      message: 'Landing page updated successfully',
      data: page,
    });
  } catch (error) {
    console.error('Error updating landing page:', error);
    const statusCode = error.message === 'Landing page not found' ? 404 : 
                       error.message === 'Slug already in use' ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete a landing page
 * DELETE /api/v1/landing-pages/:id
 */
exports.deleteLandingPage = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    await landingPageService.deleteLandingPage(parseInt(id), orgId);

    res.json({
      success: true,
      message: 'Landing page deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting landing page:', error);
    const statusCode = error.message === 'Landing page not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Duplicate a landing page
 * POST /api/v1/landing-pages/:id/duplicate
 */
exports.duplicateLandingPage = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const page = await landingPageService.duplicateLandingPage(
      parseInt(id),
      orgId,
      req.body
    );

    res.status(201).json({
      success: true,
      message: 'Landing page duplicated successfully',
      data: page,
    });
  } catch (error) {
    console.error('Error duplicating landing page:', error);
    const statusCode = error.message === 'Landing page not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Publish a landing page
 * POST /api/v1/landing-pages/:id/publish
 */
exports.publishLandingPage = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const page = await landingPageService.publishLandingPage(parseInt(id), orgId);

    res.json({
      success: true,
      message: 'Landing page published successfully',
      data: page,
    });
  } catch (error) {
    console.error('Error publishing landing page:', error);
    const statusCode = error.message === 'Landing page not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Unpublish a landing page
 * POST /api/v1/landing-pages/:id/unpublish
 */
exports.unpublishLandingPage = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const page = await landingPageService.unpublishLandingPage(parseInt(id), orgId);

    res.json({
      success: true,
      message: 'Landing page unpublished successfully',
      data: page,
    });
  } catch (error) {
    console.error('Error unpublishing landing page:', error);
    const statusCode = error.message === 'Landing page not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get landing page analytics
 * GET /api/v1/landing-pages/:id/analytics
 */
exports.getLandingPageAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;
    const dateRange = {
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
    };

    const analytics = await landingPageService.getLandingPageAnalytics(
      parseInt(id),
      orgId,
      dateRange
    );

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Error fetching landing page analytics:', error);
    const statusCode = error.message === 'Landing page not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create A/B test variant
 * POST /api/v1/landing-pages/:id/ab-test
 */
exports.createABTestVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const variant = await landingPageService.createABTestVariant(
      parseInt(id),
      orgId,
      req.body
    );

    res.status(201).json({
      success: true,
      message: 'A/B test variant created successfully',
      data: variant,
    });
  } catch (error) {
    console.error('Error creating A/B test variant:', error);
    const statusCode = error.message === 'Landing page not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Track landing page conversion
 * POST /api/v1/landing-pages/public/:slug/convert
 */
exports.trackConversion = async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await landingPageService.trackConversion(slug, req.body);

    res.json({
      success: true,
      message: 'Conversion tracked successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error tracking conversion:', error);
    const statusCode = error.message === 'Landing page not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get conversion funnel data
 * GET /api/v1/landing-pages/:id/funnel
 */
exports.getConversionFunnel = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;
    const dateRange = {
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
    };

    const funnel = await landingPageService.getConversionFunnel(
      parseInt(id),
      orgId,
      dateRange
    );

    res.json({
      success: true,
      data: funnel,
    });
  } catch (error) {
    console.error('Error fetching conversion funnel:', error);
    const statusCode = error.message === 'Landing page not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get landing pages by template
 * GET /api/v1/landing-pages/template/:templateId
 */
exports.getLandingPagesByTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const orgId = req.user.org_id;

    const pages = await landingPageService.getLandingPagesByTemplate(
      parseInt(templateId),
      orgId
    );

    res.json({
      success: true,
      data: pages,
    });
  } catch (error) {
    console.error('Error fetching landing pages by template:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
