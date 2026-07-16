/**
 * Accounting & Finance Routes Configuration
 * Accounting, expenses, and financial management
 */

module.exports = {
  group: 'Accounting & Finance',
  routes: [
    {
      path: '/api/v1/accounting',
      router: require('../accounting'),
      middleware: [],
      description: 'Accounting and financial management',
      public: false,
      moduleSlug: 'accounting',
    },
    {
      path: '/api/v1/expenses',
      router: require('../expenses'),
      middleware: [],
      description: 'Expense tracking and management',
      public: false,
      moduleSlug: 'expenses',
    },
  ],
};
