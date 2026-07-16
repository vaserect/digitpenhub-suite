/**
 * Integrations & Platform Routes Configuration
 * Third-party integrations, platform features, and publishing
 */

module.exports = {
  group: 'Integrations & Platform',
  routes: [
    {
      path: '/api/v1/integrations',
      router: require('../integrations'),
      middleware: [],
      description: 'Third-party integrations and API connections',
      public: false,
    },
    {
      path: '/api/v1/documents',
      router: require('../documents'),
      middleware: [],
      description: 'Document management and storage',
      public: false,
      moduleSlug: 'document-management',
    },
    {
      path: '/api/v1/publishing',
      router: require('../publishing'),
      middleware: [],
      description: 'Content publishing and distribution',
      public: false,
    },
    {
      path: '/api/v1/search',
      router: require('../search'),
      middleware: [],
      description: 'Global search functionality',
      public: false,
    },
    {
      path: '/api/v1/platform',
      router: require('../platform'),
      middleware: [],
      description: 'Platform-wide features and settings',
      public: false,
    },
    {
      path: '/api/v1/password-manager',
      router: require('../passwordManager'),
      middleware: [],
      description: 'Password manager and vault',
      public: false,
      moduleSlug: 'password-manager',
    },
  ],
};
