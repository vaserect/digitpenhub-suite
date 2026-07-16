/**
 * CRM (Customer Relationship Management) Routes Configuration
 * Contact management, companies, deals, and CRM features
 */

module.exports = {
  group: 'CRM',
  routes: [
    {
      path: '/api/v1/crm',
      router: require('../crm'),
      middleware: [],
      description: 'CRM core endpoints (contacts, companies, deals, pipelines)',
      public: false,
      moduleSlug: 'crm',
    },
    {
      path: '/api/v1/crm',
      router: require('../crmUpgrades'),
      middleware: [],
      description: 'CRM premium features and upgrades',
      public: false,
      moduleSlug: 'crm',
    },
    {
      path: '/api/v1/leads',
      router: require('../leads'),
      middleware: [],
      description: 'Lead generation and management',
      public: false,
      moduleSlug: 'lead-generation',
    },
  ],
};
