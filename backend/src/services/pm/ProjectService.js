const BaseService = require('../base/BaseService');
const ProjectRepository = require('../../repositories/ProjectRepository');
const logger = require('../../utils/logger');

/**
 * ProjectService - Business logic for projects
 * Handles project management, validation, and statistics
 */
class ProjectService extends BaseService {
  constructor() {
    const repository = new ProjectRepository();
    super(repository, {
      serviceName: 'ProjectService',
      logger,
    });
  }

  /**
   * Validate data before creating a project
   * @param {Object} data - Project data
   * @throws {Error} If validation fails
   */
  validateCreate(data) {
    if (!data.name || !data.name.trim()) {
      throw new Error('Project name is required');
    }

    if (data.name.trim().length < 3) {
      throw new Error('Project name must be at least 3 characters');
    }

    if (data.name.trim().length > 200) {
      throw new Error('Project name must not exceed 200 characters');
    }
  }

  /**
   * Validate data before updating a project
   * @param {Object} data - Project data
   * @throws {Error} If validation fails
   */
  validateUpdate(data) {
    if (data.name !== undefined) {
      if (!data.name || !data.name.trim()) {
        throw new Error('Project name is required');
      }

      if (data.name.trim().length < 3) {
        throw new Error('Project name must be at least 3 characters');
      }

      if (data.name.trim().length > 200) {
        throw new Error('Project name must not exceed 200 characters');
      }
    }
  }

  /**
   * Transform data before creating a project
   * @param {Object} data - Raw project data
   * @returns {Object} Transformed data
   */
  transformForCreate(data) {
    return {
      name: data.name.trim(),
      created_by: data.created_by || null,
    };
  }

  /**
   * Transform data before updating a project
   * @param {Object} data - Raw project data
   * @returns {Object} Transformed data
   */
  transformForUpdate(data) {
    const transformed = {};

    if (data.name !== undefined) {
      transformed.name = data.name.trim();
    }

    return transformed;
  }

  /**
   * Enrich project entity with computed fields
   * @param {Object} entity - Project entity
   * @returns {Object} Enriched entity
   */
  enrichEntity(entity) {
    const totalTasks = parseInt(entity.total_tasks || 0, 10);
    const doneCount = parseInt(entity.done_count || 0, 10);
    const todoCount = parseInt(entity.todo_count || 0, 10);
    const inProgressCount = parseInt(entity.in_progress_count || 0, 10);

    const completionPercentage = totalTasks > 0
      ? Math.round((doneCount / totalTasks) * 100)
      : 0;

    return {
      ...entity,
      total_tasks: totalTasks,
      todo_count: todoCount,
      in_progress_count: inProgressCount,
      done_count: doneCount,
      completion_percentage: completionPercentage,
      is_complete: totalTasks > 0 && doneCount === totalTasks,
      has_tasks: totalTasks > 0,
    };
  }

  /**
   * Create a new project
   * @param {Object} data - Project data
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created project
   */
  async create(data, orgId, userId) {
    this.logger.info(`Creating project for org ${orgId}`);

    // Validate
    this.validateCreate(data);

    // Check for duplicate name
    const exists = await this.repository.existsByName(data.name, orgId);
    if (exists) {
      throw new Error('A project with this name already exists');
    }

    // Transform and create
    const projectData = this.transformForCreate({
      ...data,
      created_by: userId,
    });

    try {
      const project = await this.repository.create(projectData, orgId);
      this.logger.info(`Project created`, { id: project.id });

      return this.enrichEntity({
        ...project,
        total_tasks: 0,
        todo_count: 0,
        in_progress_count: 0,
        done_count: 0,
      });
    } catch (error) {
      this.logger.error('Error creating project:', error);
      throw new Error('Failed to create project');
    }
  }

  /**
   * Update a project
   * @param {string} id - Project ID
   * @param {Object} data - Update data
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Updated project
   */
  async update(id, data, orgId, userId) {
    this.logger.info(`Updating project ${id} for org ${orgId}`);

    // Validate
    this.validateUpdate(data);

    // Check for duplicate name if changing
    if (data.name) {
      const exists = await this.repository.existsByName(data.name, orgId, id);
      if (exists) {
        throw new Error('A project with this name already exists');
      }
    }

    // Transform and update
    const projectData = this.transformForUpdate(data);

    try {
      const project = await this.repository.update(id, projectData, orgId);

      if (!project) {
        this.logger.warn(`Project not found for update`, { id });
        return null;
      }

      this.logger.info(`Project updated`, { id });

      // Get with stats
      return this.findByIdWithStats(id, orgId);
    } catch (error) {
      this.logger.error('Error updating project:', error);
      throw new Error('Failed to update project');
    }
  }

  /**
   * Get project with task statistics
   * @param {string} id - Project ID
   * @param {string} orgId - Organization ID
   * @returns {Promise<Object|null>} Project with stats
   */
  async findByIdWithStats(id, orgId) {
    this.logger.info(`Getting project ${id} with stats for org ${orgId}`);

    try {
      const project = await this.repository.findByIdWithStats(id, orgId);

      if (!project) {
        return null;
      }

      return this.enrichEntity(project);
    } catch (error) {
      this.logger.error('Error getting project with stats:', error);
      throw new Error('Failed to get project');
    }
  }

  /**
   * Get all projects with statistics
   * @param {string} orgId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Projects with stats
   */
  async findAllWithStats(orgId, options = {}) {
    this.logger.info(`Getting projects with stats for org ${orgId}`);

    try {
      const projects = await this.repository.findAllWithStats(orgId, options);
      return projects.map((project) => this.enrichEntity(project));
    } catch (error) {
      this.logger.error('Error getting projects with stats:', error);
      throw new Error('Failed to get projects');
    }
  }

  /**
   * Get project statistics
   * @param {string} orgId - Organization ID
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics(orgId) {
    this.logger.info(`Getting project statistics for org ${orgId}`);

    try {
      const stats = await this.repository.getStatistics(orgId);

      return {
        total_projects: parseInt(stats.total_projects, 10),
        total_tasks: parseInt(stats.total_tasks, 10),
        todo_tasks: parseInt(stats.todo_tasks, 10),
        in_progress_tasks: parseInt(stats.in_progress_tasks, 10),
        done_tasks: parseInt(stats.done_tasks, 10),
        completion_percentage: parseFloat(stats.completion_percentage),
        average_tasks_per_project: stats.total_projects > 0
          ? Math.round(stats.total_tasks / stats.total_projects)
          : 0,
      };
    } catch (error) {
      this.logger.error('Error getting project statistics:', error);
      throw new Error('Failed to get statistics');
    }
  }

  /**
   * Search projects by name
   * @param {string} query - Search query
   * @param {string} orgId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Matching projects
   */
  async search(query, orgId, options = {}) {
    this.logger.info(`Searching projects for org ${orgId}`, { query });

    if (!query || !query.trim()) {
      return [];
    }

    try {
      const projects = await this.repository.search(query.trim(), orgId, options);
      return projects.map((project) => this.enrichEntity(project));
    } catch (error) {
      this.logger.error('Error searching projects:', error);
      throw new Error('Failed to search projects');
    }
  }

  /**
   * Get projects created by user
   * @param {string} userId - User ID
   * @param {string} orgId - Organization ID
   * @returns {Promise<Array>} User's projects
   */
  async findByCreator(userId, orgId) {
    this.logger.info(`Getting projects for user ${userId} in org ${orgId}`);

    try {
      const projects = await this.repository.findByCreator(userId, orgId);
      return projects.map((project) => this.enrichEntity(project));
    } catch (error) {
      this.logger.error('Error getting projects by creator:', error);
      throw new Error('Failed to get projects');
    }
  }

  /**
   * Get recently updated projects
   * @param {string} orgId - Organization ID
   * @param {number} limit - Number of projects
   * @returns {Promise<Array>} Recent projects
   */
  async findRecent(orgId, limit = 10) {
    this.logger.info(`Getting recent projects for org ${orgId}`);

    try {
      const projects = await this.repository.findRecent(orgId, limit);
      return projects.map((project) => this.enrichEntity(project));
    } catch (error) {
      this.logger.error('Error getting recent projects:', error);
      throw new Error('Failed to get recent projects');
    }
  }

  /**
   * Delete project and all associated tasks
   * @param {string} id - Project ID
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(id, orgId, userId) {
    this.logger.info(`Deleting project ${id} for org ${orgId}`);

    try {
      const deleted = await this.repository.deleteWithTasks(id, orgId);

      if (deleted) {
        this.logger.info(`Project deleted with all tasks`, { id });
      } else {
        this.logger.warn(`Project not found for deletion`, { id });
      }

      return deleted;
    } catch (error) {
      this.logger.error('Error deleting project:', error);
      throw new Error('Failed to delete project');
    }
  }

  /**
   * Bulk create projects
   * @param {Array} projectsData - Array of project data
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result with created and failed projects
   */
  async bulkCreate(projectsData, orgId, userId) {
    this.logger.info(`Bulk creating ${projectsData.length} projects for org ${orgId}`);

    const results = {
      created: [],
      failed: [],
    };

    for (const data of projectsData) {
      try {
        const project = await this.create(data, orgId, userId);
        results.created.push(project);
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
}

// Export singleton instance
module.exports = new ProjectService();
