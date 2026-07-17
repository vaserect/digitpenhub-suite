// backend/src/repositories/PipelineRepository.js
// Phase 1 Implementation: Pipeline Repository
// Date: 2026-07-16

const BaseRepository = require('../base/BaseRepository');
const db = require('../../db');
const logger = require('../../utils/logger');

/**
 * Repository for CRM Pipelines
 * Handles all database operations for pipelines and stages
 */
class PipelineRepository extends BaseRepository {
  constructor() {
    super(db, 'crm_pipelines');
  }

  /**
   * Create a new pipeline
   * @param {string} orgId - Organization ID
   * @param {Object} pipelineData - Pipeline data
   * @param {string} userId - User creating the pipeline
   * @returns {Promise<Object>} Created pipeline
   */
  async create(orgId, pipelineData, userId) {
    const query = `
      INSERT INTO crm_pipelines (
        org_id, name, description, is_default, display_order,
        created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $6
      )
      RETURNING *
    `;

    const values = [
      orgId,
      pipelineData.name,
      pipelineData.description || null,
      pipelineData.isDefault || false,
      pipelineData.displayOrder || 0,
      userId
    ];

    try {
      const result = await this.db.query(query, values);
      logger.info('Pipeline created', { pipelineId: result.rows[0].id, orgId, userId });
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating pipeline', { error: error.message, orgId, userId });
      throw error;
    }
  }

  /**
   * Get pipeline by ID
   * @param {string} orgId - Organization ID
   * @param {string} pipelineId - Pipeline ID
   * @returns {Promise<Object>} Pipeline data
   */
  async getById(orgId, pipelineId) {
    const query = `
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM crm_stages WHERE pipeline_id = p.id) AS stage_count,
        (SELECT COUNT(*) FROM crm_deals WHERE pipeline_id = p.id AND is_archived IS NOT TRUE) AS deal_count
      FROM crm_pipelines p
      WHERE p.id = $1 AND p.org_id = $2
    `;

    try {
      const result = await this.db.query(query, [pipelineId, orgId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching pipeline', { error: error.message, pipelineId, orgId });
      throw error;
    }
  }

  /**
   * List pipelines
   * @param {string} orgId - Organization ID
   * @returns {Promise<Array>} Pipelines list
   */
  async list(orgId) {
    const query = `
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM crm_stages WHERE pipeline_id = p.id) AS stage_count,
        (SELECT COUNT(*) FROM crm_deals WHERE pipeline_id = p.id AND is_archived IS NOT TRUE) AS deal_count
      FROM crm_pipelines p
      WHERE p.org_id = $1
      ORDER BY p.display_order, p.name
    `;

    try {
      const result = await this.db.query(query, [orgId]);
      return result.rows;
    } catch (error) {
      logger.error('Error listing pipelines', { error: error.message, orgId });
      throw error;
    }
  }

  /**
   * Update pipeline
   * @param {string} orgId - Organization ID
   * @param {string} pipelineId - Pipeline ID
   * @param {Object} updates - Fields to update
   * @param {string} userId - User updating the pipeline
   * @returns {Promise<Object>} Updated pipeline
   */
  async update(orgId, pipelineId, updates, userId) {
    const allowedFields = ['name', 'description', 'is_default', 'display_order'];

    const setClause = [];
    const values = [orgId, pipelineId];
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
      UPDATE crm_pipelines
      SET ${setClause.join(', ')}
      WHERE org_id = $1 AND id = $2
      RETURNING *
    `;

    try {
      const result = await this.db.query(query, values);
      if (result.rows.length === 0) {
        throw new Error('Pipeline not found');
      }
      logger.info('Pipeline updated', { pipelineId, orgId, userId });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating pipeline', { error: error.message, pipelineId, orgId, userId });
      throw error;
    }
  }

  /**
   * Hard delete pipeline
   * @param {string} orgId - Organization ID
   * @param {string} pipelineId - Pipeline ID
   * @param {string} userId - User deleting the pipeline
   * @returns {Promise<boolean>} Success status
   */
  async delete(orgId, pipelineId, userId) {
    try {
      // First delete associated stages to avoid foreign key issues
      await this.db.query(`DELETE FROM crm_stages WHERE pipeline_id = $1`, [pipelineId]);
      
      const query = `
        DELETE FROM crm_pipelines
        WHERE org_id = $1 AND id = $2
        RETURNING id
      `;

      const result = await this.db.query(query, [orgId, pipelineId]);
      if (result.rows.length === 0) {
        throw new Error('Pipeline not found');
      }
      logger.info('Pipeline deleted', { pipelineId, orgId, userId });
      return true;
    } catch (error) {
      logger.error('Error deleting pipeline', { error: error.message, pipelineId, orgId, userId });
      throw error;
    }
  }

  /**
   * Create a pipeline stage
   * @param {string} pipelineId - Pipeline ID
   * @param {Object} stageData - Stage data
   * @param {string} userId - User creating the stage
   * @returns {Promise<Object>} Created stage
   */
  async createStage(pipelineId, stageData, userId) {
    const query = `
      INSERT INTO crm_stages (
        pipeline_id, name, description, probability, display_order,
        color, is_closed_won, is_closed_lost, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
      )
      RETURNING *
    `;

    const values = [
      pipelineId,
      stageData.name,
      stageData.description || null,
      stageData.probability || 0,
      stageData.displayOrder || 0,
      stageData.color || '#3B82F6',
      stageData.isClosedWon || false,
      stageData.isClosedLost || false
    ];

    try {
      const result = await this.db.query(query, values);
      logger.info('Pipeline stage created', { stageId: result.rows[0].id, pipelineId, userId });
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating stage', { error: error.message, pipelineId, userId });
      throw error;
    }
  }

  /**
   * Get stage by ID
   * @param {string} stageId - Stage ID
   * @returns {Promise<Object>} Stage data
   */
  async getStage(stageId) {
    const query = `
      SELECT 
        s.*,
        (SELECT COUNT(*) FROM crm_deals WHERE stage_id = s.id AND is_archived IS NOT TRUE) AS deal_count,
        (SELECT COALESCE(SUM(amount), 0) FROM crm_deals WHERE stage_id = s.id AND is_archived IS NOT TRUE) AS total_value
      FROM crm_stages s
      WHERE s.id = $1
    `;

    try {
      const result = await this.db.query(query, [stageId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching stage', { error: error.message, stageId });
      throw error;
    }
  }

  /**
   * List stages for pipeline
   * @param {string} pipelineId - Pipeline ID
   * @returns {Promise<Array>} Stages list
   */
  async listStages(pipelineId) {
    const query = `
      SELECT 
        s.*,
        (SELECT COUNT(*) FROM crm_deals WHERE stage_id = s.id AND is_archived IS NOT TRUE) AS deal_count,
        (SELECT COALESCE(SUM(amount), 0) FROM crm_deals WHERE stage_id = s.id AND is_archived IS NOT TRUE) AS total_value
      FROM crm_stages s
      WHERE s.pipeline_id = $1
      ORDER BY s.display_order, s.name
    `;

    try {
      const result = await this.db.query(query, [pipelineId]);
      return result.rows;
    } catch (error) {
      logger.error('Error listing stages', { error: error.message, pipelineId });
      throw error;
    }
  }

  /**
   * Update stage
   * @param {string} stageId - Stage ID
   * @param {Object} updates - Fields to update
   * @param {string} userId - User updating the stage
   * @returns {Promise<Object>} Updated stage
   */
  async updateStage(stageId, updates, userId) {
    const allowedFields = [
      'name', 'description', 'probability', 'display_order',
      'color', 'is_closed_won', 'is_closed_lost'
    ];

    const setClause = [];
    const values = [stageId];
    let paramCount = 1;

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

    setClause.push('updated_at = NOW()');

    const query = `
      UPDATE crm_stages
      SET ${setClause.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    try {
      const result = await this.db.query(query, values);
      if (result.rows.length === 0) {
        throw new Error('Stage not found');
      }
      logger.info('Stage updated', { stageId, userId });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating stage', { error: error.message, stageId, userId });
      throw error;
    }
  }

  /**
   * Delete stage
   * @param {string} stageId - Stage ID
   * @param {string} userId - User deleting the stage
   * @returns {Promise<boolean>} Success status
   */
  async deleteStage(stageId, userId) {
    const query = `
      DELETE FROM crm_stages
      WHERE id = $1
      RETURNING id
    `;

    try {
      const result = await this.db.query(query, [stageId]);
      if (result.rows.length === 0) {
        throw new Error('Stage not found');
      }
      logger.info('Stage deleted', { stageId, userId });
      return true;
    } catch (error) {
      logger.error('Error deleting stage', { error: error.message, stageId, userId });
      throw error;
    }
  }

  /**
   * Get default pipeline for organization
   * @param {string} orgId - Organization ID
   * @returns {Promise<Object>} Default pipeline
   */
  async getDefault(orgId) {
    const query = `
      SELECT *
      FROM crm_pipelines
      WHERE org_id = $1 AND is_default = true
      LIMIT 1
    `;

    try {
      const result = await this.db.query(query, [orgId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching default pipeline', { error: error.message, orgId });
      throw error;
    }
  }

  /**
   * Set pipeline as default
   * @param {string} orgId - Organization ID
   * @param {string} pipelineId - Pipeline ID
   * @param {string} userId - User setting default
   * @returns {Promise<Object>} Updated pipeline
   */
  async setDefault(orgId, pipelineId, userId) {
    // Start transaction
    try {
      // Unset current default
      await this.db.query(`
        UPDATE crm_pipelines
        SET is_default = false, updated_by = $2, updated_at = NOW()
        WHERE org_id = $1 AND is_default = true
      `, [orgId, userId]);

      // Set new default
      const result = await this.db.query(`
        UPDATE crm_pipelines
        SET is_default = true, updated_by = $3, updated_at = NOW()
        WHERE org_id = $1 AND id = $2
        RETURNING *
      `, [orgId, pipelineId, userId]);

      if (result.rows.length === 0) {
        throw new Error('Pipeline not found');
      }

      logger.info('Default pipeline set', { pipelineId, orgId, userId });
      return result.rows[0];
    } catch (error) {
      logger.error('Error setting default pipeline', { error: error.message, pipelineId, orgId, userId });
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

module.exports = PipelineRepository;
