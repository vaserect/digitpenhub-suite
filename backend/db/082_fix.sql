-- Fix for 082 migration - proper subquery syntax
-- Delete existing broken modules and categories, then recreate properly

-- First, let's create all missing categories
INSERT INTO categories (key, name, badge, sort_order) VALUES
  ('marketing', 'Marketing', 'MK', 4),
  ('ai', 'AI', 'AI', 5),
  ('seo', 'SEO', 'SE', 6),
  ('creative', 'Creative', 'CR', 7),
  ('business', 'Business', 'BZ', 9),
  ('education', 'Education', 'ED', 10),
  ('commerce', 'Commerce', 'CM', 11),
  ('productivity', 'Productivity', 'PR', 12),
  ('analytics', 'Analytics', 'AN', 13),
  ('utilities', 'Utilities', 'UT', 14)
ON CONFLICT (key) DO UPDATE SET 
  name = EXCLUDED.name,
  badge = EXCLUDED.badge,
  sort_order = EXCLUDED.sort_order;

-- Now insert all modules with proper subqueries
-- Platform Admin modules
INSERT INTO modules (category_id, name, slug, status, sort_order)
SELECT 
  (SELECT id FROM categories WHERE key = 'platform-admin'),
  name, slug, status::module_status, sort_order
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

-- Platform Core modules  
INSERT INTO modules (category_id, name, slug, status, sort_order)
SELECT 
  (SELECT id FROM categories WHERE key = 'platform-core'),
  name, slug, status::module_status, sort_order
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

SELECT 'Fixed 082 migration applied' AS status;
