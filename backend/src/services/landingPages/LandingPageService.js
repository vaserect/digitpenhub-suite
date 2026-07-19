const LandingPageRepository = require('../../repositories/landingPages/LandingPageRepository');

// Utility function to create URL-friendly slugs
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Landing Page Service
 * Business logic for conversion-focused landing pages
 */
class LandingPageService {
  constructor() {
    this.repository = new LandingPageRepository();
  }

  /**
   * Get all landing pages for an organization
   * @param {number} orgId - Organization ID
   * @param {object} options - Query options
   * @returns {Promise<object>} Paginated landing pages with metadata
   */
  async getLandingPages(orgId, options = {}) {
    const pages = await this.repository.findByOrganization(orgId, options);
    const statusCounts = await this.repository.countByStatus(orgId);

    return {
      pages,
      pagination: {
        limit: options.limit || 50,
        offset: options.offset || 0,
        total: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
      },
      statusCounts,
    };
  }

  /**
   * Get a single landing page by ID
   * @param {number} id - Page ID
   * @param {number} orgId - Organization ID
   * @returns {Promise<object>} Landing page
   */
  async getLandingPageById(id, orgId) {
    const page = await this.repository.findById(id);

    if (!page || page.org_id !== orgId || page.page_type !== 'landing') {
      throw new Error('Landing page not found');
    }

    return page;
  }

  /**
   * Get landing page by slug
   * @param {string} slug - Page slug
   * @param {number} orgId - Organization ID
   * @returns {Promise<object>} Landing page
   */
  async getLandingPageBySlug(slug, orgId) {
    const page = await this.repository.findBySlug(slug, orgId);

    if (!page) {
      throw new Error('Landing page not found');
    }

    return page;
  }

  /**
   * Get published landing page by slug (public access)
   * @param {string} slug - Page slug
   * @returns {Promise<object>} Landing page
   */
  async getPublishedLandingPage(slug) {
    const page = await this.repository.findPublishedBySlug(slug);

    if (!page) {
      throw new Error('Landing page not found or not published');
    }

    return page;
  }

  /**
   * Create a new landing page
   * @param {number} orgId - Organization ID
   * @param {number} userId - User ID
   * @param {object} data - Landing page data
   * @returns {Promise<object>} Created landing page
   */
  async createLandingPage(orgId, userId, data) {
    // Generate slug if not provided
    let slug = data.slug || slugify(data.title);

    // Ensure slug is unique
    let counter = 1;
    let uniqueSlug = slug;
    while (await this.repository.findBySlug(uniqueSlug, orgId)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    const landingPageData = {
      org_id: orgId,
      created_by: userId,
      title: data.title,
      slug: uniqueSlug,
      description: data.description || null,
      content: data.content || {},
      template_id: data.template_id || null,
      status: data.status || 'draft',
      seo_title: data.seo_title || data.title,
      seo_description: data.seo_description || data.description || null,
      seo_keywords: data.seo_keywords || null,
      og_image: data.og_image || null,
      custom_css: data.custom_css || null,
      custom_js: data.custom_js || null,
      custom_domain: data.custom_domain || null,
      conversion_goal: data.conversion_goal || 'lead_capture',
      tracking_pixels: data.tracking_pixels || [],
      ab_test_enabled: data.ab_test_enabled || false,
      ab_test_config: data.ab_test_config || null,
    };

    return this.repository.create(landingPageData);
  }

  /**
   * Update a landing page
   * @param {number} id - Page ID
   * @param {number} orgId - Organization ID
   * @param {object} data - Update data
   * @returns {Promise<object>} Updated landing page
   */
  async updateLandingPage(id, orgId, data) {
    // Verify page exists and belongs to org
    await this.getLandingPageById(id, orgId);

    // If slug is being updated, ensure it's unique
    if (data.slug) {
      const existingPage = await this.repository.findBySlug(data.slug, orgId);
      if (existingPage && existingPage.id !== id) {
        throw new Error('Slug already in use');
      }
    }

    const updateData = {
      title: data.title,
      slug: data.slug,
      description: data.description,
      content: data.content,
      template_id: data.template_id,
      status: data.status,
      seo_title: data.seo_title,
      seo_description: data.seo_description,
      seo_keywords: data.seo_keywords,
      og_image: data.og_image,
      custom_css: data.custom_css,
      custom_js: data.custom_js,
      custom_domain: data.custom_domain,
      conversion_goal: data.conversion_goal,
      tracking_pixels: data.tracking_pixels,
      ab_test_enabled: data.ab_test_enabled,
      ab_test_config: data.ab_test_config,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    return this.repository.update(id, orgId, updateData);
  }

  /**
   * Delete a landing page
   * @param {number} id - Page ID
   * @param {number} orgId - Organization ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteLandingPage(id, orgId) {
    // Verify page exists and belongs to org
    await this.getLandingPageById(id, orgId);

    return this.repository.delete(id, orgId);
  }

  /**
   * Duplicate a landing page
   * @param {number} id - Source page ID
   * @param {number} orgId - Organization ID
   * @param {object} overrides - Data to override
   * @returns {Promise<object>} Duplicated landing page
   */
  async duplicateLandingPage(id, orgId, overrides = {}) {
    // Verify source page exists and belongs to org
    await this.getLandingPageById(id, orgId);

    return this.repository.duplicate(id, orgId, overrides);
  }

  /**
   * Publish a landing page
   * @param {number} id - Page ID
   * @param {number} orgId - Organization ID
   * @returns {Promise<object>} Published landing page
   */
  async publishLandingPage(id, orgId) {
    return this.updateLandingPage(id, orgId, { status: 'published' });
  }

  /**
   * Unpublish a landing page
   * @param {number} id - Page ID
   * @param {number} orgId - Organization ID
   * @returns {Promise<object>} Unpublished landing page
   */
  async unpublishLandingPage(id, orgId) {
    return this.updateLandingPage(id, orgId, { status: 'draft' });
  }

  /**
   * Get landing page analytics
   * @param {number} id - Page ID
   * @param {number} orgId - Organization ID
   * @param {object} dateRange - Date range filter
   * @returns {Promise<object>} Analytics data
   */
  async getLandingPageAnalytics(id, orgId, dateRange = {}) {
    // Verify page exists and belongs to org
    await this.getLandingPageById(id, orgId);

    return this.repository.getAnalyticsSummary(id, orgId, dateRange);
  }

  /**
   * Get landing pages by template
   * @param {number} templateId - Template ID
   * @param {number} orgId - Organization ID
   * @returns {Promise<Array>} Landing pages
   */
  async getLandingPagesByTemplate(templateId, orgId) {
    return this.repository.findByTemplate(templateId, orgId);
  }

  /**
   * Create A/B test variant
   * @param {number} id - Original page ID
   * @param {number} orgId - Organization ID
   * @param {object} variantData - Variant configuration
   * @returns {Promise<object>} Created variant page
   */
  async createABTestVariant(id, orgId, variantData) {
    const originalPage = await this.getLandingPageById(id, orgId);

    // Create duplicate with variant modifications
    const variant = await this.repository.duplicate(id, orgId, {
      title: `${originalPage.title} - Variant ${variantData.variantName || 'B'}`,
      slug: `${originalPage.slug}-variant-${Date.now()}`,
      content: variantData.content || originalPage.content,
      ab_test_enabled: true,
      ab_test_config: {
        originalPageId: id,
        variantName: variantData.variantName || 'B',
        trafficSplit: variantData.trafficSplit || 50,
        startDate: new Date(),
        endDate: variantData.endDate || null,
      },
    });

    // Update original page to enable A/B testing
    await this.updateLandingPage(id, orgId, {
      ab_test_enabled: true,
      ab_test_config: {
        variants: [
          ...(originalPage.ab_test_config?.variants || []),
          { id: variant.id, name: variantData.variantName || 'B' },
        ],
      },
    });

    return variant;
  }

  /**
   * Track landing page conversion
   * @param {string} slug - Page slug
   * @param {object} conversionData - Conversion data
   * @returns {Promise<object>} Tracking result
   */
  async trackConversion(slug, conversionData) {
    const page = await this.repository.findPublishedBySlug(slug);

    if (!page) {
      throw new Error('Landing page not found');
    }

    // This will integrate with analytics tracking once we build it
    // For now, return a success response
    return {
      success: true,
      pageId: page.id,
      conversionType: conversionData.type || 'lead_capture',
      timestamp: new Date(),
    };
  }

  /**
   * Get conversion funnel data
   * @param {number} id - Page ID
   * @param {number} orgId - Organization ID
   * @param {object} dateRange - Date range filter
   * @returns {Promise<object>} Funnel data
   */
  async getConversionFunnel(id, orgId, dateRange = {}) {
    // Verify page exists and belongs to org
    await this.getLandingPageById(id, orgId);

    // This will integrate with analytics once we build it
    return {
      pageId: id,
      steps: [
        { name: 'Page View', count: 0, percentage: 100 },
        { name: 'Form Started', count: 0, percentage: 0 },
        { name: 'Form Submitted', count: 0, percentage: 0 },
        { name: 'Conversion', count: 0, percentage: 0 },
      ],
      dropoffPoints: [],
    };
  }
}

module.exports = LandingPageService;
