/**
 * AI & Automation Routes Configuration
 * AI-powered tools, chatbots, document generation, and automation
 */

// Custom middleware for AI documents (shared across multiple AI modules)
const { getOrgPlan, FREE_TIER_MODULE_SLUGS } = require('../../utils/planAccess');

const requireAiDocuments = async (req, res, next) => {
  try {
    const plan = await getOrgPlan(req.user.orgId);
    if (plan.all_modules) return next();
    const hasFreeAccess = ['ai-writer', 'ai-email-assistant', 'ai-proposal-generator', 'ai-blog-generator']
      .some((s) => FREE_TIER_MODULE_SLUGS.has(s));
    if (hasFreeAccess) return next();
    return res.status(403).json({
      error: 'This feature requires a paid plan. Upgrade to unlock AI Writer tools.',
      upgradeRequired: true,
      moduleSlug: 'ai-documents',
      currentPlan: plan.slug,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  group: 'AI & Automation',
  routes: [
    {
      path: '/api/v1/ai-documents',
      router: require('../aiDocuments'),
      middleware: [requireAiDocuments],
      description: 'AI document generation (writer, email, proposals, blog)',
      public: false,
    },
    {
      path: '/api/v1/chatbot-builder',
      router: require('../chatbotBuilder'),
      middleware: [],
      description: 'AI chatbot builder and management',
      public: false,
      moduleSlug: 'ai-chatbot-builder',
    },
    {
      path: '/api/v1/meeting-notes',
      router: require('../meetingNotes'),
      middleware: [],
      description: 'AI-powered meeting notes and transcription',
      public: false,
      moduleSlug: 'ai-meeting-notes',
    },
    {
      path: '/api/v1/ai-kb',
      router: require('../aiKnowledgeBase'),
      middleware: [],
      description: 'AI knowledge base and search',
      public: false,
      moduleSlug: 'ai-knowledge-base',
    },
    {
      path: '/api/v1/ai-support',
      router: require('../aiCustomerSupport'),
      middleware: [],
      description: 'AI customer support automation',
      public: false,
      moduleSlug: 'ai-customer-support',
    },
    {
      path: '/api/v1/ai-translator',
      router: require('../aiTranslator'),
      middleware: [],
      description: 'AI translation services',
      public: false,
      moduleSlug: 'ai-translator',
    },
    {
      path: '/api/v1/workflows',
      router: require('../workflowAutomation'),
      middleware: [],
      description: 'Workflow automation builder',
      public: false,
      moduleSlug: 'workflow-automation',
    },
  ],
};
