-- ============================================================================
-- CRM EMAIL INTEGRATION SCHEMA
-- Date: 2026-07-18
-- Purpose: Email integration for Gmail/Outlook with tracking and templates
-- ============================================================================

-- ============================================================================
-- SECTION 1: EMAIL ACCOUNTS & CONNECTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook', 'smtp')),
  email_address TEXT NOT NULL,
  display_name TEXT,
  
  -- OAuth tokens (encrypted)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- SMTP credentials (encrypted)
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_username TEXT,
  smtp_password TEXT,
  smtp_use_tls BOOLEAN DEFAULT true,
  
  -- Sync settings
  sync_enabled BOOLEAN NOT NULL DEFAULT true,
  sync_direction TEXT NOT NULL DEFAULT 'bidirectional' CHECK (sync_direction IN ('inbound', 'outbound', 'bidirectional')),
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'active' CHECK (sync_status IN ('active', 'error', 'paused')),
  sync_error TEXT,
  
  -- Settings
  auto_create_contacts BOOLEAN NOT NULL DEFAULT true,
  auto_log_emails BOOLEAN NOT NULL DEFAULT true,
  signature TEXT,
  
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, email_address)
);

CREATE INDEX idx_crm_email_accounts_org ON crm_email_accounts(org_id);
CREATE INDEX idx_crm_email_accounts_user ON crm_email_accounts(user_id, is_active);
CREATE INDEX idx_crm_email_accounts_sync ON crm_email_accounts(sync_enabled, last_sync_at) WHERE sync_enabled = true;

-- ============================================================================
-- SECTION 2: EMAIL MESSAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Email identifiers
  message_id TEXT NOT NULL, -- External message ID (Gmail/Outlook)
  thread_id TEXT, -- External thread ID
  
  -- Account
  email_account_id UUID REFERENCES crm_email_accounts(id) ON DELETE SET NULL,
  
  -- Direction
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  
  -- Participants
  from_address TEXT NOT NULL,
  from_name TEXT,
  to_addresses TEXT[] NOT NULL DEFAULT '{}',
  cc_addresses TEXT[] DEFAULT '{}',
  bcc_addresses TEXT[] DEFAULT '{}',
  
  -- Content
  subject TEXT NOT NULL,
  body_text TEXT,
  body_html TEXT,
  snippet TEXT, -- First 200 chars for preview
  
  -- Metadata
  sent_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ,
  
  -- Tracking
  opened_at TIMESTAMPTZ,
  open_count INTEGER NOT NULL DEFAULT 0,
  clicked_at TIMESTAMPTZ,
  click_count INTEGER NOT NULL DEFAULT 0,
  replied_at TIMESTAMPTZ,
  
  -- Associations
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
  
  -- Template
  template_id UUID REFERENCES crm_email_templates(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'delivered', 'bounced', 'failed')),
  scheduled_at TIMESTAMPTZ,
  
  -- Flags
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_starred BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  has_attachments BOOLEAN NOT NULL DEFAULT false,
  
  -- Sync
  synced_from_provider BOOLEAN NOT NULL DEFAULT false,
  provider_folder TEXT, -- Gmail label or Outlook folder
  
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_emails_org ON crm_emails(org_id, sent_at DESC);
CREATE INDEX idx_crm_emails_message_id ON crm_emails(message_id);
CREATE INDEX idx_crm_emails_thread_id ON crm_emails(thread_id);
CREATE INDEX idx_crm_emails_contact ON crm_emails(contact_id, sent_at DESC);
CREATE INDEX idx_crm_emails_company ON crm_emails(company_id, sent_at DESC);
CREATE INDEX idx_crm_emails_deal ON crm_emails(deal_id, sent_at DESC);
CREATE INDEX idx_crm_emails_account ON crm_emails(email_account_id, sent_at DESC);
CREATE INDEX idx_crm_emails_status ON crm_emails(status, scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_crm_emails_tracking ON crm_emails(org_id, opened_at, clicked_at);

-- ============================================================================
-- SECTION 3: EMAIL ATTACHMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_email_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES crm_emails(id) ON DELETE CASCADE,
  
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  content_id TEXT, -- For inline images
  
  -- Storage
  storage_path TEXT NOT NULL,
  storage_provider TEXT NOT NULL DEFAULT 'local' CHECK (storage_provider IN ('local', 's3', 'gcs')),
  
  -- Tracking
  download_count INTEGER NOT NULL DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_email_attachments_email ON crm_email_attachments(email_id);

-- ============================================================================
-- SECTION 4: EMAIL TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  
  -- Variables
  variables JSONB DEFAULT '[]', -- [{name: 'firstName', label: 'First Name', default: ''}]
  
  -- Settings
  is_shared BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  
  -- Usage stats
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(org_id, name)
);

CREATE INDEX idx_crm_email_templates_org ON crm_email_templates(org_id, is_archived);
CREATE INDEX idx_crm_email_templates_category ON crm_email_templates(org_id, category);
CREATE INDEX idx_crm_email_templates_usage ON crm_email_templates(org_id, usage_count DESC);

-- ============================================================================
-- SECTION 5: EMAIL TRACKING EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_email_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES crm_emails(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'spam')),
  event_data JSONB DEFAULT '{}',
  
  -- Tracking details
  ip_address INET,
  user_agent TEXT,
  location TEXT,
  device_type TEXT,
  
  -- Link tracking (for clicks)
  link_url TEXT,
  link_position INTEGER,
  
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_email_tracking_email ON crm_email_tracking_events(email_id, occurred_at DESC);
CREATE INDEX idx_crm_email_tracking_type ON crm_email_tracking_events(event_type, occurred_at DESC);

-- ============================================================================
-- SECTION 6: EMAIL SYNC LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_email_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_account_id UUID NOT NULL REFERENCES crm_email_accounts(id) ON DELETE CASCADE,
  
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental')),
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('inbound', 'outbound')),
  
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT,
  
  -- Stats
  emails_processed INTEGER NOT NULL DEFAULT 0,
  emails_created INTEGER NOT NULL DEFAULT 0,
  emails_updated INTEGER NOT NULL DEFAULT 0,
  emails_skipped INTEGER NOT NULL DEFAULT 0,
  contacts_created INTEGER NOT NULL DEFAULT 0,
  
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_crm_email_sync_log_account ON crm_email_sync_log(email_account_id, started_at DESC);
CREATE INDEX idx_crm_email_sync_log_status ON crm_email_sync_log(status, started_at DESC);

-- ============================================================================
-- SECTION 7: EMAIL UNSUBSCRIBES
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_email_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  email_address TEXT NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  
  unsubscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribe_reason TEXT,
  
  -- Source
  email_id UUID REFERENCES crm_emails(id) ON DELETE SET NULL,
  
  UNIQUE(org_id, email_address)
);

CREATE INDEX idx_crm_email_unsubscribes_org ON crm_email_unsubscribes(org_id);
CREATE INDEX idx_crm_email_unsubscribes_email ON crm_email_unsubscribes(email_address);

-- ============================================================================
-- SECTION 8: TRIGGERS
-- ============================================================================

CREATE TRIGGER update_crm_email_accounts_updated_at 
  BEFORE UPDATE ON crm_email_accounts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_emails_updated_at 
  BEFORE UPDATE ON crm_emails 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_email_templates_updated_at 
  BEFORE UPDATE ON crm_email_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 9: FUNCTIONS
-- ============================================================================

-- Function to update email open tracking
CREATE OR REPLACE FUNCTION update_email_open_tracking()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type = 'opened' THEN
    UPDATE crm_emails 
    SET 
      opened_at = COALESCE(opened_at, NEW.occurred_at),
      open_count = open_count + 1,
      is_read = true
    WHERE id = NEW.email_id;
  END IF;
  
  IF NEW.event_type = 'clicked' THEN
    UPDATE crm_emails 
    SET 
      clicked_at = COALESCE(clicked_at, NEW.occurred_at),
      click_count = click_count + 1
    WHERE id = NEW.email_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_email_tracking
  AFTER INSERT ON crm_email_tracking_events
  FOR EACH ROW EXECUTE FUNCTION update_email_open_tracking();

-- Function to auto-associate emails with contacts
CREATE OR REPLACE FUNCTION auto_associate_email_with_contact()
RETURNS TRIGGER AS $$
DECLARE
  found_contact_id UUID;
BEGIN
  -- Only for inbound emails without existing contact association
  IF NEW.direction = 'inbound' AND NEW.contact_id IS NULL THEN
    -- Try to find contact by email
    SELECT id INTO found_contact_id
    FROM contacts
    WHERE org_id = NEW.org_id 
      AND (email = NEW.from_address OR phone = NEW.from_address)
    LIMIT 1;
    
    IF found_contact_id IS NOT NULL THEN
      NEW.contact_id = found_contact_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_associate_email
  BEFORE INSERT ON crm_emails
  FOR EACH ROW EXECUTE FUNCTION auto_associate_email_with_contact();

-- ============================================================================
-- SECTION 10: DEFAULT DATA
-- ============================================================================

-- Default email templates
INSERT INTO crm_email_templates (org_id, name, description, category, subject, body_html, body_text, variables, is_shared)
SELECT 
  id as org_id,
  'Welcome Email',
  'Welcome new contacts to your business',
  'onboarding',
  'Welcome to {{companyName}}!',
  '<p>Hi {{firstName}},</p><p>Welcome to {{companyName}}! We''re excited to have you.</p><p>Best regards,<br>{{senderName}}</p>',
  'Hi {{firstName}},\n\nWelcome to {{companyName}}! We''re excited to have you.\n\nBest regards,\n{{senderName}}',
  '[{"name":"firstName","label":"First Name","default":"there"},{"name":"companyName","label":"Company Name","default":"our company"},{"name":"senderName","label":"Sender Name","default":"The Team"}]'::jsonb,
  true
FROM organizations
WHERE NOT EXISTS (
  SELECT 1 FROM crm_email_templates 
  WHERE crm_email_templates.org_id = organizations.id 
    AND crm_email_templates.name = 'Welcome Email'
);

INSERT INTO crm_email_templates (org_id, name, description, category, subject, body_html, body_text, variables, is_shared)
SELECT 
  id as org_id,
  'Follow-up Email',
  'Follow up with prospects after initial contact',
  'sales',
  'Following up on our conversation',
  '<p>Hi {{firstName}},</p><p>I wanted to follow up on our recent conversation about {{topic}}.</p><p>Do you have time for a quick call this week?</p><p>Best regards,<br>{{senderName}}</p>',
  'Hi {{firstName}},\n\nI wanted to follow up on our recent conversation about {{topic}}.\n\nDo you have time for a quick call this week?\n\nBest regards,\n{{senderName}}',
  '[{"name":"firstName","label":"First Name","default":"there"},{"name":"topic","label":"Topic","default":"your needs"},{"name":"senderName","label":"Sender Name","default":"The Team"}]'::jsonb,
  true
FROM organizations
WHERE NOT EXISTS (
  SELECT 1 FROM crm_email_templates 
  WHERE crm_email_templates.org_id = organizations.id 
    AND crm_email_templates.name = 'Follow-up Email'
);

INSERT INTO crm_email_templates (org_id, name, description, category, subject, body_html, body_text, variables, is_shared)
SELECT 
  id as org_id,
  'Meeting Request',
  'Request a meeting with a prospect',
  'sales',
  'Let''s schedule a meeting',
  '<p>Hi {{firstName}},</p><p>I''d love to schedule a meeting to discuss how we can help with {{topic}}.</p><p>Are you available {{proposedTime}}?</p><p>Best regards,<br>{{senderName}}</p>',
  'Hi {{firstName}},\n\nI''d love to schedule a meeting to discuss how we can help with {{topic}}.\n\nAre you available {{proposedTime}}?\n\nBest regards,\n{{senderName}}',
  '[{"name":"firstName","label":"First Name","default":"there"},{"name":"topic","label":"Topic","default":"your needs"},{"name":"proposedTime","label":"Proposed Time","default":"this week"},{"name":"senderName","label":"Sender Name","default":"The Team"}]'::jsonb,
  true
FROM organizations
WHERE NOT EXISTS (
  SELECT 1 FROM crm_email_templates 
  WHERE crm_email_templates.org_id = organizations.id 
    AND crm_email_templates.name = 'Meeting Request'
);
