/**
 * Assets & Storage Routes Configuration
 * Asset management, DAM, cloud storage, and brand kit
 */

module.exports = {
  group: 'Assets & Storage',
  routes: [
    {
      path: '/api/v1/assets',
      router: require('../assets'),
      middleware: [],
      description: 'Asset management system',
      public: false,
      moduleSlug: 'asset-management',
    },
    {
      path: '/api/v1/dam',
      router: require('../dam'),
      middleware: [],
      description: 'Digital Asset Management (DAM)',
      public: false,
    },
    {
      path: '/api/v1/storage',
      router: require('../cloudStorage'),
      middleware: [],
      description: 'Cloud storage integration',
      public: false,
      moduleSlug: 'cloud-storage',
    },
    {
      path: '/api/v1/brand-kit',
      router: require('../brandKit'),
      middleware: [],
      description: 'Brand kit and style guide',
      public: false,
      moduleSlug: 'brand-kit',
    },
    {
      path: '/api/v1/saved-designs',
      router: require('../savedDesigns'),
      middleware: [],
      description: 'Saved designs and templates',
      public: false,
    },
  ],
};
