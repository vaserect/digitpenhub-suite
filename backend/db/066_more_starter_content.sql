-- Milestone 66: Starter sample content, batch 2 (Calendar, Help Desk)
--
-- Extends the seed_starter_content(org_id) function from 065 with two more
-- high-visibility modules. Redefining the whole function (not just adding a
-- second trigger) so there's one single source of truth for "what a new org
-- gets," matching the existing 008_subscriptions.sql precedent for
-- CREATE OR REPLACE on a trigger function across migrations.

CREATE OR REPLACE FUNCTION seed_starter_content(p_org_id UUID)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_client_id UUID;
  v_invoice1_id UUID;
  v_invoice2_id UUID;
  v_list_id UUID;
  v_ticket_num TEXT;
BEGIN
  -- CRM: a realistic small pipeline spanning every stage
  INSERT INTO contacts (org_id, full_name, company, email, phone, stage, value_ngn, last_touch_at) VALUES
    (p_org_id, 'Amara Okafor',    'Lagos Fresh Foods',      'amara.okafor@lagosfresh.ng',    '+2348031234567', 'new',            450000,  now() - interval '1 day'),
    (p_org_id, 'Tunde Bakare',    'Bakare & Partners Law',  'tunde@bakarepartners.ng',        '+2348023456789', 'contacted',      1200000, now() - interval '3 days'),
    (p_org_id, 'Ngozi Eze',       'Eze Interiors',          'ngozi@ezeinteriors.ng',          '+2347012345678', 'proposal_sent',  850000,  now() - interval '5 days'),
    (p_org_id, 'Chidi Nwosu',     'Nwosu Logistics',        'chidi.nwosu@nwosulogistics.ng',  '+2348098765432', 'won',            2300000, now() - interval '10 days'),
    (p_org_id, 'Folake Adeyemi',  'Adeyemi Consulting',     'folake@adeyemiconsulting.ng',    '+2348011122233', 'lost',           600000,  now() - interval '14 days')
  ON CONFLICT DO NOTHING;

  -- Invoices: one real client, one paid invoice, one draft awaiting send
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

  -- Task Management: a realistic small board across every column
  INSERT INTO task_items (org_id, title, description, status, priority, due_date, assignee, label) VALUES
    (p_org_id, 'Follow up with Tunde Bakare on proposal',      'He asked for a revised quote by end of week.',       'todo',        'high',   CURRENT_DATE + 2, 'You', 'Sales'),
    (p_org_id, 'Prepare onboarding checklist for new client',  NULL,                                                   'todo',        'medium', CURRENT_DATE + 5, 'You', 'Ops'),
    (p_org_id, 'Review Q3 invoice aging report',                'Check for anything overdue past 30 days.',           'in_progress', 'medium', CURRENT_DATE + 1, 'You', 'Finance'),
    (p_org_id, 'Draft welcome email sequence',                  'Three emails: welcome, feature tour, first-week check-in.', 'review', 'low',    NULL,             'You', 'Marketing'),
    (p_org_id, 'Set up workspace branding',                     'Logo, colors, and email footer.',                     'done',        'medium', NULL,             'You', 'Ops');

  -- Email Marketing: a starter list, a few subscribers, one draft campaign
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

  -- Calendar: a realistic mixed week — a client call, an internal meeting,
  -- an all-day reminder, tied to the same seeded contacts where it makes sense.
  INSERT INTO calendar_events (org_id, title, description, start_at, end_at, all_day, color, location) VALUES
    (p_org_id, 'Call with Tunde Bakare — proposal review',
     'Walk through the revised quote and answer questions.',
     date_trunc('day', now()) + interval '1 day' + interval '10 hours',
     date_trunc('day', now()) + interval '1 day' + interval '10 hours 30 minutes',
     false, '#2563eb', 'Phone'),
    (p_org_id, 'Team weekly sync',
     'Quick round-up of open tasks and blockers.',
     date_trunc('day', now()) + interval '2 days' + interval '9 hours',
     date_trunc('day', now()) + interval '2 days' + interval '9 hours 30 minutes',
     false, '#16a34a', 'Google Meet'),
    (p_org_id, 'Invoice INV-0002 due',
     'Follow up with Lagos Fresh Foods if unpaid.',
     date_trunc('day', now()) + interval '14 days',
     date_trunc('day', now()) + interval '14 days' + interval '23 hours 59 minutes',
     true, '#d97706', NULL);

  -- Help Desk: 3 tickets spanning open/pending/resolved so the queue
  -- doesn't read as either "empty" or "everything already done."
  SELECT nextval('ticket_number_seq') INTO v_ticket_num;
  INSERT INTO helpdesk_tickets (org_id, ticket_number, subject, description, status, priority, requester_name, requester_email) VALUES
    (p_org_id, 'TKT-' || lpad(v_ticket_num::text, 5, '0'), 'Cannot access my invoice PDF', 'The download link on invoice INV-0002 returns a 404.', 'open', 'high', 'Amara Okafor', 'amara.okafor@lagosfresh.ng');
  SELECT nextval('ticket_number_seq') INTO v_ticket_num;
  INSERT INTO helpdesk_tickets (org_id, ticket_number, subject, description, status, priority, requester_name, requester_email, assignee) VALUES
    (p_org_id, 'TKT-' || lpad(v_ticket_num::text, 5, '0'), 'Question about bulk pricing', 'Do you offer a discount for orders over ₦1,000,000?', 'pending', 'medium', 'Ngozi Eze', 'ngozi@ezeinteriors.ng', 'You');
  SELECT nextval('ticket_number_seq') INTO v_ticket_num;
  INSERT INTO helpdesk_tickets (org_id, ticket_number, subject, description, status, priority, requester_name, requester_email, assignee) VALUES
    (p_org_id, 'TKT-' || lpad(v_ticket_num::text, 5, '0'), 'Update billing contact email', 'Please change our billing contact to accounts@nwosulogistics.ng.', 'resolved', 'low', 'Chidi Nwosu', 'chidi.nwosu@nwosulogistics.ng', 'You');
END;
$$;
