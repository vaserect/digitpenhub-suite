const taskService = require('./TaskService');
const { createCacheHelper } = require('../../cache/cacheDecorators');
const cacheConfig = require('../../config/cache.config');

/**
 * TaskServiceCached - TaskService with caching layer
 * 
 * Wraps TaskService methods with intelligent caching:
 * - Shorter TTLs due to highly dynamic nature of tasks
 * - Invalidates both task and project caches on changes
 * - Handles task reordering and status updates
 */
class TaskServiceCached {
  constructor() {
    this.service = taskService;
    this.cacheConfig = cacheConfig.entities.task;
    this.logger = taskService.logger;
    this.repository = taskService.repository;
  }

  /**
   * Get cache helper for organization
   */
  getCacheHelper(orgId) {
    return createCacheHelper(this.cacheConfig.namespace, orgId);
  }

  /**
   * Get project cache helper for cascade invalidation
   */
  getProjectCacheHelper(orgId) {
    return createCacheHelper('project', orgId);
  }

  /**
   * Find task by ID with caching
   */
  async findById(id, orgId) {
    const cache = this.getCacheHelper(orgId);
    
    const cached = await cache.get('findById', id);
    if (cached !== null) {
      this.logger.debug('TaskService: Cache hit for findById', { id, orgId });
      return cached;
    }

    const task = await this.service.findById(id, orgId);
    
    if (task) {
      await cache.set('findById', task, this.cacheConfig.ttl.findById, id);
      this.logger.debug('TaskService: Cached findById result', { id, orgId });
    }

    return task;
  }

  /**
   * Find tasks by project with caching
   */
  async findByProject(projectId, orgId, options = {}) {
    const cache = this.getCacheHelper(orgId);
    const cacheKey = `${projectId}:${JSON.stringify(options)}`;
    
    const cached = await cache.get('findByProject', cacheKey);
    if (cached !== null) {
      this.logger.debug('TaskService: Cache hit for findByProject', { projectId, orgId });
      return cached;
    }

    const tasks = await this.service.findByProject(projectId, orgId, options);
    
    await cache.set('findByProject', tasks, this.cacheConfig.ttl.findByProject, cacheKey);
    this.logger.debug('TaskService: Cached findByProject result', { projectId, orgId, count: tasks.length });

    return tasks;
  }

  /**
   * Find all tasks with caching
   */
  async findAll(orgId, options = {}) {
    const cache = this.getCacheHelper(orgId);
    const cacheKey = JSON.stringify(options);
    
    const cached = await cache.get('findAll', cacheKey);
    if (cached !== null) {
      this.logger.debug('TaskService: Cache hit for findAll', { orgId });
      return cached;
    }

    const tasks = await this.service.findAll(orgId, options);
    
    await cache.set('findAll', tasks, this.cacheConfig.ttl.findAll, cacheKey);
    this.logger.debug('TaskService: Cached findAll result', { orgId, count: tasks.length });

    return tasks;
  }

  /**
   * Search tasks with caching
   */
  async search(query, orgId, options = {}) {
    const cache = this.getCacheHelper(orgId);
    const cacheKey = `${query}:${JSON.stringify(options)}`;
    
    const cached = await cache.get('search', cacheKey);
    if (cached !== null) {
      this.logger.debug('TaskService: Cache hit for search', { query, orgId });
      return cached;
    }

    const tasks = await this.service.search(query, orgId, options);
    
    await cache.set('search', tasks, this.cacheConfig.ttl.search, cacheKey);
    this.logger.debug('TaskService: Cached search result', { query, orgId, count: tasks.length });

    return tasks;
  }

  /**
   * Get task statistics with caching
   */
  async getStatistics(projectId, orgId) {
    const cache = this.getCacheHelper(orgId);
    
    const cached = await cache.get('stats', projectId);
    if (cached !== null) {
      this.logger.debug('TaskService: Cache hit for stats', { projectId, orgId });
      return cached;
    }

    const stats = await this.service.getStatistics(projectId, orgId);
    
    await cache.set('stats', stats, this.cacheConfig.ttl.stats, projectId);
    this.logger.debug('TaskService: Cached stats result', { projectId, orgId });

    return stats;
  }

  /**
   * Create task and invalidate cache
   */
  async create(data, orgId, userId) {
    const task = await this.service.create(data, orgId, userId);
    await this.invalidateCache(orgId, null, data.project_id);
    return task;
  }

  /**
   * Update task and invalidate cache
   */
  async update(id, data, orgId, userId) {
    // Get task to know which project to invalidate
    const existingTask = await this.service.findById(id, orgId);
    const task = await this.service.update(id, data, orgId, userId);
    
    const projectId = existingTask?.project_id || data.project_id;
    await this.invalidateCache(orgId, id, projectId);
    
    return task;
  }

  /**
   * Update task status and invalidate cache
   */
  async updateStatus(id, status, orgId, userId) {
    const existingTask = await this.service.findById(id, orgId);
    const task = await this.service.updateStatus(id, status, orgId, userId);
    
    await this.invalidateCache(orgId, id, existingTask?.project_id);
    
    return task;
  }

  /**
   * Reorder tasks and invalidate cache
   */
  async reorder(projectId, taskOrders, orgId, userId) {
    const result = await this.service.reorder(projectId, taskOrders, orgId, userId);
    await this.invalidateCache(orgId, null, projectId);
    return result;
  }

  /**
   * Delete task and invalidate cache
   */
  async delete(id, orgId, userId) {
    const existingTask = await this.service.findById(id, orgId);
    const result = await this.service.delete(id, orgId, userId);
    
    await this.invalidateCache(orgId, id, existingTask?.project_id);
    
    return result;
  }

  /**
   * Bulk create tasks and invalidate cache
   */
  async bulkCreate(tasksData, orgId, userId) {
    const result = await this.service.bulkCreate(tasksData, orgId, userId);
    
    // Get unique project IDs
    const projectIds = [...new Set(tasksData.map(t => t.project_id).filter(Boolean))];
    
    for (const projectId of projectIds) {
      await this.invalidateCache(orgId, null, projectId);
    }
    
    return result;
  }

  /**
   * Bulk update tasks and invalidate cache
   */
  async bulkUpdate(updates, orgId, userId) {
    const result = await this.service.bulkUpdate(updates, orgId, userId);
    await this.invalidateCache(orgId);
    return result;
  }

  /**
   * Bulk delete tasks and invalidate cache
   */
  async bulkDelete(ids, orgId, userId) {
    const result = await this.service.bulkDelete(ids, orgId, userId);
    await this.invalidateCache(orgId);
    return result;
  }

  /**
   * Invalidate cache for organization and optionally project
   */
  async invalidateCache(orgId, entityId = null, projectId = null) {
    const cache = this.getCacheHelper(orgId);
    
    if (entityId) {
      await cache.invalidateEntity(entityId);
    } else {
      await cache.invalidateLists();
    }
    
    // Invalidate project-specific caches
    if (projectId) {
      await cache.deletePattern(`findByProject:${projectId}:*`);
      await cache.delete('stats', projectId);
      
      // Cascade to project cache
      const projectCache = this.getProjectCacheHelper(orgId);
      await projectCache.delete('findByIdWithStats', projectId);
      await projectCache.deletePattern('findAllWithStats:*');
      await projectCache.delete('stats');
      
      this.logger.debug('TaskService: Cascaded cache invalidation to project', { projectId, orgId });
    }
    
    this.logger.debug('TaskService: Cache invalidated', { orgId, entityId, projectId });
  }
}

module.exports = new TaskServiceCached();
