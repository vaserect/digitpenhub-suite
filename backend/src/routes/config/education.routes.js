/**
 * Education & Learning Routes Configuration
 * LMS, school management, courses, and educational tools
 */

module.exports = {
  group: 'Education & Learning',
  routes: [
    {
      path: '/api/v1/lms',
      router: require('../lms'),
      middleware: [],
      description: 'Learning Management System core',
      public: false,
      moduleSlug: 'learning-management-system',
    },
    {
      path: '/api/v1/lms',
      router: require('../educationUpgrades'),
      middleware: [],
      description: 'LMS premium features and upgrades',
      public: false,
      moduleSlug: 'learning-management-system',
    },
    {
      path: '/api/v1/school',
      router: require('../school'),
      middleware: [],
      description: 'School management system',
      public: false,
      moduleSlug: 'school-management',
    },
    {
      path: '/api/v1/school-assignments',
      router: require('../assignments'),
      middleware: [],
      description: 'Assignment management and grading',
      public: false,
      moduleSlug: 'assignments',
    },
    {
      path: '/api/v1/cbt',
      router: require('../cbt'),
      middleware: [],
      description: 'Computer-Based Testing platform',
      public: false,
      moduleSlug: 'cbt-platform',
    },
  ],
};
