/**
 * Invoicing & Billing Routes Configuration
 * Invoice management, payments, and billing
 */

module.exports = {
  group: 'Invoicing',
  routes: [
    {
      path: '/api/v1/invoices',
      router: require('../invoices'),
      middleware: [],
      description: 'Invoice management endpoints (create, read, update, delete)',
      public: false,
      moduleSlug: 'invoicing',
    },
    {
      path: '/api/v1/invoices',
      router: require('../invoiceUpgrades'),
      middleware: [],
      description: 'Invoice premium features and upgrades',
      public: false,
      moduleSlug: 'invoicing',
    },
    {
      path: '/api/v1/quotations',
      router: require('../quotations'),
      middleware: [],
      description: 'Quotation and estimate management',
      public: false,
      moduleSlug: 'quotations',
    },
    {
      path: '/api/v1/billing',
      router: require('../billing'),
      middleware: [],
      description: 'Billing and subscription management',
      public: false,
    },
    {
      path: '/api/v1/payments',
      router: require('../payments'),
      middleware: [],
      description: 'Payment processing and gateway integration',
      public: false,
    },
  ],
};
