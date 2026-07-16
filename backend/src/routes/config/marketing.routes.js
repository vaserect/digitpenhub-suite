/**
 * Marketing & Automation Routes Configuration
 * Email marketing, automation, SMS, WhatsApp, and marketing tools
 */

module.exports = {
  group: 'Marketing',
  routes: [
    {
      path: '/api/v1/email',
      router: require('../email'),
      middleware: [],
      description: 'Email marketing core endpoints',
      public: false,
      moduleSlug: 'email-marketing',
    },
    {
      path: '/api/v1/email',
      router: require('../emailUpgrades'),
      middleware: [],
      description: 'Email marketing premium features',
      public: false,
      moduleSlug: 'email-marketing',
    },
    {
      path: '/api/v1/automation',
      router: require('../automation'),
      middleware: [],
      description: 'Marketing automation workflows and campaigns',
      public: false,
      moduleSlug: 'marketing-automation',
    },
    {
      path: '/api/v1/sms',
      router: require('../sms'),
      middleware: [],
      description: 'SMS marketing and campaigns',
      public: false,
      moduleSlug: 'sms-marketing',
    },
    {
      path: '/api/v1/whatsapp',
      router: require('../whatsapp'),
      middleware: [],
      description: 'WhatsApp marketing and messaging',
      public: false,
      moduleSlug: 'whatsapp-marketing',
    },
    {
      path: '/api/v1/marketing-dashboard',
      router: require('../marketingDashboard'),
      middleware: [],
      description: 'Marketing analytics and dashboard',
      public: false,
      moduleSlug: 'marketing-dashboard',
    },
  ],
};
