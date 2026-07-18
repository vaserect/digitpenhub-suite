/**
 * Website Builder & Content Routes Configuration
 * Website builder, pages, funnels, templates, and content management
 */

module.exports = {
  group: 'Website Builder',
  routes: [
    // Website Builder Core
    {
      path: '/api/v1/builder/themes',
      router: require('../builder-themes'),
      middleware: [],
      description: 'Website builder themes',
      public: false,
      moduleSlug: 'website-builder',
    },
    {
      path: '/api/v1/builder/components',
      router: require('../builder-components'),
      middleware: [],
      description: 'Website builder components',
      public: false,
      moduleSlug: 'website-builder',
    },
    {
      path: '/api/v1/builder/sections',
      router: require('../builder-sections'),
      middleware: [],
      description: 'Website builder sections',
      public: false,
      moduleSlug: 'website-builder',
    },
    {
      path: '/api/v1/builder/templates',
      router: require('../builder-templates'),
      middleware: [],
      description: 'Website builder templates',
      public: false,
      moduleSlug: 'website-builder',
    },
    {
      path: '/api/v1/builder/sites',
      router: require('../builder-sites'),
      middleware: [],
      description: 'Website builder sites management',
      public: false,
      moduleSlug: 'website-builder',
    },
    {
      path: '/api/v1/builder/assets',
      router: require('../builder-assets'),
      middleware: [],
      description: 'Website builder asset management',
      public: false,
      moduleSlug: 'website-builder',
    },
    
    // Pages & Funnels
    {
      path: '/api/v1/pages',
      router: require('../pages'),
      middleware: [],
      description: 'Landing pages and website pages',
      public: false,
      moduleSlug: 'website-builder',
    },
    // Templates
    {
      path: '/api/v1/page-templates',
      router: require('../templates'),
      middleware: [],
      description: 'Page templates library',
      public: false,
      moduleSlug: 'website-builder',
    },
    {
      path: '/api/v1/site-templates',
      router: require('../siteTemplates'),
      middleware: [],
      description: 'Complete site templates',
      public: false,
      moduleSlug: 'website-builder',
    },
    {
      path: '/api/v1/email-templates',
      router: require('../emailTemplates'),
      middleware: [],
      description: 'Email templates library',
      public: false,
      moduleSlug: 'email-marketing',
    },
    {
      path: '/api/v1/form-templates',
      router: require('../formTemplates'),
      middleware: [],
      description: 'Form templates library',
      public: false,
    },
    
    // Components & Sections
    {
      path: '/api/v1/components',
      router: require('../components'),
      middleware: [],
      description: 'Reusable UI components',
      public: false,
      moduleSlug: 'website-builder',
    },
    {
      path: '/api/v1/sections',
      router: require('../sections'),
      middleware: [],
      description: 'Page sections library',
      public: false,
      moduleSlug: 'website-builder',
    },
    
    // Forms & Popups
    {
      path: '/api/v1/forms',
      router: require('../forms'),
      middleware: [],
      description: 'Form builder and submissions',
      public: false,
    },
    {
      path: '/api/v1/popup-builder',
      router: require('../popupBuilder'),
      middleware: [],
      description: 'Popup builder (includes public embed routes)',
      public: false,
      moduleSlug: 'popup-builder',
    },
    {
      path: '/api/v1/quiz-builder',
      router: require('../quizBuilder'),
      middleware: [],
      description: 'Quiz builder (includes public quiz routes)',
      public: false,
      moduleSlug: 'quiz-builder',
    },
    
    // SEO & Analytics
    {
      path: '/api/v1/seo',
      router: require('../seo'),
      middleware: [],
      description: 'SEO tools and optimization',
      public: false,
      moduleSlug: 'seo-audit',
    },
    {
      path: '/api/v1/seo',
      router: require('../seoExpansion'),
      middleware: [],
      description: 'SEO expansion features',
      public: false,
      moduleSlug: 'seo-audit',
    },
    {
      path: '/api/v1/website-analytics',
      router: require('../websiteAnalytics'),
      middleware: [],
      description: 'Website analytics and tracking',
      public: false,
      moduleSlug: 'website-analytics',
    },
    {
      path: '/api/v1/heatmaps',
      router: require('../heatmaps'),
      middleware: [],
      description: 'Heatmap tracking and analysis',
      public: false,
    },
  ],
};
