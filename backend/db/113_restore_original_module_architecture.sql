-- Restore Original Enterprise Module Architecture
-- Reverses DB consolidation while preserving all existing module data
--
-- The DB consolidation:
--   1. Created consolidated workspace "hub" entries (coming_soon) that replaced individual modules
--   2. Merged Gamification, Mobile, Media, Non-Profit, Extended Vertical → "solutions" category
--   3. Renamed several category names (e.g., "Finance" → "Finance — Advanced")
--   4. Used "finance" key instead of canonical "finance-advanced"
--
-- This restores the original architecture from categories.data.js while preserving
-- ALL existing module data (CRM contacts, invoices, etc.)

BEGIN;

-- Step 1: Delete ALL consolidated hub entries (coming_soon workspace containers)
-- These replaced the original individual modules during consolidation
DELETE FROM modules WHERE slug IN (
  'affiliate-referral',
  'marketing-utilities',
  'sales-tools',
  'marketing-analytics',
  'ai-content-studio',
  'ai-intelligence',
  'ai-voice-hub',
  'ai-assistant',
  'seo-performance',
  'content-studio',
  'hr-operations',
  'procurement',
  'document-signing',
  'field-service',
  'legal-ip',
  'lms-workspace',
  'online-store',
  'promotions-loyalty',
  'fulfillment',
  'warranty-returns',
  'workspace-hub',
  'file-management',
  'internal-communications',
  'analytics-bi',
  'customer-success-hub',
  'advanced-finance',
  'compliance-security',
  'localization-international',
  'sustainability-esg',
  'utilities-hub',
  'gamification-hub',
  'mobile-hub',
  'media-hub',
  'non-profit-hub'
);

-- Step 2: Restore canonical category keys for categories that were renamed
-- The consolidation renamed "finance-advanced" to simple "finance"
-- Update the key to match the canonical categories.data.js
UPDATE categories SET key = 'finance-advanced' WHERE key = 'finance';

-- Step 3: Restore original category names
UPDATE categories SET name = 'Platform Administration' WHERE key = 'platform-admin';
UPDATE categories SET name = 'Platform Core' WHERE key = 'platform-core';
UPDATE categories SET name = 'Integrations & Developer Ecosystem' WHERE key = 'integrations';
UPDATE categories SET name = 'Marketing' WHERE key = 'marketing';
UPDATE categories SET name = 'AI' WHERE key = 'ai';
UPDATE categories SET name = 'SEO + SEM' WHERE key = 'seo';
UPDATE categories SET name = 'Creative' WHERE key = 'creative';
UPDATE categories SET name = 'Business' WHERE key = 'business';
UPDATE categories SET name = 'Education' WHERE key = 'education';
UPDATE categories SET name = 'Commerce' WHERE key = 'commerce';
UPDATE categories SET name = 'Productivity' WHERE key = 'productivity';
UPDATE categories SET name = 'Analytics' WHERE key = 'analytics';
UPDATE categories SET name = 'Utilities' WHERE key = 'utilities';
UPDATE categories SET name = 'Trust, Compliance & Localization' WHERE key = 'trust-compliance';
UPDATE categories SET name = 'Support & Success' WHERE key = 'support-success';
UPDATE categories SET name = 'Finance — Advanced' WHERE key = 'finance-advanced';
UPDATE categories SET name = 'Workspace Settings' WHERE key = 'settings';

-- Step 4: Restore original badges
UPDATE categories SET badge = 'SE' WHERE key = 'seo';
UPDATE categories SET badge = 'BI' WHERE key = 'business';
UPDATE categories SET badge = 'PR' WHERE key = 'productivity';
UPDATE categories SET badge = 'AN' WHERE key = 'analytics';
UPDATE categories SET badge = 'SS' WHERE key = 'support-success';
UPDATE categories SET badge = 'FA' WHERE key = 'finance-advanced';
UPDATE categories SET badge = 'TC' WHERE key = 'trust-compliance';
UPDATE categories SET badge = 'ST' WHERE key = 'settings';

-- Step 5: Create the original categories that were merged into 'solutions'
INSERT INTO categories (key, name, badge, sort_order, tier) VALUES
  ('gamification', 'Gamification & Engagement', 'GM', 17, 1),
  ('mobile-access', 'Mobile & Access', 'MA', 18, 1),
  ('media-production', 'Media & Content Production', 'MP', 19, 1),
  ('nonprofit-civic', 'Non-Profit & Civic', 'NC', 20, 1),
  ('extended-vertical', 'Extended Vertical Modules', 'EV', 21, 1)
ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name, badge = EXCLUDED.badge, sort_order = EXCLUDED.sort_order, tier = EXCLUDED.tier;

-- Step 6: Move modules from 'solutions' category back to their original categories
UPDATE modules SET category_id = (SELECT id FROM categories WHERE key = 'gamification')
WHERE slug IN (
  'achievement-badge-system',
  'leaderboards',
  'streaks-habit-tracking',
  'product-tour-onboarding-checklist-builder'
);

UPDATE modules SET category_id = (SELECT id FROM categories WHERE key = 'mobile-access')
WHERE slug IN (
  'native-mobile-app',
  'offline-mode',
  'white-label-mobile-app-builder'
);

UPDATE modules SET category_id = (SELECT id FROM categories WHERE key = 'media-production')
WHERE slug IN (
  'podcast-hosting',
  'video-hosting-streaming',
  'interactive-product-demo-builder',
  'in-product-guided-tours-editor',
  'print-publishing-workflow'
);

UPDATE modules SET category_id = (SELECT id FROM categories WHERE key = 'nonprofit-civic')
WHERE slug IN (
  'donation-management',
  'volunteer-management',
  'grant-tracking'
);

UPDATE modules SET category_id = (SELECT id FROM categories WHERE key = 'extended-vertical')
WHERE slug IN (
  'legal-practice-management',
  'insurance-policy-claims-management',
  'manufacturing-quality-control',
  'travel-hospitality-booking',
  'property-management',
  'iot-hardware-device-integration',
  'agriculture-farm-management',
  'esports-gaming-community-tools',
  'religious-congregation-management',
  'government-rfp-response-management'
);

-- Step 7: Restore "Learning Management System" module name
UPDATE modules SET name = 'Learning Management System' WHERE slug = 'learning-management-system';

-- Step 8: Delete the consolidated 'solutions' category
DELETE FROM categories WHERE key = 'solutions';

-- Step 9: Restore ALL sort orders to canonical ordering
UPDATE categories SET sort_order = 0 WHERE key = 'platform-admin';
UPDATE categories SET sort_order = 1 WHERE key = 'platform-core';
UPDATE categories SET sort_order = 2 WHERE key = 'integrations';
UPDATE categories SET sort_order = 3 WHERE key = 'marketing';
UPDATE categories SET sort_order = 4 WHERE key = 'ai';
UPDATE categories SET sort_order = 5 WHERE key = 'seo';
UPDATE categories SET sort_order = 6 WHERE key = 'creative';
UPDATE categories SET sort_order = 7 WHERE key = 'business';
UPDATE categories SET sort_order = 8 WHERE key = 'education';
UPDATE categories SET sort_order = 9 WHERE key = 'commerce';
UPDATE categories SET sort_order = 10 WHERE key = 'productivity';
UPDATE categories SET sort_order = 11 WHERE key = 'analytics';
UPDATE categories SET sort_order = 12 WHERE key = 'utilities';
UPDATE categories SET sort_order = 13 WHERE key = 'trust-compliance';
UPDATE categories SET sort_order = 14 WHERE key = 'support-success';
UPDATE categories SET sort_order = 15 WHERE key = 'finance-advanced';
UPDATE categories SET sort_order = 16 WHERE key = 'gamification';
UPDATE categories SET sort_order = 17 WHERE key = 'mobile-access';
UPDATE categories SET sort_order = 18 WHERE key = 'media-production';
UPDATE categories SET sort_order = 19 WHERE key = 'nonprofit-civic';
UPDATE categories SET sort_order = 20 WHERE key = 'extended-vertical';
UPDATE categories SET sort_order = 21 WHERE key = 'settings';

COMMIT;
