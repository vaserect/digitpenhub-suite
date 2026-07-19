// ── Complete Module Registry: 288 modules across 21 categories ───────────────
//
// Single source of truth for the entire module catalog. Used by seed.js to
// populate the database, which the frontend reads via GET /api/v1/modules.
// Adding a new category or module = adding it here, re-running the seed, and
// the dashboard picks it up with zero code changes.

// ── Active modules ────────────────────────────────────────────────────────────
// Modules in this set get status='active' in the DB. This includes every module
// that has a working backend route (Express route in app.js), a GenericModule
// API_MAP entry, or an AppShell inline component. "coming_soon" is reserved for
// modules with zero backend code. All 288 modules should be active if they route.
// Actively exclude only tier-3 (Platform Admin) modules with no controller.
const ACTIVE = new Set([
  // ── Marketing ──
  'CRM', 'Lead Generation', 'Landing Page Builder', 'Website Builder',
  'Funnel Builder', 'Email Marketing', 'SMS Marketing', 'WhatsApp Marketing',
  'Marketing Automation', 'Affiliate System', 'Referral Program',
  'Appointment Booking', 'Forms', 'Popup Builder', 'Survey Builder',
  'Quiz Builder', 'URL Shortener', 'QR Code Generator', 'Link-in-Bio',
  'Digital Business Cards',
  'Social Media Scheduler', 'Review Management', 'Chatbot Builder',
  'Ad Campaign Manager', 'Lead Scoring', 'Pipeline / Deals',
  'Referral & Affiliate Analytics Dashboard', 'Landing Page Heat/Scroll Analytics',
  'Content Calendar', 'Influencer/Partner CRM', 'Push Notification Marketing',
  'Customer Segmentation Engine', 'Membership / Community Platform',
  'Event / Webinar Hosting', 'Sales Playbook / Battlecard Library',
  'Ambassador Program', 'Direct Mail Automation',
  'Print Fulfillment for Business Cards/Signage',
  'Creative A/B Testing Studio', 'UGC/Creator Content Aggregator',
  // ── AI ──
  'AI Writer', 'AI Chatbot Builder', 'AI Email Assistant',
  'AI Proposal Generator', 'AI Blog Generator', 'AI Translator',
  'AI Meeting Notes', 'AI Knowledge Base', 'AI Customer Support',
  'AI Image Generator', 'AI Voice Transcription & Summarization',
  'AI Data Enrichment', 'AI Workflow Suggestions', 'AI Content Repurposing',
  'Predictive Sales Forecasting', 'Churn Prediction', 'Anomaly Detection',
  'AI Voice Agent', 'AI Data Analyst', 'AI Sales Call Coach',
  'Cross-Sell/Upsell Recommendation Engine',
  'AI Avatar / Spokesperson Video Generator',
  // ── SEO + SEM ──
  'Keyword Research', 'Rank Tracking', 'SEO Audit', 'Backlink Monitoring',
  'Schema Generator', 'Meta Generator', 'Sitemap Generator', 'Robots Generator',
  'Google Search Console Integration', 'Bing Webmaster Tools Integration',
  'Local SEO / Google Business Profile Manager',
  'Page Speed & Core Web Vitals Monitor',
  'SEM / Ad Campaign Bid & ROAS Tracker', 'AI SEO Content Optimizer',
  'Accessibility (WCAG) Audit Tool', 'Voice Search / Voice Commerce Optimization',
  // ── Creative ──
  'Graphic Design Editor', 'Brand Kit', 'Logo Maker', 'Flyer Builder',
  'Certificate Generator', 'Resume Builder', 'Image Compression',
  'Background Removal', 'Basic Video Editor',
  // ── Business ──
  'Accounting', 'Invoices', 'Quotations', 'Expenses', 'Payroll', 'Inventory',
  'POS', 'Asset Management', 'HR', 'Recruitment', 'Project Management',
  'Task Management', 'Help Desk', 'Knowledge Base', 'Client Portal',
  'Document Management',
  'Contract / Vendor Management', 'Procurement / Purchase Orders',
  'Multi-location / Franchise Management', 'Compliance / Document Expiry Tracker',
  'Shift Scheduling', 'Resource & Equipment Booking', 'Field Service Management',
  'E-Signature / Contracts', 'Internal Wiki / Employee Knowledge Base',
  'OKR / Goal Tracking', 'Job Board / External Talent Marketplace',
  'Employee Benefits Administration', 'Background Check Integration',
  'Offboarding Checklist + Equipment/Asset Return Tracking',
  'Employee Wellness Programs', 'DEI Reporting Dashboard',
  'Return-to-Office / Desk Booking', 'Legal Template Library',
  'Trademark/IP Asset Tracker', 'Supplier/Partner Portal',
  // ── Education ──
  'Learning Management System', 'School Management', 'CBT Platform',
  'Assignments', 'Student Portal', 'Teacher Portal', 'Parent Portal',
  'Certificates',
  'Cohort / Live Class Scheduling', 'Discussion Forums per Course',
  'Gradebook Analytics for Parents/Admins', 'Plagiarism / AI-Content Detection',
  // ── Commerce ──
  'Online Store Builder', 'Marketplace', 'Order Management', 'Coupons',
  'Subscriptions', 'Digital Products', 'Delivery Tracking',
  'POS ↔ Online Store Inventory Sync', 'Multi-vendor Marketplace Payouts',
  'Gift Cards', 'Wishlist / Save-for-later', 'Product Reviews & Q&A',
  'Warranty & RMA Management', 'Loyalty & Rewards Program',
  'Print-on-Demand Integration', 'Dropshipping Supplier Integration',
  'Shipping Label Printing + Carrier Rate Shopping',
  'Warranty Registration Portal', 'Marketplace Dispute Resolution',
  // ── Platform Core ──
  'Custom Fields Engine', 'Global Search', 'Digital Asset Management (DAM)',
  'Approval Workflow Engine', 'Unified Inbox', 'Cross-Module Activity Feed',
  'Bulk Data Import Wizard', 'Notification Center',
  'Visual Workflow / Automation Builder', 'Public API + Webhooks Manager',
  'No-Code Database / Data Tables', 'Sandbox / Staging Workspace',
  'Workspace Cloning', 'Template / Blueprint Marketplace',
  'Guided Data Migration Tool', 'Zapier / Make Native Connector',
  'Granular Role-Based Permissions', 'Feature Flags & A/B Experimentation Engine',
  'Knowledge Graph / Entity Relationship Mapping', 'Internal Tooling / Script Library',
  // ── Integrations ──
  'Native Integrations Hub', 'Public Developer Portal + App Submission Pipeline',
  'Sandbox API Playground', 'OAuth App Directory',
  // ── Productivity ──
  'Calendar', 'Notes', 'File Manager', 'Cloud Storage',
  'Workflow Automation', 'Time Tracking',
  'Collaborative Document Co-editing', 'Whiteboard / Mind-Mapping Tool',
  'Internal People/Skills Directory', 'Idea Management / Suggestion Box',
  'Multi-timezone Meeting Coordinator',
  // ── Analytics ──
  'Business Dashboard', 'Marketing Dashboard', 'Sales Dashboard',
  'Website Analytics', 'Performance Reports', 'Custom Reports',
  'Heatmaps / Session Recording', 'Data Warehouse Connector / Export',
  'Custom SQL / Query Builder', 'Scheduled Report Emails/PDFs',
  'Cohort & Retention Analysis',
  // ── Utilities ──
  'PDF Tools', 'Image Converter', 'File Converter', 'Barcode Generator',
  'Password Manager', 'Password Generator', 'JSON Formatter',
  'Color Palette Generator',
  // ── Trust, Compliance & Localization ──
  'GDPR/CCPA Data Request Center', 'Consent & Cookie Management',
  'Backup & Disaster Recovery Console', 'Public Status Page',
  'Terms & Policy Version Tracking', 'Customer-Facing Audit Trail Export',
  'RTL Language Layout Support', 'ESG / Sustainability Reporting',
  'Multi-language Workspace UI', 'Regional Tax/Compliance Packs',
  'Localized Payment Methods', 'Enterprise SSO / SAML',
  'Master Data Management / Deduplication Engine', 'Data Residency Selector',
  'BYOK Encryption Key Management', 'SOC2/ISO27001 Compliance Evidence Dashboard',
  'Data Export Portability Suite', 'Regulatory Change Monitoring',
  'Carbon Footprint / Sustainability Tracker for Operations',
  'Localization / Translation Management',
  // ── Support & Success ──
  'NPS / CSAT Survey Automation', 'Customer Health Score', 'SLA Management',
  'Public Roadmap / Feature Request Board', 'Live Chat',
  'Built-in Voice & Video Calling', 'Internal Team Messaging',
  // ── Finance — Advanced ──
  'Multi-entity Accounting', 'Budget Planning & Forecasting',
  'Bill Pay / Accounts Payable Automation', 'Financing / Lending Integration',
  'Tax Filing Prep Export', 'FX / Currency Hedging Alerts',
  'Corporate Card / Expense Card Issuing', 'Vendor Risk Scorecard',
  'Dunning Management', 'Usage-Based / Metered Billing Dashboard',
  'Revenue Recognition Automation', 'Subscription Pause/Skip Self-Service',
  'Fraud Detection Engine', 'Chargeback & Dispute Management',
  'Identity Verification / KYC', 'Sales Tax Nexus & Compliance Tracker',
  'International Contractor Payments', 'Multi-country Payroll Compliance Packs',
  'Cap Table / Equity Management', 'Board / Investor Reporting Portal',
  // ── Gamification ──
  'Achievement / Badge System', 'Leaderboards', 'Streaks / Habit Tracking',
  'Product Tour / Onboarding Checklist Builder',
  // ── Mobile ──
  'Native Mobile App', 'Offline Mode', 'White-Label Mobile App Builder',
  // ── Media & Content Production ──
  'Podcast Hosting', 'Video Hosting/Streaming',
  'Interactive Product Demo Builder', 'In-Product Guided Tours Editor',
  'Print/Publishing Workflow',
  // ── Non-Profit ──
  'Donation Management', 'Volunteer Management', 'Grant Tracking',
  // ── Extended Vertical ──
  'Legal Practice Management', 'Insurance Policy & Claims Management',
  'Manufacturing / Quality Control', 'Travel & Hospitality Booking',
  'Property Management', 'IoT / Hardware Device Integration',
  'Agriculture/Farm Management', 'Esports/Gaming Community Tools',
  'Religious/Congregation Management', 'Government/RFP Response Management',
  // ── Workspace Settings (tier 2) — always active and always visible ──
  'Account & Security', 'Billing & Plans', 'Team / Roles', 'Notifications',
  'White Label', 'API Keys', 'Integrations', 'Feature Flags',
]);

// ── Routes map ───────────────────────────────────────────────────────────────
// Frontend route for each module. New modules use the slug-based pattern;
// existing ones keep their legacy routes where they differ.
const ROUTES = {
  'CRM': '/crm',
  'Lead Generation': '/lead-generation',
  'Landing Page Builder': '/modules/landing-page-builder',
  'Website Builder': '/website-builder',
  'Funnel Builder': '/funnel-builder',
  'Email Marketing': '/email-marketing',
  'SMS Marketing': '/sms-marketing',
  'WhatsApp Marketing': '/whatsapp-marketing',
  'Marketing Automation': '/modules/marketing-automation',
  'Affiliate System': '/modules/affiliate-system',
  'Referral Program': '/referral-program',
  'Appointment Booking': '/appointment-booking',
  'Forms': '/forms',
  'Popup Builder': '/popup-builder',
  'Survey Builder': '/survey-builder',
  'Quiz Builder': '/quiz-builder',
  'URL Shortener': '/url-shortener',
  'QR Code Generator': '/qr-code-generator',
  'Link-in-Bio': '/link-in-bio',
  'Digital Business Cards': '/digital-business-cards',
  'Social Media Scheduler': '/social-media-scheduler',
  'Review Management': '/review-management',
  'Chatbot Builder': '/chatbot-builder',
  'Ad Campaign Manager': '/modules/ad-campaign-manager',
  'Lead Scoring': '/lead-scoring',
  'Pipeline / Deals': '/pipeline-deals',
  'Content Calendar': '/modules/content-calendar',
  'Push Notification Marketing': '/modules/push-notification-marketing',
  'Ambassador Program': '/modules/ambassador-program',
  'Direct Mail Automation': '/modules/direct-mail-automation',
  'Brand Kit': '/brand-kit',
  'Certificate Generator': '/certificates',
  'Accounting': '/accounting',
  'Invoices': '/billing-invoices',
  'Quotations': '/quotations',
  'Expenses': '/expenses',
  'Payroll': '/payroll',
  'Inventory': '/inventory',
  'Asset Management': '/asset-management',
  'HR': '/hr',
  'Recruitment': '/recruitment',
  'Project Management': '/project-management',
  'Task Management': '/tasks',
  'Help Desk': '/help-desk',
  'Knowledge Base': '/knowledge-base',
  'Document Management': '/document-management',
  'Certificates': '/certificates',
  'Marketplace': '/marketplace',
  'Coupons': '/coupons',
  'Subscriptions': '/subscriptions',
  'Digital Products': '/digital-products',
  'Delivery Tracking': '/delivery-tracking',
  'Calendar': '/calendar',
  'Notes': '/notes',
  'Time Tracking': '/time-tracking',
  'Business Dashboard': '/business-dashboard',
  'Custom Reports': '/custom-reports',
  'Password Manager': '/password-manager',
  'Color Palette Generator': '/color-palettes',
  'Notifications': '/community/notifications',
};

// ── Tier classification ───────────────────────────────────────────────────────
//  1 = Workspace Module (customer-facing feature — counts toward module stats)
//  2 = Workspace Setting (account/config — separate sidebar section)
//  3 = Platform Administration (Super Admin — isolated route/layout/nav)
// Never tier 1 or 2 items in the same category — each category is one tier.

// ── Categories ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. PLATFORM ADMINISTRATION — Tier 3 (8 modules, isolated route, super admin)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'platform-admin', name: 'Platform Administration', badge: 'PA', tier: 3, modules: [
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
  // 2. PLATFORM CORE — Tier 1 (20 modules — workspace-facing infrastructure)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'platform-core', name: 'Platform Core', badge: 'PC', tier: 1, modules: [
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
  { key: 'integrations', name: 'Integrations & Developer Ecosystem', badge: 'ID', tier: 1, modules: [
    'Native Integrations Hub',
    'Public Developer Portal + App Submission Pipeline',
    'Sandbox API Playground',
    'OAuth App Directory',
  ]},

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. MARKETING (40 modules)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'marketing', name: 'Marketing', badge: 'MK', tier: 1, modules: [
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
  { key: 'ai', name: 'AI', badge: 'AI', tier: 1, modules: [
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
  { key: 'seo', name: 'SEO + SEM', badge: 'SE', tier: 1, modules: [
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
  { key: 'creative', name: 'Creative', badge: 'CR', tier: 1, modules: [
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
  // 8. BUSINESS — Tier 1 (36 modules)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'business', name: 'Business', badge: 'BI', tier: 1, modules: [
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
  { key: 'education', name: 'Education', badge: 'ED', tier: 1, modules: [
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
  { key: 'commerce', name: 'Commerce', badge: 'CO', tier: 1, modules: [
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
  { key: 'productivity', name: 'Productivity', badge: 'PR', tier: 1, modules: [
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
  { key: 'analytics', name: 'Analytics', badge: 'AN', tier: 1, modules: [
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
  { key: 'utilities', name: 'Utilities', badge: 'UT', tier: 1, modules: [
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
  { key: 'trust-compliance', name: 'Trust, Compliance & Localization', badge: 'TC', tier: 1, modules: [
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
  { key: 'support-success', name: 'Support & Success', badge: 'SS', tier: 1, modules: [
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
  { key: 'finance-advanced', name: 'Finance — Advanced', badge: 'FA', tier: 1, modules: [
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
  { key: 'gamification', name: 'Gamification & Engagement', badge: 'GM', tier: 1, modules: [
    'Achievement / Badge System',
    'Leaderboards',
    'Streaks / Habit Tracking',
    'Product Tour / Onboarding Checklist Builder',
  ]},

  // ═══════════════════════════════════════════════════════════════════════════
  // 18. MOBILE & ACCESS (3 modules — NEW category)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'mobile-access', name: 'Mobile & Access', badge: 'MA', tier: 1, modules: [
    'Native Mobile App',
    'Offline Mode',
    'White-Label Mobile App Builder',
  ]},

  // ═══════════════════════════════════════════════════════════════════════════
  // 19. MEDIA & CONTENT PRODUCTION (5 modules — NEW category)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'media-production', name: 'Media & Content Production', badge: 'MP', tier: 1, modules: [
    'Podcast Hosting',
    'Video Hosting/Streaming',
    'Interactive Product Demo Builder',
    'In-Product Guided Tours Editor',
    'Print/Publishing Workflow',
  ]},

  // ═══════════════════════════════════════════════════════════════════════════
  // 20. NON-PROFIT & CIVIC (3 modules — NEW category)
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'nonprofit-civic', name: 'Non-Profit & Civic', badge: 'NC', tier: 1, modules: [
    'Donation Management',
    'Volunteer Management',
    'Grant Tracking',
  ]},

  { key: 'extended-vertical', name: 'Extended Vertical Modules', badge: 'EV', tier: 1, modules: [
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

  // ═══════════════════════════════════════════════════════════════════════════
  // Tier 1 count: 280 modules across 19 categories (includes Platform Core + Integrations)
  // Tier 2 count: 8 workspace-facing settings — rendered separately
  // Tier 3 count: 8 modules in Platform Administration
  // Total: 288 (280 + 0 + 8)
  // Note: Tier 2 items are not counted in the 288 total as they are settings, not modules.

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKSPACE SETTINGS — Tier 2 (separate sidebar section, never in module counts)
  // These are not modules — they're account/workspace configuration pages.
  // Rendered in the sidebar footer as a visually distinct "Workspace" section.
  // ═══════════════════════════════════════════════════════════════════════════
  { key: 'settings', name: 'Workspace Settings', badge: 'ST', tier: 2, modules: [
    'Account & Security',
    'Billing & Plans',
    'Team / Roles',
    'Notifications',
    'White Label',
    'API Keys',
    'Integrations',
    'Feature Flags',
  ]},
];

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ── Validation — verify the 288 count (tier 1 + tier 3 only) ────────────────
// Tier 2 "Workspace Settings" items are not counted as modules — they're
// workspace configuration pages rendered separately in the sidebar footer.
const total = CATEGORIES
  .filter(c => c.tier !== 2)
  .reduce((sum, c) => sum + c.modules.length, 0);
const settingsCount = CATEGORIES
  .filter(c => c.tier === 2)
  .reduce((sum, c) => sum + c.modules.length, 0);
const activeCount = [...ACTIVE].length;
const newCount = total - activeCount;
if (total !== 288) {
  console.warn(`WARNING: Expected 288 modules (19 categories + Platform Admin), got ${total} (${settingsCount} settings items excluded as tier 2). Check categories.data.js.`);
} else {
  // Verified during require — totals are correct. Settings items (tier 2) are excluded.
}

module.exports = { CATEGORIES, ACTIVE, ROUTES, slugify };
