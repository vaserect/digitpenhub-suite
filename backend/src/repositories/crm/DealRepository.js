// backend/src/repositories/DealRepository.js
// Phase 1 Implementation: Deal Repository
// Date: 2026-07-16

const BaseRepository = require('../base/BaseRepository');
const db = require('../../db');
const logger = require('../../utils/logger');

/**
 * Repository for CRM Deals
 * Handles all database operations for deals/opportunities
 */
class DealRepository extends BaseRepository {
  constructor() {
    super(db, 'crm_deals');
  }

  /**
   * Create a new deal
   * @param {string} orgId - Organization ID
   * @param {Object} dealData - Deal data
   * @param {string} userId - User creating the deal
   * @returns {Promise<Object>} Created deal
   */
  async create(orgId, dealData, userId) {
    const query = `
      INSERT INTO crm_deals (
        org_id, name, contact_id, company_id, pipeline_id, stage_id,
        amount, currency, probability, expected_close_date, description,
        tags, custom_fields, owner_id, source, created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $16
      )
      RETURNING *
    `;

    const values = [
      orgId,
      dealData.name,
      dealData.contactId || null,
      dealData.companyId || null,
      dealData.pipelineId,
      dealData.stageId,
      dealData.amount || 0,
      dealData.currency || 'USD',
      dealData.probability || 0,
      dealData.expectedCloseDate || null,
      dealData.description || null,
      dealData.tags || [],
      dealData.customFields || {},
      dealData.ownerId || userId,
      dealData.source || null,
      userId
    ];

    try {
      const result = await this.db.query(query, values);
      logger.info('Deal created', { dealId: result.rows[0].id, orgId, userId });
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating deal', { error: error.message, orgId, userId });
      throw error;
    }
  }

  /**
   * Get deal by ID with related entities
   * @param {string} orgId - Organization ID
   * @param {string} dealId - Deal ID
   * @returns {Promise<Object>} Deal with related data
   */
  async getById(orgId, dealId) {
    const query = `
      SELECT 
        d.*,
        c.full_name AS contact_name,
        c.email AS contact_email,
        comp.name AS company_name,
        p.name AS pipeline_name,
        s.name AS stage_name,
        s.probability AS stage_probability,
        s.color AS stage_color,
        u.full_name AS owner_name,
        (SELECT COUNT(*) FROM crm_deal_products WHERE deal_id = d.id) AS product_count,
        (SELECT SUM(total_price) FROM crm_deal_products WHERE deal_id = d.id) AS products_total
      FROM crm_deals d
      LEFT JOIN contacts c ON d.contact_id = c.id
      LEFT JOIN crm_companies comp ON d.company_id = comp.id
      LEFT JOIN crm_pipelines p ON d.pipeline_id = p.id
      LEFT JOIN crm_stages s ON d.stage_id = s.id
      LEFT JOIN users u ON d.owner_id = u.id
      WHERE d.id = $1 AND d.org_id = $2 AND d.deleted_at IS NULL
    `;

    try {
      const result = await this.db.query(query, [dealId, orgId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching deal', { error: error.message, dealId, orgId });
      throw error;
    }
  }

  /**
   * List deals with filters and pagination
   * @param {string} orgId - Organization ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Deals list with pagination
   */
  async list(orgId, filters = {}) {
    const {
      pipelineId,
      stageId,
      ownerId,
      status = undefined,
      search,
      tags,
      page = 1,
      limit = 50,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = filters;

    let whereConditions = ['d.org_id = $1', 'd.deleted_at IS NULL'];
    let values = [orgId];
    let paramCount = 1;

    // Add filters
    if (pipelineId) {
      paramCount++;
      whereConditions.push(`d.pipeline_id = $${paramCount}`);
      values.push(pipelineId);
    }

    if (stageId) {
      paramCount++;
      whereConditions.push(`d.stage_id = $${paramCount}`);
      values.push(stageId);
    }

    if (ownerId) {
      paramCount++;
      whereConditions.push(`d.owner_id = $${paramCount}`);
      values.push(ownerId);
    }

    if (status) {
      paramCount++;
      whereConditions.push(`d.status = $${paramCount}`);
      values.push(status);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(
        d.name ILIKE $${paramCount} OR 
        d.description ILIKE $${paramCount}
      )`);
      values.push(`%${search}%`);
    }

    if (tags && tags.length > 0) {
      paramCount++;
      whereConditions.push(`d.tags && $${paramCount}`);
      values.push(tags);
    }

    const whereClause = whereConditions.join(' AND ');
    const offset = (page - 1) * limit;

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM crm_deals d
      WHERE ${whereClause}
    `;

    // Data query
    const dataQuery = `
      SELECT 
        d.*,
        c.full_name AS contact_name,
        comp.name AS company_name,
        p.name AS pipeline_name,
        s.name AS stage_name,
        s.color AS stage_color,
        u.full_name AS owner_name
      FROM crm_deals d
      LEFT JOIN contacts c ON d.contact_id = c.id
      LEFT JOIN crm_companies comp ON d.company_id = comp.id
      LEFT JOIN crm_pipelines p ON d.pipeline_id = p.id
      LEFT JOIN crm_stages s ON d.stage_id = s.id
      LEFT JOIN users u ON d.owner_id = u.id
      WHERE ${whereClause}
      ORDER BY d.${sortBy} ${['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC'}
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
      logger.error('Error listing deals', { error: error.message, orgId, filters });
      throw error;
    }
  }

  /**
   * Update deal
   * @param {string} orgId - Organization ID
   * @param {string} dealId - Deal ID
   * @param {Object} updates - Fields to update
   * @param {string} userId - User updating the deal
   * @returns {Promise<Object>} Updated deal
   */
  async update(orgId, dealId, updates, userId) {
    const allowedFields = [
      'name', 'contact_id', 'company_id', 'stage_id', 'amount', 'currency',
      'expected_close_date', 'actual_close_date', 'status', 'lost_reason',
      'description', 'tags', 'custom_fields', 'owner_id', 'source'
    ];

    const setClause = [];
    const values = [orgId, dealId];
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
      UPDATE crm_deals
      SET ${setClause.join(', ')}
      WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL
      RETURNING *
    `;

    try {
      const result = await this.db.query(query, values);
      if (result.rows.length === 0) {
        throw new Error('Deal not found');
      }
      logger.info('Deal updated', { dealId, orgId, userId });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating deal', { error: error.message, dealId, orgId, userId });
      throw error;
    }
  }

  /**
   * Soft delete deal
   * @param {string} orgId - Organization ID
   * @param {string} dealId - Deal ID
   * @param {string} userId - User deleting the deal
   * @returns {Promise<boolean>} Success status
   */
  async delete(orgId, dealId, userId) {
    const query = `
      UPDATE crm_deals
      SET deleted_at = NOW(), deleted_by = $3
      WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL
      RETURNING id
    `;

    try {
      const result = await this.db.query(query, [orgId, dealId, userId]);
      if (result.rows.length === 0) {
        throw new Error('Deal not found');
      }
      logger.info('Deal deleted', { dealId, orgId, userId });
      return true;
    } catch (error) {
      logger.error('Error deleting deal', { error: error.message, dealId, orgId, userId });
      throw error;
    }
  }

  /**
   * Get deals by pipeline
   * @param {string} orgId - Organization ID
   * @param {string} pipelineId - Pipeline ID
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Deals in pipeline
   */
  async getByPipeline(orgId, pipelineId, filters = {}) {
    return this.list(orgId, { ...filters, pipelineId });
  }

  /**
   * Get deals by stage
   * @param {string} orgId - Organization ID
   * @param {string} stageId - Stage ID
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Deals in stage
   */
  async getByStage(orgId, stageId, filters = {}) {
    return this.list(orgId, { ...filters, stageId });
  }

  /**
   * Add product to deal
   * @param {string} dealId - Deal ID
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} Created product
   */
  async addProduct(dealId, productData) {
    const query = `
      INSERT INTO crm_deal_products (
        deal_id, product_id, name, description, quantity, unit_price,
        discount_percent, discount_amount, tax_percent, tax_amount,
        total_price, display_order, custom_fields
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      dealId,
      productData.productId || null,
      productData.name,
      productData.description || null,
      productData.quantity || 1,
      productData.unitPrice,
      productData.discountPercent || 0,
      productData.discountAmount || 0,
      productData.taxPercent || 0,
      productData.taxAmount || 0,
      productData.totalPrice,
      productData.displayOrder || 0,
      productData.customFields || {}
    ];

    try {
      const result = await this.db.query(query, values);
      logger.info('Product added to deal', { dealId, productId: result.rows[0].id });
      return result.rows[0];
    } catch (error) {
      logger.error('Error adding product to deal', { error: error.message, dealId });
      throw error;
    }
  }

  /**
   * Get products for deal
   * @param {string} dealId - Deal ID
   * @returns {Promise<Array>} Deal products
   */
  async getProducts(dealId) {
    const query = `
      SELECT *
      FROM crm_deal_products
      WHERE deal_id = $1
      ORDER BY display_order, created_at
    `;

    try {
      const result = await this.db.query(query, [dealId]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching deal products', { error: error.message, dealId });
      throw error;
    }
  }

  /**
   * Remove product from deal
   * @param {string} dealId - Deal ID
   * @param {string} productId - Product ID
   * @returns {Promise<boolean>} Success status
   */
  async removeProduct(dealId, productId) {
    const query = `
      DELETE FROM crm_deal_products
      WHERE deal_id = $1 AND id = $2
      RETURNING id
    `;

    try {
      const result = await this.db.query(query, [dealId, productId]);
      if (result.rows.length === 0) {
        throw new Error('Product not found');
      }
      logger.info('Product removed from deal', { dealId, productId });
      return true;
    } catch (error) {
      logger.error('Error removing product from deal', { error: error.message, dealId, productId });
      throw error;
    }
  }

  /**
   * Get pipeline metrics
   * @param {string} orgId - Organization ID
   * @param {string} pipelineId - Pipeline ID (optional)
   * @returns {Promise<Array>} Pipeline metrics
   */
  async getPipelineMetrics(orgId, pipelineId = null) {
    const query = `
      SELECT * FROM crm_pipeline_metrics
      WHERE org_id = $1
      ${pipelineId ? 'AND pipeline_id = $2' : ''}
      ORDER BY display_order
    `;

    const values = pipelineId ? [orgId, pipelineId] : [orgId];

    try {
      const result = await this.db.query(query, values);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching pipeline metrics', { error: error.message, orgId, pipelineId });
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

module.exports = DealRepository;
