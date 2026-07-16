-- Migration 120: Fix starter content trigger function
-- Corrects columns for projects, tasks, lead_forms, expenses, employees, kb_articles, and contracts.

CREATE OR REPLACE FUNCTION seed_starter_content(p_org_id UUID)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_client_id UUID;
  v_invoice1_id UUID;
  v_invoice2_id UUID;
  v_list_id UUID;
  v_ticket_num TEXT;
  v_project_id UUID;
  v_form_id UUID;
  v_rent_cat_id UUID;
  v_util_cat_id UUID;
  v_meals_cat_id UUID;
  v_quote_num BIGINT;
  v_eng_dept_id UUID;
  v_mkt_dept_id UUID;
  v_ops_dept_id UUID;
  v_fin_dept_id UUID;
  v_gs_kb_cat_id BIGINT;
  v_inv_kb_cat_id BIGINT;
  v_crm_kb_cat_id BIGINT;
BEGIN
  -- CRM: a realistic small pipeline spanning every stage --
  INSERT INTO contacts (org_id, full_name, company, email, phone, stage, value_ngn, last_touch_at) VALUES
    (p_org_id, 'Amara Okafor',    'Lagos Fresh Foods',      'amara.okafor@lagosfresh.ng',    '+2348031234567', 'new',            450000,  now() - interval '1 day'),
    (p_org_id, 'Tunde Bakare',    'Bakare & Partners Law',  'tunde@bakarepartners.ng',        '+2348023456789', 'contacted',      1200000, now() - interval '3 days'),
    (p_org_id, 'Ngozi Eze',       'Eze Interiors',          'ngozi@ezeinteriors.ng',          '+2347012345678', 'proposal_sent',  850000,  now() - interval '5 days'),
    (p_org_id, 'Chidi Nwosu',     'Nwosu Logistics',        'chidi.nwosu@nwosulogistics.ng',  '+2348098765432', 'won',            2300000, now() - interval '10 days'),
    (p_org_id, 'Folake Adeyemi',  'Adeyemi Consulting',     'folake@adeyemiconsulting.ng',    '+2348011122233', 'lost',           600000,  now() - interval '14 days')
  ON CONFLICT DO NOTHING;

  -- Invoices: one real client, one paid invoice, one draft --
  INSERT INTO invoice_clients (org_id, name, email, phone, company)
    VALUES (p_org_id, 'Amara Okafor', 'amara.okafor@lagosfresh.ng', '+2348031234567', 'Lagos Fresh Foods')
    RETURNING id INTO v_client_id;

  INSERT INTO invoices (org_id, client_id, invoice_number, status, issue_date, due_date, subtotal, tax_rate, total, notes)
    VALUES (p_org_id, v_client_id, 'INV-0001', 'paid', CURRENT_DATE - 20, CURRENT_DATE - 6, 450000, 7.5, 483750, 'Thank you for your business!')
    RETURNING id INTO v_invoice1_id;
  INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount) VALUES
    (v_invoice1_id, 'Monthly supply contract — produce delivery', 1, 450000, 450000);

  INSERT INTO invoices (org_id, client_id, invoice_number, status, issue_date, due_date, subtotal, tax_rate, total, notes)
    VALUES (p_org_id, v_client_id, 'INV-0002', 'draft', CURRENT_DATE, CURRENT_DATE + 14, 180000, 7.5, 193500, NULL)
    RETURNING id INTO v_invoice2_id;
  INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount) VALUES
    (v_invoice2_id, 'Consulting — site visit and inventory review', 2, 90000, 180000);

  -- Task Management: a realistic small board --
  INSERT INTO task_items (org_id, title, description, status, priority, due_date, assignee, label) VALUES
    (p_org_id, 'Follow up with Tunde Bakare on proposal',      'He asked for a revised quote by end of week.',       'todo',        'high',   CURRENT_DATE + 2, 'You', 'Sales'),
    (p_org_id, 'Prepare onboarding checklist for new client',  NULL,                                                   'todo',        'medium', CURRENT_DATE + 5, 'You', 'Ops'),
    (p_org_id, 'Review Q3 invoice aging report',                'Check for anything overdue past 30 days.',           'in_progress', 'medium', CURRENT_DATE + 1, 'You', 'Finance'),
    (p_org_id, 'Draft welcome email sequence',                  'Three emails: welcome, feature tour, first-week check-in.', 'review', 'low',    NULL,             'You', 'Marketing'),
    (p_org_id, 'Set up workspace branding',                     'Logo, colors, and email footer.',                     'done',        'medium', NULL,             'You', 'Ops');

  -- Email Marketing: a starter list, subscribers, draft campaign --
  INSERT INTO email_lists (org_id, name, description)
    VALUES (p_org_id, 'Newsletter Subscribers', 'General updates and announcements')
    RETURNING id INTO v_list_id;
  INSERT INTO email_subscribers (list_id, org_id, email, name) VALUES
    (v_list_id, p_org_id, 'amara.okafor@lagosfresh.ng',   'Amara Okafor'),
    (v_list_id, p_org_id, 'tunde@bakarepartners.ng',       'Tunde Bakare'),
    (v_list_id, p_org_id, 'ngozi@ezeinteriors.ng',         'Ngozi Eze');
  INSERT INTO email_campaigns (org_id, list_id, subject, preview_text, body_html, status) VALUES
    (p_org_id, v_list_id, 'Welcome to our newsletter!', 'A quick hello and what to expect from us.',
     '<p>Hi there,</p><p>Thanks for subscribing — you will hear from us with occasional updates, offers, and news. Reply anytime if you have questions.</p>', 'draft');

  -- Calendar: events --
  INSERT INTO calendar_events (org_id, title, description, start_at, end_at, all_day, color, location) VALUES
    (p_org_id, 'Call with Tunde Bakare — proposal review',
     'Walk through the revised quote.',
     date_trunc('day', now()) + interval '1 day' + interval '10 hours',
     date_trunc('day', now()) + interval '1 day' + interval '10 hours 30 minutes',
     false, '#2563eb', 'Phone'),
    (p_org_id, 'Team weekly sync',
     'Quick round-up of open tasks.',
     date_trunc('day', now()) + interval '2 days' + interval '9 hours',
     date_trunc('day', now()) + interval '2 days' + interval '9 hours 30 minutes',
     false, '#16a34a', 'Google Meet'),
    (p_org_id, 'Invoice INV-0002 due',
     'Follow up if unpaid.',
     date_trunc('day', now()) + interval '14 days',
     date_trunc('day', now()) + interval '14 days' + interval '23 hours 59 minutes',
     true, '#d97706', NULL);

  -- Help Desk: 3 tickets --
  SELECT nextval('ticket_number_seq') INTO v_ticket_num;
  INSERT INTO helpdesk_tickets (org_id, ticket_number, subject, description, status, priority, requester_name, requester_email) VALUES
    (p_org_id, 'TKT-' || lpad(v_ticket_num::text, 5, '0'), 'Cannot access my invoice PDF', 'The download link returns a 404.', 'open', 'high', 'Amara Okafor', 'amara.okafor@lagosfresh.ng');
  SELECT nextval('ticket_number_seq') INTO v_ticket_num;
  INSERT INTO helpdesk_tickets (org_id, ticket_number, subject, description, status, priority, requester_name, requester_email, assignee) VALUES
    (p_org_id, 'TKT-' || lpad(v_ticket_num::text, 5, '0'), 'Question about bulk pricing', 'Do you offer a discount for orders over ₦1,000,000?', 'pending', 'medium', 'Ngozi Eze', 'ngozi@ezeinteriors.ng', 'You');
  SELECT nextval('ticket_number_seq') INTO v_ticket_num;
  INSERT INTO helpdesk_tickets (org_id, ticket_number, subject, description, status, priority, requester_name, requester_email, assignee) VALUES
    (p_org_id, 'TKT-' || lpad(v_ticket_num::text, 5, '0'), 'Update billing contact email', 'Please change our billing contact.', 'resolved', 'low', 'Chidi Nwosu', 'chidi.nwosu@nwosulogistics.ng', 'You');

  -- Project Management: 2 projects with tasks --
  INSERT INTO projects (org_id, name) VALUES
    (p_org_id, 'Website Redesign')
    RETURNING id INTO v_project_id;
  INSERT INTO tasks (project_id, org_id, title, status) VALUES
    (v_project_id, p_org_id, 'Design homepage mockup', 'todo'),
    (v_project_id, p_org_id, 'Develop contact form', 'todo'),
    (v_project_id, p_org_id, 'Set up staging environment', 'in_progress'),
    (v_project_id, p_org_id, 'Content migration', 'done');

  INSERT INTO projects (org_id, name) VALUES
    (p_org_id, 'Q4 Marketing Campaign');

  -- Lead Generation: a sample form --
  INSERT INTO lead_forms (org_id, name, fields_json, thank_you_message) VALUES
    (p_org_id, 'Contact Us',
     '[{"key":"full_name","label":"Full Name","type":"text","required":true},{"key":"email","label":"Email","type":"email","required":true},{"key":"message","label":"Message","type":"textarea","required":false}]'::jsonb,
     'Thanks for reaching out — we will get back to you shortly.')
    RETURNING id INTO v_form_id;

  -- Contracts: a sample contract --
  INSERT INTO contracts (org_id, title, content, status, parties, created_by) VALUES
    (p_org_id, 'Standard Service Agreement',
     '# Service Agreement\n\n## Scope of Work\nProvider agrees to deliver the services described in the attached statement of work.\n\n## Payment Terms\nNet 30 days from invoice date.\n\n## Term\nThis agreement shall remain in effect until terminated by either party with 30 days written notice.',
     'draft', '[{"name": "Digitpen Hub", "email": "admin@digitpenhub.com", "role": "provider"}, {"name": "Client", "email": "client@example.com", "role": "client"}]'::jsonb,
     (SELECT id FROM users WHERE org_id = p_org_id LIMIT 1));

  -- Expenses: categories + expenses --
  INSERT INTO expense_categories (org_id, name, color) VALUES
    (p_org_id, 'Rent', '#f87171') RETURNING id INTO v_rent_cat_id;
  INSERT INTO expense_categories (org_id, name, color) VALUES
    (p_org_id, 'Utilities', '#60a5fa') RETURNING id INTO v_util_cat_id;
  INSERT INTO expense_categories (org_id, name, color) VALUES
    (p_org_id, 'Meals', '#fbbf24') RETURNING id INTO v_meals_cat_id;

  INSERT INTO expenses (org_id, title, amount_ngn, category_id, payment_method, expense_date) VALUES
    (p_org_id, 'Office rent — November', 350000, v_rent_cat_id, 'transfer', CURRENT_DATE - 5),
    (p_org_id, 'Internet subscription', 45000, v_util_cat_id, 'transfer', CURRENT_DATE - 3),
    (p_org_id, 'Team lunch — strategy session', 28500, v_meals_cat_id, 'cash', CURRENT_DATE - 1);

  -- Quotations: a sample quote --
  SELECT nextval('quotation_number_seq') INTO v_quote_num;
  INSERT INTO quotations (org_id, quote_number, client_name, client_email, items, subtotal, total, notes, status) VALUES
    (p_org_id, 'QT-' || lpad(v_quote_num::text, 5, '0'), 'Folake Adeyemi', 'folake@adeyemiconsulting.ng',
     '[{"description":"Website audit and recommendations","quantity":1,"unitPrice":250000}]'::jsonb,
     250000, 250000, 'Valid for 30 days.', 'draft');

  -- HR: departments, employees --
  INSERT INTO departments (org_id, name) VALUES (p_org_id, 'Engineering') RETURNING id INTO v_eng_dept_id;
  INSERT INTO departments (org_id, name) VALUES (p_org_id, 'Marketing') RETURNING id INTO v_mkt_dept_id;
  INSERT INTO departments (org_id, name) VALUES (p_org_id, 'Operations') RETURNING id INTO v_ops_dept_id;
  INSERT INTO departments (org_id, name) VALUES (p_org_id, 'Finance') RETURNING id INTO v_fin_dept_id;

  INSERT INTO employees (org_id, full_name, email, department_id, employment_type, salary_ngn) VALUES
    (p_org_id, 'Sarah Ogunlesi', 'sarah@example.com', v_eng_dept_id, 'full-time', 450000),
    (p_org_id, 'Michael Obi', 'michael@example.com', v_mkt_dept_id, 'full-time', 350000),
    (p_org_id, 'Blessing Adeleke', 'blessing@example.com', v_ops_dept_id, 'full-time', 300000);

  -- Knowledge Base: sample articles --
  INSERT INTO kb_categories (org_id, name) VALUES (p_org_id, 'Getting Started') RETURNING id INTO v_gs_kb_cat_id;
  INSERT INTO kb_categories (org_id, name) VALUES (p_org_id, 'Invoicing') RETURNING id INTO v_inv_kb_cat_id;
  INSERT INTO kb_categories (org_id, name) VALUES (p_org_id, 'CRM') RETURNING id INTO v_crm_kb_cat_id;

  INSERT INTO kb_articles (org_id, title, content, category_id, status) VALUES
    (p_org_id, 'Getting Started with Digitpen Hub', 'Welcome! This guide walks you through your first week.', v_gs_kb_cat_id, 'published'),
    (p_org_id, 'How to Create and Send Invoices', 'Learn how to create professional invoices and send them to clients.', v_inv_kb_cat_id, 'published'),
    (p_org_id, 'Managing Contacts and Deals', 'Use the CRM to track leads, manage deals, and close sales.', v_crm_kb_cat_id, 'published');

  -- Recruitment: a sample job posting --
  INSERT INTO job_postings (org_id, title, description, status) VALUES
    (p_org_id, 'Senior Software Engineer', 'We are looking for an experienced software engineer to join our team.', 'open');
END;
$$;
