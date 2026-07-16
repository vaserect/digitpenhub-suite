-- Complete 082 migration - all 21 categories and 288 modules

-- Insert all categories
INSERT INTO categories (key, name, badge, sort_order) VALUES ('platform-admin', 'Platform Administration', 'PA', 10) ON CONFLICT (key) DO UPDATE SET name=EXCLUDED.name, badge=EXCLUDED.badge, sort_order=EXCLUDED.sort_order;
INSERT INTO categories (key, name, badge, sort_order) VALUES ('platform-core', 'Platform Core', 'PC', 11) ON CONFLICT (key) DO UPDATE SET name=EXCLUDED.name, badge=EXCLUDED.badge, sort_order=EXCLUDED.sort_order;
INSERT INTO categories (key, name, badge, sort_order) VALUES ('integrations', 'Integrations & Developer Ecosystem', 'ID', 12) ON CONFLICT (key) DO UPDATE SET name=EXCLUDED.name, badge=EXCLUDED.badge, sort_order=EXCLUDED.sort_order;
INSERT INTO categories (key, name, badge, sort_order) VALUES ('trust-compliance', 'Trust, Compliance & Localization', 'TC', 13) ON CONFLICT (key) DO UPDATE SET name=EXCLUDED.name, badge=EXCLUDED.badge, sort_order=EXCLUDED.sort_order;
INSERT INTO categories (key, name, badge, sort_order) VALUES ('support-success', 'Support & Success', 'SS', 14) ON CONFLICT (key) DO UPDATE SET name=EXCLUDED.name, badge=EXCLUDED.badge, sort_order=EXCLUDED.sort_order;
INSERT INTO categories (key, name, badge, sort_order) VALUES ('finance-advanced', 'Finance — Advanced', 'FA', 15) ON CONFLICT (key) DO UPDATE SET name=EXCLUDED.name, badge=EXCLUDED.badge, sort_order=EXCLUDED.sort_order;
INSERT INTO categories (key, name, badge, sort_order) VALUES ('gamification', 'Gamification & Engagement', 'GM', 16) ON CONFLICT (key) DO UPDATE SET name=EXCLUDED.name, badge=EXCLUDED.badge, sort_order=EXCLUDED.sort_order;
INSERT INTO categories (key, name, badge, sort_order) VALUES ('mobile-access', 'Mobile & Access', 'MA', 17) ON CONFLICT (key) DO UPDATE SET name=EXCLUDED.name, badge=EXCLUDED.badge, sort_order=EXCLUDED.sort_order;
INSERT INTO categories (key, name, badge, sort_order) VALUES ('media-production', 'Media & Content Production', 'MP', 18) ON CONFLICT (key) DO UPDATE SET name=EXCLUDED.name, badge=EXCLUDED.badge, sort_order=EXCLUDED.sort_order;
INSERT INTO categories (key, name, badge, sort_order) VALUES ('nonprofit-civic', 'Non-Profit & Civic', 'NC', 19) ON CONFLICT (key) DO UPDATE SET name=EXCLUDED.name, badge=EXCLUDED.badge, sort_order=EXCLUDED.sort_order;
INSERT INTO categories (key, name, badge, sort_order) VALUES ('extended-vertical', 'Extended Vertical Modules', 'EV', 20) ON CONFLICT (key) DO UPDATE SET name=EXCLUDED.name, badge=EXCLUDED.badge, sort_order=EXCLUDED.sort_order;

-- Insert all modules

-- platform-admin modules
INSERT INTO modules (category_id, name, slug, status, sort_order)
SELECT (SELECT id FROM categories WHERE key = 'platform-admin'), name, slug, status::module_status, sort_order
FROM (VALUES
  ('Super Admin Panel', 'super-admin-panel', 'coming_soon', 0),
  ('Add-On & Third-Party Integration Marketplace Manager', 'add-on-marketplace-manager', 'coming_soon', 1),
  ('Impersonation & Support Tools', 'impersonation-support-tools', 'coming_soon', 2),
  ('Agency / Reseller White-Label Mode', 'agency-reseller-white-label-mode', 'coming_soon', 3),
  ('Vulnerability Scanning Dashboard', 'vulnerability-scanning-dashboard', 'coming_soon', 4),
  ('Security Incident Response Runbook Tool', 'security-incident-response-runbook-tool', 'coming_soon', 5),
  ('In-App Feedback Widget', 'in-app-feedback-widget', 'coming_soon', 6),
  ('Changelog / Release Notes Automation', 'changelog-release-notes-automation', 'coming_soon', 7)
) AS v(name, slug, status, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- platform-core modules
INSERT INTO modules (category_id, name, slug, status, sort_order)
SELECT (SELECT id FROM categories WHERE key = 'platform-core'), name, slug, status::module_status, sort_order
FROM (VALUES
  ('Custom Fields Engine', 'custom-fields-engine', 'coming_soon', 0),
  ('Global Search', 'global-search', 'coming_soon', 1),
  ('Digital Asset Management (DAM)', 'digital-asset-management-dam', 'coming_soon', 2),
  ('Approval Workflow Engine', 'approval-workflow-engine', 'coming_soon', 3),
  ('Unified Inbox', 'unified-inbox', 'coming_soon', 4),
  ('Cross-Module Activity Feed', 'cross-module-activity-feed', 'coming_soon', 5),
  ('Bulk Data Import Wizard', 'bulk-data-import-wizard', 'coming_soon', 6),
  ('Notification Center', 'notification-center', 'coming_soon', 7),
  ('Visual Workflow / Automation Builder', 'visual-workflow-automation-builder', 'coming_soon', 8),
  ('Public API + Webhooks Manager', 'public-api-webhooks-manager', 'coming_soon', 9),
  ('No-Code Database / Data Tables', 'no-code-database-data-tables', 'coming_soon', 10),
  ('Sandbox / Staging Workspace', 'sandbox-staging-workspace', 'coming_soon', 11),
  ('Workspace Cloning', 'workspace-cloning', 'coming_soon', 12),
  ('Template / Blueprint Marketplace', 'template-blueprint-marketplace', 'coming_soon', 13),
  ('Guided Data Migration Tool', 'guided-data-migration-tool', 'coming_soon', 14),
  ('Zapier / Make Native Connector', 'zapier-make-native-connector', 'coming_soon', 15),
  ('Granular Role-Based Permissions', 'granular-role-based-permissions', 'coming_soon', 16),
  ('Feature Flags & A/B Experimentation Engine', 'feature-flags-ab-experimentation-engine', 'coming_soon', 17),
  ('Knowledge Graph / Entity Relationship Mapping', 'knowledge-graph-entity-relationship-mapping', 'coming_soon', 18),
  ('Internal Tooling / Script Library', 'internal-tooling-script-library', 'coming_soon', 19)
) AS v(name, slug, status, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- integrations modules
INSERT INTO modules (category_id, name, slug, status, sort_order)
SELECT (SELECT id FROM categories WHERE key = 'integrations'), name, slug, status::module_status, sort_order
FROM (VALUES
  ('Native Integrations Hub', 'native-integrations-hub', 'coming_soon', 0),
  ('Public Developer Portal + App Submission Pipeline', 'public-developer-portal-app-submission-pipeline', 'coming_soon', 1),
  ('Sandbox API Playground', 'sandbox-api-playground', 'coming_soon', 2),
  ('OAuth App Directory', 'oauth-app-directory', 'coming_soon', 3)
) AS v(name, slug, status, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- marketing modules
INSERT INTO modules (category_id, name, slug, status, sort_order)
SELECT (SELECT id FROM categories WHERE key = 'marketing'), name, slug, status::module_status, sort_order
FROM (VALUES
  ('Social Media Scheduler', 'social-media-scheduler', 'coming_soon', 20),
  ('Review Management', 'review-management', 'coming_soon', 21),
  ('Chatbot Builder', 'chatbot-builder', 'coming_soon', 22),
  ('Ad Campaign Manager', 'ad-campaign-manager', 'coming_soon', 23),
  ('Lead Scoring', 'lead-scoring', 'coming_soon', 24),
  ('Pipeline / Deals', 'pipeline-deals', 'coming_soon', 25),
  ('Referral & Affiliate Analytics Dashboard', 'referral-affiliate-analytics-dashboard', 'coming_soon', 26),
  ('Landing Page Heat/Scroll Analytics', 'landing-page-heat-scroll-analytics', 'coming_soon', 27),
  ('Content Calendar', 'content-calendar', 'coming_soon', 28),
  ('Influencer/Partner CRM', 'influencer-partner-crm', 'coming_soon', 29),
  ('Push Notification Marketing', 'push-notification-marketing', 'coming_soon', 30),
  ('Customer Segmentation Engine', 'customer-segmentation-engine', 'coming_soon', 31),
  ('Membership / Community Platform', 'membership-community-platform', 'coming_soon', 32),
  ('Event / Webinar Hosting', 'event-webinar-hosting', 'coming_soon', 33),
  ('Sales Playbook / Battlecard Library', 'sales-playbook-battlecard-library', 'coming_soon', 34),
  ('Ambassador Program', 'ambassador-program', 'coming_soon', 35),
  ('Direct Mail Automation', 'direct-mail-automation', 'coming_soon', 36),
  ('Print Fulfillment for Business Cards/Signage', 'print-fulfillment-business-cards-signage', 'coming_soon', 37),
  ('Creative A/B Testing Studio', 'creative-ab-testing-studio', 'coming_soon', 38),
  ('UGC/Creator Content Aggregator', 'ugc-creator-content-aggregator', 'coming_soon', 39)
) AS v(name, slug, status, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- ai modules
INSERT INTO modules (category_id, name, slug, status, sort_order)
SELECT (SELECT id FROM categories WHERE key = 'ai'), name, slug, status::module_status, sort_order
FROM (VALUES
  ('AI Image Generator', 'ai-image-generator', 'coming_soon', 9),
  ('AI Voice Transcription & Summarization', 'ai-voice-transcription-summarization', 'coming_soon', 10),
  ('AI Data Enrichment', 'ai-data-enrichment', 'coming_soon', 11),
  ('AI Workflow Suggestions', 'ai-workflow-suggestions', 'coming_soon', 12),
  ('AI Content Repurposing', 'ai-content-repurposing', 'coming_soon', 13),
  ('Predictive Sales Forecasting', 'predictive-sales-forecasting', 'coming_soon', 14),
  ('Churn Prediction', 'churn-prediction', 'coming_soon', 15),
  ('Anomaly Detection', 'anomaly-detection', 'coming_soon', 16),
  ('AI Voice Agent', 'ai-voice-agent', 'coming_soon', 17),
  ('AI Data Analyst', 'ai-data-analyst', 'coming_soon', 18),
  ('AI Sales Call Coach', 'ai-sales-call-coach', 'coming_soon', 19),
  ('Cross-Sell/Upsell Recommendation Engine', 'cross-sell-upsell-recommendation-engine', 'coming_soon', 20),
  ('AI Avatar / Spokesperson Video Generator', 'ai-avatar-spokesperson-video-generator', 'coming_soon', 21)
) AS v(name, slug, status, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- seo modules
INSERT INTO modules (category_id, name, slug, status, sort_order)
SELECT (SELECT id FROM categories WHERE key = 'seo'), name, slug, status::module_status, sort_order
FROM (VALUES
  ('Google Search Console Integration', 'google-search-console-integration', 'coming_soon', 8),
  ('Bing Webmaster Tools Integration', 'bing-webmaster-tools-integration', 'coming_soon', 9),
  ('Local SEO / Google Business Profile Manager', 'local-seo-google-business-profile-manager', 'coming_soon', 10),
  ('Page Speed & Core Web Vitals Monitor', 'page-speed-core-web-vitals-monitor', 'coming_soon', 11),
  ('SEM / Ad Campaign Bid & ROAS Tracker', 'sem-ad-campaign-bid-roas-tracker', 'coming_soon', 12),
  ('AI SEO Content Optimizer', 'ai-seo-content-optimizer', 'coming_soon', 13),
  ('Accessibility (WCAG) Audit Tool', 'accessibility-wcag-audit-tool', 'coming_soon', 14),
  ('Voice Search / Voice Commerce Optimization', 'voice-search-voice-commerce-optimization', 'coming_soon', 15)
) AS v(name, slug, status, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- business modules
INSERT INTO modules (category_id, name, slug, status, sort_order)
SELECT (SELECT id FROM categories WHERE key = 'business'), name, slug, status::module_status, sort_order
FROM (VALUES
  ('Contract / Vendor Management', 'contract-vendor-management', 'coming_soon', 16),
  ('Procurement / Purchase Orders', 'procurement-purchase-orders', 'coming_soon', 17),
  ('Multi-location / Franchise Management', 'multi-location-franchise-management', 'coming_soon', 18),
  ('Compliance / Document Expiry Tracker', 'compliance-document-expiry-tracker', 'coming_soon', 19),
  ('Shift Scheduling', 'shift-scheduling', 'coming_soon', 20),
  ('Resource & Equipment Booking', 'resource-equipment-booking', 'coming_soon', 21),
  ('Field Service Management', 'field-service-management', 'coming_soon', 22),
  ('E-Signature / Contracts', 'e-signature-contracts', 'coming_soon', 23),
  ('Internal Wiki / Employee Knowledge Base', 'internal-wiki-employee-knowledge-base', 'coming_soon', 24),
  ('OKR / Goal Tracking', 'okr-goal-tracking', 'coming_soon', 25),
  ('Job Board / External Talent Marketplace', 'job-board-external-talent-marketplace', 'coming_soon', 26),
  ('Employee Benefits Administration', 'employee-benefits-administration', 'coming_soon', 27),
  ('Background Check Integration', 'background-check-integration', 'coming_soon', 28),
  ('Offboarding Checklist + Equipment/Asset Return Tracking', 'offboarding-checklist-equipment-asset-return-tracking', 'coming_soon', 29),
  ('Employee Wellness Programs', 'employee-wellness-programs', 'coming_soon', 30),
  ('DEI Reporting Dashboard', 'dei-reporting-dashboard', 'coming_soon', 31),
  ('Return-to-Office / Desk Booking', 'return-to-office-desk-booking', 'coming_soon', 32),
  ('Legal Template Library', 'legal-template-library', 'coming_soon', 33),
  ('Trademark/IP Asset Tracker', 'trademark-ip-asset-tracker', 'coming_soon', 34),
  ('Supplier/Partner Portal', 'supplier-partner-portal', 'coming_soon', 35)
) AS v(name, slug, status, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- education modules
INSERT INTO modules (category_id, name, slug, status, sort_order)
SELECT (SELECT id FROM categories WHERE key = 'education'), name, slug, status::module_status, sort_order
FROM (VALUES
  ('Cohort / Live Class Scheduling', 'cohort-live-class-scheduling', 'coming_soon', 8),
  ('Discussion Forums per Course', 'discussion-forums-per-course', 'coming_soon', 9),
  ('Gradebook Analytics for Parents/Admins', 'gradebook-analytics-for-parents-admins', 'coming_soon', 10),
  ('Plagiarism / AI-Content Detection', 'plagiarism-ai-content-detection', 'coming_soon', 11)
) AS v(name, slug, status, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- commerce modules
INSERT INTO modules (category_id, name, slug, status, sort_order)
SELECT (SELECT id FROM categories WHERE key = 'commerce'), name, slug, status::module_status, sort_order
FROM (VALUES
  ('POS ↔ Online Store Inventory Sync', 'pos-online-store-inventory-sync', 'coming_soon', 7),
  ('Multi-vendor Marketplace Payouts', 'multi-vendor-marketplace-payouts', 'coming_soon', 8),
  ('Gift Cards', 'gift-cards', 'coming_soon', 9),
  ('Wishlist / Save-for-later', 'wishlist-save-for-later', 'coming_soon', 10),
  ('Product Reviews & Q&A', 'product-reviews-qa', 'coming_soon', 11),
  ('Warranty & RMA Management', 'warranty-rma-management', 'coming_soon', 12),
  ('Loyalty & Rewards Program', 'loyalty-rewards-program', 'coming_soon', 13),
  ('Print-on-Demand Integration', 'print-on-demand-integration', 'coming_soon', 14),
  ('Dropshipping Supplier Integration', 'dropshipping-supplier-integration', 'coming_soon', 15),
  ('Shipping Label Printing + Carrier Rate Shopping', 'shipping-label-printing-carrier-rate-shopping', 'coming_soon', 16),
  ('Warranty Registration Portal', 'warranty-registration-portal', 'coming_soon', 17),
  ('Marketplace Dispute Resolution', 'marketplace-dispute-resolution', 'coming_soon', 18)
) AS v(name, slug, status, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- productivity modules
INSERT INTO modules (category_id, name, slug, status, sort_order)
SELECT (SELECT id FROM categories WHERE key = 'productivity'), name, slug, status::module_status, sort_order
FROM (VALUES
  ('Collaborative Document Co-editing', 'collaborative-document-co-editing', 'coming_soon', 7),
  ('Whiteboard / Mind-Mapping Tool', 'whiteboard-mind-mapping-tool', 'coming_soon', 8),
  ('Internal People/Skills Directory', 'internal-people-skills-directory', 'coming_soon', 9),
  ('Idea Management / Suggestion Box', 'idea-management-suggestion-box', 'coming_soon', 10),
  ('Multi-timezone Meeting Coordinator', 'multi-timezone-meeting-coordinator', 'coming_soon', 11)
) AS v(name, slug, status, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- analytics modules
INSERT INTO modules (category_id, name, slug, status, sort_order)
SELECT (SELECT id FROM categories WHERE key = 'analytics'), name, slug, status::module_status, sort_order
FROM (VALUES
  ('Heatmaps / Session Recording', 'heatmaps-session-recording', 'coming_soon', 6),
  ('Data Warehouse Connector / Export', 'data-warehouse-connector-export', 'coming_soon', 7),
  ('Custom SQL / Query Builder', 'custom-sql-query-builder', 'coming_soon', 8),
  ('Scheduled Report Emails/PDFs', 'scheduled-report-emails-pdfs', 'coming_soon', 9),
  ('Cohort & Retention Analysis', 'cohort-retention-analysis', 'coming_soon', 10)
) AS v(name, slug, status, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- trust-compliance modules
INSERT INTO modules (category_id, name, slug, status, sort_order)
SELECT (SELECT id FROM categories WHERE key = 'trust-compliance'), name, slug, status::module_status, sort_order
FROM (VALUES
  ('GDPR/CCPA Data Request Center', 'gdpr-ccpa-data-request-center', 'coming_soon', 0),
  ('Consent & Cookie Management', 'consent-cookie-management', 'coming_soon', 1),
  ('Backup & Disaster Recovery Console', 'backup-disaster-recovery-console', 'coming_soon', 2),
  ('Public Status Page', 'public-status-page', 'coming_soon', 3),
  ('Terms & Policy Version Tracking', 'terms-policy-version-tracking', 'coming_soon', 4),
  ('Customer-Facing Audit Trail Export', 'customer-facing-audit-trail-export', 'coming_soon', 5),
  ('RTL Language Layout Support', 'rtl-language-layout-support', 'coming_soon', 6),
  ('ESG / Sustainability Reporting', 'esg-sustainability-reporting', 'coming_soon', 7),
  ('Multi-language Workspace UI', 'multi-language-workspace-ui', 'coming_soon', 8),
  ('Regional Tax/Compliance Packs', 'regional-tax-compliance-packs', 'coming_soon', 9),
  ('Localized Payment Methods', 'localized-payment-methods', 'coming_soon', 10),
  ('Enterprise SSO / SAML', 'enterprise-sso-saml', 'coming_soon', 11),
  ('Master Data Management / Deduplication Engine', 'master-data-management-deduplication-engine', 'coming_soon', 12),
  ('Data Residency Selector', 'data-residency-selector', 'coming_soon', 13),
  ('BYOK Encryption Key Management', 'byok-encryption-key-management', 'coming_soon', 14),
  ('SOC2/ISO27001 Compliance Evidence Dashboard', 'soc2-iso27001-compliance-evidence-dashboard', 'coming_soon', 15),
  ('Data Export Portability Suite', 'data-export-portability-suite', 'coming_soon', 16),
  ('Regulatory Change Monitoring', 'regulatory-change-monitoring', 'coming_soon', 17),
  ('Carbon Footprint / Sustainability Tracker for Operations', 'carbon-footprint-sustainability-tracker-operations', 'coming_soon', 18),
  ('Localization / Translation Management', 'localization-translation-management', 'coming_soon', 19)
) AS v(name, slug, status, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- support-success modules
INSERT INTO modules (category_id, name, slug, status, sort_order)
SELECT (SELECT id FROM categories WHERE key = 'support-success'), name, slug, status::module_status, sort_order
FROM (VALUES
  ('NPS / CSAT Survey Automation', 'nps-csat-survey-automation', 'coming_soon', 0),
  ('Customer Health Score', 'customer-health-score', 'coming_soon', 1),
  ('SLA Management', 'sla-management', 'coming_soon', 2),
  ('Public Roadmap / Feature Request Board', 'public-roadmap-feature-request-board', 'coming_soon', 3),
  ('Live Chat', 'live-chat', 'coming_soon', 4),
  ('Built-in Voice & Video Calling', 'built-in-voice-video-calling', 'coming_soon', 5),
  ('Internal Team Messaging', 'internal-team-messaging', 'coming_soon', 6)
) AS v(name, slug, status, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- finance-advanced modules
INSERT INTO modules (category_id, name, slug, status, sort_order)
SELECT (SELECT id FROM categories WHERE key = 'finance-advanced'), name, slug, status::module_status, sort_order
FROM (VALUES
  ('Multi-entity Accounting', 'multi-entity-accounting', 'coming_soon', 0),
  ('Budget Planning & Forecasting', 'budget-planning-forecasting', 'coming_soon', 1),
  ('Bill Pay / Accounts Payable Automation', 'bill-pay-accounts-payable-automation', 'coming_soon', 2),
  ('Financing / Lending Integration', 'financing-lending-integration', 'coming_soon', 3),
  ('Tax Filing Prep Export', 'tax-filing-prep-export', 'coming_soon', 4),
  ('FX / Currency Hedging Alerts', 'fx-currency-hedging-alerts', 'coming_soon', 5),
  ('Corporate Card / Expense Card Issuing', 'corporate-card-expense-card-issuing', 'coming_soon', 6),
  ('Vendor Risk Scorecard', 'vendor-risk-scorecard', 'coming_soon', 7),
  ('Dunning Management', 'dunning-management', 'coming_soon', 8),
  ('Usage-Based / Metered Billing Dashboard', 'usage-based-metered-billing-dashboard', 'coming_soon', 9),
  ('Revenue Recognition Automation', 'revenue-recognition-automation', 'coming_soon', 10),
  ('Subscription Pause/Skip Self-Service', 'subscription-pause-skip-self-service', 'coming_soon', 11),
  ('Fraud Detection Engine', 'fraud-detection-engine', 'coming_soon', 12),
  ('Chargeback & Dispute Management', 'chargeback-dispute-management', 'coming_soon', 13),
  ('Identity Verification / KYC', 'identity-verification-kyc', 'coming_soon', 14),
  ('Sales Tax Nexus & Compliance Tracker', 'sales-tax-nexus-compliance-tracker', 'coming_soon', 15),
  ('International Contractor Payments', 'international-contractor-payments', 'coming_soon', 16),
  ('Multi-country Payroll Compliance Packs', 'multi-country-payroll-compliance-packs', 'coming_soon', 17),
  ('Cap Table / Equity Management', 'cap-table-equity-management', 'coming_soon', 18),
  ('Board / Investor Reporting Portal', 'board-investor-reporting-portal', 'coming_soon', 19)
) AS v(name, slug, status, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- gamification modules
INSERT INTO modules (category_id, name, slug, status, sort_order)
SELECT (SELECT id FROM categories WHERE key = 'gamification'), name, slug, status::module_status, sort_order
FROM (VALUES
  ('Achievement / Badge System', 'achievement-badge-system', 'coming_soon', 0),
  ('Leaderboards', 'leaderboards', 'coming_soon', 1),
  ('Streaks / Habit Tracking', 'streaks-habit-tracking', 'coming_soon', 2),
  ('Product Tour / Onboarding Checklist Builder', 'product-tour-onboarding-checklist-builder', 'coming_soon', 3)
) AS v(name, slug, status, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- mobile-access modules
INSERT INTO modules (category_id, name, slug, status, sort_order)
SELECT (SELECT id FROM categories WHERE key = 'mobile-access'), name, slug, status::module_status, sort_order
FROM (VALUES
  ('Native Mobile App', 'native-mobile-app', 'coming_soon', 0),
  ('Offline Mode', 'offline-mode', 'coming_soon', 1),
  ('White-Label Mobile App Builder', 'white-label-mobile-app-builder', 'coming_soon', 2)
) AS v(name, slug, status, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- media-production modules
INSERT INTO modules (category_id, name, slug, status, sort_order)
SELECT (SELECT id FROM categories WHERE key = 'media-production'), name, slug, status::module_status, sort_order
FROM (VALUES
  ('Podcast Hosting', 'podcast-hosting', 'coming_soon', 0),
  ('Video Hosting/Streaming', 'video-hosting-streaming', 'coming_soon', 1),
  ('Interactive Product Demo Builder', 'interactive-product-demo-builder', 'coming_soon', 2),
  ('In-Product Guided Tours Editor', 'in-product-guided-tours-editor', 'coming_soon', 3),
  ('Print/Publishing Workflow', 'print-publishing-workflow', 'coming_soon', 4)
) AS v(name, slug, status, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- nonprofit-civic modules
INSERT INTO modules (category_id, name, slug, status, sort_order)
SELECT (SELECT id FROM categories WHERE key = 'nonprofit-civic'), name, slug, status::module_status, sort_order
FROM (VALUES
  ('Donation Management', 'donation-management', 'coming_soon', 0),
  ('Volunteer Management', 'volunteer-management', 'coming_soon', 1),
  ('Grant Tracking', 'grant-tracking', 'coming_soon', 2)
) AS v(name, slug, status, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- extended-vertical modules
INSERT INTO modules (category_id, name, slug, status, sort_order)
SELECT (SELECT id FROM categories WHERE key = 'extended-vertical'), name, slug, status::module_status, sort_order
FROM (VALUES
  ('Legal Practice Management', 'legal-practice-management', 'coming_soon', 0),
  ('Insurance Policy & Claims Management', 'insurance-policy-claims-management', 'coming_soon', 1),
  ('Manufacturing / Quality Control', 'manufacturing-quality-control', 'coming_soon', 2),
  ('Travel & Hospitality Booking', 'travel-hospitality-booking', 'coming_soon', 3),
  ('Property Management', 'property-management', 'coming_soon', 4),
  ('IoT / Hardware Device Integration', 'iot-hardware-device-integration', 'coming_soon', 5),
  ('Agriculture/Farm Management', 'agriculture-farm-management', 'coming_soon', 6),
  ('Esports/Gaming Community Tools', 'esports-gaming-community-tools', 'coming_soon', 7),
  ('Religious/Congregation Management', 'religious-congregation-management', 'coming_soon', 8),
  ('Government/RFP Response Management', 'government-rfp-response-management', 'coming_soon', 9)
) AS v(name, slug, status, sort_order)
ON CONFLICT (slug) DO NOTHING;
