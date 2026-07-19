/**
 * Search Routes Configuration
 * Global search functionality across all modules
 */

module.exports = {
  group: 'Platform Core',
  routes: [
    {
      path: '/api/v1/search',
      router: require('../search'),
      middleware: [],
      description: 'Global search',
      public: false,
      moduleSlug: 'global-search',
    },
  ],
};
