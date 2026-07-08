// Must be required before express so it can patch Router.prototype — this
// forwards any rejected promise from an async route handler to the error
// middleware instead of it becoming an unhandled rejection. Nearly all ~90
// route files here use bare `async (req, res) => {}` handlers with no
// try/catch, so without this a single bad request (bad input, DB constraint,
// null deref) hangs that request forever instead of returning an error.
require('express-async-errors');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { requireAuth } = require('./middleware/auth');
const { requireModuleAccess, getOrgPlan, FREE_TIER_MODULE_SLUGS } = require('./utils/planAccess');

const authRoutes = require('./routes/auth');
const moduleRoutes = require('./routes/modules');
const crmRoutes = require('./routes/crm');
const pmRoutes = require('./routes/pm');
const teamRoutes = require('./routes/team');
const invoicesRoutes = require('./routes/invoices');
const emailRoutes = require('./routes/email');
const leadsRoutes = require('./routes/leads');
const analyticsRoutes = require('./routes/analytics');
const billingRoutes = require('./routes/billing');
const adminRoutes = require('./routes/admin');
const contentRoutes = require('./routes/content');
const whiteLabelRoutes = require('./routes/whiteLabel');
const notificationsRoutes = require('./routes/notifications');
const pagesRoutes = require('./routes/pages');
const funnelsRoutes = require('./routes/funnels');
const hrRoutes = require('./routes/hr');
const appointmentsRoutes = require('./routes/appointments');
const expensesRoutes = require('./routes/expenses');
const recruitmentRoutes = require('./routes/recruitment');
const accountingRoutes  = require('./routes/accounting');
const portalRoutes      = require('./routes/portal');
const automationRoutes  = require('./routes/automation');
const whatsappRoutes    = require('./routes/whatsapp');
const affiliatesRoutes  = require('./routes/affiliates');
const referralsRoutes   = require('./routes/referrals');
const inventoryRoutes   = require('./routes/inventory');
const posRoutes         = require('./routes/pos');
const quotationsRoutes  = require('./routes/quotations');
const tasksRoutes       = require('./routes/tasks');
const formsRoutes       = require('./routes/forms');
const helpdeskRoutes    = require('./routes/helpdesk');
const smsRoutes         = require('./routes/sms');
const calendarRoutes    = require('./routes/calendar');
const timeTrackingRoutes = require('./routes/timeTracking');
const notesRoutes        = require('./routes/notes');
const knowledgeBaseRoutes = require('./routes/knowledgeBase');
const couponsRoutes      = require('./routes/coupons');
const urlShortenerRoutes = require('./routes/urlShortener');
const assetsRoutes       = require('./routes/assets');
const imagesRoutes       = require('./routes/images');
const templatesRoutes    = require('./routes/templates');
const siteTemplatesRoutes = require('./routes/siteTemplates');
const emailTemplatesRoutes = require('./routes/emailTemplates');
const ordersRoutes       = require('./routes/orders');
const documentsRoutes    = require('./routes/documents');
const payrollRoutes       = require('./routes/payroll');
const subscriptionsRoutes = require('./routes/subscriptions');
const deliveryRoutes      = require('./routes/delivery');
const brandKitRoutes      = require('./routes/brandKit');
const savedDesignsRoutes  = require('./routes/savedDesigns');
const passwordMgrRoutes   = require('./routes/passwordManager');
const digitalProductsRoutes = require('./routes/digitalProducts');
const qrCodesRoutes       = require('./routes/qrCodes');
const customReportsRoutes = require('./routes/customReports');
// Batch 4
const salesDashboardRoutes    = require('./routes/salesDashboard');
const marketingDashboardRoutes = require('./routes/marketingDashboard');
const websiteAnalyticsRoutes  = require('./routes/websiteAnalytics');
const perfReportsRoutes       = require('./routes/performanceReports');
const bizCardsRoutes          = require('./routes/digitalBusinessCards');
const linkInBioRoutes         = require('./routes/linkInBio');
const certificatesRoutes      = require('./routes/certificates');
const barcodesRoutes          = require('./routes/barcodes');
const colorPalettesRoutes     = require('./routes/colorPalettes');
// Batch 5
const quizBuilderRoutes       = require('./routes/quizBuilder');
const popupBuilderRoutes      = require('./routes/popupBuilder');
const aiDocumentsRoutes       = require('./routes/aiDocuments');
const chatbotBuilderRoutes    = require('./routes/chatbotBuilder');
const meetingNotesRoutes      = require('./routes/meetingNotes');
const aiKnowledgeBaseRoutes   = require('./routes/aiKnowledgeBase');
const aiCustomerSupportRoutes = require('./routes/aiCustomerSupport');
const aiTranslatorRoutes      = require('./routes/aiTranslator');
// Batch 6 — SEO + Utilities
const seoRoutes               = require('./routes/seo');
const pdfToolsRoutes          = require('./routes/pdfTools');
// Batch 7 — Design, Storage, Marketplace
const cloudStorageRoutes      = require('./routes/cloudStorage');
const workflowAutomationRoutes = require('./routes/workflowAutomation');
const marketplaceRoutes       = require('./routes/marketplace');
// Batch 8 — LMS, School, Store
const lmsRoutes               = require('./routes/lms');
const schoolRoutes            = require('./routes/school');
const assignmentsRoutes2      = require('./routes/assignments');
const cbtRoutes               = require('./routes/cbt');
const storeBuilderRoutes      = require('./routes/storeBuilder');

const app = express();

app.set('trust proxy', 1); // we sit behind OpenLiteSpeed
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '200kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// AI documents are shared across writer/email/proposal/blog modules,
// so use a generic access check whose message doesn't hard-code one slug.
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

app.get('/api/v1/health', (req, res) => res.json({ ok: true }));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/modules', moduleRoutes);
app.use('/api/v1/crm', crmRoutes);
app.use('/api/v1/pm', requireAuth, requireModuleAccess('project-management'), pmRoutes);
app.use('/api/v1/team', teamRoutes);
app.use('/api/v1/invoices', invoicesRoutes);
app.use('/api/v1/email', emailRoutes);
app.use('/api/v1/leads', leadsRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/white-label', whiteLabelRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/pages', pagesRoutes);
app.use('/api/v1/funnels', requireAuth, requireModuleAccess('funnel-builder'), funnelsRoutes);
app.use('/api/v1/hr', requireAuth, requireModuleAccess('hr'), hrRoutes);
app.use('/api/v1/appointments', appointmentsRoutes);
app.use('/api/v1/expenses', requireAuth, requireModuleAccess('expenses'), expensesRoutes);
app.use('/api/v1/recruitment', requireAuth, requireModuleAccess('recruitment'), recruitmentRoutes);
app.use('/api/v1/accounting', requireAuth, requireModuleAccess('accounting'), accountingRoutes);
app.use('/api/v1/portal',      portalRoutes);
app.use('/api/v1/automation',  requireAuth, requireModuleAccess('marketing-automation'), automationRoutes);
app.use('/api/v1/whatsapp',    requireAuth, requireModuleAccess('whatsapp-marketing'), whatsappRoutes);
app.use('/api/v1/affiliates',  requireAuth, requireModuleAccess('affiliate-system'), affiliatesRoutes);
app.use('/api/v1/referrals',   requireAuth, requireModuleAccess('referral-program'), referralsRoutes);
app.use('/api/v1/inventory',     requireAuth, requireModuleAccess('inventory'), inventoryRoutes);
app.use('/api/v1/pos',           requireAuth, requireModuleAccess('pos'), posRoutes);
app.use('/api/v1/quotations',    requireAuth, requireModuleAccess('quotations'), quotationsRoutes);
app.use('/api/v1/tasks',         requireAuth, requireModuleAccess('task-management'), tasksRoutes);
app.use('/api/v1/forms',         formsRoutes);
app.use('/api/v1/helpdesk',      requireAuth, requireModuleAccess('help-desk'), helpdeskRoutes);
app.use('/api/v1/sms',           requireAuth, requireModuleAccess('sms-marketing'), smsRoutes);
app.use('/api/v1/calendar',      requireAuth, requireModuleAccess('calendar'), calendarRoutes);
app.use('/api/v1/time-tracking', requireAuth, requireModuleAccess('time-tracking'), timeTrackingRoutes);
app.use('/api/v1/notes',         requireAuth, requireModuleAccess('notes'), notesRoutes);
app.use('/api/v1/kb',            requireAuth, requireModuleAccess('knowledge-base'), knowledgeBaseRoutes);
app.use('/api/v1/coupons',       requireAuth, requireModuleAccess('coupons'), couponsRoutes);
app.use('/api/v1/url-shortener', requireAuth, requireModuleAccess('url-shortener'), urlShortenerRoutes);
app.use('/api/v1/assets',        requireAuth, requireModuleAccess('asset-management'), assetsRoutes);
app.use('/api/v1/images',        imagesRoutes);
app.use('/api/v1/page-templates', requireAuth, requireModuleAccess('website-builder'), templatesRoutes);
app.use('/api/v1/site-templates', requireAuth, requireModuleAccess('website-builder'), siteTemplatesRoutes);
app.use('/api/v1/email-templates', requireAuth, requireModuleAccess('email-marketing'), emailTemplatesRoutes);
app.use('/api/v1/orders',        requireAuth, requireModuleAccess('order-management'), ordersRoutes);
app.use('/api/v1/documents',       requireAuth, requireModuleAccess('document-management'), documentsRoutes);
app.use('/api/v1/payroll',         requireAuth, requireModuleAccess('payroll'), payrollRoutes);
app.use('/api/v1/customer-subs',   requireAuth, requireModuleAccess('subscriptions'), subscriptionsRoutes);
app.use('/api/v1/delivery',        requireAuth, requireModuleAccess('delivery-tracking'), deliveryRoutes);
app.use('/api/v1/brand-kit',       requireAuth, requireModuleAccess('brand-kit'), brandKitRoutes);
app.use('/api/v1/saved-designs',   savedDesignsRoutes);
app.use('/api/v1/password-manager',requireAuth, requireModuleAccess('password-manager'), passwordMgrRoutes);
app.use('/api/v1/digital-products',requireAuth, requireModuleAccess('digital-products'), digitalProductsRoutes);
app.use('/api/v1/qr-codes',        requireAuth, requireModuleAccess('qr-code-generator'), qrCodesRoutes);
app.use('/api/v1/custom-reports',   requireAuth, requireModuleAccess('custom-reports'), customReportsRoutes);
// Batch 4
app.use('/api/v1/sales-dashboard',    requireAuth, requireModuleAccess('sales-dashboard'), salesDashboardRoutes);
app.use('/api/v1/marketing-dashboard',requireAuth, requireModuleAccess('marketing-dashboard'), marketingDashboardRoutes);
app.use('/api/v1/website-analytics',  requireAuth, requireModuleAccess('website-analytics'), websiteAnalyticsRoutes);
app.use('/api/v1/perf-reports',       requireAuth, requireModuleAccess('performance-reports'), perfReportsRoutes);
app.use('/api/v1/biz-cards',          requireAuth, requireModuleAccess('digital-business-cards'), bizCardsRoutes);
app.use('/api/v1/link-in-bio',        requireAuth, requireModuleAccess('link-in-bio'), linkInBioRoutes);
app.use('/api/v1/certificates',       requireAuth, requireModuleAccess('certificate-generator'), certificatesRoutes);
app.use('/api/v1/barcodes',           requireAuth, requireModuleAccess('barcode-generator'), barcodesRoutes);
app.use('/api/v1/color-palettes',     requireAuth, requireModuleAccess('color-palette-generator'), colorPalettesRoutes);
// Batch 5
// Auth/module-access gating for quiz-builder lives inside quizBuilderRoutes
// itself (after its public quiz-taking routes), matching the storeBuilder
// pattern, so anonymous respondents can reach /public/:id and /:quizId/respond.
app.use('/api/v1/quiz-builder',       quizBuilderRoutes);
app.use('/api/v1/popup-builder',      requireAuth, requireModuleAccess('popup-builder'), popupBuilderRoutes);
app.use('/api/v1/ai-documents', requireAuth, requireAiDocuments, aiDocumentsRoutes);
app.use('/api/v1/chatbot-builder',    requireAuth, requireModuleAccess('ai-chatbot-builder'), chatbotBuilderRoutes);
app.use('/api/v1/meeting-notes',      requireAuth, requireModuleAccess('ai-meeting-notes'), meetingNotesRoutes);
app.use('/api/v1/ai-kb',              requireAuth, requireModuleAccess('ai-knowledge-base'), aiKnowledgeBaseRoutes);
app.use('/api/v1/ai-support',         requireAuth, requireModuleAccess('ai-customer-support'), aiCustomerSupportRoutes);
app.use('/api/v1/ai-translator',      requireAuth, requireModuleAccess('ai-translator'), aiTranslatorRoutes);
// Batch 6
app.use('/api/v1/seo',                requireAuth, requireModuleAccess('seo-audit'), seoRoutes);
app.use('/api/v1/pdf',                requireAuth, requireModuleAccess('pdf-tools'), pdfToolsRoutes);
// Batch 7
app.use('/api/v1/storage',            requireAuth, requireModuleAccess('cloud-storage'), cloudStorageRoutes);
app.use('/api/v1/workflows',          requireAuth, requireModuleAccess('workflow-automation'), workflowAutomationRoutes);
app.use('/api/v1/marketplace',        requireAuth, requireModuleAccess('marketplace'), marketplaceRoutes);
// Batch 8
app.use('/api/v1/lms',                requireAuth, requireModuleAccess('learning-management-system'), lmsRoutes);
app.use('/api/v1/school',             requireAuth, requireModuleAccess('school-management'), schoolRoutes);
app.use('/api/v1/school-assignments', requireAuth, requireModuleAccess('assignments'), assignmentsRoutes2);
app.use('/api/v1/cbt',                requireAuth, requireModuleAccess('cbt-platform'), cbtRoutes);
// Auth/module-access gating for store-builder lives inside storeBuilderRoutes
// itself (after its public storefront routes), matching the pagesRoutes
// pattern, so unauthenticated shoppers can reach /public/:orgId and checkout.
app.use('/api/v1/store-builder',      storeBuilderRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found.' }));

// Centralised error handler — never leak stack traces to the client in production.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our end.' });
});

module.exports = app;
