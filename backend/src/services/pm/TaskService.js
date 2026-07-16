const BaseService = require('../base/BaseService');
const TaskRepository = require('../../repositories/TaskRepository');
const logger = require('../../utils/logger');

/**
 * TaskService - Business logic for tasks
 * Handles task management, validation, and status transitions
 */
class TaskService extends BaseService {
  constructor() {
    const repository = new TaskRepository();
    super(repository, {
      serviceName: 'TaskService',
      logger,
    });

    // Valid task statuses
    this.VALID_STATUSES = ['todo', 'in_progress', 'done'];
  }

  /**
   * Validate data before creating a task
   * @param {Object} data - Task data
   * @throws {Error} If validation fails
   */
  validateCreate(data) {
    if (!data.title || !data.title.trim()) {
      throw new Error('Task title is required');
    }

    if (data.title.trim().length < 3) {
      throw new Error('Task title must be at least 3 characters');
    }

    if (data.title.trim().length > 500) {
      throw new Error('Task title must not exceed 500 characters');
    }

    if (!data.project_id) {
      throw new Error('Project ID is required');
    }

    if (data.status && !this.VALID_STATUSES.includes(data.status)) {
      throw new Error(`Status must be one of: ${this.VALID_STATUSES.join(', ')}`);
    }

    if (data.sort_order !== undefined && data.sort_order < 0) {
      throw new Error('Sort order cannot be negative');
    }
  }

  /**
   * Validate data before updating a task
   * @param {Object} data - Task data
   * @throws {Error} If validation fails
   */
  validateUpdate(data) {
    if (data.title !== undefined) {
      if (!data.title || !data.title.trim()) {
        throw new Error('Task title is required');
      }

      if (data.title.trim().length < 3) {
        throw new Error('Task title must be at least 3 characters');
      }

      if (data.title.trim().length > 500) {
        throw new Error('Task title must not exceed 500 characters');
      }
    }

    if (data.status !== undefined && !this.VALID_STATUSES.includes(data.status)) {
      throw new Error(`Status must be one of: ${this.VALID_STATUSES.join(', ')}`);
    }

    if (data.sort_order !== undefined && data.sort_order < 0) {
      throw new Error('Sort order cannot be negative');
    }
  }

  /**
   * Transform data before creating a task
   * @param {Object} data - Raw task data
   * @returns {Object} Transformed data
   */
  transformForCreate(data) {
    return {
      project_id: data.project_id,
      title: data.title.trim(),
      status: data.status || 'todo',
      sort_order: data.sort_order !== undefined ? data.sort_order : null,
      created_by: data.created_by || null,
    };
  }

  /**
   * Transform data before updating a task
   * @param {Object} data - Raw task data
   * @returns {Object} Transformed data
   */
  transformForUpdate(data) {
    const transformed = {};

    if (data.title !== undefined) {
      transformed.title = data.title.trim();
    }

    if (data.status !== undefined) {
      transformed.status = data.status;
    }

    if (data.sort_order !== undefined) {
      transformed.sort_order = data.sort_order;
    }

    if (data.project_id !== undefined) {
      transformed.project_id = data.project_id;
    }

    return transformed;
  }

  /**
   * Enrich task entity with computed fields
   * @param {Object} entity - Task entity
   * @returns {Object} Enriched entity
   */
  enrichEntity(entity) {
    return {
      ...entity,
      is_todo: entity.status === 'todo',
      is_in_progress: entity.status === 'in_progress',
      is_done: entity.status === 'done',
      can_start: entity.status === 'todo',
      can_complete: entity.status === 'in_progress',
      can_reopen: entity.status === 'done',
    };
  }

  /**
   * Create a new task
   * @param {Object} data - Task data
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created task
   */
  async create(data, orgId, userId) {
    this.logger.info(`Creating task for org ${orgId}`);

    // Validate
    this.validateCreate(data);

    // Get next sort order if not provided
    let sortOrder = data.sort_order;
    if (sortOrder === undefined || sortOrder === null) {
      sortOrder = await this.repository.getNextSortOrder(data.project_id, orgId);
    }

    // Transform and create
    const taskData = this.transformForCreate({
      ...data,
      sort_order: sortOrder,
      created_by: userId,
    });

    try {
      const task = await this.repository.create(taskData, orgId);
      this.logger.info(`Task created`, { id: task.id });

      return this.enrichEntity(task);
    } catch (error) {
      this.logger.error('Error creating task:', error);
      throw new Error('Failed to create task');
    }
  }

  /**
   * Update a task
   * @param {string} id - Task ID
   * @param {Object} data - Update data
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Updated task
   */
  async update(id, data, orgId, userId) {
    this.logger.info(`Updating task ${id} for org ${orgId}`);

    // Validate
    this.validateUpdate(data);

    // Transform and update
    const taskData = this.transformForUpdate(data);

    try {
      const task = await this.repository.update(id, taskData, orgId);

      if (!task) {
        this.logger.warn(`Task not found for update`, { id });
        return null;
      }

      this.logger.info(`Task updated`, { id });

      return this.enrichEntity(task);
    } catch (error) {
      this.logger.error('Error updating task:', error);
      throw new Error('Failed to update task');
    }
  }

  /**
   * Get task with project info
   * @param {string} id - Task ID
   * @param {string} orgId - Organization ID
   * @returns {Promise<Object|null>} Task with project
   */
  async findByIdWithProject(id, orgId) {
    this.logger.info(`Getting task ${id} with project for org ${orgId}`);

    try {
      const task = await this.repository.findByIdWithProject(id, orgId);

      if (!task) {
        return null;
      }

      return this.enrichEntity(task);
    } catch (error) {
      this.logger.error('Error getting task with project:', error);
      throw new Error('Failed to get task');
    }
  }

  /**
   * Get all tasks for a project
   * @param {string} projectId - Project ID
   * @param {string} orgId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Tasks
   */
  async findByProject(projectId, orgId, options = {}) {
    this.logger.info(`Getting tasks for project ${projectId} in org ${orgId}`);

    try {
      const tasks = await this.repository.findByProject(projectId, orgId, options);
      return tasks.map((task) => this.enrichEntity(task));
    } catch (error) {
      this.logger.error('Error getting tasks by project:', error);
      throw new Error('Failed to get tasks');
    }
  }

  /**
   * Get task statistics by status
   * @param {string} projectId - Project ID
   * @param {string} orgId - Organization ID
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics(projectId, orgId) {
    this.logger.info(`Getting task statistics for project ${projectId}`);

    try {
      const stats = await this.repository.getStatsByStatus(projectId, orgId);

      const completionPercentage = stats.total > 0
        ? Math.round((stats.done / stats.total) * 100)
        : 0;

      return {
        ...stats,
        completion_percentage: completionPercentage,
        remaining: stats.todo + stats.in_progress,
      };
    } catch (error) {
      this.logger.error('Error getting task statistics:', error);
      throw new Error('Failed to get statistics');
    }
  }

  /**
   * Update task status
   * @param {string} id - Task ID
   * @param {string} status - New status
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Updated task
   */
  async updateStatus(id, status, orgId, userId) {
    this.logger.info(`Updating task ${id} status to ${status}`);

    if (!this.VALID_STATUSES.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    try {
      const task = await this.repository.updateStatus(id, status, orgId);

      if (!task) {
        this.logger.warn(`Task not found for status update`, { id });
        return null;
      }

      this.logger.info(`Task status updated`, { id, status });

      return this.enrichEntity(task);
    } catch (error) {
      this.logger.error('Error updating task status:', error);
      throw new Error('Failed to update task status');
    }
  }

  /**
   * Start a task (move to in_progress)
   * @param {string} id - Task ID
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Updated task
   */
  async start(id, orgId, userId) {
    return this.updateStatus(id, 'in_progress', orgId, userId);
  }

  /**
   * Complete a task (move to done)
   * @param {string} id - Task ID
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Updated task
   */
  async complete(id, orgId, userId) {
    return this.updateStatus(id, 'done', orgId, userId);
  }

  /**
   * Reopen a task (move to todo)
   * @param {string} id - Task ID
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Updated task
   */
  async reopen(id, orgId, userId) {
    return this.updateStatus(id, 'todo', orgId, userId);
  }

  /**
   * Reorder tasks within a project
   * @param {string} projectId - Project ID
   * @param {Array} taskOrders - Array of {id, sort_order}
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success
   */
  async reorder(projectId, taskOrders, orgId, userId) {
    this.logger.info(`Reordering ${taskOrders.length} tasks in project ${projectId}`);

    // Validate task orders
    if (!Array.isArray(taskOrders) || taskOrders.length === 0) {
      throw new Error('Task orders must be a non-empty array');
    }

    for (const order of taskOrders) {
      if (!order.id || order.sort_order === undefined) {
        throw new Error('Each task order must have id and sort_order');
      }
      if (order.sort_order < 0) {
        throw new Error('Sort order cannot be negative');
      }
    }

    try {
      const success = await this.repository.reorder(projectId, taskOrders, orgId);
      this.logger.info(`Tasks reordered`, { projectId, count: taskOrders.length });
      return success;
    } catch (error) {
      this.logger.error('Error reordering tasks:', error);
      throw new Error('Failed to reorder tasks');
    }
  }

  /**
   * Move task to different project
   * @param {string} id - Task ID
   * @param {string} newProjectId - New project ID
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Updated task
   */
  async moveToProject(id, newProjectId, orgId, userId) {
    this.logger.info(`Moving task ${id} to project ${newProjectId}`);

    if (!newProjectId) {
      throw new Error('New project ID is required');
    }

    try {
      const task = await this.repository.moveToProject(id, newProjectId, orgId);

      if (!task) {
        this.logger.warn(`Task not found for move`, { id });
        return null;
      }

      this.logger.info(`Task moved to project`, { id, newProjectId });

      return this.enrichEntity(task);
    } catch (error) {
      this.logger.error('Error moving task:', error);
      throw new Error('Failed to move task');
    }
  }

  /**
   * Get tasks created by user
   * @param {string} userId - User ID
   * @param {string} orgId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} User's tasks
   */
  async findByCreator(userId, orgId, options = {}) {
    this.logger.info(`Getting tasks for user ${userId} in org ${orgId}`);

    try {
      const tasks = await this.repository.findByCreator(userId, orgId, options);
      return tasks.map((task) => this.enrichEntity(task));
    } catch (error) {
      this.logger.error('Error getting tasks by creator:', error);
      throw new Error('Failed to get tasks');
    }
  }

  /**
   * Search tasks by title
   * @param {string} query - Search query
   * @param {string} orgId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Matching tasks
   */
  async search(query, orgId, options = {}) {
    this.logger.info(`Searching tasks for org ${orgId}`, { query });

    if (!query || !query.trim()) {
      return [];
    }

    try {
      const tasks = await this.repository.search(query.trim(), orgId, options);
      return tasks.map((task) => this.enrichEntity(task));
    } catch (error) {
      this.logger.error('Error searching tasks:', error);
      throw new Error('Failed to search tasks');
    }
  }

  /**
   * Bulk update task statuses
   * @param {Array} taskIds - Array of task IDs
   * @param {string} status - New status
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of updated tasks
   */
  async bulkUpdateStatus(taskIds, status, orgId, userId) {
    this.logger.info(`Bulk updating ${taskIds.length} tasks to status ${status}`);

    if (!this.VALID_STATUSES.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      throw new Error('Task IDs must be a non-empty array');
    }

    try {
      const count = await this.repository.bulkUpdateStatus(taskIds, status, orgId);
      this.logger.info(`Bulk status update complete`, { count, status });
      return count;
    } catch (error) {
      this.logger.error('Error bulk updating task statuses:', error);
      throw new Error('Failed to bulk update tasks');
    }
  }

  /**
   * Bulk create tasks
   * @param {Array} tasksData - Array of task data
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result with created and failed tasks
   */
  async bulkCreate(tasksData, orgId, userId) {
    this.logger.info(`Bulk creating ${tasksData.length} tasks for org ${orgId}`);

    const results = {
      created: [],
      failed: [],
    };

    for (const data of tasksData) {
      try {
        const task = await this.create(data, orgId, userId);
        results.created.push(task);
      } catch (error) {
        results.failed.push({
          data,
          error: error.message,
        });
      }
    }

    this.logger.info(`Bulk create complete`, {
      created: results.created.length,
      failed: results.failed.length,
    });

    return results;
  }

  /**
   * Delete all tasks in a project
   * @param {string} projectId - Project ID
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of deleted tasks
   */
  async deleteByProject(projectId, orgId, userId) {
    this.logger.info(`Deleting all tasks in project ${projectId}`);

    try {
      const count = await this.repository.deleteByProject(projectId, orgId);
      this.logger.info(`Tasks deleted`, { projectId, count });
      return count;
    } catch (error) {
      this.logger.error('Error deleting tasks by project:', error);
      throw new Error('Failed to delete tasks');
    }
  }
}

// Export singleton instance
module.exports = new TaskService();
