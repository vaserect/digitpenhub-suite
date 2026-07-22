const BaseRepository = require('./base/BaseRepository');
const db = require('../db');

/**
 * ProjectRepository - Data access layer for projects
 * Handles all database operations for project records
 */
class ProjectRepository extends BaseRepository {
  constructor() {
    super(db, 'projects', {
      primaryKey: 'id',
      timestamps: true,
      tenantColumn: 'org_id',
    });
  }

  /**
   * Find project with task statistics
   * @param {string} projectId - Project ID
   * @param {string} orgId - Organization ID
   * @returns {Promise<Object|null>} Project with task stats
   */
  async findByIdWithStats(projectId, orgId) {
    const { rows } = await this.db.query(
      `SELECT 
        p.*,
        u.email as creator_email,
        COUNT(t.id) as total_tasks,
        COUNT(CASE WHEN t.status = 'todo' THEN 1 END) as todo_count,
        COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_count,
        COUNT(CASE WHEN t.status = 'done' THEN 1 END) as done_count
       FROM ${this.tableName} p
       LEFT JOIN users u ON u.id = p.created_by
       LEFT JOIN tasks t ON t.project_id = p.id
       WHERE p.id = $1 AND p.org_id = $2
       GROUP BY p.id, u.email`,
      [projectId, orgId]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find all projects with task statistics
   * @param {string} orgId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Projects with stats
   */
  async findAllWithStats(orgId, options = {}) {
    const limit = options.limit || 100;
    const offset = options.offset || 0;
    const orderBy = options.orderBy || 'p.created_at DESC';

    const { rows } = await this.db.query(
      `SELECT 
        p.*,
        u.email as creator_email,
        COUNT(t.id) as total_tasks,
        COUNT(CASE WHEN t.status = 'todo' THEN 1 END) as todo_count,
        COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_count,
        COUNT(CASE WHEN t.status = 'done' THEN 1 END) as done_count
       FROM ${this.tableName} p
       LEFT JOIN users u ON u.id = p.created_by
       LEFT JOIN tasks t ON t.project_id = p.id
       WHERE p.org_id = $1
       GROUP BY p.id, u.email
       ORDER BY ${orderBy}
       LIMIT $2 OFFSET $3`,
      [orgId, limit, offset]
    );

    return rows;
  }

  /**
   * Get project statistics
   * @param {string} orgId - Organization ID
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics(orgId) {
    const { rows } = await this.db.query(
      `SELECT 
        COUNT(DISTINCT p.id) as total_projects,
        COUNT(t.id) as total_tasks,
        COUNT(CASE WHEN t.status = 'todo' THEN 1 END) as todo_tasks,
        COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN t.status = 'done' THEN 1 END) as done_tasks,
        ROUND(
          CASE 
            WHEN COUNT(t.id) > 0 
            THEN (COUNT(CASE WHEN t.status = 'done' THEN 1 END)::NUMERIC / COUNT(t.id)::NUMERIC) * 100
            ELSE 0
          END, 
          2
        ) as completion_percentage
       FROM ${this.tableName} p
       LEFT JOIN tasks t ON t.project_id = p.id
       WHERE p.org_id = $1`,
      [orgId]
    );

    return rows[0];
  }

  /**
   * Search projects by name
   * @param {string} query - Search query
   * @param {string} orgId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Matching projects
   */
  async search(query, orgId, options = {}) {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const { rows } = await this.db.query(
      `SELECT 
        p.*,
        COUNT(t.id) as total_tasks,
        COUNT(CASE WHEN t.status = 'done' THEN 1 END) as done_count
       FROM ${this.tableName} p
       LEFT JOIN tasks t ON t.project_id = p.id
       WHERE p.org_id = $1 
         AND p.name ILIKE $2
       GROUP BY p.id
       ORDER BY p.created_at DESC
       LIMIT $3 OFFSET $4`,
      [orgId, `%${query}%`, limit, offset]
    );

    return rows;
  }

  /**
   * Check if project name exists
   * @param {string} name - Project name
   * @param {string} orgId - Organization ID
   * @param {string} excludeId - Project ID to exclude
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
   * Get projects created by user
   * @param {string} userId - User ID
   * @param {string} orgId - Organization ID
   * @returns {Promise<Array>} User's projects
   */
  async findByCreator(userId, orgId) {
    const { rows } = await this.db.query(
      `SELECT 
        p.*,
        COUNT(t.id) as total_tasks,
        COUNT(CASE WHEN t.status = 'done' THEN 1 END) as done_count
       FROM ${this.tableName} p
       LEFT JOIN tasks t ON t.project_id = p.id
       WHERE p.org_id = $1 AND p.created_by = $2
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [orgId, userId]
    );

    return rows;
  }

  /**
   * Get recently updated projects
   * @param {string} orgId - Organization ID
   * @param {number} limit - Number of projects
   * @returns {Promise<Array>} Recent projects
   */
  async findRecent(orgId, limit = 10) {
    const { rows } = await this.db.query(
      `SELECT 
        p.*,
        COUNT(t.id) as total_tasks,
        MAX(t.updated_at) as last_task_update
       FROM ${this.tableName} p
       LEFT JOIN tasks t ON t.project_id = p.id
       WHERE p.org_id = $1
       GROUP BY p.id
       ORDER BY GREATEST(p.created_at, MAX(t.updated_at)) DESC NULLS LAST
       LIMIT $2`,
      [orgId, limit]
    );

    return rows;
  }

  /**
   * Delete project and all associated tasks
   * @param {string} projectId - Project ID
   * @param {string} orgId - Organization ID
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteWithTasks(projectId, orgId) {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // Delete tasks first (cascade should handle this, but being explicit)
      await client.query(
        'DELETE FROM tasks WHERE project_id = $1',
        [projectId]
      );

      // Delete project
      const { rowCount } = await client.query(
        `DELETE FROM ${this.tableName} WHERE id = $1 AND org_id = $2`,
        [projectId, orgId]
      );

      await client.query('COMMIT');

      return rowCount > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = ProjectRepository;
