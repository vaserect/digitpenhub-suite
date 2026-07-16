/**
 * Analytics & Reporting Routes Configuration
 * Analytics dashboards, reports, and data visualization
 */

module.exports = {
  group: 'Analytics & Reporting',
  routes: [
    {
      path: '/api/v1/analytics',
      router: require('../analytics'),
      middleware: [],
      description: 'General analytics and metrics',
      public: false,
    },
    {
      path: '/api/v1/analytics',
      router: require('../analytics'),
      middleware: [],
      description: 'Marketplace analytics',
      public: false,
    },
    {
      path: '/api/v1/sales-dashboard',
      router: require('../salesDashboard'),
      middleware: [],
      description: 'Sales analytics dashboard',
      public: false,
      moduleSlug: 'sales-dashboard',
    },
    {
      path: '/api/v1/perf-reports',
      router: require('../performanceReports'),
      middleware: [],
      description: 'Performance reports and metrics',
      public: false,
      moduleSlug: 'performance-reports',
    },
    {
      path: '/api/v1/custom-reports',
      router: require('../customReports'),
      middleware: [],
      description: 'Custom report builder',
      public: false,
      moduleSlug: 'custom-reports',
    },
    {
      path: '/api/v1/data-tables',
      router: require('../dataTables'),
      middleware: [],
      description: 'Data tables and visualization',
      public: false,
    },
    {
      path: '/api/v1/knowledge-graph',
      router: require('../knowledgeGraph'),
      middleware: [],
      description: 'Knowledge graph and relationships',
      public: false,
    },
  ],
};
