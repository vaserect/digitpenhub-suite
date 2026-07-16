/**
 * Dynamic Route Loader
 * Automatically loads and registers routes based on configuration
 */

const path = require('path');
const logger = require('../../utils/logger');
const { ROUTES_CONFIG } = require('../config/routes.config');
const { requireAuth } = require('../../middleware/auth');
const { getOrgPlan, FREE_TIER_MODULE_SLUGS } = require('../../utils/planAccess');

/**
 * Custom middleware for AI documents (shared across multiple modules)
 */
const requireAiDocuments = async (req, res, next) => {
  try {
    const plan = await getOrgPlan(req.user.orgId);
    if (plan.all_modules) return next();
    
    const hasFreeAccess = ['ai-writer', 'ai-email-assistant', 'ai-proposal-generator', 'ai-blog-generator']
      .some((s) => FREE_TIER_MODULE_SLUGS.has(s));
    
    if (hasFreeAccess) return next();
    
    return res.status(403).json({
      error: 'This feature requires a paid plan. Upgrade to unlock AI Writer tools.',
      upgradeRequired: true,
      moduleSlug: 'ai-documents',
      currentPlan: plan.slug,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Load a route module from file
 * @param {string} fileName - Route file name
 * @returns {Object} Route module
 */
function loadRouteModule(fileName) {
  try {
    const routePath = path.join(__dirname, '..', fileName);
    const routeModule = require(routePath);
    
    // Handle different export patterns
    if (routeModule.router) {
      return routeModule.router;
    }
    if (routeModule.ADDON_ROUTER || routeModule.HEALTH_ROUTER || routeModule.WORKSPACE_ROUTER) {
      return routeModule;
    }
    
    return routeModule;
  } catch (error) {
    logger.error(`Failed to load route module: ${fileName}`, { error: error.message });
    throw new Error(`Route module not found: ${fileName}`);
  }
}

/**
 * Register a single route with its middleware
 * @param {Object} app - Express app
 * @param {Object} routeConfig - Route configuration
 */
function registerRoute(app, routeConfig) {
  const { path: routePath, file, middleware = [], description } = routeConfig;
  
  try {
    // Load the route module
    const routeModule = loadRouteModule(file);
    
    // Handle special cases for super admin routes
    if (file === 'superAdmin') {
      if (routePath === '/api/v1/admin/addons' && routeModule.ADDON_ROUTER) {
        app.use(routePath, routeModule.ADDON_ROUTER);
        logger.info(`✓ Registered route: ${routePath} (Super Admin - Addons)`);
        return;
      }
      if (routePath === '/api/v1/admin/health' && routeModule.HEALTH_ROUTER) {
        app.use(routePath, routeModule.HEALTH_ROUTER);
        logger.info(`✓ Registered route: ${routePath} (Super Admin - Health)`);
        return;
      }
      if (routePath === '/api/v1/marketplace' && routeModule.WORKSPACE_ROUTER) {
        app.use(routePath, routeModule.WORKSPACE_ROUTER);
        logger.info(`✓ Registered route: ${routePath} (Super Admin - Workspace)`);
        return;
      }
    }
    
    // Handle inbox special case (has .router property)
    const router = routeModule.router || routeModule;
    
    // Register route with middleware
    if (middleware.length > 0) {
      app.use(routePath, ...middleware, router);
    } else {
      app.use(routePath, router);
    }
    
    const middlewareInfo = middleware.length > 0 
      ? ` [${middleware.length} middleware]` 
      : ' [public]';
    
    logger.info(`✓ Registered route: ${routePath}${middlewareInfo} - ${description || file}`);
  } catch (error) {
    logger.error(`✗ Failed to register route: ${routePath}`, {
      file,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Load all routes from configuration
 * @param {Object} app - Express app
 * @returns {Object} Statistics about loaded routes
 */
function loadRoutes(app) {
  const startTime = Date.now();
  const stats = {
    total: 0,
    public: 0,
    authenticated: 0,
    moduleProtected: 0,
    failed: 0,
  };
  
  logger.info('Starting dynamic route loading...');
  
  // Special case: AI documents route (uses custom middleware)
  try {
    const aiDocumentsRoute = require('../aiDocuments');
    app.use('/api/v1/ai-documents', requireAuth, requireAiDocuments, aiDocumentsRoute);
    logger.info('✓ Registered route: /api/v1/ai-documents [custom middleware] - AI documents');
    stats.total++;
    stats.moduleProtected++;
  } catch (error) {
    logger.error('✗ Failed to register AI documents route', { error: error.message });
    stats.failed++;
  }
  
  // Load all configured routes
  for (const routeConfig of ROUTES_CONFIG) {
    try {
      registerRoute(app, routeConfig);
      stats.total++;
      
      // Track route types
      if (routeConfig.public) {
        stats.public++;
      } else if (routeConfig.moduleSlug) {
        stats.moduleProtected++;
      } else {
        stats.authenticated++;
      }
    } catch (error) {
      stats.failed++;
      // Continue loading other routes even if one fails
      logger.warn(`Skipping failed route: ${routeConfig.path}`);
    }
  }
  
  const duration = Date.now() - startTime;
  
  logger.info('Route loading complete', {
    duration: `${duration}ms`,
    total: stats.total,
    public: stats.public,
    authenticated: stats.authenticated,
    moduleProtected: stats.moduleProtected,
    failed: stats.failed,
  });
  
  return stats;
}

/**
 * Get route statistics
 * @returns {Object} Route statistics
 */
function getRouteStats() {
  return {
    totalConfigured: ROUTES_CONFIG.length + 1, // +1 for AI documents
    publicRoutes: ROUTES_CONFIG.filter(r => r.public).length,
    authenticatedRoutes: ROUTES_CONFIG.filter(r => !r.public && !r.moduleSlug).length,
    moduleProtectedRoutes: ROUTES_CONFIG.filter(r => r.moduleSlug).length + 1, // +1 for AI documents
  };
}

/**
 * Validate route configuration
 * @returns {Array} Validation errors
 */
function validateRouteConfig() {
  const errors = [];
  const pathFileMap = new Map(); // Track path+file combinations
  
  for (const route of ROUTES_CONFIG) {
    // Check required fields
    if (!route.path) {
      errors.push(`Route missing path: ${JSON.stringify(route)}`);
    }
    if (!route.file) {
      errors.push(`Route missing file: ${route.path}`);
    }
    
    // Allow duplicate paths with different files (e.g., base + upgrade routes)
    // Only flag if same path+file combination appears twice
    const pathFileKey = `${route.path}:${route.file}`;
    if (pathFileMap.has(pathFileKey)) {
      errors.push(`Duplicate route registration: ${route.path} with file ${route.file}`);
    }
    pathFileMap.set(pathFileKey, route);
    
    // Validate middleware array
    if (route.middleware && !Array.isArray(route.middleware)) {
      errors.push(`Invalid middleware for route ${route.path}: must be array`);
    }
  }
  
  return errors;
}

module.exports = {
  loadRoutes,
  getRouteStats,
  validateRouteConfig,
  registerRoute,
  loadRouteModule,
};
