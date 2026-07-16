/**
 * Marketplace & Affiliates Routes Configuration
 * Marketplace, affiliates, referrals, and partner programs
 */

module.exports = {
  group: 'Marketplace & Partners',
  routes: [
    {
      path: '/api/v1/marketplace',
      router: require('../marketplace'),
      middleware: [],
      description: 'Marketplace for templates, plugins, and extensions',
      public: false,
      moduleSlug: 'marketplace',
    },
    {
      path: '/api/v1/marketplace/admin',
      router: require('../marketplaceAdmin'),
      middleware: [],
      description: 'Marketplace admin and vendor management',
      public: false,
    },
    {
      path: '/api/v1/affiliates',
      router: require('../affiliates'),
      middleware: [],
      description: 'Affiliate program management',
      public: false,
      moduleSlug: 'affiliate-system',
    },
    {
      path: '/api/v1/referrals',
      router: require('../referrals'),
      middleware: [],
      description: 'Referral program and tracking',
      public: false,
      moduleSlug: 'referral-program',
    },
    {
      path: '/api/v1/payouts',
      router: require('../payouts'),
      middleware: [],
      description: 'Payout management for affiliates and vendors',
      public: false,
    },
  ],
};
