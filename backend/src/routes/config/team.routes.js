/**
 * Team & Collaboration Routes Configuration
 * Team management, permissions, workspace, and collaboration
 */

module.exports = {
  group: 'Team & Collaboration',
  routes: [
    {
      path: '/api/v1/team',
      router: require('../team'),
      middleware: [],
      description: 'Team management and member invitations',
      public: false,
    },
    {
      path: '/api/v1/permissions',
      router: require('../permissions').router,
      middleware: [],
      description: 'Role-based permissions and access control',
      public: false,
    },
    {
      path: '/api/v1/workspace',
      router: require('../workspace'),
      middleware: [],
      description: 'Workspace management and settings',
      public: false,
    },
    {
      path: '/api/v1/collaborative-editing',
      router: require('../collaborativeEditing'),
      middleware: [],
      description: 'Real-time collaborative editing',
      public: false,
    },
    {
      path: '/api/v1/notes',
      router: require('../notes'),
      middleware: [],
      description: 'Shared notes and documentation',
      public: false,
      moduleSlug: 'notes',
    },
    {
      path: '/api/v1/calendar',
      router: require('../calendar'),
      middleware: [],
      description: 'Shared calendar and scheduling',
      public: false,
      moduleSlug: 'calendar',
    },
    {
      path: '/api/v1/appointments',
      router: require('../appointments'),
      middleware: [],
      description: 'Appointment scheduling and booking',
      public: false,
    },
  ],
};
