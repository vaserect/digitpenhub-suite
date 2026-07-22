/**
 * Per-module route configurations — one entry per module with a DB table.
 * Every module gets its own explicit CRUD route at /api/v1/module/{slug}.
 * No catch-all, no parameterized slug — each is individually registered.
 */

const { requireAuth } = require('../../middleware/auth');
const { createCrudController } = require('../../controllers/crudController');

// Map of module slug → table name + options
const CRUD_MODULES = {
  // ── Marketing ──
  'leads':                 { table: 'lead_forms',           search: ['name','email'] },
  'forms':                 { table: 'forms',                search: ['name'] },
  'survey-builder':        { table: 'forms',                search: ['name'] },
  'popup-builder':         { table: 'popups',               search: ['name'] },
  'url-shortener':         { table: 'short_links',          search: ['url'] },
  'qr-code-generator':     { table: 'qr_codes',             search: ['name'] },
  'digital-business-cards':{ table: 'digital_business_cards', search: ['name'] },
  'link-in-bio':           { table: 'link_in_bio_pages',    search: ['name'] },
  'social-media-scheduler':{ table: 'social_media_scheduler', search: ['post_content'] },
  'review-management':     { table: 'review_management',    search: ['reviewer_name'] },
  'influencer-partner-crm':{ table: 'influencer_crm',       search: ['name','email'] },
  'push-notification-marketing': { table: 'push_notification_campaigns', search: ['title','body'] },
  'customer-segmentation-engine': { table: 'customer_segments', search: ['name','description'] },
  'direct-mail-automation':{ table: 'direct_mail_campaigns', search: ['name'] },
  'print-fulfillment-for-business-cards-signage': { table: 'print_fulfillment_orders', search: ['product_type'] },
  'creative-a-b-testing-studio': { table: 'ab_testing_experiments', search: ['name'] },
  'ugc-creator-content-aggregator': { table: 'ugc_content', search: ['creator_name'] },
  'referral-program':      { table: 'referral_programs',    search: ['name'] },
  'ambassador-program':    { table: 'ambassador_programs',  search: ['name'] },
  'pipeline-deals':        { table: 'crm_deals',            search: ['name'] },
  'referral-affiliate-analytics-dashboard': { table: 'referral_affiliate_analytics', search: ['source'] },
  'landing-page-heat-scroll-analytics': { table: 'landing_page_analytics', search: ['page_url'] },
  'lead-scoring':          { table: 'lead_scoring_models',  search: ['name'] },

  // ── AI ──
  'ai-writer':             { table: 'ai_writer',            search: ['data'] },
  'ai-email-assistant':    { table: 'ai_email',             search: ['data'] },
  'ai-proposal-generator': { table: 'ai_proposals',         search: ['data'] },
  'ai-blog-generator':     { table: 'ai_blog',              search: ['data'] },
  'ai-image-generator':    { table: 'ai_images',            search: ['data'] },
  'ai-translator':         { table: 'ai_translations',      search: ['data'] },
  'ai-meeting-notes':      { table: 'meeting_notes',        search: ['title'] },
  'ai-knowledge-base':     { table: 'ai_knowledge_articles', search: ['title'] },
  'ai-customer-support':   { table: 'ai_documents',         search: ['title'] },
  'ai-voice-transcription-summarization': { table: 'ai_voice', search: ['data'] },
  'ai-data-enrichment':    { table: 'ai_enrich',            search: ['data'] },
  'ai-workflow-suggestions': { table: 'ai_workflow',        search: ['data'] },
  'ai-content-repurposing':{ table: 'ai_repurpose',         search: ['data'] },
  'predictive-sales-forecasting': { table: 'ai_forecast',   search: ['data'] },
  'churn-prediction':      { table: 'ai_churn',             search: ['data'] },
  'anomaly-detection':     { table: 'ai_anomaly',           search: ['data'] },
  'ai-voice-agent':        { table: 'ai_agent',             search: ['data'] },
  'ai-data-analyst':       { table: 'ai_analyst',           search: ['data'] },
  'ai-sales-call-coach':   { table: 'ai_coach',             search: ['data'] },
  'cross-sell-upsell-recommendation-engine': { table: 'ai_cross_sell', search: ['data'] },
  'ai-avatar-spokesperson-video-generator': { table: 'ai_avatar', search: ['data'] },

  // ── SEO ──
  'keyword-research':      { table: 'seo_tracked_keywords', search: ['keyword'] },
  'seo-audit':             { table: 'seo_audits',           search: ['url'] },
  'rank-tracking':         { table: 'seo_rank_history',     search: ['keyword'] },
  'backlink-monitoring':   { table: 'seo_backlinks',        search: ['domain'] },
  'schema-generator':      { table: 'seo_schemas',          search: ['name'] },
  'sitemap-generator':     { table: 'seo_sitemaps',         search: ['url'] },
  'meta-generator':        { table: 'seo_meta_tags',        search: ['page_url'] },
  'robots-generator':      { table: 'seo_robots',           search: ['url'] },
  'google-search-console-integration': { table: 'seo_search_console', search: ['url'] },
  'bing-webmaster-tools-integration': { table: 'seo_search_console', search: ['url'] },
  'local-seo-google-business-profile-manager': { table: 'seo_local_listings', search: ['business_name'] },
  'page-speed-core-web-vitals-monitor': { table: 'seo_page_speed_results', search: ['url'] },
  'sem-ad-campaign-bid-roas-tracker': { table: 'seo_sem_tracker', search: ['campaign_name'] },
  'ai-seo-content-optimizer': { table: 'seo_content_scores', search: ['url'] },
  'accessibility-wcag-audit-tool': { table: 'seo_accessibility', search: ['url'] },
  'voice-search-voice-commerce-optimization': { table: 'seo_voice_search', search: ['url'] },

  // ── Creative ──
  'brand-kit':             { table: 'brand_kits',           search: ['name'] },
  'certificate-generator': { table: 'issued_certificates',  search: ['title'] },
  'color-palette-generator': { table: 'color_palettes',     search: ['name'] },

  // ── Business ──
  'employee-benefits-administration': { table: 'biz_benefits', search: ['name'] },
  'background-check-integration': { table: 'biz_bg_checks', search: ['candidate_name'] },
  'compliance-document-expiry-tracker': { table: 'biz_compliance', search: ['name'] },
  'dei-reporting-dashboard': { table: 'biz_dei', search: ['data'] },
  'return-to-office-desk-booking': { table: 'biz_desk_bookings', search: ['employee_name'] },
  'e-signature-contracts': { table: 'biz_esignatures', search: ['title'] },
  'field-service-management': { table: 'biz_field_service', search: ['title'] },
  'multi-location-franchise-management': { table: 'biz_franchises', search: ['name'] },
  'job-board-external-talent-marketplace': { table: 'biz_jobs', search: ['title'] },
  'legal-template-library': { table: 'biz_legal_templates', search: ['title'] },
  'offboarding-checklist-equipment-asset-return-tracking': { table: 'biz_offboarding', search: ['employee_name'] },
  'okr-goal-tracking':     { table: 'biz_okrs',             search: ['title'] },
  'procurement-purchase-orders': { table: 'biz_procurement', search: ['title'] },
  'resource-equipment-booking': { table: 'biz_resource_bookings', search: ['resource_name'] },
  'shift-scheduling':      { table: 'biz_shifts',           search: ['employee_name'] },
  'supplier-partner-portal': { table: 'biz_suppliers',      search: ['name'] },
  'trademark-ip-asset-tracker': { table: 'biz_trademarks',  search: ['name'] },
  'employee-wellness-programs': { table: 'biz_wellness',    search: ['name'] },
  'internal-wiki-employee-knowledge-base': { table: 'biz_wiki', search: ['title'] },
  'contract-vendor-management': { table: 'biz_compliance',  search: ['name'] },

  // ── Education ──
  'assignments':           { table: 'assignments',          search: ['title'] },
  'student-portal':        { table: 'edu_students',         search: ['full_name','email'] },
  'teacher-portal':        { table: 'edu_teachers',         search: ['full_name','email'] },
  'parent-portal':         { table: 'edu_students',         search: ['full_name','email'] },
  'certificates':          { table: 'edu_certificates',     search: ['title'] },
  'cohort-live-class-scheduling': { table: 'edu_schedule',  search: ['title'] },
  'discussion-forums-per-course': { table: 'edu_discussions',search: ['title','body'] },
  'gradebook-analytics-for-parents-admins': { table: 'edu_grades', search: ['grade'] },
  'plagiarism-ai-content-detection': { table: 'edu_plagiarism', search: ['content_hash'] },

  // ── Commerce ──
  'coupons':               { table: 'coupons',              search: ['code'] },
  'subscriptions':         { table: 'customer_subscriptions', search: ['plan_name','customer_email'] },
  'digital-products':      { table: 'digital_products',     search: ['name'] },
  'gift-cards':            { table: 'commerce_gift_cards',  search: ['code'] },
  'wishlist-save-for-later': { table: 'commerce_wishlists', search: ['product_name'] },
  'product-reviews-qa':    { table: 'commerce_product_reviews', search: ['reviewer_name','review_text'] },
  'loyalty-rewards-program': { table: 'commerce_loyalty',   search: ['name'] },
  'warranty-rma-management': { table: 'commerce_rma',       search: ['product_name'] },
  'shipping-label-printing-carrier-rate-shopping': { table: 'commerce_shipping', search: ['order_ref'] },
  'print-on-demand-integration': { table: 'commerce_print_on_demand', search: ['product_name'] },
  'dropshipping-supplier-integration': { table: 'commerce_dropshipping', search: ['supplier_name'] },
  'marketplace-dispute-resolution': { table: 'commerce_dispute_resolution', search: ['title'] },
  'multi-vendor-marketplace-payouts': { table: 'commerce_marketplace_payouts', search: ['vendor_name'] },
  'pos-online-store-inventory-sync': { table: 'pos_inventory_sync', search: ['sync_status'] },
  'warranty-registration-portal': { table: 'warranty_registrations', search: ['product_name','purchaser_name'] },

  // ── Productivity ──
  'notes':                 { table: 'notes',                search: ['title','content'] },
  'whiteboard-mind-mapping-tool': { table: 'whiteboards',   search: ['name'] },
  'internal-people-skills-directory': { table: 'people_directory', search: ['full_name','email'] },
  'idea-management-suggestion-box': { table: 'ideas',       search: ['title','description'] },
  'multi-timezone-meeting-coordinator': { table: 'timezone_proposals', search: ['title'] },

  // ── Analytics ──
  'business-dashboard':    { table: 'analytics_daily',      search: ['data'] },
  'marketing-dashboard':   { table: 'analytics_daily',      search: ['data'] },
  'sales-dashboard':       { table: 'analytics_daily',      search: ['data'] },
  'website-analytics':     { table: 'analytics_daily',      search: ['data'] },
  'performance-reports':   { table: 'analytics_daily',      search: ['data'] },
  'custom-reports':        { table: 'saved_reports',        search: ['name'] },
  'heatmaps-session-recording': { table: 'session_recordings', search: ['page_url'] },
  'data-warehouse-connector-export': { table: 'export_jobs', search: ['name'] },
  'custom-sql-query-builder': { table: 'saved_reports',     search: ['name'] },
  'scheduled-report-emails-pdfs': { table: 'saved_reports', search: ['name'] },
  'cohort-retention-analysis': { table: 'analytics_daily',  search: ['data'] },

  // ── Support & Success ──
  'nps-csat-survey-automation': { table: 'ss_nps',          search: ['data'] },
  'customer-health-score': { table: 'ss_health',            search: ['data'] },
  'sla-management':       { table: 'ss_sla',                search: ['name'] },
  'public-roadmap-feature-request-board': { table: 'ss_roadmap', search: ['title'] },
  'live-chat':            { table: 'ss_live_chat',          search: ['message'] },
  'built-in-voice-video-calling': { table: 'ss_voice_video', search: ['data'] },
  'internal-team-messaging': { table: 'ss_team_messaging',  search: ['message'] },

  // ── Finance — Advanced ──
  'dunning-management':    { table: 'dunning_campaigns',    search: ['name'] },
  'multi-entity-accounting': { table: 'fa_multi_entity',    search: ['data'] },
  'budget-planning-forecasting': { table: 'fa_budget',      search: ['data'] },
  'bill-pay-accounts-payable-automation': { table: 'fa_bill_pay', search: ['data'] },
  'financing-lending-integration': { table: 'fa_financing', search: ['data'] },
  'tax-filing-prep-export': { table: 'fa_tax_filing',       search: ['data'] },
  'fx-currency-hedging-alerts': { table: 'fa_fx',           search: ['data'] },
  'corporate-card-expense-card-issuing': { table: 'fa_corp_cards', search: ['data'] },
  'vendor-risk-scorecard': { table: 'fa_vendor_risk',       search: ['data'] },
  'usage-based-metered-billing-dashboard': { table: 'fa_usage_billing', search: ['data'] },
  'revenue-recognition-automation': { table: 'fa_revenue_rec', search: ['data'] },
  'subscription-pause-skip-self-service': { table: 'fa_sub_pause', search: ['data'] },
  'fraud-detection-engine': { table: 'fa_fraud',            search: ['data'] },
  'chargeback-dispute-management': { table: 'fa_chargeback', search: ['data'] },
  'identity-verification-kyc': { table: 'fa_kyc',           search: ['data'] },
  'sales-tax-nexus-compliance-tracker': { table: 'fa_tax_nexus', search: ['data'] },
  'international-contractor-payments': { table: 'fa_contractor', search: ['data'] },
  'multi-country-payroll-compliance-packs': { table: 'fa_payroll_packs', search: ['data'] },
  'cap-table-equity-management': { table: 'fa_cap_table',   search: ['data'] },
  'board-investor-reporting-portal': { table: 'fa_board_reporting', search: ['data'] },

  // ── Trust & Compliance ──
  'gdpr-ccpa-data-request-center': { table: 'gdpr_requests', search: ['requester_email'] },
  'consent-cookie-management': { table: 'consent_records',   search: ['visitor_id'] },
  'backup-disaster-recovery-console': { table: 'tc_backups', search: ['data'] },
  'public-status-page':    { table: 'tc_status_pages',      search: ['data'] },
  'terms-policy-version-tracking': { table: 'tc_terms',      search: ['data'] },
  'customer-facing-audit-trail-export': { table: 'tc_audit_trail', search: ['action'] },
  'rtl-language-layout-support': { table: 'tc_rtl',          search: ['data'] },
  'esg-sustainability-reporting': { table: 'tc_esg',         search: ['data'] },
  'multi-language-workspace-ui': { table: 'tc_multi_lang',   search: ['data'] },
  'regional-tax-compliance-packs': { table: 'tc_tax_packs',  search: ['data'] },
  'localized-payment-methods': { table: 'tc_local_payments', search: ['data'] },
  'enterprise-sso-saml':  { table: 'sso_providers',          search: ['name'] },
  'data-residency-selector': { table: 'tc_data_residency',   search: ['data'] },
  'byok-encryption-key-management': { table: 'tc_byok',      search: ['data'] },
  'soc2-iso27001-compliance-evidence-dashboard': { table: 'tc_soc2', search: ['data'] },
  'data-export-portability-suite': { table: 'tc_data_export', search: ['data'] },
  'regulatory-change-monitoring': { table: 'tc_regulatory',  search: ['data'] },
  'carbon-footprint-sustainability-tracker-for-operations': { table: 'tc_carbon', search: ['data'] },
  'localization-translation-management': { table: 'tc_localization', search: ['data'] },

  // ── Gamification ──
  'achievement-badge-system': { table: 'gm_badges',          search: ['name'] },
  'leaderboards':          { table: 'gm_leaderboards',       search: ['name'] },
  'streaks-habit-tracking': { table: 'gm_streaks',           search: ['data'] },
  'product-tour-onboarding-checklist-builder': { table: 'gm_onboarding', search: ['name'] },

  // ── Mobile ──
  'native-mobile-app':     { table: 'ma_mobile',             search: ['data'] },
  'offline-mode':          { table: 'ma_offline',            search: ['data'] },
  'white-label-mobile-app-builder': { table: 'ma_whitelabel_app', search: ['name'] },

  // ── Media & Content ──
  'podcast-hosting':       { table: 'mp_podcast',            search: ['title'] },
  'video-hosting-streaming': { table: 'mp_video',            search: ['title'] },
  'interactive-product-demo-builder': { table: 'mp_demo',    search: ['name'] },
  'in-product-guided-tours-editor': { table: 'mp_tours',     search: ['name'] },
  'print-publishing-workflow': { table: 'mp_print',          search: ['name'] },

  // ── Non-Profit ──
  'donation-management':   { table: 'np_donations',          search: ['donor_email'] },
  'volunteer-management':  { table: 'np_volunteers',         search: ['name','email'] },
  'grant-tracking':        { table: 'np_grants',             search: ['name'] },

  // ── Extended Vertical ──
  'legal-practice-management': { table: 'ev_legal',          search: ['data'] },
  'insurance-policy-claims-management': { table: 'ev_insurance', search: ['data'] },
  'manufacturing-quality-control': { table: 'ev_manufacturing', search: ['data'] },
  'travel-hospitality-booking': { table: 'ev_travel',        search: ['data'] },
  'property-management':  { table: 'ev_property',            search: ['data'] },
  'iot-hardware-device-integration': { table: 'ev_iot',       search: ['data'] },
  'agriculture-farm-management': { table: 'ev_agriculture',  search: ['data'] },
  'esports-gaming-community-tools': { table: 'ev_esports',   search: ['data'] },
  'religious-congregation-management': { table: 'ev_religious', search: ['data'] },
  'government-rfp-response-management': { table: 'ev_gov',   search: ['data'] },
};

// Pre-create all CRUD controllers
const controllers = {};
const ROUTE_CONFIGS = [];

for (const [slug, config] of Object.entries(CRUD_MODULES)) {
  const ctrl = createCrudController(config.table, {
    searchColumns: config.search,
    exportName: slug,
  });
  controllers[slug] = ctrl;

  ROUTE_CONFIGS.push({
    path: `/api/v1/module/${slug}`,
    file: 'moduleCrud',
    slug: slug,
    table: config.table,
    middleware: [requireAuth],
    description: `${slug} CRUD`,
  });
}

module.exports = { ROUTE_CONFIGS, CRUD_MODULES };
