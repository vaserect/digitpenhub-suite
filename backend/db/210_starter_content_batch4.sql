-- Migration 210: Extend starter content seeding — batch 4
-- Covers more modules with realistic demo data for new orgs
-- Extended from seed_starter_content() in migrations 065, 066, 117, 120

CREATE OR REPLACE FUNCTION seed_starter_content(p_org_id UUID)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_client_id UUID;
  v_invoice1_id UUID;
  v_invoice2_id UUID;
  v_list_id UUID;
  v_proj1_id UUID;
  v_proj2_id UUID;
  v_hr_dept1 UUID;
  v_hr_dept2 UUID;
  v_kb_cat1 UUID;
  v_kb_cat2 UUID;
  v_user_id UUID;
BEGIN
  -- Get the org owner
  SELECT id INTO v_user_id FROM users WHERE org_id = p_org_id AND role = 'owner' LIMIT 1;
  IF v_user_id IS NULL THEN RETURN; END IF;

  -- ── CRM: 5 contacts ─────────────────────────────────────
  INSERT INTO contacts (org_id, full_name, company, email, phone, stage, value_ngn, tags) VALUES
    (p_org_id, 'Chioma Okafor', 'Okafor Ventures', 'chioma@okafortech.ng', '+2348025001001', 'new', 0, ARRAY['warm', 'tech']),
    (p_org_id, 'Femi Adeyemi', 'Lagos Digital Agency', 'femi@lagosdigital.ng', '+2348092002002', 'contacted', 250000, ARRAY['hot', 'marketing']),
    (p_org_id, 'Ngozi Eze', 'Eze Holdings', 'ngozi@ezeholdings.com', '+2348063003003', 'proposal_sent', 1500000, ARRAY['enterprise']),
    (p_org_id, 'Tunde Bakare', 'Bakare Properties', 'tunde@bakareproperty.com', '+2348034004004', 'won', 750000, ARRAY['closed']),
    (p_org_id, 'Amara Obi', 'Obi Solutions', 'amara@obisolutions.ng', '+2347015005005', 'lost', 0, ARRAY['lost']);

  -- ── Invoices: 1 client, 2 invoices ──────────────────────
  INSERT INTO contacts (org_id, full_name, company, email) VALUES
    (p_org_id, 'James Okonkwo', 'Okonkwo & Partners', 'james@okonkwopartners.com');
  v_client_id := lastval();

  INSERT INTO invoices (org_id, client_name, contact_id, total, status, due_date, created_at) VALUES
    (p_org_id, 'Okonkwo & Partners', v_client_id, 483750, 'paid', now() + interval '14 days', now() - interval '5 days'),
    (p_org_id, 'Okonkwo & Partners', v_client_id, 325000, 'draft', now() + interval '30 days', now() - interval '2 days');

  -- ── Tasks: 5 items ──────────────────────────────────────
  INSERT INTO tasks (org_id, title) VALUES (p_org_id, 'Onboarding tasks');
  INSERT INTO task_items (org_id, task_id, title, status, assignee_id) VALUES
    (p_org_id, lastval(), 'Set up email templates', 'done', v_user_id),
    (p_org_id, lastval(), 'Review Q3 budget', 'in_progress', v_user_id),
    (p_org_id, lastval(), 'Prepare client presentation', 'pending', v_user_id),
    (p_org_id, lastval(), 'Update team calendar', 'todo', v_user_id),
    (p_org_id, lastval(), 'Schedule quarterly review', 'todo', v_user_id);

  -- ── Email: 1 list, 3 subscribers, 1 draft ───────────────
  INSERT INTO email_lists (org_id, name) VALUES (p_org_id, 'Newsletter Subscribers');
  v_list_id := lastval();
  INSERT INTO email_subscribers (org_id, list_id, email, full_name, status) VALUES
    (p_org_id, v_list_id, ' subscriber1@example.com', 'John Doe', 'subscribed'),
    (p_org_id, v_list_id, ' subscriber2@example.com', 'Jane Smith', 'subscribed'),
    (p_org_id, v_list_id, ' subscriber3@example.com', 'Bob Johnson', 'subscribed');
  INSERT INTO email_campaigns (org_id, list_id, subject, status) VALUES
    (p_org_id, v_list_id, 'Welcome to our newsletter', 'draft');

  -- ── Calendar: 3 events ──────────────────────────────────
  INSERT INTO calendar_events (org_id, title, event_date, created_by) VALUES
    (p_org_id, 'Client call — Chioma Okafor', now() + interval '1 day', v_user_id),
    (p_org_id, 'Weekly team sync', now() + interval '2 days', v_user_id),
    (p_org_id, 'Invoice due reminder — Okonkwo', now() + interval '14 days', v_user_id);

  -- ── Help Desk: 3 tickets ────────────────────────────────
  INSERT INTO helpdesk_tickets (org_id, subject, status, priority, created_by) VALUES
    (p_org_id, 'Cannot access email campaign editor', 'open', 'high', v_user_id),
    (p_org_id, 'Question about billing cycle', 'pending', 'normal', v_user_id),
    (p_org_id, 'Feature request: bulk import', 'resolved', 'low', v_user_id);

  -- ── Project Management: 2 projects ──────────────────────
  INSERT INTO projects (org_id, name, status) VALUES
    (p_org_id, 'Website Redesign', 'active'),
    (p_org_id, 'Q3 Marketing Campaign', 'planning');
  v_proj1_id := lastval() - 1;
  v_proj2_id := lastval();

  -- ── Lead Generation: 1 form ─────────────────────────────
  INSERT INTO lead_forms (org_id, name, fields, is_active) VALUES
    (p_org_id, 'Contact us', '[{"key":"name","label":"Full name","type":"text","required":true},{"key":"email","label":"Email","type":"email","required":true},{"key":"message","label":"Message","type":"textarea","required":true}]', true);

  -- ── Contracts: 1 draft ──────────────────────────────────
  INSERT INTO contracts (org_id, title, status, value_ngn, created_by) VALUES
    (p_org_id, 'Service Agreement — Lagos Digital Agency', 'draft', 250000, v_user_id);

  -- ── Expenses: 3 categories + 3 expenses ─────────────────
  INSERT INTO expense_categories (org_id, name) VALUES
    (p_org_id, 'Office Supplies'), (p_org_id, 'Software Subscriptions'), (p_org_id, 'Travel');
  INSERT INTO expenses (org_id, category_id, description, amount, created_at) VALUES
    (p_org_id, (SELECT id FROM expense_categories WHERE org_id = p_org_id AND name = 'Office Supplies'), 'Printer paper & ink', 12500, now() - interval '3 days'),
    (p_org_id, (SELECT id FROM expense_categories WHERE org_id = p_org_id AND name = 'Software Subscriptions'), 'Cloud hosting — monthly', 45000, now() - interval '1 day'),
    (p_org_id, (SELECT id FROM expense_categories WHERE org_id = p_org_id AND name = 'Travel'), 'Client visit — taxi fares', 8500, now() - interval '7 days');

  -- ── Quotations: 1 draft ─────────────────────────────────
  INSERT INTO quotations (org_id, client_name, total, status, created_by) VALUES
    (p_org_id, 'Eze Holdings', 1500000, 'draft', v_user_id);

  -- ── HR: 4 departments + 3 employees ─────────────────────
  INSERT INTO hr_departments (org_id, name) VALUES
    (p_org_id, 'Engineering'), (p_org_id, 'Marketing'), (p_org_id, 'Sales'), (p_org_id, 'Operations');
  INSERT INTO hr_employees (org_id, full_name, email, department_id, position, salary_ngn) VALUES
    (p_org_id, 'Chidi Nwosu', 'chidi@org.com', (SELECT id FROM hr_departments WHERE org_id = p_org_id AND name = 'Engineering'), 'Lead Developer', 600000),
    (p_org_id, 'Zainab Abdullah', 'zainab@org.com', (SELECT id FROM hr_departments WHERE org_id = p_org_id AND name = 'Marketing'), 'Marketing Manager', 450000),
    (p_org_id, 'Emeka Okafor', 'emeka@org.com', (SELECT id FROM hr_departments WHERE org_id = p_org_id AND name = 'Sales'), 'Sales Representative', 350000);

  -- ── Knowledge Base: 3 categories + 3 articles ───────────
  INSERT INTO kb_categories (org_id, name) VALUES
    (p_org_id, 'Getting Started'), (p_org_id, 'Tutorials'), (p_org_id, 'FAQs');
  INSERT INTO kb_articles (org_id, category_id, title, content, status) VALUES
    (p_org_id, (SELECT id FROM kb_categories WHERE org_id = p_org_id AND name = 'Getting Started'), 'Welcome to Digitpen Hub', 'Your comprehensive business management suite.', 'published'),
    (p_org_id, (SELECT id FROM kb_categories WHERE org_id = p_org_id AND name = 'Tutorials'), 'How to create your first invoice', 'Follow these steps to generate professional invoices.', 'published'),
    (p_org_id, (SELECT id FROM kb_categories WHERE org_id = p_org_id AND name = 'FAQs'), 'Common billing questions', 'Answers to frequently asked billing questions.', 'published');

  -- ── Recruitment: 1 job posting ──────────────────────────
  INSERT INTO job_postings (org_id, title, department, status, created_by) VALUES
    (p_org_id, 'Senior Software Engineer', 'Engineering', 'open', v_user_id);

  -- ── Brand Kit: default colors ───────────────────────────
  INSERT INTO brand_kits (org_id, name, primary_color, accent_color) VALUES
    (p_org_id, 'Default Brand', '#2563eb', '#38bdf8');

  -- ── Coupons: 1 sample coupon ────────────────────────────
  INSERT INTO coupons (org_id, code, discount_percent, max_uses) VALUES
    (p_org_id, 'WELCOME10', 10, 100);
END;
$$;
