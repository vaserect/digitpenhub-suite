const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * RouteLoader - Dynamic route registration system
 * 
 * Loads routes from configuration files and registers them with Express app.
 * Supports middleware composition, module access control, and route organization.
 * 
 * @example
 * const loader = new RouteLoader(app);
 * loader.loadRoutes(routeConfigs);
 */
class RouteLoader {
  constructor(app) {
    this.app = app;
    this.routes = [];
    this.stats = {
      total: 0,
      public: 0,
      protected: 0,
      moduleProtected: 0,
    };
  }

  /**
   * Load routes from configuration array
   * @param {Array} routeConfigs - Array of route configuration objects
   */
  loadRoutes(routeConfigs) {
    const startTime = Date.now();
    
    routeConfigs.forEach(config => {
      try {
        this.registerRoute(config);
      } catch (error) {
        logger.error('Failed to register route', {
          path: config.path,
          error: error.message,
          stack: error.stack,
        });
        throw error;
      }
    });
    
    const duration = Date.now() - startTime;
    logger.info('Route loading complete', {
      total: this.stats.total,
      public: this.stats.public,
      protected: this.stats.protected,
      moduleProtected: this.stats.moduleProtected,
      duration: `${duration}ms`,
    });
  }

  /**
   * Register a single route configuration
   * @param {Object} config - Route configuration
   * @param {string} config.path - Route path (e.g., '/api/v1/crm')
   * @param {Router} config.router - Express router instance
   * @param {Array} config.middleware - Array of middleware functions
   * @param {string} config.description - Route description
   * @param {boolean} config.public - Whether route is public (no auth required)
   * @param {string} config.moduleSlug - Module slug for access control
   */
  registerRoute(config) {
    const {
      path: routePath,
      router,
      middleware = [],
      description = '',
      public: isPublic = false,
      moduleSlug = null,
    } = config;

    // Validate configuration
    this.validateConfig(config);

    // Build middleware chain
    const middlewareChain = this.buildMiddlewareChain(middleware, isPublic, moduleSlug);
    
    // Register route with Express
    this.app.use(routePath, ...middlewareChain, router);
    
    // Track route registration
    this.routes.push({
      path: routePath,
      middleware: middleware.map(m => m.name || 'anonymous'),
      public: isPublic,
      moduleSlug,
      description,
    });

    // Update statistics
    this.stats.total++;
    if (isPublic) {
      this.stats.public++;
    } else {
      this.stats.protected++;
      if (moduleSlug) {
        this.stats.moduleProtected++;
      }
    }

    logger.debug('Route registered', {
      path: routePath,
      public: isPublic,
      moduleSlug,
      middlewareCount: middlewareChain.length,
    });
  }

  /**
   * Validate route configuration
   * @param {Object} config - Route configuration
   * @throws {Error} If configuration is invalid
   */
  validateConfig(config) {
    if (!config.path) {
      throw new Error('Route configuration must include "path"');
    }
    if (!config.router) {
      throw new Error(`Route configuration for "${config.path}" must include "router"`);
    }
    if (typeof config.path !== 'string') {
      throw new Error(`Route path must be a string, got ${typeof config.path}`);
    }
    if (typeof config.router !== 'function') {
      throw new Error(`Router must be a function, got ${typeof config.router}`);
    }
    if (config.middleware && !Array.isArray(config.middleware)) {
      throw new Error(`Middleware must be an array, got ${typeof config.middleware}`);
    }
  }

  /**
   * Build middleware chain based on configuration
   * @param {Array} customMiddleware - Custom middleware from config
   * @param {boolean} isPublic - Whether route is public
   * @param {string} moduleSlug - Module slug for access control
   * @returns {Array} Middleware chain
   */
  buildMiddlewareChain(customMiddleware, isPublic, moduleSlug) {
    const chain = [];
    
    // Add authentication middleware for protected routes
    if (!isPublic) {
      const { requireAuth } = require('../middleware/auth');
      chain.push(requireAuth);
    }
    
    // Add module access control if specified
    if (moduleSlug) {
      const { requireModuleAccess } = require('../utils/planAccess');
      chain.push(requireModuleAccess(moduleSlug));
    }
    
    // Add custom middleware
    chain.push(...customMiddleware);
    
    return chain;
  }

  /**
   * Get registered routes information
   * @returns {Array} Array of route information objects
   */
  getRoutes() {
    return this.routes;
  }

  /**
   * Get route loading statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return this.stats;
  }

  /**
   * Get routes grouped by type
   * @returns {Object} Routes grouped by public/protected/module-protected
   */
  getRoutesByType() {
    return {
      public: this.routes.filter(r => r.public),
      protected: this.routes.filter(r => !r.public && !r.moduleSlug),
      moduleProtected: this.routes.filter(r => !r.public && r.moduleSlug),
    };
  }

  /**
   * Find route by path
   * @param {string} path - Route path to find
   * @returns {Object|null} Route configuration or null if not found
   */
  findRoute(path) {
    return this.routes.find(r => r.path === path) || null;
  }

  /**
   * Check if a path is registered
   * @param {string} path - Route path to check
   * @returns {boolean} True if path is registered
   */
  hasRoute(path) {
    return this.routes.some(r => r.path === path);
  }
}

module.exports = RouteLoader;
