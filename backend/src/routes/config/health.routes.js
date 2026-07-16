/**
 * Health & System Routes Configuration
 * Public routes for health checks and system status
 */

module.exports = {
  group: 'Health & System',
  routes: [
    {
      path: '/api/v1/health',
      router: require('../health'),
      middleware: [],
      description: 'Health check and system status endpoints',
      public: true,
    },
  ],
};
