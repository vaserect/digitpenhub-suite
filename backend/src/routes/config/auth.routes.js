/**
 * Authentication & Authorization Routes Configuration
 * Public and protected authentication endpoints
 */

module.exports = {
  group: 'Authentication',
  routes: [
    {
      path: '/api/v1/auth/sso',
      router: require('../sso'),
      middleware: [],
      description: 'Single Sign-On (SSO) authentication endpoints',
      public: true,
    },
    {
      path: '/api/v1/auth',
      router: require('../auth'),
      middleware: [],
      description: 'User authentication endpoints (login, register, logout, password reset)',
      public: true,
    },
  ],
};
