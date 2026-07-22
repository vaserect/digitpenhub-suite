/**
 * Support & Help Desk Routes Configuration
 * Customer support, help desk, knowledge base, and community
 */

module.exports = {
  group: 'Support & Community',
  routes: [
    {
      path: '/api/v1/helpdesk',
      router: require('../helpdesk'),
      middleware: [],
      description: 'Help desk and ticket management',
      public: false,
      moduleSlug: 'help-desk',
    },
    {
      path: '/api/v1/helpdesk',
      router: require('../helpdeskUpgrades'),
      middleware: [],
      description: 'Help desk premium features',
      public: false,
      moduleSlug: 'help-desk',
    },
    {
      path: '/api/v1/kb',
      router: require('../knowledgeBase'),
      middleware: [],
      description: 'Knowledge base management',
      public: false,
      moduleSlug: 'knowledge-base',
    },
    {
      path: '/api/v1/kb',
      router: require('../kbUpgrades'),
      middleware: [],
      description: 'Knowledge base premium features',
      public: false,
      moduleSlug: 'knowledge-base',
    },
    {
      path: '/api/v1/inbox',
      router: require('../inbox').router,
      middleware: [],
      description: 'Unified inbox for messages and communications',
      public: false,
    },
    {
      path: '/api/v1/support',
      router: require('../remainingYellow'),
      middleware: [],
      description: 'Additional support features',
      public: false,
    },
    // greenModules.js removed — its 7 modules (old communities, events, jobs, skills,
    // ideas, timezone-proposals, ambassadors) each have dedicated routes registered
    // individually in routes.config.js. New community platform uses community.js.
    // The orphaned route file backend/src/routes/greenModules.js remains as reference
    // but is NOT loaded by the route loader.
  ],
};
