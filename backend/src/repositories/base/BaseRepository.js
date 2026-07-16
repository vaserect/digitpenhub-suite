const logger = require('../../utils/logger');

/**
 * Base repository class providing common database operations
 * All repositories should extend this class
 */
class BaseRepository {
  /**
   * @param {Object} db - Database connection pool
   * @param {string} tableName - Name of the database table
   * @param {Object} options - Repository configuration options
   */
  constructor(db, tableName, options = {}) {
    if (!db) {
      throw new Error('Database connection is required for BaseRepository');
    }
    if (!tableName) {
      throw new Error('Table name is required for BaseRepository');
    }
    
    this.db = db;
    this.tableName = tableName;
    this.logger = options.logger || logger;
    this.primaryKey = options.primaryKey || 'id';
    this.timestamps = options.timestamps !== false; // Default true
  }

  /**
   * Find entity by ID with tenant isolation
   * @param {number} id - Entity ID
   * @param {number} orgId - Organization ID for tenant isolation
   * @returns {Promise<Object|null>} Entity or null if not found
   */
  async findById(id, orgId) {
    try {
      const { rows } = await this.db.query(
        `SELECT * FROM ${this.tableName} 
         WHERE ${this.primaryKey} = $1 AND org_id = $2`,
        [id, orgId]
      );
      return rows[0] || null;
    } catch (error) {
      this.logger.error(`${this.tableName}: Error finding by ID`, {
        id,
        orgId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Find all entities for an organization
   * @param {number} orgId - Organization ID
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Array>} Array of entities
   */
  async findAll(orgId, filters = {}, pagination = {}) {
    try {
      const { limit = 50, offset = 0, orderBy = 'created_at', order = 'DESC' } = pagination;
      
      // Build WHERE clause
      const whereClauses = ['org_id = $1'];
      const params = [orgId];
      let paramIndex = 2;
      
      // Add filters
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          whereClauses.push(`${key} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      }
      
      const whereClause = whereClauses.join(' AND ');
      
      // Build query
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE ${whereClause}
        ORDER BY ${orderBy} ${order}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      params.push(limit, offset);
      
      const { rows } = await this.db.query(query, params);
      return rows;
    } catch (error) {
      this.logger.error(`${this.tableName}: Error finding all`, {
        orgId,
        filters,
        pagination,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Create a new entity
   * @param {Object} data - Entity data
   * @param {number} orgId - Organization ID
   * @param {number} userId - User ID for audit trail
   * @returns {Promise<Object>} Created entity
   */
  async create(data, orgId, userId = null) {
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      
      // Add org_id
      columns.push('org_id');
      values.push(orgId);
      
      // Add created_by if userId provided
      if (userId) {
        columns.push('created_by');
        values.push(userId);
      }
      
      // Build placeholders
      const placeholders = values.map((_, i) => `$${i + 1}`);
      
      // Build query
      const query = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;
      
      const { rows } = await this.db.query(query, values);
      return rows[0];
    } catch (error) {
      this.logger.error(`${this.tableName}: Error creating entity`, {
        orgId,
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Update an existing entity
   * @param {number} id - Entity ID
   * @param {Object} data - Updated data
   * @param {number} orgId - Organization ID
   * @param {number} userId - User ID for audit trail
   * @returns {Promise<Object|null>} Updated entity or null if not found
   */
  async update(id, data, orgId, userId = null) {
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      
      // Add updated_by if userId provided
      if (userId) {
        columns.push('updated_by');
        values.push(userId);
      }
      
      // Add updated_at if timestamps enabled
      if (this.timestamps) {
        columns.push('updated_at');
        values.push(new Date());
      }
      
      // Build SET clause
      const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
      
      // Build query
      const query = `
        UPDATE ${this.tableName}
        SET ${setClause}
        WHERE ${this.primaryKey} = $${values.length + 1} AND org_id = $${values.length + 2}
        RETURNING *
      `;
      
      values.push(id, orgId);
      
      const { rows } = await this.db.query(query, values);
      return rows[0] || null;
    } catch (error) {
      this.logger.error(`${this.tableName}: Error updating entity`, {
        id,
        orgId,
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Delete an entity
   * @param {number} id - Entity ID
   * @param {number} orgId - Organization ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id, orgId) {
    try {
      const { rows } = await this.db.query(
        `DELETE FROM ${this.tableName}
         WHERE ${this.primaryKey} = $1 AND org_id = $2
         RETURNING ${this.primaryKey}`,
        [id, orgId]
      );
      return rows.length > 0;
    } catch (error) {
      this.logger.error(`${this.tableName}: Error deleting entity`, {
        id,
        orgId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Soft delete an entity (if table has deleted_at column)
   * @param {number} id - Entity ID
   * @param {number} orgId - Organization ID
   * @param {number} userId - User ID for audit trail
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async softDelete(id, orgId, userId = null) {
    try {
      const updates = ['deleted_at = NOW()'];
      const params = [id, orgId];
      
      if (userId) {
        updates.push('deleted_by = $3');
        params.push(userId);
      }
      
      const { rows } = await this.db.query(
        `UPDATE ${this.tableName}
         SET ${updates.join(', ')}
         WHERE ${this.primaryKey} = $1 AND org_id = $2 AND deleted_at IS NULL
         RETURNING ${this.primaryKey}`,
        params
      );
      return rows.length > 0;
    } catch (error) {
      this.logger.error(`${this.tableName}: Error soft deleting entity`, {
        id,
        orgId,
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Count entities matching criteria
   * @param {number} orgId - Organization ID
   * @param {Object} filters - Filter criteria
   * @returns {Promise<number>} Count of entities
   */
  async count(orgId, filters = {}) {
    try {
      // Build WHERE clause
      const whereClauses = ['org_id = $1'];
      const params = [orgId];
      let paramIndex = 2;
      
      // Add filters
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          whereClauses.push(`${key} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      }
      
      const whereClause = whereClauses.join(' AND ');
      
      const { rows } = await this.db.query(
        `SELECT COUNT(*)::int AS count FROM ${this.tableName} WHERE ${whereClause}`,
        params
      );
      return rows[0].count;
    } catch (error) {
      this.logger.error(`${this.tableName}: Error counting entities`, {
        orgId,
        filters,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Check if entity exists
   * @param {number} id - Entity ID
   * @param {number} orgId - Organization ID
   * @returns {Promise<boolean>} True if exists
   */
  async exists(id, orgId) {
    try {
      const { rows } = await this.db.query(
        `SELECT 1 FROM ${this.tableName} 
         WHERE ${this.primaryKey} = $1 AND org_id = $2`,
        [id, orgId]
      );
      return rows.length > 0;
    } catch (error) {
      this.logger.error(`${this.tableName}: Error checking existence`, {
        id,
        orgId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Bulk create entities
   * @param {Array<Object>} dataArray - Array of entity data
   * @param {number} orgId - Organization ID
   * @param {number} userId - User ID for audit trail
   * @returns {Promise<Array>} Created entities
   */
  async bulkCreate(dataArray, orgId, userId = null) {
    if (!dataArray || dataArray.length === 0) {
      return [];
    }

    try {
      // Get columns from first item
      const columns = Object.keys(dataArray[0]);
      columns.push('org_id');
      if (userId) columns.push('created_by');
      
      // Build values
      const values = [];
      const placeholders = [];
      let paramIndex = 1;
      
      dataArray.forEach((data) => {
        const rowPlaceholders = [];
        
        // Add data values
        columns.forEach((col) => {
          if (col === 'org_id') {
            values.push(orgId);
          } else if (col === 'created_by') {
            values.push(userId);
          } else {
            values.push(data[col]);
          }
          rowPlaceholders.push(`$${paramIndex++}`);
        });
        
        placeholders.push(`(${rowPlaceholders.join(', ')})`);
      });
      
      // Build query
      const query = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES ${placeholders.join(', ')}
        RETURNING *
      `;
      
      const { rows } = await this.db.query(query, values);
      return rows;
    } catch (error) {
      this.logger.error(`${this.tableName}: Error bulk creating entities`, {
        count: dataArray.length,
        orgId,
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Bulk delete entities
   * @param {Array<number>} ids - Array of entity IDs
   * @param {number} orgId - Organization ID
   * @returns {Promise<number>} Number of deleted entities
   */
  async bulkDelete(ids, orgId) {
    if (!ids || ids.length === 0) {
      return 0;
    }

    try {
      const placeholders = ids.map((_, i) => `$${i + 2}`).join(', ');
      
      const { rowCount } = await this.db.query(
        `DELETE FROM ${this.tableName}
         WHERE ${this.primaryKey} IN (${placeholders}) AND org_id = $1`,
        [orgId, ...ids]
      );
      return rowCount;
    } catch (error) {
      this.logger.error(`${this.tableName}: Error bulk deleting entities`, {
        count: ids.length,
        orgId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Execute a raw query (use with caution)
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Query result
   */
  async query(query, params = []) {
    try {
      return await this.db.query(query, params);
    } catch (error) {
      this.logger.error(`${this.tableName}: Error executing query`, {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Begin a database transaction
   * @returns {Promise<Object>} Transaction client
   */
  async beginTransaction() {
    const client = await this.db.connect();
    await client.query('BEGIN');
    return client;
  }

  /**
   * Commit a database transaction
   * @param {Object} client - Transaction client
   */
  async commitTransaction(client) {
    await client.query('COMMIT');
    client.release();
  }

  /**
   * Rollback a database transaction
   * @param {Object} client - Transaction client
   */
  async rollbackTransaction(client) {
    await client.query('ROLLBACK');
    client.release();
  }
}

module.exports = BaseRepository;
