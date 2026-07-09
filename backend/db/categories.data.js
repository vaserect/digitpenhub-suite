// ── Complete Module Registry: 288 modules across 21 categories ───────────────
//
// Single source of truth for the entire module catalog. Used by seed.js to
// populate the database, which the frontend reads via GET /api/v1/modules.
// Adding a new category or module = adding it here, re-running the seed, and
// the dashboard picks it up with zero code changes.

// ── Active modules ────────────────────────────────────────────────────────────
// Modules in this set get status='active' in the DB. Everything else is
// status='coming_soon'. The 97 existing modules remain active; the 191 new
// ones start as coming_soon until their backend implementations land.
const ACTIVE = new Set([
  // ── Marketing (20 active) ──
  'CRM', 'Lead Generation', 'Landing Page Builder', 'Website Builder',
  'Funnel Builder', 'Email Marketing', 'SMS Marketing', 'WhatsApp Marketing',
  'Marketing Automation', 'Affiliate System', 'Referral Program',
  'Appointment Booking', 'Forms', 'Popup Builder', 'Survey Builder',
  'Quiz Builder', 'URL Shortener', 'QR Code Generator', 'Link-in-Bio',
  'Digital Business Cards',
  // ── AI (9 active) ──
  'AI Writer', 'AI Chatbot Builder', 'AI Email Assistant',
  'AI Proposal Generator', 'AI Blog Generator', 'AI Translator',
  'AI Meeting Notes', 'AI Knowledge Base', 'AI Customer Support',
  // ── SEO + SEM (8 active) ──
  'Keyword Research', 'Rank Tracking', 'SEO Audit', 'Backlink Monitoring',
  'Schema Generator', 'Meta Generator', 'Sitemap Generator', 'Robots Generator',
  // ── Creative (9 active) ──
  'Graphic Design Editor', 'Brand Kit', 'Logo Maker', 'Flyer Builder',
  'Certificate Generator', 'Resume Builder', 'Image Compression',
  'Background Removal', 'Basic Video Editor',
  // ── Business (16 active) ──
  'Accounting', 'Invoices', 'Quotations', 'Expenses', 'Payroll', 'Inventory',
  'POS', 'Asset Management', 'HR', 'Recruitment', 'Project Management',
  'Task Management', 'Help Desk', 'Knowledge Base', 'Client Portal',
  'Document Management',
  // ── Education (8 active) ──
  'Learning Management System', 'School Management', 'CBT Platform',
  'Assignments', 'Student Portal', 'Teacher Portal', 'Parent Portal',
  'Certificates',
  // ── Commerce (7 active) ──
  'Online Store Builder', 'Marketplace', 'Order Management', 'Coupons',
  'Subscriptions', 'Digital Products', 'Delivery Tracking',
  // ── Productivity (6 active) ──
  'Calendar', 'Notes', 'File Manager', 'Cloud Storage',
  'Workflow Automation', 'Time Tracking',
  // ── Analytics (6 active) ──
  'Business Dashboard', 'Marketing Dashboard', 'Sales Dashboard',
  'Website Analytics', 'Performance Reports', 'Custom Reports',
  // ── Utilities (8 active) ──
  'PDF Tools', 'Image Converter', 'File Converter', 'Barcode Generator',
  'Password Manager', 'Password Generator', 'JSON Formatter',
  'Color Palette Generator',
]);

// ── Routes map ───────────────────────────────────────────────────────────────
// Frontend route for each module. New modules use the slug-based pattern;
// existing ones keep their legacy routes where they differ.
const ROUTES = {
  CRM: '/modules/crm',
  'Project Management': '/modules/pm',
  Invoices: '/modules/invoices',
  'Online Store Builder': '/modules/online-store-builder',
  'Landing Page Builder': '/modules/landing-page-builder',
  'Website Builder': '/modules/website-builder',
  'Email Marketing': '/modules/email-marketing',
  'Lead Generation': '/modules/lead-generation',
  'Appointment Booking': '/modules/appointment-booking',
  Forms: '/modules/forms',
  'Funnel Builder': '/modules/funnel-builder',
  HR: '/modules/hr',
  'Help Desk': '/modules/help-desk',
  'Task Management': '/modules/task-management',
  'Knowledge Base': '/modules/knowledge-base',
  'Client Portal': '/modules/client-portal',
  Accounting: '/modules/accounting',
  Expenses: '/modules/expenses',
  Quotations: '/modules/quotations',
  Inventory: '/modules/inventory',
  'QR Code Generator': '/modules/qr-code-generator',
  'Barcode Generator': '/modules/barcode-generator',
  'Digital Business Cards': '/modules/digital-business-cards',
  'Link-in-Bio': '/modules/link-in-bio',
  Payroll: '/modules/payroll',
  Subscriptions: '/modules/subscriptions',
  Coupons: '/modules/coupons',
  'Order Management': '/modules/order-management',
  'Delivery Tracking': '/modules/delivery-tracking',
  'Digital Products': '/modules/digital-products',
  'Password Manager': '/modules/password-manager',
  'Brand Kit': '/modules/brand-kit',
  'Marketing Automation': '/modules/marketing-automation',
  POS: '/modules/pos',
  Recruitment: '/modules/recruitment',
  'SMS Marketing': '/modules/sms-marketing',
  'WhatsApp Marketing': '/modules/whatsapp-marketing',
  'Affiliate System': '/modules/affiliate-system',
  'Referral Program': '/modules/referral-program',
  'Asset Management': '/modules/asset-management',
  Calendar: '/modules/calendar',
  'Time Tracking': '/modules/time-tracking',
  Notes: '/modules/notes',
  'Document Management': '/modules/document-management',
  'Custom Reports': '/modules/custom-reports',
  'Sales Dashboard': '/modules/sales-dashboard',
  'Marketing Dashboard': '/modules/marketing-dashboard',
  'Website Analytics': '/modules/website-analytics',
  'Performance Reports': '/modules/performance-reports',
  'Certificate Generator': '/modules/certificate-generator',
  'Color Palette Generator': '/modules/color-palette-generator',
  'Quiz Builder': '/modules/quiz-builder',
  'Popup Builder': '/modules/popup-builder',
  'AI Writer': '/modules/ai-writer',
  'AI Email Assistant': '/modules/ai-email-assistant',
  'AI Proposal Generator': '/modules/ai-proposal-generator',
  'AI Blog Generator': '/modules/ai-blog-generator',
  'AI Chatbot Builder': '/modules/ai-chatbot-builder',
  'AI Meeting Notes': '/modules/ai-meeting-notes',
  'AI Knowledge Base': '/modules/ai-knowledge-base',
  'AI Customer Support': '/modules/ai-customer-support',
  'AI Translator': '/modules/ai-translator',
  'PDF Tools': '/modules/pdf-tools',
  'Image Converter': '/modules/image-converter',
  'File Converter': '/modules/file-converter',
  'JSON Formatter': '/modules/json-formatter',
  'Password Generator': '/modules/password-generator',
  'Image Compression': '/modules/image-compression',
  'Background Removal': '/modules/background-removal',
  'Basic Video Editor': '/modules/basic-video-editor',
  'Cloud Storage': '/modules/cloud-storage',
  'File Manager': '/modules/file-manager',
  'Workflow Automation': '/modules/workflow-automation',
  Marketplace: '/modules/marketplace',
  'Learning Management System': '/modules/learning-management-system',
  'School Management': '/modules/school-management',
  'CBT Platform': '/modules/cbt-platform',
  Assignments: '/modules/assignments',
  'Student Portal': '/modules/student-portal',
  'Teacher Portal': '/modules/teacher-portal',
  'Parent Portal': '/modules/parent-portal',
  Certificates: '/modules/certificates',
  'Keyword Research': '/modules/keyword-research',
  'Rank Tracking': '/modules/rank-tracking',
  'SEO Audit': '/modules/seo-audit',
  'Backlink Monitoring': '/modules/backlink-monitoring',
  'Schema Generator': '/modules/schema-generator',
  'Meta Generator': '/modules/meta-generator',
  'Sitemap Generator': '/modules/sitemap-generator',
  'Robots Generator': '/modules/robots-generator',
  'Graphic Design Editor': '/modules/graphic-design-editor',
  'Logo Maker': '/modules/logo-maker',
  'Flyer Builder': '/modules/flyer-builder',
  'Resume Builder': '/modules/resume-builder',
  'Survey Builder': '/modules/survey-builder',
};

// ── Categories ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. PLATFORM ADMINISTRATION (8 modules — super-admin only)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'platform-admin', name: 'Platform Administration', badge: 'PA', modules: [
    'Super Admin Panel',
    'Add-On & Third-Party Integration Marketplace Manager',
    'Impersonation & Support Tools',
    'Agency / Reseller White-Label Mode',
    'Vulnerability Scanning Dashboard',
    'Security Incident Response Runbook Tool',
    'In-App Feedback Widget',
    'Changelog / Release Notes Automation',
  ]},

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. PLATFORM CORE (20 modules — workspace-facing infrastructure)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'platform-core', name: 'Platform Core', badge: 'PC', modules: [
    'Custom Fields Engine',
    'Global Search',
    'Digital Asset Management (DAM)',
    'Approval Workflow Engine',
    'Unified Inbox',
    'Cross-Module Activity Feed',
    'Bulk Data Import Wizard',
    'Notification Center',
    'Visual Workflow / Automation Builder',
    'Public API + Webhooks Manager',
    'No-Code Database / Data Tables',
    'Sandbox / Staging Workspace',
    'Workspace Cloning',
    'Template / Blueprint Marketplace',
    'Guided Data Migration Tool',
    'Zapier / Make Native Connector',
    'Granular Role-Based Permissions',
    'Feature Flags & A/B Experimentation Engine',
    'Knowledge Graph / Entity Relationship Mapping',
    'Internal Tooling / Script Library',
  ]},

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. INTEGRATIONS & DEVELOPER ECOSYSTEM (4 modules — NEW category)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'integrations', name: 'Integrations & Developer Ecosystem', badge: 'ID', modules: [
    'Native Integrations Hub',
    'Public Developer Portal + App Submission Pipeline',
    'Sandbox API Playground',
    'OAuth App Directory',
  ]},

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. MARKETING (40 modules)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'marketing', name: 'Marketing', badge: 'MK', modules: [
    'CRM',
    'Lead Generation',
    'Landing Page Builder',
    'Website Builder',
    'Funnel Builder',
    'Email Marketing',
    'SMS Marketing',
    'WhatsApp Marketing',
    'Marketing Automation',
    'Affiliate System',
    'Referral Program',
    'Appointment Booking',
    'Forms',
    'Popup Builder',
    'Survey Builder',
    'Quiz Builder',
    'URL Shortener',
    'QR Code Generator',
    'Link-in-Bio',
    'Digital Business Cards',
    // ── New Marketing modules ──
    'Social Media Scheduler',
    'Review Management',
    'Chatbot Builder',
    'Ad Campaign Manager',
    'Lead Scoring',
    'Pipeline / Deals',
    'Referral & Affiliate Analytics Dashboard',
    'Landing Page Heat/Scroll Analytics',
    'Content Calendar',
    'Influencer/Partner CRM',
    'Push Notification Marketing',
    'Customer Segmentation Engine',
    'Membership / Community Platform',
    'Event / Webinar Hosting',
    'Sales Playbook / Battlecard Library',
    'Ambassador Program',
    'Direct Mail Automation',
    'Print Fulfillment for Business Cards/Signage',
    'Creative A/B Testing Studio',
    'UGC/Creator Content Aggregator',
  ]},

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. AI (22 modules)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'ai', name: 'AI', badge: 'AI', modules: [
    'AI Writer',
    'AI Chatbot Builder',
    'AI Email Assistant',
    'AI Proposal Generator',
    'AI Blog Generator',
    'AI Translator',
    'AI Meeting Notes',
    'AI Knowledge Base',
    'AI Customer Support',
    // ── New AI modules ──
    'AI Image Generator',
    'AI Voice Transcription & Summarization',
    'AI Data Enrichment',
    'AI Workflow Suggestions',
    'AI Content Repurposing',
    'Predictive Sales Forecasting',
    'Churn Prediction',
    'Anomaly Detection',
    'AI Voice Agent',
    'AI Data Analyst',
    'AI Sales Call Coach',
    'Cross-Sell/Upsell Recommendation Engine',
    'AI Avatar / Spokesperson Video Generator',
  ]},

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. SEO + SEM (16 modules)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'seo', name: 'SEO + SEM', badge: 'SE', modules: [
    'Keyword Research',
    'SEO Audit',
    'Rank Tracking',
    'Backlink Monitoring',
    'Schema Generator',
    'Sitemap Generator',
    'Meta Generator',
    'Robots Generator',
    // ── New SEO modules ──
    'Google Search Console Integration',
    'Bing Webmaster Tools Integration',
    'Local SEO / Google Business Profile Manager',
    'Page Speed & Core Web Vitals Monitor',
    'SEM / Ad Campaign Bid & ROAS Tracker',
    'AI SEO Content Optimizer',
    'Accessibility (WCAG) Audit Tool',
    'Voice Search / Voice Commerce Optimization',
  ]},

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. CREATIVE (9 modules)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'creative', name: 'Creative', badge: 'CR', modules: [
    'Graphic Design Editor',
    'Brand Kit',
    'Logo Maker',
    'Flyer Builder',
    'Certificate Generator',
    'Resume Builder',
    'Image Compression',
    'Background Removal',
    'Basic Video Editor',
  ]},

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. BUSINESS (36 modules)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'business', name: 'Business', badge: 'BI', modules: [
    'Accounting',
    'Invoices',
    'Quotations',
    'Expenses',
    'Payroll',
    'Inventory',
    'POS',
    'Asset Management',
    'HR',
    'Recruitment',
    'Project Management',
    'Task Management',
    'Help Desk',
    'Knowledge Base',
    'Client Portal',
    'Document Management',
    // ── New Business modules ──
    'Contract / Vendor Management',
    'Procurement / Purchase Orders',
    'Multi-location / Franchise Management',
    'Compliance / Document Expiry Tracker',
    'Shift Scheduling',
    'Resource & Equipment Booking',
    'Field Service Management',
    'E-Signature / Contracts',
    'Internal Wiki / Employee Knowledge Base',
    'OKR / Goal Tracking',
    'Job Board / External Talent Marketplace',
    'Employee Benefits Administration',
    'Background Check Integration',
    'Offboarding Checklist + Equipment/Asset Return Tracking',
    'Employee Wellness Programs',
    'DEI Reporting Dashboard',
    'Return-to-Office / Desk Booking',
    'Legal Template Library',
    'Trademark/IP Asset Tracker',
    'Supplier/Partner Portal',
  ]},

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. EDUCATION (12 modules)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'education', name: 'Education', badge: 'ED', modules: [
    'Learning Management System',
    'School Management',
    'CBT Platform',
    'Assignments',
    'Student Portal',
    'Teacher Portal',
    'Parent Portal',
    'Certificates',
    // ── New Education modules ──
    'Cohort / Live Class Scheduling',
    'Discussion Forums per Course',
    'Gradebook Analytics for Parents/Admins',
    'Plagiarism / AI-Content Detection',
  ]},

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. COMMERCE (19 modules)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'commerce', name: 'Commerce', badge: 'CO', modules: [
    'Online Store Builder',
    'Order Management',
    'Marketplace',
    'Coupons',
    'Subscriptions',
    'Digital Products',
    'Delivery Tracking',
    // ── New Commerce modules ──
    'POS ↔ Online Store Inventory Sync',
    'Multi-vendor Marketplace Payouts',
    'Gift Cards',
    'Wishlist / Save-for-later',
    'Product Reviews & Q&A',
    'Warranty & RMA Management',
    'Loyalty & Rewards Program',
    'Print-on-Demand Integration',
    'Dropshipping Supplier Integration',
    'Shipping Label Printing + Carrier Rate Shopping',
    'Warranty Registration Portal',
    'Marketplace Dispute Resolution',
  ]},

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. PRODUCTIVITY (11 modules)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'productivity', name: 'Productivity', badge: 'PR', modules: [
    'Calendar',
    'Notes',
    'File Manager',
    'Cloud Storage',
    'Workflow Automation',
    'Time Tracking',
    // ── New Productivity modules ──
    'Collaborative Document Co-editing',
    'Whiteboard / Mind-Mapping Tool',
    'Internal People/Skills Directory',
    'Idea Management / Suggestion Box',
    'Multi-timezone Meeting Coordinator',
  ]},

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. ANALYTICS (11 modules)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'analytics', name: 'Analytics', badge: 'AN', modules: [
    'Business Dashboard',
    'Marketing Dashboard',
    'Sales Dashboard',
    'Website Analytics',
    'Performance Reports',
    'Custom Reports',
    // ── New Analytics modules ──
    'Heatmaps / Session Recording',
    'Data Warehouse Connector / Export',
    'Custom SQL / Query Builder',
    'Scheduled Report Emails/PDFs',
    'Cohort & Retention Analysis',
  ]},

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. UTILITIES (8 modules)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'utilities', name: 'Utilities', badge: 'UT', modules: [
    'PDF Tools',
    'File Converter',
    'Barcode Generator',
    'Password Manager',
    'Password Generator',
    'JSON Formatter',
    'Color Palette Generator',
    'Image Converter',
  ]},

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. TRUST, COMPLIANCE & LOCALIZATION (20 modules — NEW category)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'trust-compliance', name: 'Trust, Compliance & Localization', badge: 'TC', modules: [
    'GDPR/CCPA Data Request Center',
    'Consent & Cookie Management',
    'Backup & Disaster Recovery Console',
    'Public Status Page',
    'Terms & Policy Version Tracking',
    'Customer-Facing Audit Trail Export',
    'RTL Language Layout Support',
    'ESG / Sustainability Reporting',
    'Multi-language Workspace UI',
    'Regional Tax/Compliance Packs',
    'Localized Payment Methods',
    'Enterprise SSO / SAML',
    'Master Data Management / Deduplication Engine',
    'Data Residency Selector',
    'BYOK Encryption Key Management',
    'SOC2/ISO27001 Compliance Evidence Dashboard',
    'Data Export Portability Suite',
    'Regulatory Change Monitoring',
    'Carbon Footprint / Sustainability Tracker for Operations',
    'Localization / Translation Management',
  ]},

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. SUPPORT & SUCCESS (7 modules — NEW category)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'support-success', name: 'Support & Success', badge: 'SS', modules: [
    'NPS / CSAT Survey Automation',
    'Customer Health Score',
    'SLA Management',
    'Public Roadmap / Feature Request Board',
    'Live Chat',
    'Built-in Voice & Video Calling',
    'Internal Team Messaging',
  ]},

  // ═══════════════════════════════════════════════════════════════════════════
  // 16. FINANCE — ADVANCED (20 modules — NEW category)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'finance-advanced', name: 'Finance — Advanced', badge: 'FA', modules: [
    'Multi-entity Accounting',
    'Budget Planning & Forecasting',
    'Bill Pay / Accounts Payable Automation',
    'Financing / Lending Integration',
    'Tax Filing Prep Export',
    'FX / Currency Hedging Alerts',
    'Corporate Card / Expense Card Issuing',
    'Vendor Risk Scorecard',
    'Dunning Management',
    'Usage-Based / Metered Billing Dashboard',
    'Revenue Recognition Automation',
    'Subscription Pause/Skip Self-Service',
    'Fraud Detection Engine',
    'Chargeback & Dispute Management',
    'Identity Verification / KYC',
    'Sales Tax Nexus & Compliance Tracker',
    'International Contractor Payments',
    'Multi-country Payroll Compliance Packs',
    'Cap Table / Equity Management',
    'Board / Investor Reporting Portal',
  ]},

  // ═══════════════════════════════════════════════════════════════════════════
  // 17. GAMIFICATION & ENGAGEMENT (4 modules — NEW category)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'gamification', name: 'Gamification & Engagement', badge: 'GM', modules: [
    'Achievement / Badge System',
    'Leaderboards',
    'Streaks / Habit Tracking',
    'Product Tour / Onboarding Checklist Builder',
  ]},

  // ═══════════════════════════════════════════════════════════════════════════
  // 18. MOBILE & ACCESS (3 modules — NEW category)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'mobile-access', name: 'Mobile & Access', badge: 'MA', modules: [
    'Native Mobile App',
    'Offline Mode',
    'White-Label Mobile App Builder',
  ]},

  // ═══════════════════════════════════════════════════════════════════════════
  // 19. MEDIA & CONTENT PRODUCTION (5 modules — NEW category)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'media-production', name: 'Media & Content Production', badge: 'MP', modules: [
    'Podcast Hosting',
    'Video Hosting/Streaming',
    'Interactive Product Demo Builder',
    'In-Product Guided Tours Editor',
    'Print/Publishing Workflow',
  ]},

  // ═══════════════════════════════════════════════════════════════════════════
  // 20. NON-PROFIT & CIVIC (3 modules — NEW category)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'nonprofit-civic', name: 'Non-Profit & Civic', badge: 'NC', modules: [
    'Donation Management',
    'Volunteer Management',
    'Grant Tracking',
  ]},

  // ═══════════════════════════════════════════════════════════════════════════
  // 21. EXTENDED VERTICAL MODULES (10 modules — NEW category)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'extended-vertical', name: 'Extended Vertical Modules', badge: 'EV', modules: [
    'Legal Practice Management',
    'Insurance Policy & Claims Management',
    'Manufacturing / Quality Control',
    'Travel & Hospitality Booking',
    'Property Management',
    'IoT / Hardware Device Integration',
    'Agriculture/Farm Management',
    'Esports/Gaming Community Tools',
    'Religious/Congregation Management',
    'Government/RFP Response Management',
  ]},
];

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ── Validation — verify the 288 count ─────────────────────────────────────────
const total = CATEGORIES.reduce((sum, c) => sum + c.modules.length, 0);
const activeCount = [...ACTIVE].length;
const newCount = total - activeCount;
if (total !== 288) {
  console.warn(`WARNING: Expected 288 modules, got ${total} (${activeCount} active + ${newCount} new). Check categories.data.js.`);
} else {
  // Verified during require — totals are correct.
}

module.exports = { CATEGORIES, ACTIVE, ROUTES, slugify };
