-- Seed all active/working modules that have backend routes
-- These are the modules users can actually use (not coming_soon)

-- Get category IDs
DO $$
DECLARE
  cat_business INT := (SELECT id FROM categories WHERE key = 'business');
  cat_marketing INT := (SELECT id FROM categories WHERE key = 'marketing');
  cat_hr INT := (SELECT id FROM categories WHERE key = 'hr');
  cat_commerce INT := (SELECT id FROM categories WHERE key = 'commerce');
  cat_productivity INT := (SELECT id FROM categories WHERE key = 'productivity');
  cat_finance INT := (SELECT id FROM categories WHERE key = 'finance-advanced');
  cat_support INT := (SELECT id FROM categories WHERE key = 'support-success');
  cat_education INT := (SELECT id FROM categories WHERE key = 'education');
  cat_ai INT := (SELECT id FROM categories WHERE key = 'ai');
  cat_seo INT := (SELECT id FROM categories WHERE key = 'seo');
  cat_creative INT := (SELECT id FROM categories WHERE key = 'creative');
  cat_analytics INT := (SELECT id FROM categories WHERE key = 'analytics');
  cat_utilities INT := (SELECT id FROM categories WHERE key = 'utilities');
BEGIN
  -- Business modules (active)
  INSERT INTO modules (category_id, name, slug, status, route, sort_order) VALUES
    (cat_business, 'CRM', 'crm', 'active', '/crm', 1),
    (cat_business, 'Project Management', 'project-management', 'active', '/pm', 2),
    (cat_business, 'Team Management', 'team-management', 'active', '/team', 3),
    (cat_business, 'Appointments', 'appointments', 'active', '/appointments', 4),
    (cat_business, 'Expenses', 'expenses', 'active', '/expenses', 5),
    (cat_business, 'Recruitment', 'recruitment', 'active', '/recruitment', 6),
    (cat_business, 'Client Portal', 'client-portal', 'active', '/portal', 7),
    (cat_business, 'Quotations', 'quotations', 'active', '/quotations', 8),
    (cat_business, 'Tasks', 'tasks', 'active', '/tasks', 9),
    (cat_business, 'Forms', 'forms', 'active', '/forms', 10),
    (cat_business, 'Calendar', 'calendar', 'active', '/calendar', 11),
    (cat_business, 'Time Tracking', 'time-tracking', 'active', '/time-tracking', 12),
    (cat_business, 'Notes', 'notes', 'active', '/notes', 13),
    (cat_business, 'Documents', 'documents', 'active', '/documents', 14),
    (cat_business, 'Delivery Tracking', 'delivery-tracking', 'active', '/delivery', 15)
  ON CONFLICT (slug) DO UPDATE SET status = 'active', route = EXCLUDED.route;

  -- Marketing modules
  INSERT INTO modules (category_id, name, slug, status, route, sort_order) VALUES
    (cat_marketing, 'Email Marketing', 'email-marketing', 'active', '/email', 1),
    (cat_marketing, 'Lead Generation', 'lead-generation', 'active', '/leads', 2),
    (cat_marketing, 'Landing Pages', 'landing-pages', 'active', '/pages', 3),
    (cat_marketing, 'Funnels', 'funnels', 'active', '/funnels', 4),
    (cat_marketing, 'Marketing Automation', 'marketing-automation', 'active', '/automation', 5),
    (cat_marketing, 'WhatsApp Marketing', 'whatsapp-marketing', 'active', '/whatsapp', 6),
    (cat_marketing, 'Affiliates', 'affiliates', 'active', '/affiliates', 7),
    (cat_marketing, 'Referrals', 'referrals', 'active', '/referrals', 8),
    (cat_marketing, 'SMS Marketing', 'sms-marketing', 'active', '/sms', 9)
  ON CONFLICT (slug) DO UPDATE SET status = 'active', route = EXCLUDED.route;

  -- HR modules
  INSERT INTO modules (category_id, name, slug, status, route, sort_order) VALUES
    (cat_hr, 'HR & Payroll', 'hr-payroll', 'active', '/hr', 1),
    (cat_hr, 'Payroll', 'payroll', 'active', '/payroll', 2)
  ON CONFLICT (slug) DO UPDATE SET status = 'active', route = EXCLUDED.route;

  -- Commerce modules
  INSERT INTO modules (category_id, name, slug, status, route, sort_order) VALUES
    (cat_commerce, 'Inventory', 'inventory', 'active', '/inventory', 1),
    (cat_commerce, 'POS', 'pos', 'active', '/pos', 2),
    (cat_commerce, 'Orders', 'orders', 'active', '/orders', 3),
    (cat_commerce, 'Coupons', 'coupons', 'active', '/coupons', 4),
    (cat_commerce, 'Store Builder', 'store-builder', 'active', '/store', 5),
    (cat_commerce, 'Digital Products', 'digital-products', 'active', '/digital-products', 6)
  ON CONFLICT (slug) DO UPDATE SET status = 'active', route = EXCLUDED.route;

  -- Finance modules
  INSERT INTO modules (category_id, name, slug, status, route, sort_order) VALUES
    (cat_finance, 'Invoices', 'invoices', 'active', '/invoices', 1),
    (cat_finance, 'Accounting', 'accounting', 'active', '/accounting', 2),
    (cat_finance, 'Billing & Subscriptions', 'billing-subscriptions', 'active', '/billing', 3)
  ON CONFLICT (slug) DO UPDATE SET status = 'active', route = EXCLUDED.route;

  -- Support modules
  INSERT INTO modules (category_id, name, slug, status, route, sort_order) VALUES
    (cat_support, 'Helpdesk', 'helpdesk', 'active', '/helpdesk', 1),
    (cat_support, 'Knowledge Base', 'knowledge-base', 'active', '/kb', 2)
  ON CONFLICT (slug) DO UPDATE SET status = 'active', route = EXCLUDED.route;

  -- Education modules
  INSERT INTO modules (category_id, name, slug, status, route, sort_order) VALUES
    (cat_education, 'LMS', 'lms', 'active', '/lms', 1),
    (cat_education, 'School Management', 'school-management', 'active', '/school', 2),
    (cat_education, 'Assignments', 'assignments', 'active', '/assignments', 3),
    (cat_education, 'CBT', 'cbt', 'active', '/cbt', 4)
  ON CONFLICT (slug) DO UPDATE SET status = 'active', route = EXCLUDED.route;

  -- Analytics modules
  INSERT INTO modules (category_id, name, slug, status, route, sort_order) VALUES
    (cat_analytics, 'Analytics Dashboard', 'analytics-dashboard', 'active', '/analytics', 1),
    (cat_analytics, 'Custom Reports', 'custom-reports', 'active', '/reports', 2)
  ON CONFLICT (slug) DO UPDATE SET status = 'active', route = EXCLUDED.route;

  -- Utilities modules
  INSERT INTO modules (category_id, name, slug, status, route, sort_order) VALUES
    (cat_utilities, 'URL Shortener', 'url-shortener', 'active', '/urls', 1),
    (cat_utilities, 'QR Codes', 'qr-codes', 'active', '/qr', 2),
    (cat_utilities, 'Barcodes', 'barcodes', 'active', '/barcodes', 3)
  ON CONFLICT (slug) DO UPDATE SET status = 'active', route = EXCLUDED.route;

  -- Creative modules
  INSERT INTO modules (category_id, name, slug, status, route, sort_order) VALUES
    (cat_creative, 'Digital Business Cards', 'digital-business-cards', 'active', '/cards', 1),
    (cat_creative, 'Certificates', 'certificates', 'active', '/certificates', 2),
    (cat_creative, 'Brand Kit', 'brand-kit', 'active', '/brand', 3)
  ON CONFLICT (slug) DO UPDATE SET status = 'active', route = EXCLUDED.route;

  -- AI modules
  INSERT INTO modules (category_id, name, slug, status, route, sort_order) VALUES
    (cat_ai, 'AI Writer', 'ai-writer', 'active', '/ai/writer', 1),
    (cat_ai, 'AI Email Writer', 'ai-email-writer', 'active', '/ai/email', 2),
    (cat_ai, 'AI Proposal Writer', 'ai-proposal-writer', 'active', '/ai/proposal', 3),
    (cat_ai, 'AI Blog Writer', 'ai-blog-writer', 'active', '/ai/blog', 4)
  ON CONFLICT (slug) DO UPDATE SET status = 'active', route = EXCLUDED.route;

  -- SEO modules
  INSERT INTO modules (category_id, name, slug, status, route, sort_order) VALUES
    (cat_seo, 'SEO Tools', 'seo-tools', 'active', '/seo', 1)
  ON CONFLICT (slug) DO UPDATE SET status = 'active', route = EXCLUDED.route;

  -- Productivity modules
  INSERT INTO modules (category_id, name, slug, status, route, sort_order) VALUES
    (cat_productivity, 'Password Manager', 'password-manager', 'active', '/passwords', 1),
    (cat_productivity, 'Quiz Builder', 'quiz-builder', 'active', '/quiz', 2),
    (cat_productivity, 'Popup Builder', 'popup-builder', 'active', '/popups', 3)
  ON CONFLICT (slug) DO UPDATE SET status = 'active', route = EXCLUDED.route;
END $$;

SELECT 'Seeded ' || COUNT(*) || ' active modules' FROM modules WHERE status = 'active';
