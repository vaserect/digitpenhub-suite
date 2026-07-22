const BaseRepository = require('./base/BaseRepository');
const db = require('../db');

/**
 * TaskRepository - Data access layer for tasks
 * Handles all database operations for task records
 */
class TaskRepository extends BaseRepository {
  constructor() {
    super(db, 'tasks', {
      primaryKey: 'id',
      timestamps: true,
      allowedColumns: ['id','org_id','project_id','title','description','status','priority','sort_order','assigned_to','due_date','created_at','updated_at','created_by','updated_by','deleted_at','deleted_by','tags','custom_fields','estimated_hours','actual_hours','start_date','completed_at','parent_id','is_recurring','recurrence_rule'],
      allowedSortColumns: ['id','title','status','priority','sort_order','due_date','created_at','updated_at','completed_at','assigned_to'],
    });
  }

  /**
   * Valid task statuses
   */
  static VALID_STATUSES = ['todo', 'in_progress', 'done'];

  /**
   * Find all tasks for a project
   * @param {string} projectId - Project ID
   * @param {string} orgId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Tasks
   */
  async findByProject(projectId, orgId, options = {}) {
    const status = options.status;
    const orderBy = options.orderBy || 'sort_order ASC, created_at ASC';

    let whereClause = 'org_id = $1 AND project_id = $2';
    const params = [orgId, projectId];
    let paramIndex = 3;

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const { rows } = await this.db.query(
      `SELECT t.*, u.email as creator_email
       FROM ${this.tableName} t
       LEFT JOIN users u ON u.id = t.created_by
       WHERE ${whereClause}
       ORDER BY ${orderBy}`,
      params
    );

    return rows;
  }

  /**
   * Find task with project info
   * @param {string} taskId - Task ID
   * @param {string} orgId - Organization ID
   * @returns {Promise<Object|null>} Task with project
   */
  async findByIdWithProject(taskId, orgId) {
    const { rows } = await this.db.query(
      `SELECT t.*, 
              p.name as project_name,
              u.email as creator_email
       FROM ${this.tableName} t
       LEFT JOIN projects p ON p.id = t.project_id
       LEFT JOIN users u ON u.id = t.created_by
       WHERE t.id = $1 AND t.org_id = $2`,
      [taskId, orgId]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get task statistics by status
   * @param {string} projectId - Project ID
   * @param {string} orgId - Organization ID
   * @returns {Promise<Object>} Statistics
   */
  async getStatsByStatus(projectId, orgId) {
    const { rows } = await this.db.query(
      `SELECT 
        status,
        COUNT(*) as count
       FROM ${this.tableName}
       WHERE org_id = $1 AND project_id = $2
       GROUP BY status`,
      [orgId, projectId]
    );

    const stats = {
      todo: 0,
      in_progress: 0,
      done: 0,
      total: 0,
    };

    rows.forEach((row) => {
      stats[row.status] = parseInt(row.count, 10);
      stats.total += parseInt(row.count, 10);
    });

    return stats;
  }

  /**
   * Update task status
   * @param {string} taskId - Task ID
   * @param {string} status - New status
   * @param {string} orgId - Organization ID
   * @returns {Promise<Object|null>} Updated task
   */
  async updateStatus(taskId, status, orgId) {
    const { rows } = await this.db.query(
      `UPDATE ${this.tableName}
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND org_id = $3
       RETURNING *`,
      [status, taskId, orgId]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Reorder tasks within a project
   * @param {string} projectId - Project ID
   * @param {Array} taskOrders - Array of {id, sort_order}
   * @param {string} orgId - Organization ID
   * @returns {Promise<boolean>} Success
   */
  async reorder(projectId, taskOrders, orgId) {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      for (const { id, sort_order } of taskOrders) {
        await client.query(
          `UPDATE ${this.tableName}
           SET sort_order = $1, updated_at = NOW()
           WHERE id = $2 AND org_id = $3 AND project_id = $4`,
          [sort_order, id, orgId, projectId]
        );
      }

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Move task to different project
   * @param {string} taskId - Task ID
   * @param {string} newProjectId - New project ID
   * @param {string} orgId - Organization ID
   * @returns {Promise<Object|null>} Updated task
   */
  async moveToProject(taskId, newProjectId, orgId) {
    // Get max sort_order in target project
    const { rows: maxRows } = await this.db.query(
      `SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order
       FROM ${this.tableName}
       WHERE project_id = $1 AND org_id = $2`,
      [newProjectId, orgId]
    );

    const nextOrder = maxRows[0].next_order;

    // Update task
    const { rows } = await this.db.query(
      `UPDATE ${this.tableName}
       SET project_id = $1, sort_order = $2, updated_at = NOW()
       WHERE id = $3 AND org_id = $4
       RETURNING *`,
      [newProjectId, nextOrder, taskId, orgId]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get tasks created by user
   * @param {string} userId - User ID
   * @param {string} orgId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} User's tasks
   */
  async findByCreator(userId, orgId, options = {}) {
    const limit = options.limit || 100;
    const offset = options.offset || 0;
    const status = options.status;

    let whereClause = 'org_id = $1 AND created_by = $2';
    const params = [orgId, userId];
    let paramIndex = 3;

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const { rows } = await this.db.query(
      `SELECT t.*, p.name as project_name
       FROM ${this.tableName} t
       LEFT JOIN projects p ON p.id = t.project_id
       WHERE ${whereClause}
       ORDER BY t.updated_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return rows;
  }

  /**
   * Search tasks by title
   * @param {string} query - Search query
   * @param {string} orgId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Matching tasks
   */
  async search(query, orgId, options = {}) {
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    const projectId = options.projectId;

    let whereClause = 'org_id = $1 AND title ILIKE $2';
    const params = [orgId, `%${query}%`];
    let paramIndex = 3;

    if (projectId) {
      whereClause += ` AND project_id = $${paramIndex}`;
      params.push(projectId);
      paramIndex++;
    }

    const { rows } = await this.db.query(
      `SELECT t.*, p.name as project_name
       FROM ${this.tableName} t
       LEFT JOIN projects p ON p.id = t.project_id
       WHERE ${whereClause}
       ORDER BY t.updated_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return rows;
  }

  /**
   * Get next sort order for project
   * @param {string} projectId - Project ID
   * @param {string} orgId - Organization ID
   * @returns {Promise<number>} Next sort order
   */
  async getNextSortOrder(projectId, orgId) {
    const { rows } = await this.db.query(
      `SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order
       FROM ${this.tableName}
       WHERE project_id = $1 AND org_id = $2`,
      [projectId, orgId]
    );

    return rows[0].next_order;
  }

  /**
   * Bulk update task statuses
   * @param {Array} taskIds - Array of task IDs
   * @param {string} status - New status
   * @param {string} orgId - Organization ID
   * @returns {Promise<number>} Number of updated tasks
   */
  async bulkUpdateStatus(taskIds, status, orgId) {
    if (!taskIds || taskIds.length === 0) {
      return 0;
    }

    const placeholders = taskIds.map((_, i) => `$${i + 2}`).join(',');

    const { rowCount } = await this.db.query(
      `UPDATE ${this.tableName}
       SET status = $1, updated_at = NOW()
       WHERE org_id = $${taskIds.length + 2}
         AND id IN (${placeholders})`,
      [status, ...taskIds, orgId]
    );

    return rowCount;
  }

  /**
   * Delete all tasks in a project
   * @param {string} projectId - Project ID
   * @param {string} orgId - Organization ID
   * @returns {Promise<number>} Number of deleted tasks
   */
  async deleteByProject(projectId, orgId) {
    const { rowCount } = await this.db.query(
      `DELETE FROM ${this.tableName}
       WHERE project_id = $1 AND org_id = $2`,
      [projectId, orgId]
    );

    return rowCount;
  }
}

module.exports = TaskRepository;
