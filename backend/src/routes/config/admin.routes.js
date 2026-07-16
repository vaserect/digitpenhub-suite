/**
 * Admin & System Routes Configuration
 * Admin panel, system management, and super admin features
 */

const { ADDON_ROUTER, HEALTH_ROUTER, WORKSPACE_ROUTER } = require('../superAdmin');

module.exports = {
  group: 'Admin & System',
  routes: [
    {
      path: '/api/v1/admin',
      router: require('../admin'),
      middleware: [],
      description: 'Admin panel and system management',
      public: false,
    },
    {
      path: '/api/v1/modules',
      router: require('../modules'),
      middleware: [],
      description: 'Module management and configuration',
      public: false,
    },
    {
      path: '/api/v1/content',
      router: require('../content'),
      middleware: [],
      description: 'Content management system',
      public: false,
    },
    {
      path: '/api/v1/white-label',
      router: require('../whiteLabel'),
      middleware: [],
      description: 'White-label branding and customization',
      public: false,
    },
    {
      path: '/api/v1/notifications',
      router: require('../notifications'),
      middleware: [],
      description: 'Notification system and preferences',
      public: false,
    },
    {
      path: '/api/v1/feature-flags',
      router: require('../featureFlags'),
      middleware: [],
      description: 'Feature flag management',
      public: false,
    },
    {
      path: '/api/v1/api-keys',
      router: require('../apiKeys'),
      middleware: [],
      description: 'API key management',
      public: false,
    },
    {
      path: '/api/v1/admin/addons',
      router: ADDON_ROUTER,
      middleware: [],
      description: 'Super admin addon management',
      public: false,
    },
    {
      path: '/api/v1/admin/health',
      router: HEALTH_ROUTER,
      middleware: [],
      description: 'Super admin health monitoring',
      public: false,
    },
    {
      path: '/api/v1/marketplace',
      router: WORKSPACE_ROUTER,
      middleware: [],
      description: 'Super admin workspace management',
      public: false,
    },
  ],
};
