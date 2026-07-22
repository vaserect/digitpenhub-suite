const BaseRepository = require('../base/BaseRepository');
const db = require('../../db');

/**
 * Landing Page Repository
 * Handles database operations for conversion-focused landing pages
 */
class LandingPageRepository extends BaseRepository {
  constructor() {
    super(db, 'pages');
  }

  /**
   * Find all landing pages for an organization
   * @param {number} orgId - Organization ID
   * @param {object} options - Query options (limit, offset, status, etc.)
   * @returns {Promise<Array>} Landing pages
   */
  async findByOrganization(orgId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      status = null,
      search = null,
      sortBy = 'updated_at',
      sortOrder = 'DESC',
    } = options;

    let query = `
      SELECT * FROM ${this.tableName}
      WHERE org_id = $1 AND page_type = 'landing'
    `;
    const params = [orgId];
    let paramIndex = 2;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      query += ` AND (title ILIKE $${paramIndex} OR slug ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const { rows } = await this.db.query(query, params);
    return rows;
  }

  /**
   * Find landing page by slug and organization
   * @param {string} slug - Page slug
   * @param {number} orgId - Organization ID
   * @returns {Promise<object|null>} Landing page or null
   */
  async findBySlug(slug, orgId) {
    const { rows } = await this.db.query(
      `SELECT * FROM ${this.tableName} WHERE slug = $1 AND org_id = $2 AND page_type = 'landing'`,
      [slug, orgId]
    );
    return rows[0] || null;
  }

  /**
   * Find published landing page by slug (public access)
   * @param {string} slug - Page slug
   * @returns {Promise<object|null>} Landing page or null
   */
  async findPublishedBySlug(slug) {
    const { rows } = await this.db.query(
      `SELECT * FROM ${this.tableName} WHERE slug = $1 AND page_type = 'landing' AND status = 'published'`,
      [slug]
    );
    return rows[0] || null;
  }

  /**
   * Create a new landing page
   * @param {object} data - Landing page data
   * @returns {Promise<object>} Created landing page
   */
  async create(data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    
    columns.push('page_type', 'created_at', 'updated_at');
    values.push('landing', new Date(), new Date());
    
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const { rows } = await this.db.query(
      `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    
    return rows[0];
  }

  /**
   * Update landing page
   * @param {number} id - Page ID
   * @param {number} orgId - Organization ID
   * @param {object} data - Update data
   * @returns {Promise<object>} Updated landing page
   */
  async update(id, orgId, data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    
    columns.push('updated_at');
    values.push(new Date());
    
    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
    values.push(id, orgId);
    
    const { rows } = await this.db.query(
      `UPDATE ${this.tableName} SET ${setClause} WHERE id = $${values.length - 1} AND org_id = $${values.length} AND page_type = 'landing' RETURNING *`,
      values
    );
    
    return rows[0];
  }

  /**
   * Delete landing page
   * @param {number} id - Page ID
   * @param {number} orgId - Organization ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id, orgId) {
    const { rowCount } = await this.db.query(
      `DELETE FROM ${this.tableName} WHERE id = $1 AND org_id = $2 AND page_type = 'landing'`,
      [id, orgId]
    );
    
    return rowCount > 0;
  }

  /**
   * Get landing page analytics summary
   * @param {number} pageId - Page ID
   * @param {number} orgId - Organization ID
   * @param {object} dateRange - Date range filter
   * @returns {Promise<object>} Analytics summary
   */
  async getAnalyticsSummary(pageId, orgId, dateRange = {}) {
    const { startDate, endDate } = dateRange;

    // This will integrate with the analytics table once we build it
    // For now, return a placeholder structure
    return {
      pageId,
      views: 0,
      uniqueVisitors: 0,
      conversions: 0,
      conversionRate: 0,
      bounceRate: 0,
      avgTimeOnPage: 0,
      topSources: [],
      deviceBreakdown: {},
    };
  }

  /**
   * Duplicate a landing page
   * @param {number} id - Source page ID
   * @param {number} orgId - Organization ID
   * @param {object} overrides - Data to override (e.g., title, slug)
   * @returns {Promise<object>} Duplicated landing page
   */
  async duplicate(id, orgId, overrides = {}) {
    const { rows: sourceRows } = await this.db.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1 AND org_id = $2 AND page_type = 'landing'`,
      [id, orgId]
    );
    
    const sourcePage = sourceRows[0];
    if (!sourcePage) {
      throw new Error('Landing page not found');
    }

    const { id: _, created_at, updated_at, ...pageData } = sourcePage;

    const duplicateData = {
      ...pageData,
      ...overrides,
      title: overrides.title || `${sourcePage.title} (Copy)`,
      slug: overrides.slug || `${sourcePage.slug}-copy-${Date.now()}`,
      status: 'draft',
    };

    return this.create(duplicateData);
  }

  /**
   * Get landing pages by template ID
   * @param {number} templateId - Template ID
   * @param {number} orgId - Organization ID
   * @returns {Promise<Array>} Landing pages using this template
   */
  async findByTemplate(templateId, orgId) {
    const { rows } = await this.db.query(
      `SELECT * FROM ${this.tableName} WHERE org_id = $1 AND page_type = 'landing' AND template_id = $2 ORDER BY created_at DESC`,
      [orgId, templateId]
    );
    return rows;
  }

  /**
   * Count landing pages by status
   * @param {number} orgId - Organization ID
   * @returns {Promise<object>} Count by status
   */
  async countByStatus(orgId) {
    const { rows } = await this.db.query(
      `SELECT status, COUNT(*)::int as count FROM ${this.tableName} WHERE org_id = $1 AND page_type = 'landing' GROUP BY status`,
      [orgId]
    );

    return rows.reduce((acc, { status, count }) => {
      acc[status] = count;
      return acc;
    }, {});
  }
}

module.exports = LandingPageRepository;
