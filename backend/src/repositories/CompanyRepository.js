const BaseRepository = require('./base/BaseRepository');
const db = require('../db');

/**
 * CompanyRepository - Data access layer for CRM companies
 * Handles all database operations for company records
 */
class CompanyRepository extends BaseRepository {
  constructor() {
    super(db, 'crm_companies', {
      primaryKey: 'id',
      timestamps: true,
      tenantColumn: 'org_id',
    });
  }

  /**
   * Search companies by name, website, or industry
   * @param {string} orgId - Organization ID
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Matching companies
   */
  async search(orgId, query, filters = {}) {
    const conditions = ['org_id = $1'];
    const params = [orgId];
    let paramIndex = 2;

    // Search in name, website, and industry
    if (query) {
      conditions.push(`(
        name ILIKE $${paramIndex} OR 
        website ILIKE $${paramIndex} OR 
        industry ILIKE $${paramIndex}
      )`);
      params.push(`%${query}%`);
      paramIndex++;
    }

    // Filter by industry
    if (filters.industry) {
      conditions.push(`industry = $${paramIndex}`);
      params.push(filters.industry);
      paramIndex++;
    }

    // Filter by size
    if (filters.size) {
      conditions.push(`size = $${paramIndex}`);
      params.push(filters.size);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const orderBy = filters.orderBy || 'name ASC';
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    const { rows } = await this.db.query(
      `SELECT * FROM ${this.tableName}
       WHERE ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return rows;
  }

  /**
   * Get companies with contact count
   * @param {string} orgId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Companies with contact counts
   */
  async findAllWithContactCount(orgId, options = {}) {
    const limit = options.limit || 100;
    const offset = options.offset || 0;
    const orderBy = options.orderBy || 'c.name ASC';

    const { rows } = await this.db.query(
      `SELECT 
        c.*,
        COUNT(ct.id) as contact_count
       FROM ${this.tableName} c
       LEFT JOIN contacts ct ON ct.company_id = c.id AND ct.org_id = c.org_id
       WHERE c.org_id = $1
       GROUP BY c.id
       ORDER BY ${orderBy}
       LIMIT $2 OFFSET $3`,
      [orgId, limit, offset]
    );

    return rows;
  }

  /**
   * Get company with all related contacts
   * @param {string} companyId - Company ID
   * @param {string} orgId - Organization ID
   * @returns {Promise<Object|null>} Company with contacts
   */
  async findByIdWithContacts(companyId, orgId) {
    const { rows: companies } = await this.db.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1 AND org_id = $2`,
      [companyId, orgId]
    );

    if (!companies.length) return null;

    const company = companies[0];

    // Get all contacts for this company
    const { rows: contacts } = await this.db.query(
      `SELECT id, full_name, email, phone, stage, value_ngn, last_touch_at
       FROM contacts
       WHERE company_id = $1 AND org_id = $2
       ORDER BY last_touch_at DESC`,
      [companyId, orgId]
    );

    return {
      ...company,
      contacts,
      contact_count: contacts.length,
    };
  }

  /**
   * Get statistics by industry
   * @param {string} orgId - Organization ID
   * @returns {Promise<Array>} Industry statistics
   */
  async getStatsByIndustry(orgId) {
    const { rows } = await this.db.query(
      `SELECT 
        industry,
        COUNT(*) as count,
        COUNT(DISTINCT ct.id) as total_contacts
       FROM ${this.tableName} c
       LEFT JOIN contacts ct ON ct.company_id = c.id AND ct.org_id = c.org_id
       WHERE c.org_id = $1 AND c.industry IS NOT NULL
       GROUP BY industry
       ORDER BY count DESC`,
      [orgId]
    );

    return rows;
  }

  /**
   * Get statistics by company size
   * @param {string} orgId - Organization ID
   * @returns {Promise<Array>} Size statistics
   */
  async getStatsBySize(orgId) {
    const { rows } = await this.db.query(
      `SELECT 
        size,
        COUNT(*) as count,
        COUNT(DISTINCT ct.id) as total_contacts
       FROM ${this.tableName} c
       LEFT JOIN contacts ct ON ct.company_id = c.id AND ct.org_id = c.org_id
       WHERE c.org_id = $1 AND c.size IS NOT NULL
       GROUP BY size
       ORDER BY 
         CASE size
           WHEN '1-10' THEN 1
           WHEN '11-50' THEN 2
           WHEN '51-200' THEN 3
           WHEN '201-500' THEN 4
           WHEN '501-1000' THEN 5
           WHEN '1000+' THEN 6
           ELSE 7
         END`,
      [orgId]
    );

    return rows;
  }

  /**
   * Find companies by IDs (for bulk operations)
   * @param {Array<string>} companyIds - Array of company IDs
   * @param {string} orgId - Organization ID
   * @returns {Promise<Array>} Companies
   */
  async findByIds(companyIds, orgId) {
    if (!companyIds || !companyIds.length) return [];

    const { rows } = await this.db.query(
      `SELECT * FROM ${this.tableName}
       WHERE id = ANY($1) AND org_id = $2`,
      [companyIds, orgId]
    );

    return rows;
  }

  /**
   * Check if company name exists (for duplicate detection)
   * @param {string} name - Company name
   * @param {string} orgId - Organization ID
   * @param {string} excludeId - Company ID to exclude (for updates)
   * @returns {Promise<boolean>} True if exists
   */
  async existsByName(name, orgId, excludeId = null) {
    const conditions = ['org_id = $1', 'LOWER(name) = LOWER($2)'];
    const params = [orgId, name];

    if (excludeId) {
      conditions.push('id != $3');
      params.push(excludeId);
    }

    const { rows } = await this.db.query(
      `SELECT 1 FROM ${this.tableName}
       WHERE ${conditions.join(' AND ')}
       LIMIT 1`,
      params
    );

    return rows.length > 0;
  }

  /**
   * Get total count of companies
   * @param {string} orgId - Organization ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<number>} Total count
   */
  async count(orgId, filters = {}) {
    const conditions = ['org_id = $1'];
    const params = [orgId];
    let paramIndex = 2;

    if (filters.industry) {
      conditions.push(`industry = $${paramIndex}`);
      params.push(filters.industry);
      paramIndex++;
    }

    if (filters.size) {
      conditions.push(`size = $${paramIndex}`);
      params.push(filters.size);
      paramIndex++;
    }

    const { rows } = await this.db.query(
      `SELECT COUNT(*) as count FROM ${this.tableName}
       WHERE ${conditions.join(' AND ')}`,
      params
    );

    return parseInt(rows[0].count, 10);
  }
}

module.exports = CompanyRepository;
