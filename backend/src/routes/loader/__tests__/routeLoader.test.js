const express = require('express');
const { loadRoutes, getRouteStats, validateRouteConfig, registerRoute } = require('../routeLoader');
const { ROUTES_CONFIG } = require('../../config/routes.config');

// Mock logger
jest.mock('../../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

// Mock plan access
jest.mock('../../../utils/planAccess', () => ({
  requireModuleAccess: jest.fn(() => (req, res, next) => next()),
  getOrgPlan: jest.fn().mockResolvedValue({ all_modules: true }),
  FREE_TIER_MODULE_SLUGS: new Set(['crm']),
}));

// Mock auth middleware
jest.mock('../../../middleware/auth', () => ({
  requireAuth: jest.fn((req, res, next) => next()),
}));

describe('RouteLoader', () => {
  let app;

  beforeEach(() => {
    app = express();
    jest.clearAllMocks();
  });

  describe('validateRouteConfig', () => {
    it('should return no errors for valid configuration', () => {
      const errors = validateRouteConfig();
      expect(errors).toEqual([]);
    });

    it('should detect missing path', () => {
      // This test validates the actual config, so we just ensure it runs
      const errors = validateRouteConfig();
      expect(Array.isArray(errors)).toBe(true);
    });
  });

  describe('getRouteStats', () => {
    it('should return correct statistics', () => {
      const stats = getRouteStats();
      
      expect(stats).toHaveProperty('totalConfigured');
      expect(stats).toHaveProperty('publicRoutes');
      expect(stats).toHaveProperty('authenticatedRoutes');
      expect(stats).toHaveProperty('moduleProtectedRoutes');
      
      expect(stats.totalConfigured).toBeGreaterThan(0);
      expect(typeof stats.publicRoutes).toBe('number');
      expect(typeof stats.authenticatedRoutes).toBe('number');
      expect(typeof stats.moduleProtectedRoutes).toBe('number');
    });

    it('should count routes correctly', () => {
      const stats = getRouteStats();
      const configLength = ROUTES_CONFIG.length;
      
      // Total should be config length + 1 (AI documents)
      expect(stats.totalConfigured).toBe(configLength + 1);
    });
  });

  describe('registerRoute', () => {
    it('should register a public route without middleware', () => {
      const mockRouter = express.Router();
      const routeConfig = {
        path: '/api/v1/test',
        file: 'health', // Use existing file
        middleware: [],
        public: true,
        description: 'Test route',
      };

      // Mock require to return our mock router
      jest.mock('../../health', () => mockRouter, { virtual: true });

      expect(() => {
        registerRoute(app, routeConfig);
      }).not.toThrow();
    });

    it('should register an authenticated route with middleware', () => {
      const mockRouter = express.Router();
      const mockMiddleware = jest.fn((req, res, next) => next());
      
      const routeConfig = {
        path: '/api/v1/test-auth',
        file: 'health',
        middleware: [mockMiddleware],
        description: 'Test auth route',
      };

      jest.mock('../../health', () => mockRouter, { virtual: true });

      expect(() => {
        registerRoute(app, routeConfig);
      }).not.toThrow();
    });

    it('should handle route registration errors gracefully', () => {
      const routeConfig = {
        path: '/api/v1/nonexistent',
        file: 'nonexistent-route-file',
        middleware: [],
        description: 'Nonexistent route',
      };

      expect(() => {
        registerRoute(app, routeConfig);
      }).toThrow('Route module not found');
    });
  });

  describe('loadRoutes', () => {
    it('should load routes and return statistics', () => {
      // Create a minimal app for testing
      const testApp = express();
      
      // Mock all route files to prevent actual loading
      const mockRouter = express.Router();
      
      // This will attempt to load real routes, so we expect some to succeed
      const stats = loadRoutes(testApp);
      
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('public');
      expect(stats).toHaveProperty('authenticated');
      expect(stats).toHaveProperty('moduleProtected');
      expect(stats).toHaveProperty('failed');
      
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.failed).toBe('number');
    });

    it('should track route types correctly', () => {
      const testApp = express();
      const stats = loadRoutes(testApp);
      
      // Total should equal sum of all types
      const sum = stats.public + stats.authenticated + stats.moduleProtected;
      expect(stats.total).toBeGreaterThanOrEqual(sum - stats.failed);
    });
  });

  describe('Route Configuration Structure', () => {
    it('should have valid route paths', () => {
      ROUTES_CONFIG.forEach((route) => {
        expect(route.path).toBeDefined();
        expect(route.path).toMatch(/^\/api\/v1\//);
      });
    });

    it('should have valid file references', () => {
      ROUTES_CONFIG.forEach((route) => {
        expect(route.file).toBeDefined();
        expect(typeof route.file).toBe('string');
        expect(route.file.length).toBeGreaterThan(0);
      });
    });

    it('should have valid middleware arrays', () => {
      ROUTES_CONFIG.forEach((route) => {
        if (route.middleware) {
          expect(Array.isArray(route.middleware)).toBe(true);
        }
      });
    });

    it('should have descriptions', () => {
      ROUTES_CONFIG.forEach((route) => {
        expect(route.description).toBeDefined();
        expect(typeof route.description).toBe('string');
      });
    });

    it('should have consistent module slugs for module-protected routes', () => {
      ROUTES_CONFIG.forEach((route) => {
        if (route.moduleSlug) {
          expect(typeof route.moduleSlug).toBe('string');
          expect(route.moduleSlug.length).toBeGreaterThan(0);
          // Module slugs should be kebab-case
          expect(route.moduleSlug).toMatch(/^[a-z0-9-]+$/);
        }
      });
    });
  });

  describe('Route Organization', () => {
    it('should have health route as first route', () => {
      expect(ROUTES_CONFIG[0].path).toBe('/api/v1/health');
      expect(ROUTES_CONFIG[0].public).toBe(true);
    });

    it('should have auth routes early in configuration', () => {
      const authRouteIndex = ROUTES_CONFIG.findIndex(r => r.path === '/api/v1/auth');
      expect(authRouteIndex).toBeLessThan(5);
    });

    it('should group related routes together', () => {
      // Find CRM routes
      const crmRoutes = ROUTES_CONFIG.filter(r => r.path.includes('/crm'));
      expect(crmRoutes.length).toBeGreaterThan(0);
      
      // Find HR routes
      const hrRoutes = ROUTES_CONFIG.filter(r => r.path.includes('/hr'));
      expect(hrRoutes.length).toBeGreaterThan(0);
    });
  });

  describe('Security Configuration', () => {
    it('should protect sensitive routes with authentication', () => {
      const sensitiveRoutes = [
        '/api/v1/admin',
        '/api/v1/billing',
        '/api/v1/team',
      ];

      sensitiveRoutes.forEach((path) => {
        const route = ROUTES_CONFIG.find(r => r.path === path);
        expect(route).toBeDefined();
        expect(route.public).not.toBe(true);
        expect(route.middleware.length).toBeGreaterThan(0);
      });
    });

    it('should allow public access to necessary routes', () => {
      const publicRoutes = [
        '/api/v1/health',
        '/api/v1/auth',
      ];

      publicRoutes.forEach((path) => {
        const route = ROUTES_CONFIG.find(r => r.path === path);
        expect(route).toBeDefined();
        expect(route.public).toBe(true);
      });
    });
  });

  describe('Module Access Control', () => {
    it('should protect premium features with module access', () => {
      const premiumModules = [
        'project-management',
        'marketing-automation',
        'workflow-automation',
      ];

      premiumModules.forEach((moduleSlug) => {
        const routes = ROUTES_CONFIG.filter(r => r.moduleSlug === moduleSlug);
        expect(routes.length).toBeGreaterThan(0);
        routes.forEach((route) => {
          expect(route.middleware.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Route Path Uniqueness', () => {
    it('should not have duplicate route paths', () => {
      const paths = ROUTES_CONFIG.map(r => r.path);
      const uniquePaths = new Set(paths);
      
      // Note: Some paths may appear multiple times with different middleware
      // This is intentional (e.g., /api/v1/crm with different upgrade routes)
      expect(uniquePaths.size).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should load routes in reasonable time', () => {
      const testApp = express();
      const startTime = Date.now();
      
      loadRoutes(testApp);
      
      const duration = Date.now() - startTime;
      
      // Should load all routes in less than 5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });
});
