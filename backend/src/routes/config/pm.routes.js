/**
 * Project Management Routes Configuration
 * Projects, tasks, time tracking, and collaboration
 */

module.exports = {
  group: 'Project Management',
  routes: [
    {
      path: '/api/v1/pm',
      router: require('../pm'),
      middleware: [],
      description: 'Project management endpoints (projects, tasks, milestones)',
      public: false,
      moduleSlug: 'project-management',
    },
    {
      path: '/api/v1/tasks',
      router: require('../tasks'),
      middleware: [],
      description: 'Task management and tracking',
      public: false,
      moduleSlug: 'task-management',
    },
    {
      path: '/api/v1/time-tracking',
      router: require('../timeTracking'),
      middleware: [],
      description: 'Time tracking and timesheets',
      public: false,
      moduleSlug: 'time-tracking',
    },
  ],
};
