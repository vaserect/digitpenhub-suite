const logger = require('../../utils/logger');

/**
 * Base repository class providing common database operations
 * All repositories should extend this class
 *
 * SECURITY: All column and table names are validated against allowlists
 * before being interpolated into SQL queries. This prevents SQL injection
 * via dynamic column/key/orderBy values while still supporting dynamic queries.
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

    // ── Security: Pre-validated identifier allowlists ────────────────────────
    // Subclasses set these to define which column names are accepted in dynamic queries.
    // If not set, we fall back to the table's known columns (fetched on first use).
    this.ALLOWED_COLUMNS = options.allowedColumns || null;       // e.g. ['id','name','email','org_id']
    this.ALLOWED_SORT_COLUMNS = options.allowedSortColumns || null; // e.g. ['created_at','updated_at','name']
    this.ALLOWED_SORT_DIRECTIONS = ['ASC', 'DESC', 'asc', 'desc'];

    // Cache of resolved column sets (keyed by tableName)
    this._resolvedColumns = null;
  }

  // ── Identifier validation helpers ──────────────────────────────────────────

  /**
   * Return the set of allowed column names for this table.
   * If the subclass hasn't set ALLOWED_COLUMNS we fetch them from the DB once.
   * @returns {Promise<Set<string>>}
   */
  async _getAllowedColumns() {
    if (this.ALLOWED_COLUMNS) return new Set(this.ALLOWED_COLUMNS);
    if (this._resolvedColumns) return this._resolvedColumns;

    try {
      const { rows } = await this.db.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
        [this.tableName]
      );
      this._resolvedColumns = new Set(
        rows.map(r => r.column_name).filter(Boolean)
      );
      logger.debug(`${this.tableName}: Resolved ${this._resolvedColumns.size} allowed columns from schema`);
      return this._resolvedColumns;
    } catch (err) {
      logger.error(`${this.tableName}: Failed to resolve columns from schema`, {
        error: err.message,
      });
      // Return empty set — all dynamic queries will be rejected
      return new Set();
    }
  }

  /**
   * Validate that a set of column names are safe to use in SQL.
   * Throws if any column is not in the allowlist.
   * @param {string[]} columns
   * @throws {Error}
   */
  async _validateColumns(columns) {
    const allowed = await this._getAllowedColumns();
    for (const col of columns) {
      if (!allowed.has(col)) {
        throw new Error(
          `SecurityError: column "${col}" is not in the allowlist for table "${this.tableName}". ` +
          `Allowed columns: ${[...allowed].join(', ')}`
        );
      }
    }
  }

  /**
   * Validate a single column name.
   * @param {string} col
   * @returns {Promise<string>} The column name if valid
   * @throws {Error}
   */
  async _validateColumn(col) {
    const allowed = await this._getAllowedColumns();
    if (!allowed.has(col)) {
      throw new Error(
        `SecurityError: column "${col}" is not in the allowlist for table "${this.tableName}".`
      );
    }
    return col;
  }

  /**
   * Validate sort direction.
   * @param {string} dir
   * @returns {string} Uppercased valid direction
   * @throws {Error}
   */
  _validateSortDirection(dir) {
    const upper = String(dir).toUpperCase();
    if (!this.ALLOWED_SORT_DIRECTIONS.includes(upper)) {
      throw new Error(
        `SecurityError: sort direction "${dir}" is not valid. Allowed: ${this.ALLOWED_SORT_DIRECTIONS.join(', ')}`
      );
    }
    return upper;
  }

  // ── CRUD methods ───────────────────────────────────────────────────────────

  /**
   * Find entity by ID with tenant isolation
   * @param {number|string} id - Entity ID
   * @param {number|string} orgId - Organization ID for tenant isolation
   * @returns {Promise<Object|null>} Entity or null if not found
   */
  async findById(id, orgId) {
    try {
      const pk = await this._validateColumn(this.primaryKey);
      const { rows } = await this.db.query(
        `SELECT * FROM ${this.tableName}
         WHERE ${pk} = $1 AND org_id = $2`,
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
   * Find all entities for an organization with filtering, sorting, and pagination.
   * Column names in filters/orderBy are validated against the allowlist.
   *
   * @param {number|string} orgId - Organization ID
   * @param {Object} filters - Filter criteria (keys are column names, values are filter values)
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Array>} Array of entities
   */
  async findAll(orgId, filters = {}, pagination = {}) {
    try {
      const { limit = 50, offset = 0, orderBy = 'created_at', order = 'DESC' } = pagination;

      // Build WHERE clause with parameterized values
      const whereClauses = ['org_id = $1'];
      const params = [orgId];
      let paramIndex = 2;

      // Validate and add filters
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          // Security: validate column name before using in SQL
          const safeKey = await this._validateColumn(key);
          whereClauses.push(`${safeKey} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      }

      const whereClause = whereClauses.join(' AND ');

      // Security: validate orderBy and direction
      const safeOrderBy = await this._validateColumn(orderBy || 'created_at');
      const safeOrder = this._validateSortDirection(order || 'DESC');

      const query = `
        SELECT * FROM ${this.tableName}
        WHERE ${whereClause}
        ORDER BY ${safeOrderBy} ${safeOrder}
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
   * Create a new entity.
   * Column names from the data object are validated against the allowlist.
   *
   * @param {Object} data - Entity data (keys are column names)
   * @param {number|string} orgId - Organization ID
   * @param {number|string|null} userId - User ID for audit trail
   * @returns {Promise<Object>} Created entity
   */
  async create(data, orgId, userId = null) {
    try {
      const dataKeys = Object.keys(data);

      // Build column list — validated
      const columns = [...dataKeys];
      columns.push('org_id');
      if (userId) columns.push('created_by');

      await this._validateColumns(columns);

      // Build values list
      const values = Object.values(data);
      if (orgId) values.push(orgId);
      if (userId) values.push(userId);

      const placeholders = values.map((_, i) => `$${i + 1}`);

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
   * Update an existing entity.
   * Column names from the update data are validated against the allowlist.
   *
   * @param {number|string} id - Entity ID
   * @param {Object} data - Updated data (keys are column names)
   * @param {number|string} orgId - Organization ID
   * @param {number|string|null} userId - User ID for audit trail
   * @returns {Promise<Object|null>} Updated entity or null if not found
   */
  async update(id, data, orgId, userId = null) {
    try {
      const dataKeys = Object.keys(data);
      const columns = [...dataKeys];

      if (userId) columns.push('updated_by');
      if (this.timestamps) columns.push('updated_at');

      await this._validateColumns(columns);

      // Build values for SET clause
      const setValues = [...Object.values(data)];
      if (userId) setValues.push(userId);
      if (this.timestamps) setValues.push(new Date());

      const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');

      const pk = await this._validateColumn(this.primaryKey);

      const query = `
        UPDATE ${this.tableName}
        SET ${setClause}
        WHERE ${pk} = $${setValues.length + 1} AND org_id = $${setValues.length + 2}
        RETURNING *
      `;

      const values = [...setValues, id, orgId];

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
   * Delete an entity permanently.
   *
   * @param {number|string} id - Entity ID
   * @param {number|string} orgId - Organization ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id, orgId) {
    try {
      const pk = await this._validateColumn(this.primaryKey);
      const { rows } = await this.db.query(
        `DELETE FROM ${this.tableName}
         WHERE ${pk} = $1 AND org_id = $2
         RETURNING ${pk}`,
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
   * Soft delete an entity (if table has deleted_at column).
   *
   * @param {number|string} id - Entity ID
   * @param {number|string} orgId - Organization ID
   * @param {number|string|null} userId - User ID for audit trail
   * @returns {Promise<boolean>} True if soft-deleted, false if not found
   */
  async softDelete(id, orgId, userId = null) {
    try {
      await this._validateColumns(['deleted_at', 'deleted_by']);

      const updates = ['deleted_at = NOW()'];
      const params = [id, orgId];

      if (userId && (await this._getAllowedColumns()).has('deleted_by')) {
        updates.push('deleted_by = $3');
        params.push(userId);
      }

      const pk = await this._validateColumn(this.primaryKey);

      const { rows } = await this.db.query(
        `UPDATE ${this.tableName}
         SET ${updates.join(', ')}
         WHERE ${pk} = $1 AND org_id = $2 AND deleted_at IS NULL
         RETURNING ${pk}`,
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
   * Count entities matching criteria.
   * Column names in filters are validated against the allowlist.
   *
   * @param {number|string} orgId - Organization ID
   * @param {Object} filters - Filter criteria (keys are column names)
   * @returns {Promise<number>} Count of entities
   */
  async count(orgId, filters = {}) {
    try {
      const whereClauses = ['org_id = $1'];
      const params = [orgId];
      let paramIndex = 2;

      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          const safeKey = await this._validateColumn(key);
          whereClauses.push(`${safeKey} = $${paramIndex}`);
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
   * Check if entity exists.
   *
   * @param {number|string} id - Entity ID
   * @param {number|string} orgId - Organization ID
   * @returns {Promise<boolean>} True if exists
   */
  async exists(id, orgId) {
    try {
      const pk = await this._validateColumn(this.primaryKey);
      const { rows } = await this.db.query(
        `SELECT 1 FROM ${this.tableName}
         WHERE ${pk} = $1 AND org_id = $2`,
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
   * Bulk create entities.
   * Column names from the data objects are validated against the allowlist.
   *
   * @param {Array<Object>} dataArray - Array of entity data
   * @param {number|string} orgId - Organization ID
   * @param {number|string|null} userId - User ID for audit trail
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

      await this._validateColumns(columns);

      // Build values
      const values = [];
      const placeholders = [];
      let paramIndex = 1;

      for (const data of dataArray) {
        const rowPlaceholders = [];

        for (const col of columns) {
          if (col === 'org_id') {
            values.push(orgId);
          } else if (col === 'created_by') {
            values.push(userId);
          } else {
            values.push(data[col]);
          }
          rowPlaceholders.push(`$${paramIndex++}`);
        }

        placeholders.push(`(${rowPlaceholders.join(', ')})`);
      }

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
   * Bulk delete entities.
   *
   * @param {Array<number|string>} ids - Array of entity IDs
   * @param {number|string} orgId - Organization ID
   * @returns {Promise<number>} Number of deleted entities
   */
  async bulkDelete(ids, orgId) {
    if (!ids || ids.length === 0) {
      return 0;
    }

    try {
      const placeholders = ids.map((_, i) => `$${i + 2}`).join(', ');
      const pk = await this._validateColumn(this.primaryKey);

      const { rowCount } = await this.db.query(
        `DELETE FROM ${this.tableName}
         WHERE ${pk} IN (${placeholders}) AND org_id = $1`,
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
   * Execute a raw query (use with caution — no column validation is applied here).
   * Prefer the named CRUD methods above when possible.
   *
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters (all values are parameterized)
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
   * Begin a database transaction.
   * @returns {Promise<Object>} Transaction client
   */
  async beginTransaction() {
    const client = await this.db.connect();
    await client.query('BEGIN');
    return client;
  }

  /**
   * Commit a database transaction.
   * @param {Object} client - Transaction client
   */
  async commitTransaction(client) {
    await client.query('COMMIT');
    client.release();
  }

  /**
   * Rollback a database transaction.
   * @param {Object} client - Transaction client
   */
  async rollbackTransaction(client) {
    await client.query('ROLLBACK');
    client.release();
  }
}

module.exports = BaseRepository;
