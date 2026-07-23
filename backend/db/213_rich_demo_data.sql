-- Migration 213: Rich demo data for new orgs
-- Extends seed_starter_content() with realistic volumes across all modules

CREATE OR REPLACE FUNCTION seed_starter_content(p_org_id UUID)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_user_id UUID;
  v_client_id UUID;
  v_inv_id UUID;
  v_list_id UUID;
  v_proj1_id UUID;
  v_proj2_id UUID;
  v_dept_ids UUID[] := '{}';
  v_emp_ids UUID[] := '{}';
  v_cat_id UUID;
  v_i INT;
  v_contact_id UUID;
  v_exp_cat_id UUID;
  v_sub_id UUID;
  v_plan_id UUID;
BEGIN
  -- Get org owner
  SELECT id INTO v_user_id FROM users WHERE org_id = p_org_id AND role = 'owner' LIMIT 1;
  IF v_user_id IS NULL THEN RETURN; END IF;

  -- ── CRM: 15 contacts with realistic pipeline stages ──────
  INSERT INTO contacts (org_id, full_name, company, email, phone, stage, value_ngn, tags, created_at) VALUES
    (p_org_id, 'Chioma Okafor', 'Okafor Ventures', 'chioma@okafortech.ng', '+2348025001001', 'new', 0, ARRAY['warm','tech'], now() - interval '30 days'),
    (p_org_id, 'Femi Adeyemi', 'Lagos Digital Agency', 'femi@lagosdigital.ng', '+2348092002002', 'contacted', 250000, ARRAY['hot','marketing'], now() - interval '25 days'),
    (p_org_id, 'Ngozi Eze', 'Eze Holdings', 'ngozi@ezeholdings.com', '+2348063003003', 'proposal_sent', 1500000, ARRAY['enterprise'], now() - interval '20 days'),
    (p_org_id, 'Tunde Bakare', 'Bakare Properties', 'tunde@bakareproperty.com', '+2348034004004', 'won', 750000, ARRAY['closed'], now() - interval '18 days'),
    (p_org_id, 'Amara Obi', 'Obi Solutions', 'amara@obisolutions.ng', '+2347015005005', 'lost', 0, ARRAY['lost'], now() - interval '15 days'),
    (p_org_id, 'Kelechi Nwosu', 'Nwosu Logistics', 'kelechi@nwosulog.com', '+2348036006006', 'new', 500000, ARRAY['logistics'], now() - interval '12 days'),
    (p_org_id, 'Yemi Ogunlade', 'Ogunlade Media', 'yemi@ogunlademedia.com', '+2348097007007', 'contacted', 350000, ARRAY['media','hot'], now() - interval '10 days'),
    (p_org_id, 'Fatima Usman', 'Usman Group', 'fatima@usmangroup.ng', '+2348028008008', 'proposal_sent', 2800000, ARRAY['enterprise','hot'], now() - interval '8 days'),
    (p_org_id, 'Chidi Anene', 'Anene Tech', 'chidi@anenetch.ng', '+2348099009009', 'won', 125000, ARRAY['tech'], now() - interval '6 days'),
    (p_org_id, 'Zainab Kabir', 'Kabir Enterprises', 'zainab@kabir.com', '+2347010001001', 'new', 850000, ARRAY['warm'], now() - interval '4 days'),
    (p_org_id, 'Olusegun Bello', 'Bello Industries', 'olusegun@belloind.com', '+2347011002002', 'contacted', 420000, ARRAY['manufacturing'], now() - interval '3 days'),
    (p_org_id, 'Adaobi Okeke', 'Okeke Consulting', 'adaobi@okeconsult.com', '+2347012003003', 'won', 2100000, ARRAY['consulting','closed'], now() - interval '2 days'),
    (p_org_id, 'Ebuka Okafor', 'Okafor Digital', 'ebuka@okafor.ng', '+2347013004004', 'new', 175000, ARRAY['digital'], now() - interval '1 day'),
    (p_org_id, 'Simi Ogun', 'Ogun Fashion House', 'simi@fashion.ng', '+2347014005005', 'proposal_sent', 680000, ARRAY['fashion'], now() - interval '12 hours'),
    (p_org_id, 'Bayo Akinwande', 'Akinwande Solar', 'bayo@solar.ng', '+2347015006006', 'contacted', 3200000, ARRAY['cleantech','hot'], now() - interval '6 hours');
  v_contact_id := lastval() - 14;

  -- ── Companies (from contacts that have Company set) ──────
  -- 12 unique companies already created via contacts above

  -- ── Invoices: 20 invoices across clients ────────────────
  INSERT INTO contacts (org_id, full_name, company, email) VALUES
    (p_org_id, 'James Okonkwo', 'Okonkwo & Partners', 'james@okonkwopartners.com');
  v_client_id := lastval();

  FOR v_i IN 1..20 LOOP
    INSERT INTO invoices (org_id, client_name, contact_id, total, status, due_date, created_at) VALUES
      (p_org_id,
       CASE v_i % 5 WHEN 0 THEN 'Okonkwo & Partners' WHEN 1 THEN 'Obi Solutions' WHEN 2 THEN 'Eze Holdings' WHEN 3 THEN 'Bakare Properties' ELSE 'Lagos Digital Agency' END,
       CASE v_i % 5 WHEN 0 THEN v_client_id WHEN 1 THEN (SELECT id FROM contacts WHERE org_id = p_org_id AND email = 'amara@obisolutions.ng') WHEN 2 THEN (SELECT id FROM contacts WHERE org_id = p_org_id AND email = 'ngozi@ezeholdings.com') ELSE v_client_id END,
       (random() * 500000 + 50000)::int,
       CASE WHEN v_i <= 12 THEN 'paid' WHEN v_i <= 17 THEN 'pending' ELSE 'overdue' END,
       now() + (v_i * interval '2 days'),
       now() - (v_i * interval '1 day'));
  END LOOP;

  -- ── Expenses: 12 expenses across 4 categories ───────────
  INSERT INTO expense_categories (org_id, name) VALUES
    (p_org_id, 'Office Supplies'), (p_org_id, 'Software'), (p_org_id, 'Travel'), (p_org_id, 'Utilities');
  FOR v_i IN 1..12 LOOP
    INSERT INTO expenses (org_id, category_id, description, amount, created_at) VALUES
      (p_org_id,
       (SELECT id FROM expense_categories WHERE org_id = p_org_id ORDER BY random() LIMIT 1),
       CASE v_i % 4 WHEN 0 THEN 'Monthly hosting' WHEN 1 THEN 'Client meeting transport' WHEN 2 THEN 'Office supplies restock' ELSE 'Software license renewal' END,
       (random() * 100000 + 5000)::int,
       now() - (v_i * interval '2 days'));
  END LOOP;

  -- ── Email: 3 lists, 50 subscribers, 5 campaigns ─────────
  INSERT INTO email_lists (org_id, name) VALUES
    (p_org_id, 'Newsletter Subscribers'), (p_org_id, 'Premium Clients'), (p_org_id, 'Lead Follow-ups');
  FOR v_i IN 1..50 LOOP
    INSERT INTO email_subscribers (org_id, list_id, email, full_name, status) VALUES
      (p_org_id, (SELECT id FROM email_lists WHERE org_id = p_org_id ORDER BY random() LIMIT 1),
       concat('subscriber', v_i, '@example.com'),
       concat('Subscriber ', v_i),
       CASE WHEN v_i % 10 = 0 THEN 'unsubscribed' ELSE 'subscribed' END);
  END LOOP;
  INSERT INTO email_campaigns (org_id, list_id, subject, status, sent_at) VALUES
    (p_org_id, (SELECT id FROM email_lists WHERE org_id = p_org_id LIMIT 1), 'Monthly Newsletter — July 2026', 'sent', now() - interval '5 days'),
    (p_org_id, (SELECT id FROM email_lists WHERE org_id = p_org_id OFFSET 1 LIMIT 1), 'Exclusive Premium Offer', 'sent', now() - interval '3 days'),
    (p_org_id, (SELECT id FROM email_lists WHERE org_id = p_org_id LIMIT 1), 'Product Update: New Features', 'draft', NULL),
    (p_org_id, (SELECT id FROM email_lists WHERE org_id = p_org_id OFFSET 2 LIMIT 1), 'Lead Nurture Series — Week 1', 'scheduled', NULL),
    (p_org_id, (SELECT id FROM email_lists WHERE org_id = p_org_id LIMIT 1), 'Event Invitation: Business Workshop', 'sent', now() - interval '1 day');

  -- ── Calendar: 8 events ──────────────────────────────────
  INSERT INTO calendar_events (org_id, title, event_date, created_by) VALUES
    (p_org_id, 'Client call — Chioma Okafor', now() + interval '1 day', v_user_id),
    (p_org_id, 'Weekly team sync', now() + interval '2 days', v_user_id),
    (p_org_id, 'Invoice due reminder — Okonkwo', now() + interval '14 days', v_user_id),
    (p_org_id, 'Q3 Budget Review', now() + interval '3 days', v_user_id),
    (p_org_id, 'Product Demo — Fatima Usman', now() + interval '5 days', v_user_id),
    (p_org_id, 'Marketing campaign review', now() + interval '4 days', v_user_id),
    (p_org_id, 'Board meeting prep', now() + interval '7 days', v_user_id),
    (p_org_id, 'Team offsite planning', now() + interval '10 days', v_user_id);

  -- ── Projects: 5 (3 active, 2 completed) ─────────────────
  INSERT INTO projects (org_id, name, status, created_at) VALUES
    (p_org_id, 'Website Redesign', 'active', now() - interval '20 days'),
    (p_org_id, 'Q3 Marketing Campaign', 'active', now() - interval '15 days'),
    (p_org_id, 'Mobile App Development', 'active', now() - interval '10 days'),
    (p_org_id, 'Annual Report 2025', 'completed', now() - interval '45 days'),
    (p_org_id, 'Office Relocation', 'completed', now() - interval '60 days');
  v_proj1_id := lastval() - 4;

  -- ── Tasks: 30 items across projects ─────────────────────
  INSERT INTO tasks (org_id, title) VALUES
    (p_org_id, 'Website Redesign'), (p_org_id, 'Q3 Marketing Campaign'), (p_org_id, 'App Dev');
  FOR v_i IN 1..30 LOOP
    INSERT INTO task_items (org_id, task_id, title, status, assignee_id, created_at) VALUES
      (p_org_id,
       (SELECT id FROM tasks WHERE org_id = p_org_id ORDER BY random() LIMIT 1),
       CASE v_i % 10 WHEN 0 THEN 'Review analytics dashboard' WHEN 1 THEN 'Update stakeholder presentation' WHEN 2 THEN 'Finalize design mockups' WHEN 3 THEN 'Write test cases' WHEN 4 THEN 'Deploy staging environment' WHEN 5 THEN 'Client feedback review' WHEN 6 THEN 'Draft social media posts' WHEN 7 THEN 'Optimize database queries' WHEN 8 THEN 'Prepare monthly report' ELSE 'Research competitor features' END,
       CASE WHEN v_i <= 10 THEN 'done' WHEN v_i <= 20 THEN 'in_progress' ELSE 'todo' END,
       v_user_id,
       now() - (v_i * interval '1 day'));
  END LOOP;

  -- ── Help Desk: 8 tickets ────────────────────────────────
  INSERT INTO helpdesk_tickets (org_id, subject, status, priority, created_by, created_at) VALUES
    (p_org_id, 'Cannot access email campaign editor', 'open', 'high', v_user_id, now() - interval '5 days'),
    (p_org_id, 'Question about billing cycle', 'pending', 'normal', v_user_id, now() - interval '4 days'),
    (p_org_id, 'Feature request: bulk import from Excel', 'resolved', 'low', v_user_id, now() - interval '6 days'),
    (p_org_id, 'Invoice PDF not generating', 'open', 'urgent', v_user_id, now() - interval '1 day'),
    (p_org_id, 'User role permissions issue', 'pending', 'high', v_user_id, now() - interval '2 days'),
    (p_org_id, 'Integration with Slack failed', 'resolved', 'normal', v_user_id, now() - interval '7 days'),
    (p_org_id, 'API rate limit question', 'open', 'low', v_user_id, now() - interval '3 days'),
    (p_org_id, 'Dashboard loading slowly', 'pending', 'high', v_user_id, now() - interval '12 hours');

  -- ── HR: 5 departments, 8 employees, leave requests ──────
  INSERT INTO hr_departments (org_id, name) VALUES
    (p_org_id, 'Engineering'), (p_org_id, 'Marketing'), (p_org_id, 'Sales'), (p_org_id, 'Operations'), (p_org_id, 'Finance');
  FOR v_i IN 1..8 LOOP
    INSERT INTO hr_employees (org_id, full_name, email, department_id, position, salary_ngn, created_at) VALUES
      (p_org_id,
       CASE v_i WHEN 1 THEN 'Chidi Nwosu' WHEN 2 THEN 'Zainab Abdullah' WHEN 3 THEN 'Emeka Okafor' WHEN 4 THEN 'Funke Adebayo' WHEN 5 THEN 'Samuel Eze' WHEN 6 THEN 'Grace Okonkwo' WHEN 7 THEN 'Tunde Balogun' WHEN 8 THEN 'Nkechi Obi' END,
       concat('emp', v_i, '@org.com'),
       (SELECT id FROM hr_departments WHERE org_id = p_org_id ORDER BY random() LIMIT 1),
       CASE v_i WHEN 1 THEN 'Lead Developer' WHEN 2 THEN 'Marketing Manager' WHEN 3 THEN 'Sales Rep' WHEN 4 THEN 'Operations Lead' WHEN 5 THEN 'Backend Developer' WHEN 6 THEN 'Content Strategist' WHEN 7 THEN 'Account Executive' WHEN 8 THEN 'Financial Analyst' END,
       (350000 + v_i * 50000)::int,
       now() - (v_i * interval '60 days'));
  END LOOP;

  -- ── Recruitment: 3 job postings ─────────────────────────
  INSERT INTO job_postings (org_id, title, department, status, created_by, created_at) VALUES
    (p_org_id, 'Senior Software Engineer', 'Engineering', 'open', v_user_id, now() - interval '7 days'),
    (p_org_id, 'Marketing Lead', 'Marketing', 'open', v_user_id, now() - interval '3 days'),
    (p_org_id, 'Customer Success Manager', 'Operations', 'closed', v_user_id, now() - interval '14 days');

  -- ── Contracts: 4 contracts ──────────────────────────────
  INSERT INTO contracts (org_id, title, status, value_ngn, created_by, created_at) VALUES
    (p_org_id, 'Service Agreement — Lagos Digital Agency', 'active', 250000, v_user_id, now() - interval '20 days'),
    (p_org_id, 'Consulting Contract — Eze Holdings', 'active', 1500000, v_user_id, now() - interval '15 days'),
    (p_org_id, 'Annual Maintenance — Okonkwo & Partners', 'draft', 480000, v_user_id, now() - interval '5 days'),
    (p_org_id, 'Software License — Anene Tech', 'expired', 125000, v_user_id, now() - interval '90 days');

  -- ── Quotations: 4 quotes ────────────────────────────────
  INSERT INTO quotations (org_id, client_name, total, status, created_by, created_at) VALUES
    (p_org_id, 'Eze Holdings', 1500000, 'approved', v_user_id, now() - interval '10 days'),
    (p_org_id, 'Usman Group', 2800000, 'draft', v_user_id, now() - interval '3 days'),
    (p_org_id, 'Nwosu Logistics', 500000, 'sent', v_user_id, now() - interval '7 days'),
    (p_org_id, 'Ogunlade Media', 350000, 'rejected', v_user_id, now() - interval '5 days');

  -- ── Knowledge Base: 6 articles ──────────────────────────
  INSERT INTO kb_categories (org_id, name) VALUES
    (p_org_id, 'Getting Started'), (p_org_id, 'Tutorials'), (p_org_id, 'FAQs');
  INSERT INTO kb_articles (org_id, category_id, title, content, status, created_at) VALUES
    (p_org_id, (SELECT id FROM kb_categories WHERE org_id = p_org_id AND name = 'Getting Started'), 'Welcome to Digitpen Hub', 'Your comprehensive business management suite. This guide covers the basics of navigating the platform.', 'published', now() - interval '30 days'),
    (p_org_id, (SELECT id FROM kb_categories WHERE org_id = p_org_id AND name = 'Getting Started'), 'Setting up your workspace', 'Learn how to customize your sidebar, invite team members, and configure your profile.', 'published', now() - interval '25 days'),
    (p_org_id, (SELECT id FROM kb_categories WHERE org_id = p_org_id AND name = 'Tutorials'), 'Creating your first invoice', 'Step-by-step guide to generating professional invoices and getting paid faster.', 'published', now() - interval '20 days'),
    (p_org_id, (SELECT id FROM kb_categories WHERE org_id = p_org_id AND name = 'Tutorials'), 'How to create email campaigns', 'Build and send beautiful email campaigns to your subscribers.', 'published', now() - interval '15 days'),
    (p_org_id, (SELECT id FROM kb_categories WHERE org_id = p_org_id AND name = 'FAQs'), 'Billing and subscription FAQ', 'Common questions about plans, payments, and billing cycles.', 'published', now() - interval '10 days'),
    (p_org_id, (SELECT id FROM kb_categories WHERE org_id = p_org_id AND name = 'FAQs'), 'Troubleshooting common issues', 'Solutions for frequently encountered problems.', 'draft', now() - interval '5 days');

  -- ── Brand Kit ───────────────────────────────────────────
  INSERT INTO brand_kits (org_id, name, primary_color, accent_color) VALUES
    (p_org_id, 'Default Brand', '#2563eb', '#38bdf8');

  -- ── Coupons: 2 coupons ──────────────────────────────────
  INSERT INTO coupons (org_id, code, discount_percent, max_uses, expires_at) VALUES
    (p_org_id, 'WELCOME10', 10, 100, now() + interval '90 days'),
    (p_org_id, 'Q3SAVE20', 20, 50, now() + interval '60 days');

  -- ── Lead forms: 2 sample forms ───────────────────────────
  INSERT INTO lead_forms (org_id, name, fields, is_active) VALUES
    (p_org_id, 'Contact us', '[{"key":"name","label":"Full name","type":"text","required":true},{"key":"email","label":"Email","type":"email","required":true},{"key":"message","label":"Message","type":"textarea","required":true}]', true),
    (p_org_id, 'Newsletter signup', '[{"key":"email","label":"Email","type":"email","required":true},{"key":"name","label":"Name","type":"text","required":false}]', true);

  -- ── Lead submissions: 10 sample leads ───────────────────
  FOR v_i IN 1..10 LOOP
    INSERT INTO lead_submissions (org_id, form_id, data, status, submitted_at) VALUES
      (p_org_id,
       (SELECT id FROM lead_forms WHERE org_id = p_org_id LIMIT 1),
       jsonb_build_object('name', concat('Lead ', v_i), 'email', concat('lead', v_i, '@example.com'), 'message', concat('Interested in learning more about your services — Lead ', v_i)),
       CASE WHEN v_i <= 3 THEN 'converted' WHEN v_i <= 7 THEN 'new' ELSE 'lost' END,
       now() - (v_i * interval '2 days'));
  END LOOP;

  -- ── Notes: 5 sample notes ───────────────────────────────
  INSERT INTO notes (org_id, title, body, created_by, created_at) VALUES
    (p_org_id, 'Q3 Goals', 'Increase revenue by 25%. Launch 2 new features. Hire 3 team members.', v_user_id, now() - interval '14 days'),
    (p_org_id, 'Client preferences', 'Chioma prefers email communication. Tunde likes phone calls. Ngozi wants weekly status updates.', v_user_id, now() - interval '10 days'),
    (p_org_id, 'Meeting notes — Board review', 'Discussed Q2 performance. Approved marketing budget increase. New compliance requirements noted.', v_user_id, now() - interval '7 days'),
    (p_org_id, 'Product roadmap ideas', 'AI-powered analytics dashboard. Mobile app. API marketplace.', v_user_id, now() - interval '5 days'),
    (p_org_id, 'Team standup notes', 'Website redesign on track. Marketing campaign launched. API documentation in progress.', v_user_id, now() - interval '1 day');

  -- ── Subscriptions: 5 sample customer subscriptions ──────
  INSERT INTO plans (name, slug, price_ngn, max_users, features, all_modules) VALUES
    ('Free', 'free', 0, 1, '["1 user","50 contacts","5 invoices/month","Lead forms","Basic CRM"]', false),
    ('Starter', 'starter', 9900, 5, '["Up to 5 users","500 contacts","Unlimited invoices","Email marketing","All modules"]', false),
    ('Growth', 'growth', 29900, 15, '["Up to 15 users","5,000 contacts","Unlimited everything","Priority support","Analytics"]', false),
    ('Business', 'business', 79900, 999, '["Unlimited users","Unlimited contacts","All modules + API","White-label","Dedicated support"]', true);

  -- ── Org Events (analytics) ──────────────────────────────
  FOR v_i IN 1..15 LOOP
    INSERT INTO org_events (org_id, user_id, name, properties, created_at) VALUES
      (p_org_id, v_user_id,
       CASE v_i % 5 WHEN 0 THEN 'contact.created' WHEN 1 THEN 'invoice.created' WHEN 2 THEN 'login' WHEN 3 THEN 'email.sent' ELSE 'project.created' END,
       jsonb_build_object('value', (random() * 100000)::int),
       now() - (v_i * interval '1 day'));
  END LOOP;

END;
$$;
