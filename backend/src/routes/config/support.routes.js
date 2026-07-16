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
    {
      path: '/api/v1/community',
      router: require('../greenModules'),
      middleware: [],
      description: 'Community features and forums',
      public: false,
    },
  ],
};
