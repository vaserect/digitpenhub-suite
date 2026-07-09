-- Digitpen Hub Suite — Milestone 82: Module Registry Expansion
-- Adds 11 new categories and 191 new modules, bringing the total to
-- 21 categories and 288 modules.
--
-- Idempotent via INSERT … ON CONFLICT.

-- ═════════════════════════════════════════════════════════════════════════════
-- 1. PLATFORM ADMINISTRATION (8 modules — super-admin only)
-- ═════════════════════════════════════════════════════════════════════════════
INSERT INTO categories (key, name, badge, sort_order) VALUES
  ('platform-admin', 'Platform Administration', 'PA', 10)
ON CONFLICT (key) DO UPDATE SET name='Platform Administration', badge='PA', sort_order=10;

WITH cat AS (SELECT id FROM categories WHERE key = 'platform-admin')
INSERT INTO modules (category_id, name, slug, status, sort_order) VALUES
  ((SELECT id FROM cat), 'Super Admin Panel', 'super-admin-panel', 'coming_soon', 0),
  ((SELECT id FROM cat), 'Add-On & Third-Party Integration Marketplace Manager', 'add-on-marketplace-manager', 'coming_soon', 1),
  ((SELECT id FROM cat), 'Impersonation & Support Tools', 'impersonation-support-tools', 'coming_soon', 2),
  ((SELECT id FROM cat), 'Agency / Reseller White-Label Mode', 'agency-reseller-white-label-mode', 'coming_soon', 3),
  ((SELECT id FROM cat), 'Vulnerability Scanning Dashboard', 'vulnerability-scanning-dashboard', 'coming_soon', 4),
  ((SELECT id FROM cat), 'Security Incident Response Runbook Tool', 'security-incident-response-runbook-tool', 'coming_soon', 5),
  ((SELECT id FROM cat), 'In-App Feedback Widget', 'in-app-feedback-widget', 'coming_soon', 6),
  ((SELECT id FROM cat), 'Changelog / Release Notes Automation', 'changelog-release-notes-automation', 'coming_soon', 7)
ON CONFLICT (slug) DO NOTHING;

-- ═════════════════════════════════════════════════════════════════════════════
-- 2. PLATFORM CORE (20 modules — workspace-facing infrastructure)
-- ═════════════════════════════════════════════════════════════════════════════
INSERT INTO categories (key, name, badge, sort_order) VALUES
  ('platform-core', 'Platform Core', 'PC', 11)
ON CONFLICT (key) DO UPDATE SET name='Platform Core', badge='PC', sort_order=11;

WITH cat AS (SELECT id FROM categories WHERE key = 'platform-core')
INSERT INTO modules (category_id, name, slug, status, sort_order) VALUES
  ((SELECT id FROM cat), 'Custom Fields Engine', 'custom-fields-engine', 'coming_soon', 0),
  ((SELECT id FROM cat), 'Global Search', 'global-search', 'coming_soon', 1),
  ((SELECT id FROM cat), 'Digital Asset Management (DAM)', 'digital-asset-management-dam', 'coming_soon', 2),
  ((SELECT id FROM cat), 'Approval Workflow Engine', 'approval-workflow-engine', 'coming_soon', 3),
  ((SELECT id FROM cat), 'Unified Inbox', 'unified-inbox', 'coming_soon', 4),
  ((SELECT id FROM cat), 'Cross-Module Activity Feed', 'cross-module-activity-feed', 'coming_soon', 5),
  ((SELECT id FROM cat), 'Bulk Data Import Wizard', 'bulk-data-import-wizard', 'coming_soon', 6),
  ((SELECT id FROM cat), 'Notification Center', 'notification-center', 'coming_soon', 7),
  ((SELECT id FROM cat), 'Visual Workflow / Automation Builder', 'visual-workflow-automation-builder', 'coming_soon', 8),
  ((SELECT id FROM cat), 'Public API + Webhooks Manager', 'public-api-webhooks-manager', 'coming_soon', 9),
  ((SELECT id FROM cat), 'No-Code Database / Data Tables', 'no-code-database-data-tables', 'coming_soon', 10),
  ((SELECT id FROM cat), 'Sandbox / Staging Workspace', 'sandbox-staging-workspace', 'coming_soon', 11),
  ((SELECT id FROM cat), 'Workspace Cloning', 'workspace-cloning', 'coming_soon', 12),
  ((SELECT id FROM cat), 'Template / Blueprint Marketplace', 'template-blueprint-marketplace', 'coming_soon', 13),
  ((SELECT id FROM cat), 'Guided Data Migration Tool', 'guided-data-migration-tool', 'coming_soon', 14),
  ((SELECT id FROM cat), 'Zapier / Make Native Connector', 'zapier-make-native-connector', 'coming_soon', 15),
  ((SELECT id FROM cat), 'Granular Role-Based Permissions', 'granular-role-based-permissions', 'coming_soon', 16),
  ((SELECT id FROM cat), 'Feature Flags & A/B Experimentation Engine', 'feature-flags-ab-experimentation-engine', 'coming_soon', 17),
  ((SELECT id FROM cat), 'Knowledge Graph / Entity Relationship Mapping', 'knowledge-graph-entity-relationship-mapping', 'coming_soon', 18),
  ((SELECT id FROM cat), 'Internal Tooling / Script Library', 'internal-tooling-script-library', 'coming_soon', 19)
ON CONFLICT (slug) DO NOTHING;

-- ═════════════════════════════════════════════════════════════════════════════
-- 3. INTEGRATIONS & DEVELOPER ECOSYSTEM (4 modules — NEW category)
-- ═════════════════════════════════════════════════════════════════════════════
INSERT INTO categories (key, name, badge, sort_order) VALUES
  ('integrations', 'Integrations & Developer Ecosystem', 'ID', 12)
ON CONFLICT (key) DO UPDATE SET name='Integrations & Developer Ecosystem', badge='ID', sort_order=12;

WITH cat AS (SELECT id FROM categories WHERE key = 'integrations')
INSERT INTO modules (category_id, name, slug, status, sort_order) VALUES
  ((SELECT id FROM cat), 'Native Integrations Hub', 'native-integrations-hub', 'coming_soon', 0),
  ((SELECT id FROM cat), 'Public Developer Portal + App Submission Pipeline', 'public-developer-portal-app-submission-pipeline', 'coming_soon', 1),
  ((SELECT id FROM cat), 'Sandbox API Playground', 'sandbox-api-playground', 'coming_soon', 2),
  ((SELECT id FROM cat), 'OAuth App Directory', 'oauth-app-directory', 'coming_soon', 3)
ON CONFLICT (slug) DO NOTHING;

-- ═════════════════════════════════════════════════════════════════════════════
-- 4. MARKETING — 20 new modules
-- ═════════════════════════════════════════════════════════════════════════════
WITH cat AS (SELECT id FROM categories WHERE key = 'marketing')
INSERT INTO modules (category_id, name, slug, status, sort_order) VALUES
  ((SELECT id FROM cat), 'Social Media Scheduler', 'social-media-scheduler', 'coming_soon', 20),
  ((SELECT id FROM cat), 'Review Management', 'review-management', 'coming_soon', 21),
  ((SELECT id FROM cat), 'Chatbot Builder', 'chatbot-builder', 'coming_soon', 22),
  ((SELECT id FROM cat), 'Ad Campaign Manager', 'ad-campaign-manager', 'coming_soon', 23),
  ((SELECT id FROM cat), 'Lead Scoring', 'lead-scoring', 'coming_soon', 24),
  ((SELECT id FROM cat), 'Pipeline / Deals', 'pipeline-deals', 'coming_soon', 25),
  ((SELECT id FROM cat), 'Referral & Affiliate Analytics Dashboard', 'referral-affiliate-analytics-dashboard', 'coming_soon', 26),
  ((SELECT id FROM cat), 'Landing Page Heat/Scroll Analytics', 'landing-page-heat-scroll-analytics', 'coming_soon', 27),
  ((SELECT id FROM cat), 'Content Calendar', 'content-calendar', 'coming_soon', 28),
  ((SELECT id FROM cat), 'Influencer/Partner CRM', 'influencer-partner-crm', 'coming_soon', 29),
  ((SELECT id FROM cat), 'Push Notification Marketing', 'push-notification-marketing', 'coming_soon', 30),
  ((SELECT id FROM cat), 'Customer Segmentation Engine', 'customer-segmentation-engine', 'coming_soon', 31),
  ((SELECT id FROM cat), 'Membership / Community Platform', 'membership-community-platform', 'coming_soon', 32),
  ((SELECT id FROM cat), 'Event / Webinar Hosting', 'event-webinar-hosting', 'coming_soon', 33),
  ((SELECT id FROM cat), 'Sales Playbook / Battlecard Library', 'sales-playbook-battlecard-library', 'coming_soon', 34),
  ((SELECT id FROM cat), 'Ambassador Program', 'ambassador-program', 'coming_soon', 35),
  ((SELECT id FROM cat), 'Direct Mail Automation', 'direct-mail-automation', 'coming_soon', 36),
  ((SELECT id FROM cat), 'Print Fulfillment for Business Cards/Signage', 'print-fulfillment-business-cards-signage', 'coming_soon', 37),
  ((SELECT id FROM cat), 'Creative A/B Testing Studio', 'creative-ab-testing-studio', 'coming_soon', 38),
  ((SELECT id FROM cat), 'UGC/Creator Content Aggregator', 'ugc-creator-content-aggregator', 'coming_soon', 39)
ON CONFLICT (slug) DO NOTHING;

-- ═════════════════════════════════════════════════════════════════════════════
-- 5. AI — 13 new modules
-- ═════════════════════════════════════════════════════════════════════════════
WITH cat AS (SELECT id FROM categories WHERE key = 'ai')
INSERT INTO modules (category_id, name, slug, status, sort_order) VALUES
  ((SELECT id FROM cat), 'AI Image Generator', 'ai-image-generator', 'coming_soon', 9),
  ((SELECT id FROM cat), 'AI Voice Transcription & Summarization', 'ai-voice-transcription-summarization', 'coming_soon', 10),
  ((SELECT id FROM cat), 'AI Data Enrichment', 'ai-data-enrichment', 'coming_soon', 11),
  ((SELECT id FROM cat), 'AI Workflow Suggestions', 'ai-workflow-suggestions', 'coming_soon', 12),
  ((SELECT id FROM cat), 'AI Content Repurposing', 'ai-content-repurposing', 'coming_soon', 13),
  ((SELECT id FROM cat), 'Predictive Sales Forecasting', 'predictive-sales-forecasting', 'coming_soon', 14),
  ((SELECT id FROM cat), 'Churn Prediction', 'churn-prediction', 'coming_soon', 15),
  ((SELECT id FROM cat), 'Anomaly Detection', 'anomaly-detection', 'coming_soon', 16),
  ((SELECT id FROM cat), 'AI Voice Agent', 'ai-voice-agent', 'coming_soon', 17),
  ((SELECT id FROM cat), 'AI Data Analyst', 'ai-data-analyst', 'coming_soon', 18),
  ((SELECT id FROM cat), 'AI Sales Call Coach', 'ai-sales-call-coach', 'coming_soon', 19),
  ((SELECT id FROM cat), 'Cross-Sell/Upsell Recommendation Engine', 'cross-sell-upsell-recommendation-engine', 'coming_soon', 20),
  ((SELECT id FROM cat), 'AI Avatar / Spokesperson Video Generator', 'ai-avatar-spokesperson-video-generator', 'coming_soon', 21)
ON CONFLICT (slug) DO NOTHING;

-- ═════════════════════════════════════════════════════════════════════════════
-- 6. SEO + SEM — 8 new modules
-- ═════════════════════════════════════════════════════════════════════════════
WITH cat AS (SELECT id FROM categories WHERE key = 'seo')
INSERT INTO modules (category_id, name, slug, status, sort_order) VALUES
  ((SELECT id FROM cat), 'Google Search Console Integration', 'google-search-console-integration', 'coming_soon', 8),
  ((SELECT id FROM cat), 'Bing Webmaster Tools Integration', 'bing-webmaster-tools-integration', 'coming_soon', 9),
  ((SELECT id FROM cat), 'Local SEO / Google Business Profile Manager', 'local-seo-google-business-profile-manager', 'coming_soon', 10),
  ((SELECT id FROM cat), 'Page Speed & Core Web Vitals Monitor', 'page-speed-core-web-vitals-monitor', 'coming_soon', 11),
  ((SELECT id FROM cat), 'SEM / Ad Campaign Bid & ROAS Tracker', 'sem-ad-campaign-bid-roas-tracker', 'coming_soon', 12),
  ((SELECT id FROM cat), 'AI SEO Content Optimizer', 'ai-seo-content-optimizer', 'coming_soon', 13),
  ((SELECT id FROM cat), 'Accessibility (WCAG) Audit Tool', 'accessibility-wcag-audit-tool', 'coming_soon', 14),
  ((SELECT id FROM cat), 'Voice Search / Voice Commerce Optimization', 'voice-search-voice-commerce-optimization', 'coming_soon', 15)
ON CONFLICT (slug) DO NOTHING;

-- ═════════════════════════════════════════════════════════════════════════════
-- 8. BUSINESS — 20 new modules
-- ═════════════════════════════════════════════════════════════════════════════
WITH cat AS (SELECT id FROM categories WHERE key = 'business')
INSERT INTO modules (category_id, name, slug, status, sort_order) VALUES
  ((SELECT id FROM cat), 'Contract / Vendor Management', 'contract-vendor-management', 'coming_soon', 16),
  ((SELECT id FROM cat), 'Procurement / Purchase Orders', 'procurement-purchase-orders', 'coming_soon', 17),
  ((SELECT id FROM cat), 'Multi-location / Franchise Management', 'multi-location-franchise-management', 'coming_soon', 18),
  ((SELECT id FROM cat), 'Compliance / Document Expiry Tracker', 'compliance-document-expiry-tracker', 'coming_soon', 19),
  ((SELECT id FROM cat), 'Shift Scheduling', 'shift-scheduling', 'coming_soon', 20),
  ((SELECT id FROM cat), 'Resource & Equipment Booking', 'resource-equipment-booking', 'coming_soon', 21),
  ((SELECT id FROM cat), 'Field Service Management', 'field-service-management', 'coming_soon', 22),
  ((SELECT id FROM cat), 'E-Signature / Contracts', 'e-signature-contracts', 'coming_soon', 23),
  ((SELECT id FROM cat), 'Internal Wiki / Employee Knowledge Base', 'internal-wiki-employee-knowledge-base', 'coming_soon', 24),
  ((SELECT id FROM cat), 'OKR / Goal Tracking', 'okr-goal-tracking', 'coming_soon', 25),
  ((SELECT id FROM cat), 'Job Board / External Talent Marketplace', 'job-board-external-talent-marketplace', 'coming_soon', 26),
  ((SELECT id FROM cat), 'Employee Benefits Administration', 'employee-benefits-administration', 'coming_soon', 27),
  ((SELECT id FROM cat), 'Background Check Integration', 'background-check-integration', 'coming_soon', 28),
  ((SELECT id FROM cat), 'Offboarding Checklist + Equipment/Asset Return Tracking', 'offboarding-checklist-equipment-asset-return-tracking', 'coming_soon', 29),
  ((SELECT id FROM cat), 'Employee Wellness Programs', 'employee-wellness-programs', 'coming_soon', 30),
  ((SELECT id FROM cat), 'DEI Reporting Dashboard', 'dei-reporting-dashboard', 'coming_soon', 31),
  ((SELECT id FROM cat), 'Return-to-Office / Desk Booking', 'return-to-office-desk-booking', 'coming_soon', 32),
  ((SELECT id FROM cat), 'Legal Template Library', 'legal-template-library', 'coming_soon', 33),
  ((SELECT id FROM cat), 'Trademark/IP Asset Tracker', 'trademark-ip-asset-tracker', 'coming_soon', 34),
  ((SELECT id FROM cat), 'Supplier/Partner Portal', 'supplier-partner-portal', 'coming_soon', 35)
ON CONFLICT (slug) DO NOTHING;

-- ═════════════════════════════════════════════════════════════════════════════
-- 9. EDUCATION — 4 new modules
-- ═════════════════════════════════════════════════════════════════════════════
WITH cat AS (SELECT id FROM categories WHERE key = 'education')
INSERT INTO modules (category_id, name, slug, status, sort_order) VALUES
  ((SELECT id FROM cat), 'Cohort / Live Class Scheduling', 'cohort-live-class-scheduling', 'coming_soon', 8),
  ((SELECT id FROM cat), 'Discussion Forums per Course', 'discussion-forums-per-course', 'coming_soon', 9),
  ((SELECT id FROM cat), 'Gradebook Analytics for Parents/Admins', 'gradebook-analytics-for-parents-admins', 'coming_soon', 10),
  ((SELECT id FROM cat), 'Plagiarism / AI-Content Detection', 'plagiarism-ai-content-detection', 'coming_soon', 11)
ON CONFLICT (slug) DO NOTHING;

-- ═════════════════════════════════════════════════════════════════════════════
-- 10. COMMERCE — 12 new modules
-- ═════════════════════════════════════════════════════════════════════════════
WITH cat AS (SELECT id FROM categories WHERE key = 'commerce')
INSERT INTO modules (category_id, name, slug, status, sort_order) VALUES
  ((SELECT id FROM cat), 'POS ↔ Online Store Inventory Sync', 'pos-online-store-inventory-sync', 'coming_soon', 7),
  ((SELECT id FROM cat), 'Multi-vendor Marketplace Payouts', 'multi-vendor-marketplace-payouts', 'coming_soon', 8),
  ((SELECT id FROM cat), 'Gift Cards', 'gift-cards', 'coming_soon', 9),
  ((SELECT id FROM cat), 'Wishlist / Save-for-later', 'wishlist-save-for-later', 'coming_soon', 10),
  ((SELECT id FROM cat), 'Product Reviews & Q&A', 'product-reviews-qa', 'coming_soon', 11),
  ((SELECT id FROM cat), 'Warranty & RMA Management', 'warranty-rma-management', 'coming_soon', 12),
  ((SELECT id FROM cat), 'Loyalty & Rewards Program', 'loyalty-rewards-program', 'coming_soon', 13),
  ((SELECT id FROM cat), 'Print-on-Demand Integration', 'print-on-demand-integration', 'coming_soon', 14),
  ((SELECT id FROM cat), 'Dropshipping Supplier Integration', 'dropshipping-supplier-integration', 'coming_soon', 15),
  ((SELECT id FROM cat), 'Shipping Label Printing + Carrier Rate Shopping', 'shipping-label-printing-carrier-rate-shopping', 'coming_soon', 16),
  ((SELECT id FROM cat), 'Warranty Registration Portal', 'warranty-registration-portal', 'coming_soon', 17),
  ((SELECT id FROM cat), 'Marketplace Dispute Resolution', 'marketplace-dispute-resolution', 'coming_soon', 18)
ON CONFLICT (slug) DO NOTHING;

-- ═════════════════════════════════════════════════════════════════════════════
-- 11. PRODUCTIVITY — 5 new modules
-- ═════════════════════════════════════════════════════════════════════════════
WITH cat AS (SELECT id FROM categories WHERE key = 'productivity')
INSERT INTO modules (category_id, name, slug, status, sort_order) VALUES
  ((SELECT id FROM cat), 'Collaborative Document Co-editing', 'collaborative-document-co-editing', 'coming_soon', 7),
  ((SELECT id FROM cat), 'Whiteboard / Mind-Mapping Tool', 'whiteboard-mind-mapping-tool', 'coming_soon', 8),
  ((SELECT id FROM cat), 'Internal People/Skills Directory', 'internal-people-skills-directory', 'coming_soon', 9),
  ((SELECT id FROM cat), 'Idea Management / Suggestion Box', 'idea-management-suggestion-box', 'coming_soon', 10),
  ((SELECT id FROM cat), 'Multi-timezone Meeting Coordinator', 'multi-timezone-meeting-coordinator', 'coming_soon', 11)
ON CONFLICT (slug) DO NOTHING;

-- ═════════════════════════════════════════════════════════════════════════════
-- 12. ANALYTICS — 5 new modules
-- ═════════════════════════════════════════════════════════════════════════════
WITH cat AS (SELECT id FROM categories WHERE key = 'analytics')
INSERT INTO modules (category_id, name, slug, status, sort_order) VALUES
  ((SELECT id FROM cat), 'Heatmaps / Session Recording', 'heatmaps-session-recording', 'coming_soon', 6),
  ((SELECT id FROM cat), 'Data Warehouse Connector / Export', 'data-warehouse-connector-export', 'coming_soon', 7),
  ((SELECT id FROM cat), 'Custom SQL / Query Builder', 'custom-sql-query-builder', 'coming_soon', 8),
  ((SELECT id FROM cat), 'Scheduled Report Emails/PDFs', 'scheduled-report-emails-pdfs', 'coming_soon', 9),
  ((SELECT id FROM cat), 'Cohort & Retention Analysis', 'cohort-retention-analysis', 'coming_soon', 10)
ON CONFLICT (slug) DO NOTHING;

-- ═════════════════════════════════════════════════════════════════════════════
-- 14. TRUST, COMPLIANCE & LOCALIZATION (20 modules — NEW category)
-- ═════════════════════════════════════════════════════════════════════════════
INSERT INTO categories (key, name, badge, sort_order) VALUES
  ('trust-compliance', 'Trust, Compliance & Localization', 'TC', 13)
ON CONFLICT (key) DO UPDATE SET name='Trust, Compliance & Localization', badge='TC', sort_order=13;

WITH cat AS (SELECT id FROM categories WHERE key = 'trust-compliance')
INSERT INTO modules (category_id, name, slug, status, sort_order) VALUES
  ((SELECT id FROM cat), 'GDPR/CCPA Data Request Center', 'gdpr-ccpa-data-request-center', 'coming_soon', 0),
  ((SELECT id FROM cat), 'Consent & Cookie Management', 'consent-cookie-management', 'coming_soon', 1),
  ((SELECT id FROM cat), 'Backup & Disaster Recovery Console', 'backup-disaster-recovery-console', 'coming_soon', 2),
  ((SELECT id FROM cat), 'Public Status Page', 'public-status-page', 'coming_soon', 3),
  ((SELECT id FROM cat), 'Terms & Policy Version Tracking', 'terms-policy-version-tracking', 'coming_soon', 4),
  ((SELECT id FROM cat), 'Customer-Facing Audit Trail Export', 'customer-facing-audit-trail-export', 'coming_soon', 5),
  ((SELECT id FROM cat), 'RTL Language Layout Support', 'rtl-language-layout-support', 'coming_soon', 6),
  ((SELECT id FROM cat), 'ESG / Sustainability Reporting', 'esg-sustainability-reporting', 'coming_soon', 7),
  ((SELECT id FROM cat), 'Multi-language Workspace UI', 'multi-language-workspace-ui', 'coming_soon', 8),
  ((SELECT id FROM cat), 'Regional Tax/Compliance Packs', 'regional-tax-compliance-packs', 'coming_soon', 9),
  ((SELECT id FROM cat), 'Localized Payment Methods', 'localized-payment-methods', 'coming_soon', 10),
  ((SELECT id FROM cat), 'Enterprise SSO / SAML', 'enterprise-sso-saml', 'coming_soon', 11),
  ((SELECT id FROM cat), 'Master Data Management / Deduplication Engine', 'master-data-management-deduplication-engine', 'coming_soon', 12),
  ((SELECT id FROM cat), 'Data Residency Selector', 'data-residency-selector', 'coming_soon', 13),
  ((SELECT id FROM cat), 'BYOK Encryption Key Management', 'byok-encryption-key-management', 'coming_soon', 14),
  ((SELECT id FROM cat), 'SOC2/ISO27001 Compliance Evidence Dashboard', 'soc2-iso27001-compliance-evidence-dashboard', 'coming_soon', 15),
  ((SELECT id FROM cat), 'Data Export Portability Suite', 'data-export-portability-suite', 'coming_soon', 16),
  ((SELECT id FROM cat), 'Regulatory Change Monitoring', 'regulatory-change-monitoring', 'coming_soon', 17),
  ((SELECT id FROM cat), 'Carbon Footprint / Sustainability Tracker for Operations', 'carbon-footprint-sustainability-tracker-operations', 'coming_soon', 18),
  ((SELECT id FROM cat), 'Localization / Translation Management', 'localization-translation-management', 'coming_soon', 19)
ON CONFLICT (slug) DO NOTHING;

-- ═════════════════════════════════════════════════════════════════════════════
-- 15. SUPPORT & SUCCESS (7 modules — NEW category)
-- ═════════════════════════════════════════════════════════════════════════════
INSERT INTO categories (key, name, badge, sort_order) VALUES
  ('support-success', 'Support & Success', 'SS', 14)
ON CONFLICT (key) DO UPDATE SET name='Support & Success', badge='SS', sort_order=14;

WITH cat AS (SELECT id FROM categories WHERE key = 'support-success')
INSERT INTO modules (category_id, name, slug, status, sort_order) VALUES
  ((SELECT id FROM cat), 'NPS / CSAT Survey Automation', 'nps-csat-survey-automation', 'coming_soon', 0),
  ((SELECT id FROM cat), 'Customer Health Score', 'customer-health-score', 'coming_soon', 1),
  ((SELECT id FROM cat), 'SLA Management', 'sla-management', 'coming_soon', 2),
  ((SELECT id FROM cat), 'Public Roadmap / Feature Request Board', 'public-roadmap-feature-request-board', 'coming_soon', 3),
  ((SELECT id FROM cat), 'Live Chat', 'live-chat', 'coming_soon', 4),
  ((SELECT id FROM cat), 'Built-in Voice & Video Calling', 'built-in-voice-video-calling', 'coming_soon', 5),
  ((SELECT id FROM cat), 'Internal Team Messaging', 'internal-team-messaging', 'coming_soon', 6)
ON CONFLICT (slug) DO NOTHING;

-- ═════════════════════════════════════════════════════════════════════════════
-- 16. FINANCE — ADVANCED (20 modules — NEW category)
-- ═════════════════════════════════════════════════════════════════════════════
INSERT INTO categories (key, name, badge, sort_order) VALUES
  ('finance-advanced', 'Finance — Advanced', 'FA', 15)
ON CONFLICT (key) DO UPDATE SET name='Finance — Advanced', badge='FA', sort_order=15;

WITH cat AS (SELECT id FROM categories WHERE key = 'finance-advanced')
INSERT INTO modules (category_id, name, slug, status, sort_order) VALUES
  ((SELECT id FROM cat), 'Multi-entity Accounting', 'multi-entity-accounting', 'coming_soon', 0),
  ((SELECT id FROM cat), 'Budget Planning & Forecasting', 'budget-planning-forecasting', 'coming_soon', 1),
  ((SELECT id FROM cat), 'Bill Pay / Accounts Payable Automation', 'bill-pay-accounts-payable-automation', 'coming_soon', 2),
  ((SELECT id FROM cat), 'Financing / Lending Integration', 'financing-lending-integration', 'coming_soon', 3),
  ((SELECT id FROM cat), 'Tax Filing Prep Export', 'tax-filing-prep-export', 'coming_soon', 4),
  ((SELECT id FROM cat), 'FX / Currency Hedging Alerts', 'fx-currency-hedging-alerts', 'coming_soon', 5),
  ((SELECT id FROM cat), 'Corporate Card / Expense Card Issuing', 'corporate-card-expense-card-issuing', 'coming_soon', 6),
  ((SELECT id FROM cat), 'Vendor Risk Scorecard', 'vendor-risk-scorecard', 'coming_soon', 7),
  ((SELECT id FROM cat), 'Dunning Management', 'dunning-management', 'coming_soon', 8),
  ((SELECT id FROM cat), 'Usage-Based / Metered Billing Dashboard', 'usage-based-metered-billing-dashboard', 'coming_soon', 9),
  ((SELECT id FROM cat), 'Revenue Recognition Automation', 'revenue-recognition-automation', 'coming_soon', 10),
  ((SELECT id FROM cat), 'Subscription Pause/Skip Self-Service', 'subscription-pause-skip-self-service', 'coming_soon', 11),
  ((SELECT id FROM cat), 'Fraud Detection Engine', 'fraud-detection-engine', 'coming_soon', 12),
  ((SELECT id FROM cat), 'Chargeback & Dispute Management', 'chargeback-dispute-management', 'coming_soon', 13),
  ((SELECT id FROM cat), 'Identity Verification / KYC', 'identity-verification-kyc', 'coming_soon', 14),
  ((SELECT id FROM cat), 'Sales Tax Nexus & Compliance Tracker', 'sales-tax-nexus-compliance-tracker', 'coming_soon', 15),
  ((SELECT id FROM cat), 'International Contractor Payments', 'international-contractor-payments', 'coming_soon', 16),
  ((SELECT id FROM cat), 'Multi-country Payroll Compliance Packs', 'multi-country-payroll-compliance-packs', 'coming_soon', 17),
  ((SELECT id FROM cat), 'Cap Table / Equity Management', 'cap-table-equity-management', 'coming_soon', 18),
  ((SELECT id FROM cat), 'Board / Investor Reporting Portal', 'board-investor-reporting-portal', 'coming_soon', 19)
ON CONFLICT (slug) DO NOTHING;

-- ═════════════════════════════════════════════════════════════════════════════
-- 17. GAMIFICATION & ENGAGEMENT (4 modules — NEW category)
-- ═════════════════════════════════════════════════════════════════════════════
INSERT INTO categories (key, name, badge, sort_order) VALUES
  ('gamification', 'Gamification & Engagement', 'GM', 16)
ON CONFLICT (key) DO UPDATE SET name='Gamification & Engagement', badge='GM', sort_order=16;

WITH cat AS (SELECT id FROM categories WHERE key = 'gamification')
INSERT INTO modules (category_id, name, slug, status, sort_order) VALUES
  ((SELECT id FROM cat), 'Achievement / Badge System', 'achievement-badge-system', 'coming_soon', 0),
  ((SELECT id FROM cat), 'Leaderboards', 'leaderboards', 'coming_soon', 1),
  ((SELECT id FROM cat), 'Streaks / Habit Tracking', 'streaks-habit-tracking', 'coming_soon', 2),
  ((SELECT id FROM cat), 'Product Tour / Onboarding Checklist Builder', 'product-tour-onboarding-checklist-builder', 'coming_soon', 3)
ON CONFLICT (slug) DO NOTHING;

-- ═════════════════════════════════════════════════════════════════════════════
-- 18. MOBILE & ACCESS (3 modules — NEW category)
-- ═════════════════════════════════════════════════════════════════════════════
INSERT INTO categories (key, name, badge, sort_order) VALUES
  ('mobile-access', 'Mobile & Access', 'MA', 17)
ON CONFLICT (key) DO UPDATE SET name='Mobile & Access', badge='MA', sort_order=17;

WITH cat AS (SELECT id FROM categories WHERE key = 'mobile-access')
INSERT INTO modules (category_id, name, slug, status, sort_order) VALUES
  ((SELECT id FROM cat), 'Native Mobile App', 'native-mobile-app', 'coming_soon', 0),
  ((SELECT id FROM cat), 'Offline Mode', 'offline-mode', 'coming_soon', 1),
  ((SELECT id FROM cat), 'White-Label Mobile App Builder', 'white-label-mobile-app-builder', 'coming_soon', 2)
ON CONFLICT (slug) DO NOTHING;

-- ═════════════════════════════════════════════════════════════════════════════
-- 19. MEDIA & CONTENT PRODUCTION (5 modules — NEW category)
-- ═════════════════════════════════════════════════════════════════════════════
INSERT INTO categories (key, name, badge, sort_order) VALUES
  ('media-production', 'Media & Content Production', 'MP', 18)
ON CONFLICT (key) DO UPDATE SET name='Media & Content Production', badge='MP', sort_order=18;

WITH cat AS (SELECT id FROM categories WHERE key = 'media-production')
INSERT INTO modules (category_id, name, slug, status, sort_order) VALUES
  ((SELECT id FROM cat), 'Podcast Hosting', 'podcast-hosting', 'coming_soon', 0),
  ((SELECT id FROM cat), 'Video Hosting/Streaming', 'video-hosting-streaming', 'coming_soon', 1),
  ((SELECT id FROM cat), 'Interactive Product Demo Builder', 'interactive-product-demo-builder', 'coming_soon', 2),
  ((SELECT id FROM cat), 'In-Product Guided Tours Editor', 'in-product-guided-tours-editor', 'coming_soon', 3),
  ((SELECT id FROM cat), 'Print/Publishing Workflow', 'print-publishing-workflow', 'coming_soon', 4)
ON CONFLICT (slug) DO NOTHING;

-- ═════════════════════════════════════════════════════════════════════════════
-- 20. NON-PROFIT & CIVIC (3 modules — NEW category)
-- ═════════════════════════════════════════════════════════════════════════════
INSERT INTO categories (key, name, badge, sort_order) VALUES
  ('nonprofit-civic', 'Non-Profit & Civic', 'NC', 19)
ON CONFLICT (key) DO UPDATE SET name='Non-Profit & Civic', badge='NC', sort_order=19;

WITH cat AS (SELECT id FROM categories WHERE key = 'nonprofit-civic')
INSERT INTO modules (category_id, name, slug, status, sort_order) VALUES
  ((SELECT id FROM cat), 'Donation Management', 'donation-management', 'coming_soon', 0),
  ((SELECT id FROM cat), 'Volunteer Management', 'volunteer-management', 'coming_soon', 1),
  ((SELECT id FROM cat), 'Grant Tracking', 'grant-tracking', 'coming_soon', 2)
ON CONFLICT (slug) DO NOTHING;

-- ═════════════════════════════════════════════════════════════════════════════
-- 21. EXTENDED VERTICAL MODULES (10 modules — NEW category)
-- ═════════════════════════════════════════════════════════════════════════════
INSERT INTO categories (key, name, badge, sort_order) VALUES
  ('extended-vertical', 'Extended Vertical Modules', 'EV', 20)
ON CONFLICT (key) DO UPDATE SET name='Extended Vertical Modules', badge='EV', sort_order=20;

WITH cat AS (SELECT id FROM categories WHERE key = 'extended-vertical')
INSERT INTO modules (category_id, name, slug, status, sort_order) VALUES
  ((SELECT id FROM cat), 'Legal Practice Management', 'legal-practice-management', 'coming_soon', 0),
  ((SELECT id FROM cat), 'Insurance Policy & Claims Management', 'insurance-policy-claims-management', 'coming_soon', 1),
  ((SELECT id FROM cat), 'Manufacturing / Quality Control', 'manufacturing-quality-control', 'coming_soon', 2),
  ((SELECT id FROM cat), 'Travel & Hospitality Booking', 'travel-hospitality-booking', 'coming_soon', 3),
  ((SELECT id FROM cat), 'Property Management', 'property-management', 'coming_soon', 4),
  ((SELECT id FROM cat), 'IoT / Hardware Device Integration', 'iot-hardware-device-integration', 'coming_soon', 5),
  ((SELECT id FROM cat), 'Agriculture/Farm Management', 'agriculture-farm-management', 'coming_soon', 6),
  ((SELECT id FROM cat), 'Esports/Gaming Community Tools', 'esports-gaming-community-tools', 'coming_soon', 7),
  ((SELECT id FROM cat), 'Religious/Congregation Management', 'religious-congregation-management', 'coming_soon', 8),
  ((SELECT id FROM cat), 'Government/RFP Response Management', 'government-rfp-response-management', 'coming_soon', 9)
ON CONFLICT (slug) DO NOTHING;

-- ═════════════════════════════════════════════════════════════════════════════
-- Update existing module sort orders for the expanded categories where new
-- modules were appended.
-- ═════════════════════════════════════════════════════════════════════════════

-- Re-order all modules in expanded categories to match their new sort_order
-- values. We do this by re-assigning sort_orders in one pass per category.
UPDATE modules m SET sort_order = n.seq FROM (
  SELECT id, row_number() OVER (PARTITION BY category_id ORDER BY sort_order, id) - 1 AS seq
  FROM modules
  WHERE category_id IN (SELECT id FROM categories WHERE key IN ('marketing','ai','seo','business','education','commerce','productivity','analytics'))
) n WHERE m.id = n.id AND m.sort_order != n.seq;
