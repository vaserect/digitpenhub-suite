/**
 * Portal & Client Routes Configuration
 * Client portal, contracts, approvals, and client-facing features
 */

module.exports = {
  group: 'Portal & Client',
  routes: [
    {
      path: '/api/v1/portal',
      router: require('../portal'),
      middleware: [],
      description: 'Client portal and customer access',
      public: false,
    },
    {
      path: '/api/v1/contracts',
      router: require('../contracts'),
      middleware: [],
      description: 'Contract management and e-signatures',
      public: false,
    },
    {
      path: '/api/v1/approvals',
      router: require('../approvals'),
      middleware: [],
      description: 'Approval workflows and requests',
      public: false,
    },
    {
      path: '/api/v1/dunning',
      router: require('../dunning'),
      middleware: [],
      description: 'Dunning management for overdue payments',
      public: false,
    },
  ],
};
