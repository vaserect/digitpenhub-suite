/**
 * Data Management Routes Configuration
 * Data import/export, deduplication, and data management
 */

module.exports = {
  group: 'Data Management',
  routes: [
    {
      path: '/api/v1/custom-fields',
      router: require('../customFields'),
      middleware: [],
      description: 'Custom fields management',
      public: false,
    },
    {
      path: '/api/v1/imports',
      router: require('../imports'),
      middleware: [],
      description: 'Data import tools',
      public: false,
    },
    {
      path: '/api/v1/exports',
      router: require('../exports'),
      middleware: [],
      description: 'Data export tools',
      public: false,
    },
    {
      path: '/api/v1/dedup',
      router: require('../dedup'),
      middleware: [],
      description: 'Data deduplication tools',
      public: false,
    },
    {
      path: '/api/v1/segments',
      router: require('../segments'),
      middleware: [],
      description: 'Customer segmentation',
      public: false,
    },
    {
      path: '/api/v1/gdpr',
      router: require('../gdpr'),
      middleware: [],
      description: 'GDPR compliance and data privacy',
      public: false,
    },
  ],
};
