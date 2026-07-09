-- Module Category Reclassification Migration
-- 21 categories → 23 categories, 40+ modules reclassified

-- Step 1: Create new categories with key + badge
INSERT INTO categories (key, name, badge, sort_order) VALUES ('settings', 'Settings', 'ST', 12);
INSERT INTO categories (key, name, badge, sort_order) VALUES ('hr', 'HR', 'HR', 7.5);

-- Renumber existing sort_orders to accommodate new categories
UPDATE categories SET sort_order = 1 WHERE key = 'platform-core';
UPDATE categories SET sort_order = 2 WHERE key = 'integrations';
UPDATE categories SET sort_order = 3 WHERE key = 'settings';
UPDATE categories SET sort_order = 4 WHERE key = 'marketing';
UPDATE categories SET sort_order = 5 WHERE key = 'ai';
UPDATE categories SET sort_order = 6 WHERE key = 'seo';
UPDATE categories SET sort_order = 7 WHERE key = 'creative';
UPDATE categories SET sort_order = 8 WHERE key = 'hr';
UPDATE categories SET sort_order = 9 WHERE key = 'business';
UPDATE categories SET sort_order = 10 WHERE key = 'education';
UPDATE categories SET sort_order = 11 WHERE key = 'commerce';
UPDATE categories SET sort_order = 12 WHERE key = 'productivity';
UPDATE categories SET sort_order = 13 WHERE key = 'analytics';
UPDATE categories SET sort_order = 14 WHERE key = 'utilities';
UPDATE categories SET sort_order = 15 WHERE key = 'trust-compliance';
UPDATE categories SET sort_order = 16 WHERE key = 'finance-advanced';
UPDATE categories SET sort_order = 17 WHERE key = 'support-success';
UPDATE categories SET sort_order = 18 WHERE key = 'gamification';
UPDATE categories SET sort_order = 19 WHERE key = 'mobile-access';
UPDATE categories SET sort_order = 20 WHERE key = 'media-production';
UPDATE categories SET sort_order = 21 WHERE key = 'nonprofit-civic';
UPDATE categories SET sort_order = 22 WHERE key = 'extended-vertical';

-- Step 2: Move workspace-config modules into Settings
UPDATE modules SET category_id = (SELECT id FROM categories WHERE key='settings')
WHERE slug IN (
  'brand-kit',
  'password-manager',
  'multi-language-workspace-ui',
  'localization-translation-management',
  'backup-disaster-recovery-console',
  'consent-cookie-management',
  'data-export-portability-suite',
  'data-residency-selector',
  'terms-policy-version-tracking',
  'public-status-page',
  'enterprise-sso-saml',
  'byok-encryption-key-management',
  'soc2-iso27001-compliance-evidence-dashboard',
  'customer-facing-audit-trail-export',
  'regional-tax-compliance-packs',
  'regulatory-change-monitoring',
  'rtl-language-layout-support',
  'localized-payment-methods'
);

-- Step 3: Consolidate HR modules
UPDATE modules SET category_id = (SELECT id FROM categories WHERE key='hr')
WHERE slug IN (
  'hr',
  'recruitment',
  'internal-wiki-employee-knowledge-base',
  'employee-benefits-administration',
  'employee-wellness-programs',
  'offboarding-checklist-equipment-asset-return-tracking',
  'return-to-office-desk-booking',
  'shift-scheduling',
  'internal-people-skills-directory',
  'background-check-integration'
);

-- Step 4: Move internal messaging/calling to Productivity
UPDATE modules SET category_id = (SELECT id FROM categories WHERE key='productivity')
WHERE slug IN (
  'internal-team-messaging',
  'built-in-voice-video-calling',
  'internal-tooling-script-library',
  'resource-equipment-booking'
);

-- Step 5: Reclassify Marketing misplacements
UPDATE modules SET category_id = (SELECT id FROM categories WHERE key='business') WHERE slug = 'appointment-booking';
UPDATE modules SET category_id = (SELECT id FROM categories WHERE key='business') WHERE slug = 'sales-playbook-battlecard-library';
UPDATE modules SET category_id = (SELECT id FROM categories WHERE key='commerce') WHERE slug = 'review-management';
UPDATE modules SET category_id = (SELECT id FROM categories WHERE key='utilities') WHERE slug = 'qr-code-generator';
UPDATE modules SET category_id = (SELECT id FROM categories WHERE key='creative') WHERE slug IN ('digital-business-cards', 'link-in-bio');
UPDATE modules SET category_id = (SELECT id FROM categories WHERE key='platform-core') WHERE slug = 'membership-community-platform';

-- Step 6: compliance-document-expiry-tracker → Trust
UPDATE modules SET category_id = (SELECT id FROM categories WHERE key='trust-compliance')
WHERE slug = 'compliance-document-expiry-tracker';
