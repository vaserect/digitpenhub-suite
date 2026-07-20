/**
 * Route Configuration
 * Centralized configuration for all API routes with middleware and access control
 */

const { requireAuth } = require('../../middleware/auth');
const { requireModuleAccess } = require('../../utils/planAccess');

/**
 * Route configuration structure:
 * {
 *   path: string,              // API path (e.g., '/api/v1/crm')
 *   file: string,              // Route file name (e.g., 'crm')
 *   middleware: array,         // Middleware to apply
 *   moduleSlug: string,        // Module slug for access control (optional)
 *   public: boolean,           // If true, no auth required (default: false)
 *   description: string        // Route description for documentation
 * }
 */

// Helper to create module-protected route config
const moduleRoute = (path, file, moduleSlug, description, extraMiddleware = []) => ({
  path,
  file,
  middleware: [requireAuth, requireModuleAccess(moduleSlug), ...extraMiddleware],
  moduleSlug,
  description,
});

// Helper to create auth-only route config
const authRoute = (path, file, description, extraMiddleware = []) => ({
  path,
  file,
  middleware: [requireAuth, ...extraMiddleware],
  description,
});

// Helper to create public route config
const publicRoute = (path, file, description, extraMiddleware = []) => ({
  path,
  file,
  middleware: extraMiddleware,
  public: true,
  description,
});

/**
 * Core Routes Configuration
 * Routes are loaded in the order defined here
 */
const ROUTES_CONFIG = [
  // ============================================================================
  // PUBLIC ROUTES (No authentication required)
  // ============================================================================
  publicRoute('/api/v1/health', 'health', 'Health check endpoints'),
  publicRoute('/api/v1/auth/sso', 'sso', 'SSO authentication'),
  publicRoute('/api/v1/auth', 'auth', 'Authentication endpoints'),
  
  // ============================================================================
  // CORE PLATFORM ROUTES
  // ============================================================================
  publicRoute('/api/v1/modules', 'modules', 'Module management'),
  authRoute('/api/v1/team', 'team', 'Team management'),
  authRoute('/api/v1/billing', 'billing', 'Billing and subscriptions'),
  authRoute('/api/v1/admin', 'admin', 'Admin panel'),
  authRoute('/api/v1/notifications', 'notifications', 'Notifications'),
  authRoute('/api/v1/push-notifications', 'pushNotification', 'Push Notification Marketing'),
  authRoute('/api/v1/white-label', 'whiteLabel', 'White label settings'),
  authRoute('/api/v1/content', 'content', 'Content management'),
  
  // ============================================================================
  // CRM MODULE
  // ============================================================================
  moduleRoute('/api/v1/crm/companies', 'crm/companies.routes', 'crm', 'CRM Companies API'),
  moduleRoute('/api/v1/crm/deals', 'crm/deals.routes', 'crm', 'CRM Deals API'),
  moduleRoute('/api/v1/crm/pipelines', 'crm/pipelines.routes', 'crm', 'CRM Pipelines API'),
  publicRoute('/api/v1/crm', 'crm', 'CRM endpoints (mixed auth)'),
  authRoute('/api/v1/crm', 'crmUpgrades', 'CRM upgrade features'),
  authRoute('/api/v1/custom-fields', 'customFields', 'Custom fields management'),
  
  // ============================================================================
  // PROJECT MANAGEMENT
  // ============================================================================
  moduleRoute('/api/v1/pm', 'pm', 'project-management', 'Project management'),
  moduleRoute('/api/v1/tasks', 'tasks', 'task-management', 'Task management'),
  
  // ============================================================================
  // INVOICING & ACCOUNTING
  // ============================================================================
  publicRoute('/api/v1/invoices', 'invoices', 'Invoice management (mixed auth)'),
  authRoute('/api/v1/invoices', 'invoiceUpgrades', 'Invoice upgrade features'),
  moduleRoute('/api/v1/accounting', 'accounting', 'accounting', 'Accounting module'),
  moduleRoute('/api/v1/expenses', 'expenses', 'expenses', 'Expense tracking'),
  moduleRoute('/api/v1/quotations', 'quotations', 'quotations', 'Quotations'),
  moduleRoute('/api/v1/orders', 'orders', 'order-management', 'Order management'),
  
  // ============================================================================
  // EMAIL & MARKETING
  // ============================================================================
  publicRoute('/api/v1/email', 'email', 'Email marketing (mixed auth)'),
  authRoute('/api/v1/email', 'emailUpgrades', 'Email upgrade features'),
  authRoute('/api/v1/email/segments', 'emailSegments', 'Email segmentation'),
  authRoute('/api/v1/email/automations', 'emailAutomations', 'Email automation workflows'),
  publicRoute('/api/v1/leads', 'leads', 'Lead management'),
  moduleRoute('/api/v1/automation', 'automation', 'marketing-automation', 'Marketing automation'),
  authRoute('/api/v1/automation/analytics', 'automationAnalytics', 'Automation analytics', [requireModuleAccess('marketing-automation')]),
  moduleRoute('/api/v1/sms', 'sms', 'sms-marketing', 'SMS marketing'),
  authRoute('/api/v1/sms/segments', 'smsSegments', 'SMS segmentation', [requireModuleAccess('sms-marketing')]),
  authRoute('/api/v1/sms/automations', 'smsAutomations', 'SMS automation workflows', [requireModuleAccess('sms-marketing')]),
  authRoute('/api/v1/sms/conversations', 'smsConversations', 'SMS conversations', [requireModuleAccess('sms-marketing')]),
  authRoute('/api/v1/sms/keywords', 'smsKeywords', 'SMS keywords', [requireModuleAccess('sms-marketing')]),
  moduleRoute('/api/v1/whatsapp', 'whatsapp', 'whatsapp-marketing', 'WhatsApp marketing'),
  authRoute('/api/v1/whatsapp/segments', 'whatsappSegments', 'WhatsApp segmentation', [requireModuleAccess('whatsapp-marketing')]),
  authRoute('/api/v1/whatsapp/automations', 'whatsappAutomations', 'WhatsApp automation workflows', [requireModuleAccess('whatsapp-marketing')]),
  authRoute('/api/v1/whatsapp/conversations', 'whatsappConversations', 'WhatsApp conversations', [requireModuleAccess('whatsapp-marketing')]),
  moduleRoute('/api/v1/social-media', 'socialMedia', 'social-media-scheduler', 'Social Media Scheduler'),
  
  // ============================================================================
  // WEBSITE BUILDER ECOSYSTEM
  // ============================================================================
  // Funnels MUST come before pages to avoid route conflicts (pages has /:id catch-all)
  moduleRoute('/api/v1/funnels', 'funnels', 'funnel-builder', 'Funnel builder'),
  moduleRoute('/api/v1/funnel-templates', 'funnelTemplates', 'funnel-builder', 'Funnel templates'),
  publicRoute('/api/v1/pages', 'pages', 'Website pages (mixed auth)'),
  publicRoute('/api/v1/landing-pages', 'landingPages', 'Landing page builder (mixed auth)'),
  authRoute('/api/v1/cms', 'cms', 'CMS Collections'),
  authRoute('/api/v1/interactions', 'interactions', 'Website Builder Interactions & Animations'),
  authRoute('/api/v1/responsive', 'responsive', 'Responsive Breakpoints System'),
  publicRoute('/api/v1/builder/themes', 'builder-themes', 'Builder themes'),
  publicRoute('/api/v1/builder/components', 'builder-components', 'Builder components'),
  publicRoute('/api/v1/builder/sections', 'builder-sections', 'Builder sections'),
  publicRoute('/api/v1/builder/templates', 'builder-templates', 'Builder templates'),
  publicRoute('/api/v1/builder/sites', 'builder-sites', 'Builder sites'),
  publicRoute('/api/v1/builder/assets', 'builder-assets', 'Builder assets'),
  publicRoute('/api/v1/pexels', 'pexels.routes', 'Pexels integration'),
  authRoute('/api/v1/builder/components', 'componentsController', 'Component Variants System'),
  publicRoute('/api/v1/components', 'components', 'Component library'),
  publicRoute('/api/v1/sections', 'sections', 'Section library'),
  
  // ============================================================================
  // HR & PAYROLL
  // ============================================================================
  moduleRoute('/api/v1/hr', 'hr', 'hr', 'HR management'),
  authRoute('/api/v1/hr', 'hrUpgrades', 'HR upgrade features', [requireModuleAccess('hr')]),
  moduleRoute('/api/v1/payroll', 'payroll', 'payroll', 'Payroll management'),
  moduleRoute('/api/v1/recruitment', 'recruitment', 'recruitment', 'Recruitment'),
  moduleRoute('/api/v1/time-tracking', 'timeTracking', 'time-tracking', 'Time tracking'),
  authRoute('/api/v1/file-manager', 'fileManager', 'File Manager'),
  authRoute('/api/v1/people-directory', 'peopleDirectory', 'Internal People/Skills Directory'),
  authRoute('/api/v1/ideas', 'ideas', 'Idea Management / Suggestion Box'),
  authRoute('/api/v1/timezone-proposals', 'timezoneProposals', 'Multi-timezone Meeting Coordinator'),
  authRoute('/api/v1/whiteboard', 'whiteboard', 'Whiteboard / Mind-Mapping Tool'),
  
  // ============================================================================
  // CUSTOMER SUPPORT
  // ============================================================================
  moduleRoute('/api/v1/helpdesk', 'helpdesk', 'help-desk', 'Help desk'),
  authRoute('/api/v1/helpdesk', 'helpdeskUpgrades', 'Help desk upgrades', [requireModuleAccess('help-desk')]),
  moduleRoute('/api/v1/kb', 'knowledgeBase', 'knowledge-base', 'Knowledge base'),
  authRoute('/api/v1/kb', 'kbUpgrades', 'Knowledge base upgrades', [requireModuleAccess('knowledge-base')]),
  authRoute('/api/v1/portal', 'portal', 'Client portal'),
  
  // ============================================================================
  // INVENTORY & POS
  // ============================================================================
  moduleRoute('/api/v1/inventory', 'inventory', 'inventory', 'Inventory management'),
  moduleRoute('/api/v1/pos', 'pos', 'pos', 'Point of sale'),
  moduleRoute('/api/v1/delivery', 'delivery', 'delivery-tracking', 'Delivery tracking'),
  
  authRoute('/api/v1/gift-cards', 'giftCards', 'Gift Cards'),
  authRoute('/api/v1/wishlist', 'wishlist', 'Wishlist / Save-for-later'),
  authRoute('/api/v1/product-reviews', 'productReviews', 'Product Reviews & Q&A'),
  authRoute('/api/v1/rma', 'rma', 'Warranty & RMA Management'),
  authRoute('/api/v1/loyalty', 'loyalty', 'Loyalty & Rewards Program'),
  authRoute('/api/v1/print-on-demand', 'printOnDemand', 'Print-on-Demand Integration'),
  authRoute('/api/v1/dropshipping', 'dropshipping', 'Dropshipping Supplier Integration'),
  authRoute('/api/v1/shipping-labels', 'shipping', 'Shipping Label Printing + Carrier Rate Shopping'),
  authRoute('/api/v1/marketplace-payouts', 'marketplacePayouts', 'Multi-vendor Marketplace Payouts'),
  authRoute('/api/v1/dispute-resolution', 'disputeResolution', 'Marketplace Dispute Resolution'),

  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================
  publicRoute('/api/v1/analytics', 'analytics', 'Analytics dashboard (mixed auth)'),
  moduleRoute('/api/v1/sales-dashboard', 'salesDashboard', 'sales-dashboard', 'Sales dashboard'),
  moduleRoute('/api/v1/marketing-dashboard', 'marketingDashboard', 'marketing-dashboard', 'Marketing dashboard'),
  moduleRoute('/api/v1/website-analytics', 'websiteAnalytics', 'website-analytics', 'Website analytics'),
  moduleRoute('/api/v1/perf-reports', 'performanceReports', 'performance-reports', 'Performance reports'),
  moduleRoute('/api/v1/custom-reports', 'customReports', 'custom-reports', 'Custom reports'),
  
  // ============================================================================
  // UTILITIES & TOOLS
  // ============================================================================
  authRoute('/api/v1/appointments', 'appointments', 'Appointment scheduling'),
  moduleRoute('/api/v1/calendar', 'calendar', 'calendar', 'Calendar'),
  authRoute('/api/v1/content-calendar', 'contentCalendar', 'Content Calendar'),
  authRoute('/api/v1/influencer-crm', 'influencerCRM', 'Influencer CRM'),
  moduleRoute('/api/v1/notes', 'notes', 'notes', 'Notes'),
  publicRoute('/api/v1/forms', 'forms', 'Form builder (mixed auth)'),
  authRoute('/api/v1/form-templates', 'formTemplates', 'Form templates'),
  moduleRoute('/api/v1/coupons', 'coupons', 'coupons', 'Coupon management'),
  moduleRoute('/api/v1/url-shortener', 'urlShortener', 'url-shortener', 'URL shortener'),
  
  // ============================================================================
  // ASSET MANAGEMENT
  // ============================================================================
  moduleRoute('/api/v1/assets', 'assets', 'asset-management', 'Asset management'),
  publicRoute('/api/v1/images', 'images', 'Image management'),
  moduleRoute('/api/v1/page-templates', 'templates', 'website-builder', 'Page templates'),
  moduleRoute('/api/v1/site-templates', 'siteTemplates', 'website-builder', 'Site templates'),
  moduleRoute('/api/v1/email-templates', 'emailTemplates', 'email-marketing', 'Email templates'),
  authRoute('/api/v1/saved-designs', 'savedDesigns', 'Saved designs'),
  moduleRoute('/api/v1/brand-kit', 'brandKit', 'brand-kit', 'Brand kit'),
  
  // ============================================================================
  // DOCUMENTS & FILES
  // ============================================================================
  moduleRoute('/api/v1/documents', 'documents', 'document-management', 'Document management'),
  moduleRoute('/api/v1/password-manager', 'passwordManager', 'password-manager', 'Password manager'),
  moduleRoute('/api/v1/digital-products', 'digitalProducts', 'digital-products', 'Digital products'),
  
  // ============================================================================
  // MARKETING TOOLS
  // ============================================================================
  publicRoute('/api/v1/qr-codes', 'qrCodes', 'QR code generator (mixed auth)'),
  publicRoute('/api/v1/barcodes', 'barcodes', 'Barcode generator (mixed auth)'),
  publicRoute('/api/v1/biz-cards', 'digitalBusinessCards', 'Digital business cards (mixed auth)'),
  publicRoute('/api/v1/link-in-bio', 'linkInBio', 'Link in bio (mixed auth)'),
  publicRoute('/api/v1/reviews', 'reviews', 'Review management (mixed auth)'),
  moduleRoute('/api/v1/certificates', 'certificates', 'certificate-generator', 'Certificate generator'),
  moduleRoute('/api/v1/color-palettes', 'colorPalettes', 'color-palette-generator', 'Color palette generator'),
  moduleRoute('/api/v1/ad-campaigns', 'adCampaign', 'ad-campaign-manager', 'Ad Campaign Manager'),
  
  moduleRoute('/api/v1/events', 'events', 'event-hosting', 'Event / Webinar Hosting'),
  moduleRoute('/api/v1/sales-playbook', 'salesPlaybook', 'sales-playbook', 'Sales Playbook / Battlecard Library'),
  publicRoute('/api/v1/ambassadors', 'ambassador', 'Ambassador Program (mixed auth)'),
  moduleRoute('/api/v1/direct-mail', 'directMail', 'direct-mail-automation', 'Direct Mail Automation'),
  moduleRoute('/api/v1/print-fulfillment', 'printFulfillment', 'print-fulfillment-for-business-cards-signage', 'Print Fulfillment'),
  moduleRoute('/api/v1/ab-testing', 'abTesting', 'creative-a-b-testing-studio', 'Creative A/B Testing Studio'),
  moduleRoute('/api/v1/ugc-aggregator', 'ugcAggregator', 'ugc-creator-content-aggregator', 'UGC/Creator Content Aggregator'),
  // ============================================================================
  // INTERACTIVE TOOLS
  // ============================================================================
  publicRoute('/api/v1/quiz-builder', 'quizBuilder', 'Quiz builder (mixed auth)'),
  publicRoute('/api/v1/popup-builder', 'popupBuilder', 'Popup builder (mixed auth)'),
  
  // ============================================================================
  // AI TOOLS
  // ============================================================================
  // Note: AI documents use custom middleware (requireAiDocuments)
  // This will be handled specially in the loader
  moduleRoute('/api/v1/chatbot-builder', 'chatbotBuilder', 'ai-chatbot-builder', 'AI chatbot builder'),
  moduleRoute('/api/v1/meeting-notes', 'meetingNotes', 'ai-meeting-notes', 'AI meeting notes'),
  moduleRoute('/api/v1/ai-kb', 'aiKnowledgeBase', 'ai-knowledge-base', 'AI knowledge base'),
  moduleRoute('/api/v1/ai-support', 'aiCustomerSupport', 'ai-customer-support', 'AI customer support'),
  moduleRoute('/api/v1/ai-translator', 'aiTranslator', 'ai-translator', 'AI translator'),
  
  // ============================================================================
  // SEO & OPTIMIZATION
  // ============================================================================
  moduleRoute('/api/v1/seo', 'seo', 'seo-audit', 'SEO audit'),
  authRoute('/api/v1/seo', 'seoExpansion', 'SEO expansion', [requireModuleAccess('seo-audit')]),
  moduleRoute('/api/v1/pdf', 'pdfTools', 'pdf-tools', 'PDF tools'),
  
  // ============================================================================
  // INTEGRATIONS & AUTOMATION
  // ============================================================================
  moduleRoute('/api/v1/storage', 'cloudStorage', 'cloud-storage', 'Cloud storage'),
  moduleRoute('/api/v1/workflows', 'workflowAutomation', 'workflow-automation', 'Workflow automation'),
  authRoute('/api/v1/integrations', 'integrations', 'Third-party integrations'),
  
  // ============================================================================
  // MARKETPLACE
  // ============================================================================
  moduleRoute('/api/v1/marketplace', 'marketplace', 'marketplace', 'Marketplace'),
  authRoute('/api/v1/marketplace/admin', 'marketplaceAdmin', 'Marketplace admin'),
  publicRoute('/api/v1/payments', 'payments', 'Payment processing'),
  
  // ============================================================================
  // EDUCATION & LEARNING
  // ============================================================================
  moduleRoute('/api/v1/lms', 'lms', 'learning-management-system', 'Learning management system'),
  authRoute('/api/v1/lms', 'educationUpgrades', 'LMS upgrades', [requireModuleAccess('learning-management-system')]),
  moduleRoute('/api/v1/school', 'school', 'school-management', 'School management'),
  moduleRoute('/api/v1/school-assignments', 'assignments', 'assignments', 'School assignments'),
  moduleRoute('/api/v1/cbt', 'cbt', 'cbt-platform', 'CBT platform'),
  
  // ============================================================================
  // E-COMMERCE
  // ============================================================================
  publicRoute('/api/v1/store-builder', 'storeBuilder', 'Store builder (mixed auth)'),
  moduleRoute('/api/v1/customer-subs', 'subscriptions', 'subscriptions', 'Customer subscriptions'),
  moduleRoute('/api/v1/affiliates', 'affiliates', 'affiliate-system', 'Affiliate system'),
  moduleRoute('/api/v1/referrals', 'referrals', 'referral-program', 'Referral program'),
  moduleRoute('/api/v1/lead-scoring', 'leadScoring', 'lead-scoring', 'Lead scoring system'),
  
  // ============================================================================
  // ADVANCED FEATURES
  // ============================================================================
  authRoute('/api/v1/publishing', 'publishing', 'Publishing'),
  authRoute('/api/v1/permissions', 'permissions', 'Permissions management'),
  authRoute('/api/v1/feature-flags', 'featureFlags', 'Feature flags'),
  authRoute('/api/v1/dam', 'dam', 'Digital asset management'),
  authRoute('/api/v1/api-keys', 'apiKeys', 'API key management'),
  authRoute('/api/v1/approvals', 'approvals', 'Approval workflows'),
  authRoute('/api/v1/search', 'search', 'Global search'),
  authRoute('/api/v1/inbox', 'inbox', 'Unified inbox'),
  authRoute('/api/v1/dedup', 'dedup', 'Deduplication'),
  authRoute('/api/v1/dunning', 'dunning', 'Dunning management'),
  authRoute('/api/v1/contracts', 'contracts', 'Contract management'),
  authRoute('/api/v1/segments', 'segments', 'Customer segments'),
  authRoute('/api/v1/gdpr', 'gdpr', 'GDPR compliance'),
  authRoute('/api/v1/imports', 'imports', 'Data imports'),
  authRoute('/api/v1/data-tables', 'dataTables', 'Data tables'),
  authRoute('/api/v1/data-migration', 'dataMigration', 'Guided Data Migration Tool'),
  authRoute('/api/v1/zapier-connector', 'zapierConnector', 'Zapier / Make Native Connector'),
  authRoute('/api/v1/internal-scripts', 'internalScripts', 'Internal Tooling / Script Library'),
  publicRoute('/api/v1/heatmaps', 'heatmaps', 'Heatmaps'),
  authRoute('/api/v1/payouts', 'payouts', 'Payout management'),
  authRoute('/api/v1/exports', 'exports', 'Data exports'),
  authRoute('/api/v1/knowledge-graph', 'knowledgeGraph', 'Knowledge graph'),
  authRoute('/api/v1/platform', 'platform', 'Platform settings'),
  authRoute('/api/v1/collaborative-editing', 'collaborativeEditing', 'Collaborative editing'),
  authRoute('/api/v1/workspace', 'workspace', 'Workspace management'),
  
  // ============================================================================
  // REMAINING MODULES
  // ============================================================================
  authRoute('/api/v1/support', 'remainingYellow', 'Support features'),
  authRoute('/api/v1/community', 'community', 'Community/Membership Platform'),
  
  // ============================================================================
  // SUPER ADMIN
  // ============================================================================
  authRoute('/api/v1/admin/addons', 'superAdmin', 'Super admin - addons'),
  authRoute('/api/v1/admin/health', 'superAdmin', 'Super admin - health'),
  authRoute('/api/v1/marketplace', 'superAdmin', 'Super admin - workspace'),
];

module.exports = {
  ROUTES_CONFIG,
  moduleRoute,
  authRoute,
  publicRoute,
};
