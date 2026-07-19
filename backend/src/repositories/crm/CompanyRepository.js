// backend/src/repositories/CompanyRepository.js
// Phase 1 Implementation: Company Repository
// Date: 2026-07-16

const BaseRepository = require('../base/BaseRepository');
const db = require('../../db');
const logger = require('../../utils/logger');

/**
 * Repository for CRM Companies
 * Handles all database operations for companies/accounts
 */
class CompanyRepository extends BaseRepository {
  constructor() {
    super(db, 'crm_companies');
  }

  /**
   * Create a new company
   * @param {string} orgId - Organization ID
   * @param {Object} companyData - Company data
   * @param {string} userId - User creating the company
   * @returns {Promise<Object>} Created company
   */
  async create(orgId, companyData, userId) {
    const query = `
      INSERT INTO crm_companies (
        org_id, name, legal_name, industry, company_size, annual_revenue,
        website, phone, email, billing_address, shipping_address,
        tax_id, description, tags, custom_fields, owner_id, source,
        created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $18
      )
      RETURNING *
    `;

    const values = [
      orgId,
      companyData.name,
      companyData.legalName || null,
      companyData.industry || null,
      companyData.companySize || null,
      companyData.annualRevenue || null,
      companyData.website || null,
      companyData.phone || null,
      companyData.email || null,
      companyData.billingAddress || null,
      companyData.shippingAddress || null,
      companyData.taxId || null,
      companyData.description || null,
      companyData.tags || [],
      companyData.customFields || {},
      companyData.ownerId || userId,
      companyData.source || null,
      userId
    ];

    try {
      const result = await this.db.query(query, values);
      logger.info('Company created', { companyId: result.rows[0].id, orgId, userId });
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating company', { error: error.message, orgId, userId });
      throw error;
    }
  }

  /**
   * Get company by ID with related data
   * @param {string} orgId - Organization ID
   * @param {string} companyId - Company ID
   * @returns {Promise<Object>} Company with related data
   */
  async getById(orgId, companyId) {
    const query = `
      SELECT 
        c.*,
        u.full_name AS owner_name,
        (SELECT COUNT(*) FROM contacts WHERE company_id = c.id AND deleted_at IS NULL) AS contact_count,
        (SELECT COUNT(*) FROM crm_deals WHERE company_id = c.id AND deleted_at IS NULL) AS deal_count,
        (SELECT SUM(amount) FROM crm_deals WHERE company_id = c.id AND status = 'won') AS total_revenue,
        (SELECT SUM(amount) FROM crm_deals WHERE company_id = c.id AND status = 'open') AS pipeline_value
      FROM crm_companies c
      LEFT JOIN users u ON c.owner_id = u.id
      WHERE c.id = $1 AND c.org_id = $2 AND c.deleted_at IS NULL
    `;

    try {
      const result = await this.db.query(query, [companyId, orgId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching company', { error: error.message, companyId, orgId });
      throw error;
    }
  }

  /**
   * List companies with filters and pagination
   * @param {string} orgId - Organization ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Companies list with pagination
   */
  async list(orgId, filters = {}) {
    const {
      ownerId,
      industry,
      companySize,
      search,
      tags,
      page = 1,
      limit = 50,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = filters;

    let whereConditions = ['c.org_id = $1', 'c.deleted_at IS NULL'];
    let values = [orgId];
    let paramCount = 1;

    // Add filters
    if (ownerId) {
      paramCount++;
      whereConditions.push(`c.owner_id = $${paramCount}`);
      values.push(ownerId);
    }

    if (industry) {
      paramCount++;
      whereConditions.push(`c.industry = $${paramCount}`);
      values.push(industry);
    }

    if (companySize) {
      paramCount++;
      whereConditions.push(`c.company_size = $${paramCount}`);
      values.push(companySize);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(
        c.name ILIKE $${paramCount} OR 
        c.legal_name ILIKE $${paramCount} OR
        c.website ILIKE $${paramCount} OR
        c.email ILIKE $${paramCount}
      )`);
      values.push(`%${search}%`);
    }

    if (tags && tags.length > 0) {
      paramCount++;
      whereConditions.push(`c.tags && $${paramCount}`);
      values.push(tags);
    }

    const whereClause = whereConditions.join(' AND ');
    const offset = (page - 1) * limit;

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM crm_companies c
      WHERE ${whereClause}
    `;

    // Data query
    const dataQuery = `
      SELECT 
        c.*,
        u.full_name AS owner_name,
        (SELECT COUNT(*) FROM contacts WHERE company_id = c.id AND deleted_at IS NULL) AS contact_count,
        (SELECT COUNT(*) FROM crm_deals WHERE company_id = c.id AND deleted_at IS NULL) AS deal_count
      FROM crm_companies c
      LEFT JOIN users u ON c.owner_id = u.id
      WHERE ${whereClause}
      ORDER BY c.${sortBy} ${sortOrder}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    try {
      const [countResult, dataResult] = await Promise.all([
        this.db.query(countQuery, values),
        this.db.query(dataQuery, [...values, limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        data: dataResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error listing companies', { error: error.message, orgId, filters });
      throw error;
    }
  }

  /**
   * Update company
   * @param {string} orgId - Organization ID
   * @param {string} companyId - Company ID
   * @param {Object} updates - Fields to update
   * @param {string} userId - User updating the company
   * @returns {Promise<Object>} Updated company
   */
  async update(orgId, companyId, updates, userId) {
    const allowedFields = [
      'name', 'legal_name', 'industry', 'company_size', 'annual_revenue',
      'website', 'phone', 'email', 'billing_address', 'shipping_address',
      'tax_id', 'description', 'tags', 'custom_fields', 'owner_id', 'source'
    ];

    const setClause = [];
    const values = [orgId, companyId];
    let paramCount = 2;

    Object.keys(updates).forEach(key => {
      const snakeKey = this.camelToSnake(key);
      if (allowedFields.includes(snakeKey)) {
        paramCount++;
        setClause.push(`${snakeKey} = $${paramCount}`);
        values.push(updates[key]);
      }
    });

    if (setClause.length === 0) {
      throw new Error('No valid fields to update');
    }

    paramCount++;
    setClause.push(`updated_by = $${paramCount}`);
    values.push(userId);

    setClause.push('updated_at = NOW()');

    const query = `
      UPDATE crm_companies
      SET ${setClause.join(', ')}
      WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL
      RETURNING *
    `;

    try {
      const result = await this.db.query(query, values);
      if (result.rows.length === 0) {
        throw new Error('Company not found');
      }
      logger.info('Company updated', { companyId, orgId, userId });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating company', { error: error.message, companyId, orgId, userId });
      throw error;
    }
  }

  /**
   * Soft delete company
   * @param {string} orgId - Organization ID
   * @param {string} companyId - Company ID
   * @param {string} userId - User deleting the company
   * @returns {Promise<boolean>} Success status
   */
  async delete(orgId, companyId, userId) {
    const query = `
      UPDATE crm_companies
      SET deleted_at = NOW(), deleted_by = $3
      WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL
      RETURNING id
    `;

    try {
      const result = await this.db.query(query, [orgId, companyId, userId]);
      if (result.rows.length === 0) {
        throw new Error('Company not found');
      }
      logger.info('Company deleted', { companyId, orgId, userId });
      return true;
    } catch (error) {
      logger.error('Error deleting company', { error: error.message, companyId, orgId, userId });
      throw error;
    }
  }

  /**
   * Get contacts for company
   * @param {string} orgId - Organization ID
   * @param {string} companyId - Company ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Contacts list
   */
  async getContacts(orgId, companyId, filters = {}) {
    const { page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM contacts
      WHERE company_id = $1 AND org_id = $2 AND deleted_at IS NULL
    `;

    const dataQuery = `
      SELECT *
      FROM contacts
      WHERE company_id = $1 AND org_id = $2 AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `;

    try {
      const [countResult, dataResult] = await Promise.all([
        this.db.query(countQuery, [companyId, orgId]),
        this.db.query(dataQuery, [companyId, orgId, limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        data: dataResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error fetching company contacts', { error: error.message, companyId, orgId });
      throw error;
    }
  }

  /**
   * Get deals for company
   * @param {string} orgId - Organization ID
   * @param {string} companyId - Company ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Deals list
   */
  async getDeals(orgId, companyId, filters = {}) {
    const { status = 'open', page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    let whereConditions = [
      'company_id = $1',
      'org_id = $2',
      'deleted_at IS NULL'
    ];
    let values = [companyId, orgId];
    let paramCount = 2;

    if (status) {
      paramCount++;
      whereConditions.push(`status = $${paramCount}`);
      values.push(status);
    }

    const whereClause = whereConditions.join(' AND ');

    const countQuery = `
      SELECT COUNT(*) as total
      FROM crm_deals
      WHERE ${whereClause}
    `;

    const dataQuery = `
      SELECT 
        d.*,
        p.name AS pipeline_name,
        s.name AS stage_name
      FROM crm_deals d
      LEFT JOIN crm_pipelines p ON d.pipeline_id = p.id
      LEFT JOIN crm_pipeline_stages s ON d.stage_id = s.id
      WHERE ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    try {
      const [countResult, dataResult] = await Promise.all([
        this.db.query(countQuery, values),
        this.db.query(dataQuery, [...values, limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        data: dataResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error fetching company deals', { error: error.message, companyId, orgId });
      throw error;
    }
  }

  /**
   * Get company statistics
   * @param {string} orgId - Organization ID
   * @param {string} companyId - Company ID
   * @returns {Promise<Object>} Company statistics
   */
  async getStatistics(orgId, companyId) {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM contacts WHERE company_id = $1 AND deleted_at IS NULL) AS contact_count,
        (SELECT COUNT(*) FROM crm_deals WHERE company_id = $1 AND deleted_at IS NULL) AS total_deals,
        (SELECT COUNT(*) FROM crm_deals WHERE company_id = $1 AND status = 'open' AND deleted_at IS NULL) AS open_deals,
        (SELECT COUNT(*) FROM crm_deals WHERE company_id = $1 AND status = 'won' AND deleted_at IS NULL) AS won_deals,
        (SELECT COUNT(*) FROM crm_deals WHERE company_id = $1 AND status = 'lost' AND deleted_at IS NULL) AS lost_deals,
        (SELECT COALESCE(SUM(amount), 0) FROM crm_deals WHERE company_id = $1 AND status = 'won') AS total_revenue,
        (SELECT COALESCE(SUM(amount), 0) FROM crm_deals WHERE company_id = $1 AND status = 'open') AS pipeline_value,
        (SELECT COALESCE(AVG(amount), 0) FROM crm_deals WHERE company_id = $1 AND status = 'won') AS avg_deal_size
    `;

    try {
      const result = await this.db.query(query, [companyId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching company statistics', { error: error.message, companyId, orgId });
      throw error;
    }
  }

  /**
   * Search companies by name
   * @param {string} orgId - Organization ID
   * @param {string} searchTerm - Search term
   * @param {number} limit - Result limit
   * @returns {Promise<Array>} Matching companies
   */
  async searchByName(orgId, searchTerm, limit = 10) {
    const query = `
      SELECT id, name, website, industry
      FROM crm_companies
      WHERE org_id = $1 
        AND deleted_at IS NULL
        AND name ILIKE $2
      ORDER BY name
      LIMIT $3
    `;

    try {
      const result = await this.db.query(query, [orgId, `%${searchTerm}%`, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error searching companies', { error: error.message, orgId, searchTerm });
      throw error;
    }
  }

  /**
   * Convert camelCase to snake_case
   * @param {string} str - String to convert
   * @returns {string} Converted string
   */
  camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

module.exports = CompanyRepository;
