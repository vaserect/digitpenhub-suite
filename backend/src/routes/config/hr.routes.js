/**
 * HR & Payroll Routes Configuration
 * Human resources, payroll, recruitment, and employee management
 */

module.exports = {
  group: 'HR & Payroll',
  routes: [
    {
      path: '/api/v1/hr',
      router: require('../hr'),
      middleware: [],
      description: 'HR management endpoints (employees, departments, attendance)',
      public: false,
      moduleSlug: 'hr',
    },
    {
      path: '/api/v1/hr',
      router: require('../hrUpgrades'),
      middleware: [],
      description: 'HR premium features and upgrades',
      public: false,
      moduleSlug: 'hr',
    },
    {
      path: '/api/v1/payroll',
      router: require('../payroll'),
      middleware: [],
      description: 'Payroll processing and management',
      public: false,
      moduleSlug: 'payroll',
    },
    {
      path: '/api/v1/recruitment',
      router: require('../recruitment'),
      middleware: [],
      description: 'Recruitment and applicant tracking',
      public: false,
      moduleSlug: 'recruitment',
    },
  ],
};
